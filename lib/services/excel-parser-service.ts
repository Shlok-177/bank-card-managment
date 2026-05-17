import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { normalizeHeader, sanitizeText } from "@/lib/utils";
import { calculateDifference } from "@/lib/services/formula-service";
import type { ColumnMappingDefinition, InternalField, ParsedApplicationRow, UploadValidationResult } from "@/types/domain";

const requiredFields: InternalField[] = ["month", "applicationNo", "customerName", "bank", "payout96", "given"];

export class ExcelParserService {
  async parse(buffer: Buffer, mappings: ColumnMappingDefinition[]): Promise<UploadValidationResult> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    } catch {
      return this.parseWithXlsx(buffer, mappings);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { headers: [], mapping: this.emptyMapping(), totalRows: 0, validRows: [], errors: [{ rowNumber: 0, message: "Workbook has no sheets" }], duplicateApplicationNos: [] };
    }

    const headerRow = worksheet.getRow(1);
    const headerValues = Array.isArray(headerRow.values) ? headerRow.values.slice(1) : [];
    const headers = headerValues
      .map((value: unknown) => sanitizeText(value))
      .filter(Boolean);
    const mapping = this.resolveMapping(headers, mappings);
    const errors: Array<{ rowNumber: number; field?: string; message: string }> = this.validateRequiredMapping(mapping);
    const validRows: ParsedApplicationRow[] = [];
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowValues = Array.isArray(row.values) ? row.values.slice(1) : [];
      const rawData = this.rowToObject(headers, rowValues);
      const parsed = this.parseRow(rowNumber, rawData, mapping);
      if ("errors" in parsed) {
        errors.push(...parsed.errors);
        return;
      }
      if (seen.has(parsed.applicationNo)) duplicates.add(parsed.applicationNo);
      seen.add(parsed.applicationNo);
      validRows.push(parsed);
    });

    for (const appNo of duplicates) {
      errors.push({ rowNumber: 0, field: "applicationNo", message: `Duplicate application number in file: ${appNo}` });
    }

    return {
      headers,
      mapping,
      totalRows: Math.max(worksheet.rowCount - 1, 0),
      validRows: validRows.filter((row) => !duplicates.has(row.applicationNo)),
      errors,
      duplicateApplicationNos: Array.from(duplicates)
    };
  }

  private parseWithXlsx(buffer: Buffer, mappings: ColumnMappingDefinition[]): UploadValidationResult {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const headers = rows[0] ? Object.keys(rows[0]) : [];
    const mapping = this.resolveMapping(headers, mappings);
    const errors: Array<{ rowNumber: number; field?: string; message: string }> = this.validateRequiredMapping(mapping);
    const validRows: ParsedApplicationRow[] = [];
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    rows.forEach((row, index) => {
      const parsed = this.parseRow(index + 2, row, mapping);
      if ("errors" in parsed) {
        errors.push(...parsed.errors);
        return;
      }
      if (seen.has(parsed.applicationNo)) duplicates.add(parsed.applicationNo);
      seen.add(parsed.applicationNo);
      validRows.push(parsed);
    });

    return {
      headers,
      mapping,
      totalRows: rows.length,
      validRows: validRows.filter((row) => !duplicates.has(row.applicationNo)),
      errors,
      duplicateApplicationNos: Array.from(duplicates)
    };
  }

  private resolveMapping(headers: string[], mappings: ColumnMappingDefinition[]) {
    const normalizedHeaders = new Map(headers.map((header) => [normalizeHeader(header), header]));
    return mappings.reduce((acc, mapping) => {
      const aliases = [mapping.internalField, ...mapping.aliases];
      const matched = aliases.map(normalizeHeader).map((alias) => normalizedHeaders.get(alias)).find(Boolean) ?? null;
      acc[mapping.internalField] = matched;
      return acc;
    }, this.emptyMapping());
  }

  private parseRow(
    rowNumber: number,
    rawData: Record<string, unknown>,
    mapping: Record<InternalField, string | null>
  ): ParsedApplicationRow | { errors: Array<{ rowNumber: number; field?: string; message: string }> } {
    const value = (field: InternalField) => (mapping[field] ? rawData[mapping[field] as string] : undefined);
    const applicationNo = sanitizeText(value("applicationNo"));
    const month = sanitizeText(value("month"));
    const customerName = sanitizeText(value("customerName"));
    const bank = sanitizeText(value("bank"));
    const payout96 = toMoney(value("payout96"));
    const given = toMoney(value("given"));
    const rowErrors: Array<{ rowNumber: number; field?: string; message: string }> = [];

    if (!applicationNo) rowErrors.push({ rowNumber, field: "applicationNo", message: "Application number is required" });
    if (!month) rowErrors.push({ rowNumber, field: "month", message: "Month is required" });
    if (!customerName) rowErrors.push({ rowNumber, field: "customerName", message: "Customer name is required" });
    if (!bank) rowErrors.push({ rowNumber, field: "bank", message: "Bank is required" });
    if (payout96 === null) rowErrors.push({ rowNumber, field: "payout96", message: "96% payout must be a valid number" });
    if (given === null) rowErrors.push({ rowNumber, field: "given", message: "GIVEN must be a valid number" });

    if (rowErrors.length) return { errors: rowErrors };

    const payoutAmount = payout96 ?? 0;
    const givenAmount = given ?? 0;

    return {
      rowNumber,
      month,
      dsa: sanitizeText(value("dsa")),
      applicationNo,
      customerName,
      cardType: sanitizeText(value("cardType")),
      bank,
      userName: sanitizeText(value("userName")),
      dseName: sanitizeText(value("dseName")),
      payout96: payoutAmount,
      given: givenAmount,
      difference: calculateDifference({ payout96: payoutAmount, given: givenAmount, bank }),
      rawData
    };
  }

  private validateRequiredMapping(mapping: Record<InternalField, string | null>) {
    return requiredFields
      .filter((field) => !mapping[field])
      .map((field) => ({ rowNumber: 1, field, message: `Required column is missing for ${field}` }));
  }

  private rowToObject(headers: string[], values: unknown[]) {
    return headers.reduce<Record<string, unknown>>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
  }

  private emptyMapping(): Record<InternalField, string | null> {
    return {
      month: null,
      dsa: null,
      applicationNo: null,
      customerName: null,
      cardType: null,
      bank: null,
      userName: null,
      dseName: null,
      payout96: null,
      given: null
    };
  }
}

function toMoney(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const text = String(value ?? "").trim();
  if (!text) return null;

  const cleaned = text.replace(/,/g, "").replace(/[^\d.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

import ExcelJS from "exceljs";
import Papa from "papaparse";
import jsPDF from "jspdf";

type ExportRow = Record<string, unknown>;

const preferredHeaders = [
  "Month",
  "DSA",
  "Application Ref No",
  "Customer Name",
  "Card Type",
  "Bank",
  "USER NAME",
  "DSE Name",
  "96%",
  "GIVEN",
  "Difference",
  "Penalty",
  "DSE Penalty Deduction",
  "Company Profit Deduction",
  "Final Given",
  "Penalty Reason",
  "Final Profit"
];

export async function exportReport(format: "excel" | "csv" | "pdf", rows: ExportRow[]) {
  const headers = resolveHeaders(rows);

  if (format === "csv") {
    return {
      contentType: "text/csv",
      fileName: "bank-payout-complete-report.csv",
      body: Papa.unparse(rows.map((row) => orderedRow(row, headers)))
    };
  }

  if (format === "pdf") {
    const pdf = new jsPDF({ orientation: "landscape" });
    pdf.setFontSize(12);
    pdf.text("Bank Payout Complete Report", 14, 14);
    pdf.setFontSize(7);

    const visibleHeaders = headers.slice(0, 10);
    pdf.text(visibleHeaders.join(" | "), 14, 24);
    rows.slice(0, 45).forEach((row, index) => {
      const line = visibleHeaders.map((header) => formatCell(row[header])).join(" | ");
      pdf.text(line.slice(0, 190), 14, 32 + index * 5);
    });

    if (rows.length > 45) {
      pdf.text(`Showing first 45 of ${rows.length} rows. Use Excel/CSV for full data.`, 14, 265);
    }

    return {
      contentType: "application/pdf",
      fileName: "bank-payout-complete-report.pdf",
      body: Buffer.from(pdf.output("arraybuffer"))
    };
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Complete Report");
  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.max(header.length + 4, 16)
  }));
  worksheet.addRows(rows.map((row) => orderedRow(row, headers)));

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length }
  };

  for (const row of worksheet.getRows(2, worksheet.rowCount - 1) ?? []) {
    row.eachCell((cell) => {
      if (typeof cell.value === "number") {
        cell.numFmt = "#,##0.00";
      }
    });
  }

  const body = await workbook.xlsx.writeBuffer();

  return {
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName: "bank-payout-complete-report.xlsx",
    body
  };
}

function resolveHeaders(rows: ExportRow[]) {
  const discovered = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((key) => {
    if (key !== "id") discovered.add(key);
  }));

  return [
    ...preferredHeaders.filter((header) => discovered.has(header)),
    ...Array.from(discovered).filter((header) => !preferredHeaders.includes(header))
  ];
}

function orderedRow(row: ExportRow, headers: string[]) {
  return headers.reduce<ExportRow>((acc, header) => {
    acc[header] = row[header] ?? "";
    return acc;
  }, {});
}

function formatCell(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value.toFixed(2);
  return String(value).replace(/\s+/g, " ").trim();
}

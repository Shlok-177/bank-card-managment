import ExcelJS from "exceljs";
import Papa from "papaparse";
import jsPDF from "jspdf";
import type { ReportRow } from "@/types/domain";

export async function exportReport(format: "excel" | "csv" | "pdf", rows: ReportRow[]) {
  if (format === "csv") {
    return {
      contentType: "text/csv",
      fileName: "bank-payout-report.csv",
      body: Papa.unparse(rows)
    };
  }

  if (format === "pdf") {
    const pdf = new jsPDF();
    pdf.text("Bank Payout Report", 14, 18);
    rows.slice(0, 30).forEach((row, index) => {
      pdf.text(`${row.label} | Apps: ${row.totalApplications} | Profit: ${row.totalProfit}`, 14, 30 + index * 8);
    });
    return {
      contentType: "application/pdf",
      fileName: "bank-payout-report.pdf",
      body: Buffer.from(pdf.output("arraybuffer"))
    };
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Report");
  worksheet.columns = [
    { header: "Label", key: "label", width: 28 },
    { header: "Applications", key: "totalApplications", width: 16 },
    { header: "Payout", key: "totalPayout", width: 16 },
    { header: "Given", key: "totalGiven", width: 16 },
    { header: "Profit", key: "totalProfit", width: 16 }
  ];
  worksheet.addRows(rows);
  worksheet.getRow(1).font = { bold: true };
  const body = await workbook.xlsx.writeBuffer();

  return {
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName: "bank-payout-report.xlsx",
    body
  };
}

import ExcelJS from "exceljs";

export async function buildSampleTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bank Payout Management System";
  const worksheet = workbook.addWorksheet("Master Sheet");
  const headers = ["Month", "DSA", "Appl Ref No", "Cust Name", "Card Type", "Bank", "USER NAME", "DSE Name", "96%", "GIVEN"];

  worksheet.addRow(headers);
  worksheet.addRow(["Apr-2026", "Prime DSA", "APP-10001", "Aarav Sharma", "Platinum", "HDFC Bank", "r.mehra", "Neha Iyer", 2500, 1800]);
  worksheet.addRow(["Apr-2026", "North Channel", "APP-10002", "Diya Kapoor", "Gold", "ICICI Bank", "s.khan", "Rohit Sen", 2100, 1500]);

  worksheet.columns = headers.map((header) => ({ header, key: header, width: Math.max(header.length + 6, 16) }));
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  return workbook.xlsx.writeBuffer();
}

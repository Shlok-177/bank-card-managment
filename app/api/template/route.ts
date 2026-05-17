import { NextResponse } from "next/server";
import { buildSampleTemplate } from "@/lib/services/template-service";

export async function GET() {
  const body = await buildSampleTemplate();
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="bank-payout-template.xlsx"'
    }
  });
}

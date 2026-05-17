"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

type ReportRow = { label: string; totalApplications: number; totalPayout: number; totalGiven: number; totalProfit: number };

export default function ReportsPage() {
  const [type, setType] = useState("bank");
  const [filters, setFilters] = useState({ month: "", bank: "", dseName: "", cardType: "", userName: "" });
  const [rows, setRows] = useState<ReportRow[]>([]);

  const query = new URLSearchParams({ type, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) });

  useEffect(() => {
    fetch(`/api/reports?${query}`).then((response) => response.json()).then((data) => setRows(data.data ?? []));
  }, [type, filters.month, filters.bank, filters.dseName, filters.cardType, filters.userName]);

  const columns = useMemo<ColumnDef<ReportRow>[]>(
    () => [
      { accessorKey: "label", header: "Group" },
      { accessorKey: "totalApplications", header: "Applications" },
      { accessorKey: "totalPayout", header: "Payout", cell: ({ row }) => formatCurrency(row.original.totalPayout) },
      { accessorKey: "totalGiven", header: "Given", cell: ({ row }) => formatCurrency(row.original.totalGiven) },
      { accessorKey: "totalProfit", header: "Profit", cell: ({ row }) => formatCurrency(row.original.totalProfit) }
    ],
    []
  );

  return (
    <AppShell>
      <PageHeader
        title="Reports"
        description="Generate bank-wise, DSE-wise, user-wise, monthly, and profit reports."
        action={
          <div className="flex gap-2">
            {["excel", "csv", "pdf"].map((format) => (
              <Button key={format} variant="outline" size="sm" asChild>
                <a href={`/api/reports/export?${query}&format=${format}`}>
                  <Download className="h-4 w-4" />
                  {format.toUpperCase()}
                </a>
              </Button>
            ))}
          </div>
        }
      />
      <Card className="mb-4">
        <CardContent className="grid gap-4 pt-5 md:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-2">
            <Label>Report</Label>
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="bank">Bank-wise</option>
              <option value="dse">DSE-wise</option>
              <option value="user">User-wise</option>
              <option value="monthly">Monthly</option>
              <option value="profit">Profit</option>
            </select>
          </div>
          {Object.keys(filters).map((key) => (
            <div className="space-y-2" key={key}>
              <Label>{key}</Label>
              <Input value={filters[key as keyof typeof filters]} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))} />
            </div>
          ))}
        </CardContent>
      </Card>
      <DataTable columns={columns} data={rows} filterPlaceholder="Search report rows..." />
    </AppShell>
  );
}

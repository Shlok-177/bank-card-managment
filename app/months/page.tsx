"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";

type MonthRow = {
  id: string;
  month: string;
  status: string;
  uploadedRecords: number;
  activeVersion: number;
  lastUploadAt?: string;
  penaltyAmount: number;
};

type ApplicationRow = {
  id: string;
  month: string;
  dsa?: string;
  applicationNo: string;
  customerName: string;
  cardType?: string;
  bank: string;
  userName?: string;
  dseName?: string;
  payout96: string | number;
  given: string | number;
  difference: string | number;
};

export default function MonthsPage() {
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [uploads, setUploads] = useState<Array<{ id: string; version: number; mode: string; createdAt: string; totalRows: number }>>([]);
  const [savingId, setSavingId] = useState("");
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const initialMonthApplied = useRef(false);

  const totalRecords = months.reduce((sum, month) => sum + month.uploadedRecords, 0);
  const completedMonths = months.filter((month) => month.status === "COMPLETED").length;
  const pendingMonths = months.filter((month) => ["PENDING", "PARTIAL", "PROCESSING"].includes(month.status)).length;

  async function loadMonths() {
    const data = await fetch("/api/months").then((response) => response.json());
    setMonths(data);
    const requestedMonth = !initialMonthApplied.current ? new URLSearchParams(window.location.search).get("month") : null;
    if (requestedMonth && data.some((month: MonthRow) => month.month === requestedMonth)) {
      initialMonthApplied.current = true;
      setSelectedMonth(requestedMonth);
      return;
    }
    initialMonthApplied.current = true;
    if (!selectedMonth && data[0]?.month) setSelectedMonth(data[0].month);
  }

  async function loadWorkspace(month: string) {
    if (!month) return;
    setIsLoadingWorkspace(true);
    setApplications([]);
    setUploads([]);
    try {
      const data = await fetch(`/api/months/${encodeURIComponent(month)}`).then((response) => response.json());
      setApplications(data.applications ?? []);
      setUploads(data.uploads ?? []);
    } finally {
      setIsLoadingWorkspace(false);
    }
  }

  useEffect(() => {
    loadMonths();
  }, []);

  useEffect(() => {
    loadWorkspace(selectedMonth);
  }, [selectedMonth]);

  async function updateCell(id: string, field: keyof ApplicationRow, value: string) {
    setSavingId(id);
    const numericFields = new Set(["payout96", "given"]);
    const body = { [field]: numericFields.has(field) ? Number(value) : value };
    const updated = await fetch(`/api/applications/${id}`, { method: "PATCH", body: JSON.stringify(body) }).then((response) => response.json());
    setApplications((current) => current.map((row) => (row.id === id ? { ...row, ...updated } : row)));
    setSavingId("");
    await loadMonths();
  }

  function openMonth(month: string) {
    setSelectedMonth(month);
    window.history.replaceState(null, "", `/months?month=${encodeURIComponent(month)}`);
  }

  const monthColumns = useMemo<ColumnDef<MonthRow>[]>(
    () => [
      { accessorKey: "month", header: "Month" },
      { header: "Status", cell: ({ row }) => <Badge>{row.original.status}</Badge> },
      { accessorKey: "uploadedRecords", header: "Records" },
      { accessorKey: "activeVersion", header: "Version" },
      { header: "Penalty", cell: ({ row }) => formatCurrency(row.original.penaltyAmount) },
      { header: "Last Upload", cell: ({ row }) => row.original.lastUploadAt ? new Date(row.original.lastUploadAt).toLocaleString() : "Pending" },
      { header: "Open", cell: ({ row }) => <Button size="sm" variant="outline" onClick={() => openMonth(row.original.month)}>Open</Button> }
    ],
    []
  );

  const editableColumns = useMemo<ColumnDef<ApplicationRow>[]>(
    () => {
      const editable = ([
        ["applicationNo", "Application Ref No"],
        ["customerName", "Customer Name"],
        ["dsa", "DSA"],
        ["cardType", "Card Type"],
        ["bank", "Bank"],
        ["userName", "USER NAME"],
        ["dseName", "DSE Name"],
        ["payout96", "96%"],
        ["given", "GIVEN"]
      ] as Array<[keyof ApplicationRow, string]>).map<ColumnDef<ApplicationRow>>(([key, label]) => ({
        accessorKey: key,
        header: label,
        cell: ({ row }) => (
          <Input
            defaultValue={String(row.original[key] ?? "")}
            className="min-w-36"
            onBlur={(event) => {
              const next = event.target.value;
              if (next !== String(row.original[key] ?? "")) updateCell(row.original.id, key, next);
            }}
          />
        )
      }));

      return [
        ...editable,
        {
          accessorKey: "difference",
          header: "Difference",
          cell: ({ row }) => formatCurrency(Number(row.original.difference))
        }
      ];
    },
    []
  );

  return (
    <AppShell>
      <PageHeader title="Month Management" description="Track uploaded, pending, processing, completed, locked, and versioned month data." />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Tracked Months", months.length.toLocaleString()],
          ["Completed", completedMonths.toLocaleString()],
          ["Needs Attention", pendingMonths.toLocaleString()],
          ["Active Records", totalRecords.toLocaleString()]
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {months.length ? months.map((month) => (
                <button
                  key={month.id}
                  type="button"
                  onClick={() => openMonth(month.month)}
                  className={cn(
                    "w-full rounded-md border p-3 text-left transition hover:bg-muted",
                    selectedMonth === month.month && "border-primary bg-secondary"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{month.month}</span>
                    <Badge>{month.status}</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{month.uploadedRecords} records</span>
                    <span>Version {month.activeVersion}</span>
                  </div>
                </button>
              )) : <p className="text-sm text-muted-foreground">No month data uploaded yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Months</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={monthColumns} data={months} filterPlaceholder="Search months..." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload History {selectedMonth ? `- ${selectedMonth}` : ""}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {uploads.length ? uploads.map((upload) => (
                <div key={upload.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>Version {upload.version} / {upload.mode}</span>
                  <span className="text-muted-foreground">{upload.totalRows} rows / {new Date(upload.createdAt).toLocaleString()}</span>
                </div>
              )) : <p className="text-sm text-muted-foreground">No upload history yet.</p>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{selectedMonth || "Month"} Editable Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            {savingId ? <p className="mb-3 text-sm text-muted-foreground">Saving row...</p> : null}
            {isLoadingWorkspace ? (
              <div className="rounded-md border p-8 text-sm text-muted-foreground">Loading {selectedMonth} data...</div>
            ) : (
              <DataTable key={selectedMonth} columns={editableColumns} data={applications} filterPlaceholder="Filter month rows..." />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

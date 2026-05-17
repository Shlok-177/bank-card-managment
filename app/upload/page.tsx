"use client";

import Link from "next/link";
import { CalendarDays, Download, ExternalLink, FileSpreadsheet, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Validation = {
  headers: string[];
  totalRows: number;
  validRows: unknown[];
  errors: Array<{ rowNumber: number; field?: string; message: string }>;
  duplicateApplicationNos: string[];
  existingMonth?: { month: string; activeRecords: number; nextVersion: number };
};

type MonthOption = {
  month: string;
  status?: string;
  uploadedRecords?: number;
  activeVersion?: number;
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState(defaultMonth());
  const [mode, setMode] = useState<"NEW" | "REPLACE" | "MERGE">("NEW");
  const [validation, setValidation] = useState<Validation | null>(null);
  const [message, setMessage] = useState("");
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [lastImportedMonth, setLastImportedMonth] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    loadMonths()
      .catch(() => setMonths([]));
  }, []);

  async function loadMonths() {
    const data = await fetch("/api/months").then((response) => response.json());
    setMonths(Array.isArray(data) ? data : []);
  }

  const monthOptions = useMemo(() => {
    const map = new Map<string, MonthOption>();
    for (const item of buildRollingMonths()) map.set(item.month, item);
    for (const item of months) map.set(item.month, item);
    if (month) map.set(month, map.get(month) ?? { month });
    return Array.from(map.values()).sort((a, b) => sortMonthDesc(a.month, b.month));
  }, [months, month]);

  async function submit(path: "validate" | "import") {
    if (!file) return;
    setIsBusy(true);
    setMessage(path === "validate" ? "Validating..." : "Importing...");

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("month", month);
      form.append("mode", mode);
      const response = await fetch(`/api/uploads/${path}`, { method: "POST", body: form });
      const data = await response.json().catch(() => ({ error: "Upload failed. Please try again." }));

      if (!response.ok || data.error) {
        setMessage(data.error ?? "Upload failed. Please try again.");
        return;
      }

      const nextValidation = path === "import" ? data.validation : data;
      setValidation(nextValidation);

      if (nextValidation?.existingMonth && mode === "NEW") {
        setMode("REPLACE");
      }

      if (path === "import" && data.imported) {
        setLastImportedMonth(month);
        setMessage(`${data.upload?.mode ?? mode} completed successfully as version ${data.upload?.version ?? ""}.`);
        await loadMonths();
        return;
      }

      setMessage(path === "import" ? "Import needs attention. Review validation results." : "Validation completed.");
    } catch {
      setMessage("Upload could not complete. Please retry.");
    } finally {
      setIsBusy(false);
    }
  }

  const selectedMonthInfo = monthOptions.find((option) => option.month === month);

  return (
    <AppShell>
      <PageHeader
        title="Upload Excel"
        description="Choose a month, validate the master sheet, then import as a new version when the month already exists."
        action={
          <Button variant="outline" asChild>
            <a href="/api/template">
              <Download className="h-4 w-4" />
              Template
            </a>
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[480px_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b bg-secondary/50 px-5 py-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Step 1</p>
            <h2 className="text-lg font-semibold">Select month and master sheet</h2>
          </div>
          <CardHeader>
            <CardTitle>Monthly Master Sheet</CardTitle>
            <CardDescription>Same-month uploads automatically become the next version. Replace is selected by default.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Month</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={month}
                onChange={(event) => {
                  setMonth(event.target.value);
                  setValidation(null);
                  setMessage("");
                  setMode(months.some((item) => item.month === event.target.value) ? "REPLACE" : "NEW");
                }}
              >
                {monthOptions.map((option) => (
                  <option key={option.month} value={option.month}>
                    {option.month}{option.uploadedRecords ? ` - ${option.uploadedRecords} records / v${option.activeVersion}` : ""}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                {selectedMonthInfo?.uploadedRecords ? (
                  <>
                    <Badge>{selectedMonthInfo.status}</Badge>
                    <Badge>{selectedMonthInfo.uploadedRecords} records</Badge>
                    <Badge>Version {selectedMonthInfo.activeVersion}</Badge>
                  </>
                ) : (
                  <Badge>New month</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Excel File</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setValidation(null);
                  setMessage("");
                }}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ["NEW", "New", "First upload"],
                ["REPLACE", "Replace", "Version 2, 3..."],
                ["MERGE", "Merge", "Only new rows"]
              ].map(([value, title, detail]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setMode(value as "NEW" | "REPLACE" | "MERGE");
                    setMessage("");
                  }}
                  className={`rounded-md border p-3 text-left transition ${mode === value ? "border-primary bg-secondary" : "bg-background hover:bg-muted"}`}
                >
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{detail}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => submit("validate")} disabled={!file || isBusy}>
                <FileSpreadsheet className="h-4 w-4" />
                {isBusy ? "Working..." : "Validate"}
              </Button>
              <Button onClick={() => submit("import")} disabled={!file || isBusy || (mode === "NEW" && Boolean(validation?.errors.length))}>
                <UploadCloud className="h-4 w-4" />
                {isBusy ? "Working..." : "Import"}
              </Button>
              {(lastImportedMonth || month) ? (
                <Button variant="secondary" asChild>
                  <Link href={`/months?month=${encodeURIComponent(lastImportedMonth || month)}`}>
                    <ExternalLink className="h-4 w-4" />
                    Open Month
                  </Link>
                </Button>
              ) : null}
            </div>

            {validation?.existingMonth ? (
              <div className="rounded-md border border-primary/30 bg-secondary/60 p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{validation.existingMonth.month} already has {validation.existingMonth.activeRecords} active records.</p>
                    <p className="mt-1 text-xs text-muted-foreground">This import will become version {validation.existingMonth.nextVersion}. Use Replace for updated same-sheet data.</p>
                  </div>
                </div>
              </div>
            ) : null}
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <div className="border-b bg-muted/40 px-5 py-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Step 2</p>
            <h2 className="text-lg font-semibold">Review validation</h2>
          </div>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <CardDescription>Filters and duplicate checks affect rows only. Columns remain available in reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {validation ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge>{validation.totalRows} rows</Badge>
                  <Badge>{validation.validRows.length} importable rows</Badge>
                  <Badge>{validation.errors.length} blocking errors</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {validation.headers.map((header) => (
                    <Badge key={header} className="bg-secondary text-secondary-foreground">{header}</Badge>
                  ))}
                </div>
                <div className="max-h-96 overflow-auto rounded-md border">
                  {validation.errors.length ? (
                    validation.errors.map((error, index) => (
                      <div key={`${error.message}-${index}`} className="border-b p-3 text-sm last:border-b-0">
                        <span className="font-medium">Row {error.rowNumber || "file"}:</span> {error.message}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-sm text-muted-foreground">No blocking validation errors found.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-6 text-sm text-muted-foreground">Upload a sheet to see validation details.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function defaultMonth() {
  return formatMonth(new Date());
}

function buildRollingMonths() {
  const now = new Date();
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 24 + index, 1);
    return { month: formatMonth(date) };
  });
}

function formatMonth(date: Date) {
  return date.toLocaleString("en-US", { month: "short", year: "numeric" }).replace(" ", "-");
}

function sortMonthDesc(a: string, b: string) {
  return parseMonth(b).getTime() - parseMonth(a).getTime();
}

function parseMonth(value: string) {
  const [monthName, year] = value.split("-");
  const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(monthName);
  return new Date(Number(year), Math.max(monthIndex, 0), 1);
}

"use client";

import { Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Validation = {
  headers: string[];
  totalRows: number;
  validRows: unknown[];
  errors: Array<{ rowNumber: number; field?: string; message: string }>;
  duplicateApplicationNos: string[];
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState("Apr-2026");
  const [validation, setValidation] = useState<Validation | null>(null);
  const [message, setMessage] = useState("");

  async function submit(path: "validate" | "import") {
    if (!file) return;
    setMessage(path === "validate" ? "Validating..." : "Importing...");
    const form = new FormData();
    form.append("file", file);
    form.append("month", month);
    const response = await fetch(`/api/uploads/${path}`, { method: "POST", body: form });
    const data = await response.json();
    setValidation(path === "import" ? data.validation : data);
    setMessage(path === "import" && data.imported ? "Import completed successfully." : "Validation completed.");
  }

  return (
    <AppShell>
      <PageHeader
        title="Upload Excel"
        description="Validate the monthly master sheet before it touches production payout data."
        action={
          <Button variant="outline" asChild>
            <a href="/api/template">
              <Download className="h-4 w-4" />
              Template
            </a>
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Master Sheet</CardTitle>
            <CardDescription>Accepted formats: xlsx, xls, csv. Duplicate application numbers are blocked.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Input value={month} onChange={(event) => setMonth(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Excel File</Label>
              <Input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => submit("validate")} disabled={!file}>
                <FileSpreadsheet className="h-4 w-4" />
                Validate
              </Button>
              <Button onClick={() => submit("import")} disabled={!file || Boolean(validation?.errors.length)}>
                <UploadCloud className="h-4 w-4" />
                Import
              </Button>
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <CardDescription>Review detected columns, valid rows, and blocking errors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {validation ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge>{validation.totalRows} rows</Badge>
                  <Badge>{validation.validRows.length} valid preview rows</Badge>
                  <Badge>{validation.errors.length} errors</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {validation.headers.map((header) => (
                    <Badge key={header} className="bg-secondary text-secondary-foreground">{header}</Badge>
                  ))}
                </div>
                <div className="max-h-80 overflow-auto rounded-md border">
                  {validation.errors.length ? (
                    validation.errors.map((error, index) => (
                      <div key={`${error.message}-${index}`} className="border-b p-3 text-sm last:border-b-0">
                        <span className="font-medium">Row {error.rowNumber || "file"}:</span> {error.message}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-sm text-muted-foreground">No validation errors found.</div>
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

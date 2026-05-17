"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ReceiptText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

type Penalty = {
  id: string;
  month: string;
  dseName: string;
  applicationNo?: string;
  amount: string | number;
  reason: string;
  createdAt: string;
};

export default function PenaltiesPage() {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [form, setForm] = useState({ applicationNo: "", amount: "0", reason: "" });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const totalPenalty = penalties.reduce((sum, penalty) => sum + Number(penalty.amount), 0);
  const affectedDses = new Set(penalties.map((penalty) => penalty.dseName)).size;

  async function load() {
    setPenalties(await fetch("/api/penalties").then((response) => response.json()));
  }

  useEffect(() => {
    load();
  }, []);

  async function createPenalty() {
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/penalties", {
        method: "POST",
        body: JSON.stringify({ ...form, amount: Number(form.amount) })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        setMessage(data.error ?? "Unable to add penalty");
        return;
      }

      setMessage(`Penalty added for ${data.applicationNo} / ${data.dseName}. Application profit: ${formatCurrency(Number(data.applicationProfit ?? 0))}`);
      setForm({ applicationNo: "", amount: "0", reason: "" });
      await load();
    } finally {
      setIsSaving(false);
    }
  }

  async function deletePenalty(id: string) {
    setMessage("");
    const response = await fetch(`/api/penalties?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      setMessage(data.error ?? "Unable to remove penalty");
      return;
    }

    setMessage("Penalty removed from active reports.");
    await load();
  }

  const columns = useMemo<ColumnDef<Penalty>[]>(
    () => [
      { accessorKey: "applicationNo", header: "Application No" },
      { accessorKey: "month", header: "Month" },
      { accessorKey: "dseName", header: "DSE" },
      { header: "Penalty", cell: ({ row }) => formatCurrency(Number(row.original.amount)) },
      { accessorKey: "reason", header: "Reason" },
      { header: "Added", cell: ({ row }) => new Date(row.original.createdAt).toLocaleString() },
      {
        header: "Action",
        cell: ({ row }) => (
          <Button size="sm" variant="destructive" onClick={() => deletePenalty(row.original.id)}>
            Remove
          </Button>
        )
      }
    ],
    []
  );

  return (
    <AppShell>
      <PageHeader title="Penalty Management" description="Enter an application number; the system maps month, DSE, and profit automatically." />

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Penalties</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(totalPenalty)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Affected DSEs</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{affectedDses}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Penalty Entries</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{penalties.length}</CardContent>
        </Card>
      </div>

      <Card className="mb-5 overflow-hidden">
        <div className="border-b bg-secondary/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Add Penalty</CardTitle>
              <CardDescription>Example: APP-10002, 500, Wrong document.</CardDescription>
            </div>
          </div>
        </div>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-[1fr_160px_1fr_auto]">
          <div className="space-y-2">
            <Label>Application Number</Label>
            <Input value={form.applicationNo} onChange={(event) => setForm((current) => ({ ...current, applicationNo: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Penalty</Label>
            <Input type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} />
          </div>
          <Button className="self-end" onClick={createPenalty} disabled={isSaving || !form.applicationNo || !form.reason}>
            {isSaving ? "Adding..." : "Add Penalty"}
          </Button>
          {message ? <p className="text-sm text-muted-foreground md:col-span-4">{message}</p> : null}
        </CardContent>
      </Card>

      <DataTable columns={columns} data={penalties} filterPlaceholder="Search penalties..." />
    </AppShell>
  );
}

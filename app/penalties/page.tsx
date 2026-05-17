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
  amount: string | number;
  reason: string;
  createdAt: string;
};

export default function PenaltiesPage() {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [form, setForm] = useState({ month: "Oct-2025", dseName: "", amount: "0", reason: "" });
  const totalPenalty = penalties.reduce((sum, penalty) => sum + Number(penalty.amount), 0);
  const affectedDses = new Set(penalties.map((penalty) => penalty.dseName)).size;

  async function load() {
    setPenalties(await fetch("/api/penalties").then((response) => response.json()));
  }

  useEffect(() => {
    load();
  }, []);

  async function createPenalty() {
    await fetch("/api/penalties", { method: "POST", body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
    setForm({ month: form.month, dseName: "", amount: "0", reason: "" });
    await load();
  }

  const columns = useMemo<ColumnDef<Penalty>[]>(
    () => [
      { accessorKey: "month", header: "Month" },
      { accessorKey: "dseName", header: "DSE" },
      { header: "Penalty", cell: ({ row }) => formatCurrency(Number(row.original.amount)) },
      { accessorKey: "reason", header: "Reason" },
      { header: "Added", cell: ({ row }) => new Date(row.original.createdAt).toLocaleString() }
    ],
    []
  );

  return (
    <AppShell>
      <PageHeader title="Penalty Management" description="Deduct DSE penalties from final payout reports with a clear reason trail." />

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
              <CardDescription>Example: Chirag Raval, Oct-2025, 500, Wrong document.</CardDescription>
            </div>
          </div>
        </div>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-[160px_1fr_160px_1fr_auto]">
          <div className="space-y-2">
            <Label>Month</Label>
            <Input value={form.month} onChange={(event) => setForm((current) => ({ ...current, month: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>DSE</Label>
            <Input value={form.dseName} onChange={(event) => setForm((current) => ({ ...current, dseName: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} />
          </div>
          <Button className="self-end" onClick={createPenalty} disabled={!form.month || !form.dseName || !form.reason}>Add Penalty</Button>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={penalties} filterPlaceholder="Search penalties..." />
    </AppShell>
  );
}

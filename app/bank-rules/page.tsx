"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Rule = { id: string; bank: string; cardType?: string; formula: { expression?: string }; isActive: boolean };

export default function BankRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [bank, setBank] = useState("");
  const [cardType, setCardType] = useState("");
  const [expression, setExpression] = useState("payout96 - given");

  async function load() {
    const data = await fetch("/api/bank-rules").then((response) => response.json());
    setRules(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createRule() {
    await fetch("/api/bank-rules", {
      method: "POST",
      body: JSON.stringify({ bank, cardType: cardType || null, formula: { type: "difference", expression }, isActive: true })
    });
    setBank("");
    setCardType("");
    setExpression("payout96 - given");
    await load();
  }

  const columns = useMemo<ColumnDef<Rule>[]>(
    () => [
      { accessorKey: "bank", header: "Bank" },
      { accessorKey: "cardType", header: "Card Type", cell: ({ row }) => row.original.cardType ?? "All" },
      { header: "Formula", cell: ({ row }) => row.original.formula?.expression ?? "payout96 - given" },
      { header: "Status", cell: ({ row }) => <Badge>{row.original.isActive ? "Active" : "Inactive"}</Badge> }
    ],
    []
  );

  return (
    <AppShell>
      <PageHeader title="Bank Rules" description="Configure bank-specific payout formulas and future commission logic." />
      <Card className="mb-4">
        <CardContent className="grid gap-4 pt-5 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="space-y-2"><Label>Bank</Label><Input value={bank} onChange={(event) => setBank(event.target.value)} /></div>
          <div className="space-y-2"><Label>Card Type</Label><Input value={cardType} onChange={(event) => setCardType(event.target.value)} /></div>
          <div className="space-y-2"><Label>Formula</Label><Input value={expression} onChange={(event) => setExpression(event.target.value)} /></div>
          <Button className="self-end" onClick={createRule} disabled={!bank}>Add Rule</Button>
        </CardContent>
      </Card>
      <DataTable columns={columns} data={rules} filterPlaceholder="Search bank rules..." />
    </AppShell>
  );
}

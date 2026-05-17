"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCharts } from "@/components/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type Row = { label: string; applications: number; payout: number; given: number; profit: number };

export default function AnalyticsPage() {
  const [data, setData] = useState<{ monthlyTrends: Row[]; bankPerformance: Row[]; dsePerformance: Row[] } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((response) => response.json()).then(setData);
  }, []);

  const bestBank = data?.bankPerformance?.[0];

  return (
    <AppShell>
      <PageHeader title="Analytics" description="Performance signals for payout leakage, bank profitability, and DSE throughput." />
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Top Bank</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{bestBank?.label ?? "No data"}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Bank Profit</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(bestBank?.profit ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tracked Groups</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{(data?.bankPerformance?.length ?? 0) + (data?.dsePerformance?.length ?? 0)}</CardContent>
        </Card>
      </div>
      <DashboardCharts monthlyTrends={data?.monthlyTrends ?? []} bankPerformance={data?.bankPerformance ?? []} dsePerformance={data?.dsePerformance ?? []} />
    </AppShell>
  );
}

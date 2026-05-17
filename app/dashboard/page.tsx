"use client";

import { useEffect, useState } from "react";
import { CreditCard, IndianRupee, TrendingUp, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCharts } from "@/components/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type Dashboard = {
  kpis: { totalApplications: number; totalPayout: number; totalGiven: number; totalProfit: number };
  monthlyTrends: [];
  bankPerformance: [];
  dsePerformance: [];
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((response) => response.json()).then(setData).catch(() => setData(null));
  }, []);

  const kpis = data?.kpis ?? { totalApplications: 0, totalPayout: 0, totalGiven: 0, totalProfit: 0 };
  const cards = [
    { label: "Total Applications", value: kpis.totalApplications.toLocaleString(), icon: CreditCard },
    { label: "Total Payout", value: formatCurrency(kpis.totalPayout), icon: IndianRupee },
    { label: "Total Given", value: formatCurrency(kpis.totalGiven), icon: WalletCards },
    { label: "Total Profit", value: formatCurrency(kpis.totalProfit), icon: TrendingUp }
  ];

  return (
    <AppShell>
      <PageHeader title="Dashboard" description="A live view of applications, payout exposure, and retained profit." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-4">
        <DashboardCharts
          monthlyTrends={data?.monthlyTrends ?? []}
          bankPerformance={data?.bankPerformance ?? []}
          dsePerformance={data?.dsePerformance ?? []}
        />
      </div>
    </AppShell>
  );
}

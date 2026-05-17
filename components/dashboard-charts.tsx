"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type ChartRow = {
  label: string;
  applications: number;
  payout: number;
  given: number;
  profit: number;
  originalProfit?: number;
  penalty?: number;
};

const colors = ["#0284c7", "#0f766e", "#d97706", "#7c3aed", "#be123c", "#4d7c0f", "#0f766e", "#4338ca"];

export function DashboardCharts({ monthlyTrends, bankPerformance, dsePerformance }: {
  monthlyTrends: ChartRow[];
  bankPerformance: ChartRow[];
  dsePerformance: ChartRow[];
}) {
  const monthlyPieData = monthlyTrends
    .map((row) => ({ ...row, value: Math.max(Number(row.profit), 0) }))
    .filter((row) => row.value > 0);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Profit Share</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Pie
                  data={monthlyPieData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={70}
                  outerRadius={115}
                  paddingAngle={2}
                >
                  {monthlyPieData.map((entry, index) => (
                    <Cell key={entry.label} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="max-h-80 space-y-2 overflow-auto">
            {monthlyTrends.map((row, index) => (
              <div key={row.label} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />
                    {row.label}
                  </span>
                  <span>{formatCurrency(row.profit)}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {row.applications} apps
                  {row.penalty ? ` / Penalty ${formatCurrency(row.penalty)}` : ""}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Bank Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bankPerformance.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="profit" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>DSE Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dsePerformance.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="applications" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

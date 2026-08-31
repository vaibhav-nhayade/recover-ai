"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { mockAnalytics, mockRecoveryByType, mockRecoveryCases, mockRevenueTrend } from "@/data/mock";
import { formatCompactINR, formatCurrency, labelFromEnum } from "@/lib/utils";

export default function DashboardPage() {
  const priorityCases = [...mockRecoveryCases]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Dashboard"
        description="Autonomous revenue recovery performance and operational health."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Revenue at Risk" value={formatCompactINR(mockAnalytics.revenueAtRisk)} tone="danger" />
        <MetricCard label="Recovered Revenue" value={formatCompactINR(mockAnalytics.recoveredRevenue)} tone="success" />
        <MetricCard label="Recovery Rate" value={`${mockAnalytics.recoveryRate}%`} tone="accent" />
        <MetricCard label="Active Cases" value={mockAnalytics.activeCases.toLocaleString("en-IN")} />
        <MetricCard label="Successful Recoveries" value={mockAnalytics.successfulRecoveries.toLocaleString("en-IN")} tone="success" />
        <MetricCard label="Human Escalations" value={mockAnalytics.humanEscalations.toLocaleString("en-IN")} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card className="min-h-[390px]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <CardTitle>Revenue at Risk vs Recovered</CardTitle>
              <p className="mt-1 text-xs text-secondary">Daily recovery performance · ₹L</p>
            </div>
            <Clock3 className="h-4 w-4 text-secondary" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockRevenueTrend}>
                <CartesianGrid vertical={false} stroke="#E4E7EC" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="atRisk" name="At risk" fill="#F04438" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recovered" name="Recovered" fill="#12B76A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-5 flex items-center justify-between">
            <CardTitle>Recovery by Type</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-secondary" />
          </div>
          <div className="space-y-5">
            {mockRecoveryByType.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-secondary">{item.label}</span>
                  <span className="font-semibold text-primary">{item.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-app">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Recent Recovery Activity</CardTitle>
            <Link href="/recovery" className="text-xs font-semibold text-accent hover:underline">View queue</Link>
          </div>
          <div className="divide-y divide-border">
            {mockRecoveryCases.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {item.status === "RECOVERED" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.transactionId ?? item.id}</p>
                    <p className="truncate text-xs text-secondary">{labelFromEnum(item.type)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(item.amount)}</p>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Priority Recovery Cases</CardTitle>
            <Link href="/recovery" className="text-xs font-semibold text-accent hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {priorityCases.map((item) => (
              <Link key={item.id} href={`/recovery/${item.id}`} className="block rounded-lg border border-border p-3 transition-colors hover:bg-app">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.transactionId ?? item.id}</p>
                    <p className="mt-1 text-xs text-secondary">{formatCurrency(item.amount)} · {item.recoveryProbability}% recovery probability</p>
                  </div>
                  <PriorityBadge priority={item.priority} />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

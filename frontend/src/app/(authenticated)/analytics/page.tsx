"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { mockAnalytics, mockRecoveryByType, mockRevenueTrend } from "@/data/mock";
import { formatCompactINR } from "@/lib/utils";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Analytics" description="Measure recovery performance and agent business impact." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Revenue at Risk" value={formatCompactINR(mockAnalytics.revenueAtRisk)} tone="danger" />
        <MetricCard label="Recovered Revenue" value={formatCompactINR(mockAnalytics.recoveredRevenue)} tone="success" />
        <MetricCard label="Recovery Rate" value={`${mockAnalytics.recoveryRate}%`} tone="accent" />
        <MetricCard label="Average Recovery Time" value={`${mockAnalytics.averageRecoveryTimeMinutes} min`} />
        <MetricCard label="Intervention Success" value={`${mockAnalytics.interventionSuccessRate}%`} tone="success" />
        <MetricCard label="Escalation Rate" value={`${mockAnalytics.escalationRate}%`} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="min-h-[390px]">
          <CardTitle>Revenue at Risk vs Recovered</CardTitle>
          <div className="mt-5 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockRevenueTrend}>
                <CartesianGrid vertical={false} stroke="#E4E7EC" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="atRisk" name="At risk" stroke="#F04438" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="recovered" name="Recovered" stroke="#12B76A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="min-h-[390px]">
          <CardTitle>Recovery by Failure Type</CardTitle>
          <div className="mt-5 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockRecoveryByType} layout="vertical">
                <CartesianGrid horizontal={false} stroke="#E4E7EC" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" width={150} tick={{ fill: "#667085", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#635BFF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

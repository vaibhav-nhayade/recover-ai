"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAnalytics } from "@/hooks/useAnalytics";
import { formatCompactINR } from "@/lib/utils";

function formatStrategyName(strategy: string) {
  return strategy
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMetric(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export default function AnalyticsPage() {
  const {
    data,
    loading,
    error,
  } = useAnalytics(30);

  const revenueAtRisk = Number(
    data?.revenue_at_risk ?? 0,
  );

  const recoveredRevenue = Number(
    data?.verified_recovered_revenue ?? 0,
  );

  const recoveryRate =
    Number(data?.recovery_rate ?? 0) * 100;

  const averageRecoveryTime =
    Number(
      data?.average_recovery_time_minutes ?? 0,
    );

  const interventionSuccessRate =
    Number(
      data?.intervention_success_rate ?? 0,
    ) * 100;

  const escalationRate =
    Number(data?.escalation_rate ?? 0) * 100;

  const strategyData =
    data?.strategy_metrics?.map((item) => ({
      label: formatStrategyName(item.strategy),
      value: Number(item.recovered_revenue),
      successRate: item.success_rate * 100,
      attempts: item.attempts,
    })) ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Analytics"
        description="Measure recovery performance and agent business impact."
      />

      {error && (
        <Card className="border-danger/30 bg-danger-soft p-4">
          <p className="text-sm font-bold text-danger">
            Unable to load live analytics
          </p>

          <p className="mt-1 text-xs text-secondary">
            {error}
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Revenue at Risk"
          value={
            loading
              ? "—"
              : formatCompactINR(
                  formatMetric(revenueAtRisk),
                )
          }
          tone="danger"
        />

        <MetricCard
          label="Recovered Revenue"
          value={
            loading
              ? "—"
              : formatCompactINR(
                  formatMetric(recoveredRevenue),
                )
          }
          tone="success"
        />

        <MetricCard
          label="Recovery Rate"
          value={
            loading
              ? "—"
              : `${recoveryRate.toFixed(1)}%`
          }
          tone="accent"
        />

        <MetricCard
          label="Average Recovery Time"
          value={
            loading
              ? "—"
              : `${averageRecoveryTime.toFixed(1)} min`
          }
        />

        <MetricCard
          label="Intervention Success"
          value={
            loading
              ? "—"
              : `${interventionSuccessRate.toFixed(1)}%`
          }
          tone="success"
        />

        <MetricCard
          label="Escalation Rate"
          value={
            loading
              ? "—"
              : `${escalationRate.toFixed(1)}%`
          }
          tone="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="min-h-[390px]">
          <CardTitle>
            Recovery Overview
          </CardTitle>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-soft p-5">
              <p className="text-xs font-semibold text-secondary">
                Revenue at risk
              </p>

              <p className="mt-2 text-2xl font-bold text-danger">
                {loading
                  ? "—"
                  : formatCompactINR(
                      revenueAtRisk,
                    )}
              </p>

              <p className="mt-1 text-[11px] text-muted">
                Failed payment value
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface-soft p-5">
              <p className="text-xs font-semibold text-secondary">
                Verified recovered
              </p>

              <p className="mt-2 text-2xl font-bold text-success">
                {loading
                  ? "—"
                  : formatCompactINR(
                      recoveredRevenue,
                    )}
              </p>

              <p className="mt-1 text-[11px] text-muted">
                Verified recovery outcomes
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface-soft p-5">
              <p className="text-xs font-semibold text-secondary">
                Unrecovered
              </p>

              <p className="mt-2 text-2xl font-bold text-primary">
                {loading
                  ? "—"
                  : formatCompactINR(
                      Number(
                        data?.unrecovered_revenue ?? 0,
                      ),
                    )}
              </p>

              <p className="mt-1 text-[11px] text-muted">
                Remaining opportunity
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface-soft p-5">
              <p className="text-xs font-semibold text-secondary">
                Recovery cases
              </p>

              <p className="mt-2 text-2xl font-bold text-primary">
                {loading
                  ? "—"
                  : data?.recovered_cases ?? 0}
              </p>

              <p className="mt-1 text-[11px] text-muted">
                Verified recovered cases
              </p>
            </div>
          </div>
        </Card>

        <Card className="min-h-[390px]">
          <CardTitle>
            Recovery by Intervention
          </CardTitle>

          <div className="mt-5 h-[320px]">
            {strategyData.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted">
                  {loading
                    ? "Loading recovery data..."
                    : "No intervention data available for this period."}
                </p>
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={strategyData}
                  layout="vertical"
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="#E4E7EC"
                  />

                  <XAxis
                    type="number"
                    tick={{
                      fill: "#667085",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `₹${Math.round(
                        Number(value) / 1000,
                      )}K`
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="label"
                    width={130}
                    tick={{
                      fill: "#667085",
                      fontSize: 11,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "value") {
                        return [
                          formatCompactINR(
                            Number(value),
                          ),
                          "Recovered",
                        ];
                      }

                      return [
                        `${Number(value).toFixed(1)}%`,
                        "Success rate",
                      ];
                    }}
                  />

                  <Bar
                    dataKey="value"
                    fill="#16a36f"
                    radius={[
                      0,
                      4,
                      4,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <CardTitle>
          Recovery Operations
        </CardTitle>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-secondary">
              Failed transactions
            </p>

            <p className="mt-1 text-xl font-bold text-primary">
              {loading
                ? "—"
                : data?.failed_transactions ?? 0}
            </p>
          </div>

          <div>
            <p className="text-xs text-secondary">
              Active cases
            </p>

            <p className="mt-1 text-xl font-bold text-primary">
              {loading
                ? "—"
                : data?.active_cases ?? 0}
            </p>
          </div>

          <div>
            <p className="text-xs text-secondary">
              Total attempts
            </p>

            <p className="mt-1 text-xl font-bold text-primary">
              {loading
                ? "—"
                : data?.total_attempts ?? 0}
            </p>
          </div>

          <div>
            <p className="text-xs text-secondary">
              Human escalations
            </p>

            <p className="mt-1 text-xl font-bold text-warning">
              {loading
                ? "—"
                : data?.escalated_cases ?? 0}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
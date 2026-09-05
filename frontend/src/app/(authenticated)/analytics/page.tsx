"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { formatCompactINR } from "@/lib/utils";

type DemoTransaction = {
  transaction_reference: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  failure_reason: string;
  transaction_attempts: number;
  customer_successful_transactions: number;
  customer_failed_transactions: number;
  occurred_at: string;
};

type DemoScenario = {
  case_id: string;
  transaction_reference: string;
  recovery_type: string;
  priority: string;
  amount_at_risk: number;
  recovery_probability: number;
  recommended_strategy: string;
  expected_recovery: number;
  escalation_required: boolean;
  scenario: string;
};

type DemoData = {
  transactions: DemoTransaction[];
  scenarios: DemoScenario[];
};

const EMPTY_DATA: DemoData = {
  transactions: [],
  scenarios: [],
};

function percentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function recoveryTypeLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DemoData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/demo-data", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Demo data request failed: ${response.status}`);
        }

        const result = (await response.json()) as DemoData;

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setData(EMPTY_DATA);
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load demo dataset",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const failedTransactions = data.transactions.filter(
      (transaction) => transaction.status === "FAILED",
    );

    const revenueAtRisk = data.scenarios.reduce(
      (total, scenario) => total + Number(scenario.amount_at_risk || 0),
      0,
    );

    const expectedRecovery = data.scenarios.reduce(
      (total, scenario) => total + Number(scenario.expected_recovery || 0),
      0,
    );

    const escalationCount = data.scenarios.filter(
      (scenario) => scenario.escalation_required,
    ).length;

    /*
     * Before the RecoverAI agent executes, there are no verified recovery
     * outcomes. This is intentionally ZERO rather than fabricated data.
     */
    const recoveredRevenue = 0;
    const successfulRecoveries = 0;
    const averageRecoveryTime = 0;
    const interventionSuccess = 0;

    const recoveryRate =
      revenueAtRisk > 0
        ? (recoveredRevenue / revenueAtRisk) * 100
        : 0;

    const escalationRate =
      data.scenarios.length > 0
        ? (escalationCount / data.scenarios.length) * 100
        : 0;

    return {
      failedTransactions: failedTransactions.length,
      revenueAtRisk,
      recoveredRevenue,
      expectedRecovery,
      successfulRecoveries,
      activeCases: data.scenarios.length,
      escalationCount,
      escalationRate,
      averageRecoveryTime,
      interventionSuccess,
      recoveryRate,
    };
  }, [data]);

  const recoveryMix = useMemo(() => {
    const grouped = new Map<string, number>();

    for (const scenario of data.scenarios) {
      const type = scenario.recovery_type;
      grouped.set(
        type,
        (grouped.get(type) ?? 0) +
          Number(scenario.amount_at_risk || 0),
      );
    }

    return Array.from(grouped.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [data]);

  const expectedRecoveryProgress =
    metrics.revenueAtRisk > 0
      ? Math.min(
          (metrics.expectedRecovery / metrics.revenueAtRisk) * 100,
          100,
        )
      : 0;

  return (
    <div className="page-container data-grid-background animate-fade-in">
      <header className="page-header">
        <div>
          <div className="page-eyebrow">Revenue Intelligence</div>

          <h1 className="page-title">Analytics</h1>

          <p className="page-description">
            Measure recovery performance and agent business impact.
          </p>
        </div>

        <div className="analysis-tag">
          {loading ? "Loading dataset" : "CSV dataset"}
        </div>
      </header>

      {error ? (
        <Card className="mb-6 border-danger/30 bg-danger-soft p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-danger" />

            <div>
              <p className="font-bold text-primary">
                Unable to load demo dataset
              </p>

              <p className="mt-1 text-sm text-secondary">
                {error}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <section className="dashboard-section">
        <div className="kpi-grid">
          <MetricCard
            label="Revenue at Risk"
            value={formatCompactINR(metrics.revenueAtRisk)}
            detail={`${metrics.activeCases} recovery cases`}
            tone="danger"
            icon={<AlertTriangle className="h-4 w-4" />}
          />

          <MetricCard
            label="Recovered Revenue"
            value={formatCompactINR(metrics.recoveredRevenue)}
            detail={`${metrics.successfulRecoveries} verified recoveries`}
            tone="success"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />

          <MetricCard
            label="Recovery Rate"
            value={percentage(metrics.recoveryRate)}
            detail="Verified recovered / revenue at risk"
            tone="accent"
            icon={<Target className="h-4 w-4" />}
          />

          <MetricCard
            label="Active Cases"
            value={String(metrics.activeCases)}
            detail={`${metrics.failedTransactions} failed transactions in dataset`}
            tone="warning"
            icon={<Activity className="h-4 w-4" />}
          />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="kpi-grid">
          <MetricCard
            label="Average Recovery Time"
            value={`${metrics.averageRecoveryTime.toFixed(1)} min`}
            detail="Verified recovery outcomes"
            tone="info"
            icon={<Clock3 className="h-4 w-4" />}
          />

          <MetricCard
            label="Intervention Success"
            value={percentage(metrics.interventionSuccess)}
            detail="Successful verified interventions"
            tone="success"
            icon={<ShieldCheck className="h-4 w-4" />}
          />

          <MetricCard
            label="Escalation Rate"
            value={percentage(metrics.escalationRate)}
            detail={`${metrics.escalationCount} predefined escalation case(s)`}
            tone="warning"
            icon={<Users className="h-4 w-4" />}
          />

          <MetricCard
            label="Expected Recovery"
            value={formatCompactINR(metrics.expectedRecovery)}
            detail="Scenario-level expected value"
            tone="accent"
            icon={<Target className="h-4 w-4" />}
          />
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card className="min-h-[420px] p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-primary">
              Recovery Overview
            </h2>

            <p className="mt-1 text-sm text-secondary">
              Revenue exposure and verified recovery from the current
              demo dataset.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-danger/20 bg-danger-soft p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                Revenue at risk
              </p>

              <p className="mt-3 text-3xl font-black text-danger">
                {formatCompactINR(metrics.revenueAtRisk)}
              </p>

              <p className="mt-2 text-sm text-secondary">
                {metrics.activeCases} recovery scenarios loaded
              </p>
            </div>

            <div className="rounded-xl border border-success/20 bg-success-soft p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                Verified recovered
              </p>

              <p className="mt-3 text-3xl font-black text-success">
                {formatCompactINR(metrics.recoveredRevenue)}
              </p>

              <p className="mt-2 text-sm text-secondary">
                No agent recovery has been verified yet
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-primary">
                Expected recovery opportunity
              </p>

              <p className="text-sm font-bold text-brand-dark">
                {percentage(expectedRecoveryProgress)}
              </p>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{
                  width: `${expectedRecoveryProgress}%`,
                }}
              />
            </div>

            <p className="mt-3 text-xs text-muted">
              {formatCompactINR(metrics.expectedRecovery)} expected
              from {formatCompactINR(metrics.revenueAtRisk)} at-risk
              revenue.
            </p>
          </div>
        </Card>

        <Card className="min-h-[420px] p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-primary">
              Recovery by Intervention
            </h2>

            <p className="mt-1 text-sm text-secondary">
              Distribution of the loaded recovery scenarios.
            </p>
          </div>

          {recoveryMix.length > 0 ? (
            <div className="grid items-center gap-4 md:grid-cols-[1fr_1fr]">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={recoveryMix}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={3}
                    >
                      {recoveryMix.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={
                            [
                              "#16a36f",
                              "#d99a28",
                              "#3d7fbd",
                              "#96928b",
                            ][index % 4]
                          }
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value: number) =>
                        formatCompactINR(Number(value))
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {recoveryMix.map((entry) => {
                  const percent =
                    metrics.revenueAtRisk > 0
                      ? (entry.value / metrics.revenueAtRisk) * 100
                      : 0;

                  return (
                    <div key={entry.name}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-primary">
                          {recoveryTypeLabel(entry.name)}
                        </span>

                        <span className="text-sm font-bold text-primary">
                          {percentage(percent)}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-muted">
                        {formatCompactINR(entry.value)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted">
              No recovery scenarios in the dataset.
            </div>
          )}
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-primary">
            Dataset integrity
          </h2>

          <p className="mt-1 text-sm text-secondary">
            Analytics are calculated from the RecoverAI demo CSV files.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface-soft p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
                Transactions
              </p>

              <p className="mt-2 text-2xl font-black text-primary">
                {data.transactions.length}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-soft p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
                Scenarios
              </p>

              <p className="mt-2 text-2xl font-black text-primary">
                {data.scenarios.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-primary">
            Recovery state
          </h2>

          <p className="mt-1 text-sm text-secondary">
            Verified money is intentionally separated from expected
            recovery.
          </p>

          <div className="mt-5 rounded-xl border border-warning/25 bg-warning-soft p-5">
            <p className="text-sm font-bold text-primary">
              Agent execution required for recovered revenue
            </p>

            <p className="mt-2 text-sm leading-6 text-secondary">
              The dataset contains recovery opportunities and expected
              recovery values. RecoverAI reports recovered revenue as
              ₹0 until an intervention produces a verified recovery
              outcome.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
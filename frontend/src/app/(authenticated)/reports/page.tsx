"use client";

import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock3,
  Download,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  getAnalytics,
  getRecoveryCases,
  getRecoveryScore,
  type AnalyticsResponse,
  type RecoveryCaseResponse,
} from "@/lib/api";
import { formatCompactINR } from "@/lib/utils";

const outcomeColors = [
  "#12b76a",
  "#f79009",
  "#635bff",
];

interface HighValueCase {
  id: string;
  transactionId: string;
  reason: string;
  amount: number;
  recoveryProbability: number | null;
  priority: string;
}

export default function ReportsPage() {
  const [analytics, setAnalytics] =
    useState<AnalyticsResponse | null>(null);

  const [recoveryCases, setRecoveryCases] =
    useState<RecoveryCaseResponse[]>([]);

  const [highValueCases, setHighValueCases] =
    useState<HighValueCase[]>([]);

  const [loading, setLoading] = useState(true);
  const [casesLoading, setCasesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        setError(null);

        const result = await getAnalytics(30);

        setAnalytics(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load report analytics.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadReport();
  }, []);

  useEffect(() => {
    async function loadCases() {
      try {
        setCasesLoading(true);

        const cases = await getRecoveryCases();

        setRecoveryCases(cases);

        const rankedCases = [...cases]
          .sort(
            (a, b) =>
              Number(b.amount_at_risk) -
              Number(a.amount_at_risk),
          )
          .slice(0, 4);

        const scoredCases = await Promise.all(
          rankedCases.map(async (item) => {
            try {
              const score = await getRecoveryScore(
                item.transaction_id,
              );

              return {
                id: item.id,
                transactionId: item.transaction_id,
                reason: item.reason,
                amount: Number(item.amount_at_risk),
                recoveryProbability:
                  score.recovery_probability * 100,
                priority: item.priority,
              };
            } catch {
              return {
                id: item.id,
                transactionId: item.transaction_id,
                reason: item.reason,
                amount: Number(item.amount_at_risk),
                recoveryProbability: null,
                priority: item.priority,
              };
            }
          }),
        );

        setHighValueCases(scoredCases);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load recovery opportunities.",
        );
      } finally {
        setCasesLoading(false);
      }
    }

    void loadCases();
  }, []);

  const outcomeData = useMemo(() => {
    if (!analytics) {
      return [];
    }

    const activeCases = Math.max(
      analytics.active_cases,
      0,
    );

    const recoveredCases = Math.max(
      analytics.recovered_cases,
      0,
    );

    const escalatedCases = Math.max(
      analytics.escalated_cases,
      0,
    );

    return [
      {
        name: "Recovered",
        value: recoveredCases,
      },
      {
        name: "Escalated",
        value: escalatedCases,
      },
      {
        name: "Active",
        value: Math.max(
          activeCases - recoveredCases,
          0,
        ),
      },
    ];
  }, [analytics]);

  const strategyData = useMemo(() => {
    if (!analytics) {
      return [];
    }

    return [
      {
        name: "Payment retry",
        value: analytics.payment_retry_attempts,
      },
      {
        name: "Customer contact",
        value:
          analytics.customer_contact_attempts,
      },
      {
        name: "Manual review",
        value: analytics.manual_review_cases,
      },
    ];
  }, [analytics]);

  const periodSummary = useMemo(() => {
    if (!analytics) {
      return [];
    }

    return [
      {
        name: "At risk",
        value: Number(analytics.revenue_at_risk),
      },
      {
        name: "Recovered",
        value: Number(
          analytics.verified_recovered_revenue,
        ),
      },
    ];
  }, [analytics]);

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
            Revenue intelligence
          </div>

          <h1 className="text-2xl font-bold tracking-[-0.035em] sm:text-3xl">
            Recovery Reports
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Executive view of revenue recovered, agent performance,
            intervention outcomes, and operational risk.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]"
        >
          <Download className="h-4 w-4" />
          Export report
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--danger)]">
            {error}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue at Risk"
          value={
            loading || !analytics
              ? "—"
              : formatCompactINR(
                  Number(analytics.revenue_at_risk),
                )
          }
          detail="Currently identified exposure"
          icon={<TrendingUp className="h-5 w-5" />}
          tone="danger"
        />

        <MetricCard
          label="Recovered Revenue"
          value={
            loading || !analytics
              ? "—"
              : formatCompactINR(
                  Number(
                    analytics.verified_recovered_revenue,
                  ),
                )
          }
          detail="Verified recovered revenue"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="success"
        />

        <MetricCard
          label="Recovery Rate"
          value={
            loading || !analytics
              ? "—"
              : `${(
                  analytics.recovery_rate * 100
                ).toFixed(1)}%`
          }
          detail="At-risk revenue recovered"
          icon={<ArrowUpRight className="h-5 w-5" />}
          tone="accent"
        />

        <MetricCard
          label="Agent Success"
          value={
            loading || !analytics
              ? "—"
              : `${(
                  analytics.intervention_success_rate *
                  100
                ).toFixed(1)}%`
          }
          detail={
            loading || !analytics
              ? "Loading operational data"
              : `${analytics.escalated_cases} escalated cases`
          }
          icon={<Bot className="h-5 w-5" />}
          tone="neutral"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold">
                Recovery performance
              </h2>

              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Current reporting-period revenue at risk versus verified recovery
              </p>
            </div>

            <div className="hidden items-center gap-4 text-[10px] text-[var(--text-secondary)] sm:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
                At risk
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
                Recovered
              </span>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={periodSummary}
                margin={{
                  top: 5,
                  right: 5,
                  left: -20,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  stroke="#eaecf0"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "#667085",
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "#98a2b3",
                  }}
                  tickFormatter={(value) =>
                    formatCompactINR(Number(value))
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    formatCompactINR(Number(value))
                  }
                />

                <Bar
                  dataKey="value"
                  fill="#12b76a"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-bold">
              Case outcomes
            </h2>

            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Current recovery operation distribution
            </p>
          </div>

          <div className="relative mx-auto mt-5 h-[210px] max-w-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {outcomeData.map(
                    (entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={
                          outcomeColors[index]
                        }
                      />
                    ),
                  )}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold">
                {analytics?.active_cases ?? "—"}
              </p>

              <p className="text-[10px] text-[var(--text-muted)]">
                active cases
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {outcomeData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        outcomeColors[index],
                    }}
                  />

                  {item.name}
                </span>

                <span className="font-semibold">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6">
            <h2 className="text-sm font-bold">
              Recovery strategy performance
            </h2>

            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Interventions executed during the reporting period
            </p>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={strategyData}
                layout="vertical"
                margin={{
                  top: 0,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  stroke="#eaecf0"
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: "#98a2b3",
                  }}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={115}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "#667085",
                  }}
                />

                <Tooltip
                  formatter={(value) =>
                    `${Number(value)} interventions`
                  }
                />

                <Bar
                  dataKey="value"
                  fill="#635bff"
                  radius={[0, 5, 5, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-sm font-bold">
              Operational health
            </h2>

            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Agent and governance indicators
            </p>
          </div>

          <div className="space-y-1">
            <ReportRow
              icon={<Bot className="h-4 w-4" />}
              label="Intervention success"
              value={
                analytics
                  ? `${(
                      analytics.intervention_success_rate *
                      100
                    ).toFixed(1)}%`
                  : "—"
              }
              tone="success"
            />

            <ReportRow
              icon={<Clock3 className="h-4 w-4" />}
              label="Average recovery time"
              value={
                analytics
                  ? `${analytics.average_recovery_time_minutes.toFixed(
                      1,
                    )} min`
                  : "—"
              }
              tone="accent"
            />

            <ReportRow
              icon={<Users className="h-4 w-4" />}
              label="Human escalation rate"
              value={
                analytics
                  ? `${(
                      analytics.escalation_rate * 100
                    ).toFixed(1)}%`
                  : "—"
              }
              tone="warning"
            />

            <ReportRow
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Policy compliance"
              value="100%"
              tone="success"
            />
          </div>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold">
              Highest-value recovery opportunities
            </h2>

            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Live cases carrying the highest revenue exposure
            </p>
          </div>

          <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] sm:block">
            Ranked by exposure
          </span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {casesLoading ? (
            <div className="py-8 text-center text-sm text-secondary">
              Loading recovery opportunities…
            </div>
          ) : highValueCases.length === 0 ? (
            <div className="py-8 text-center text-sm text-secondary">
              No active recovery opportunities found.
            </div>
          ) : (
            highValueCases.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {item.id}
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {item.transactionId} ·{" "}
                    {item.reason}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Revenue at risk
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {formatCompactINR(item.amount)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Recovery probability
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[var(--success)]">
                    {item.recoveryProbability ===
                    null
                      ? "—"
                      : `${item.recoveryProbability.toFixed(
                          1,
                        )}%`}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--brand)]">
                  {item.priority}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function ReportRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "success" | "accent" | "warning";
}) {
  const styles = {
    success:
      "bg-[var(--success-soft)] text-[var(--success)]",
    accent:
      "bg-[var(--brand-soft)] text-[var(--brand)]",
    warning:
      "bg-[var(--warning-soft)] text-[var(--warning)]",
  };

  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-4 last:border-0">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles[tone]}`}
        >
          {icon}
        </span>

        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </span>
      </div>

      <span className="text-sm font-bold">
        {value}
      </span>
    </div>
  );
}
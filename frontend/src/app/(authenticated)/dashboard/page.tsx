"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
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

import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  formatCompactINR,
  formatCurrency,
  labelFromEnum,
} from "@/lib/utils";


/* -------------------------------------------------------------------------- */
/* CSV-backed demo data                                                       */
/* -------------------------------------------------------------------------- */

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

const EMPTY_DEMO_DATA: DemoData = {
  transactions: [],
  scenarios: [],
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatAmount(value: number | string) {
  if (typeof value === "string") {
    return value;
  }

  return formatCompactINR(value);
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case "HIGH":
      return "status-pill danger";
    case "MEDIUM":
      return "status-pill warning";
    case "LOW":
      return "status-pill neutral";
    default:
      return "status-pill neutral";
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "RECOVERED":
    case "SUCCESS":
    case "COMPLETED":
      return "status-pill success";

    case "IN_PROGRESS":
    case "RUNNING":
    case "PENDING":
      return "status-pill warning";

    case "FAILED":
    case "ESCALATED":
      return "status-pill danger";

    default:
      return "status-pill neutral";
  }
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const [demoData, setDemoData] = useState<DemoData>(EMPTY_DEMO_DATA);
  const [demoDataLoading, setDemoDataLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDemoData() {
      try {
        const response = await fetch("/api/demo-data", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Demo data request failed: ${response.status}`);
        }

        const data = (await response.json()) as DemoData;

        if (!cancelled) {
          setDemoData(data);
        }
      } catch {
        if (!cancelled) {
          setDemoData(EMPTY_DEMO_DATA);
        }
      } finally {
        if (!cancelled) {
          setDemoDataLoading(false);
        }
      }
    }

    loadDemoData();

    return () => {
      cancelled = true;
    };
  }, []);

  const transactions = demoData.transactions;
  const scenarios = demoData.scenarios;

  const analytics = useMemo(() => {
    const revenueAtRisk = scenarios.reduce(
      (sum, item) => sum + item.amount_at_risk,
      0,
    );

    const recoveredRevenue = 0;
    const activeCases = scenarios.filter(
      (item) => !item.escalation_required,
    ).length;
    const humanEscalations = scenarios.filter(
      (item) => item.escalation_required,
    ).length;

    return {
      revenueAtRisk,
      recoveredRevenue,
      recoveryRate: 0,
      activeCases,
      successfulRecoveries: 0,
      humanEscalations,
      escalationRate:
        scenarios.length > 0
          ? Math.round((humanEscalations / scenarios.length) * 1000) / 10
          : 0,
      averageRecoveryTimeMinutes: 0,
      interventionSuccessRate: 0,
    };
  }, [scenarios]);

  const totalAtRisk = analytics.revenueAtRisk;
  const recoveredRevenue = analytics.recoveredRevenue;
  const recoveryRate = analytics.recoveryRate;
  const activeCases = analytics.activeCases;

  const revenueTrend = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) =>
        new Date(a.occurred_at).getTime() -
        new Date(b.occurred_at).getTime(),
    );

    return sorted.map((transaction) => ({
      day: new Date(transaction.occurred_at).toLocaleDateString("en-IN", {
        day: "2-digit",
      }),
      atRisk: scenarios
        .filter((item) => item.transaction_reference === transaction.transaction_reference)
        .reduce((sum, item) => sum + item.amount_at_risk, 0),
      recovered: 0,
    }));
  }, [transactions, scenarios]);

  const recoveryByType = useMemo(() => {
    const totals = new Map<string, number>();

    for (const scenario of scenarios) {
      totals.set(
        scenario.recovery_type,
        (totals.get(scenario.recovery_type) ?? 0) + scenario.amount_at_risk,
      );
    }

    const total = [...totals.values()].reduce((sum, value) => sum + value, 0);

    return [...totals.entries()].map(([name, amount]) => ({
      name: labelFromEnum(name),
      value: total > 0 ? Math.round((amount / total) * 100) : 0,
      amount,
    }));
  }, [scenarios]);

  const recoveryFunnel = useMemo(() => {
    const diagnosed = scenarios.length;
    const eligible = scenarios.filter((item) => !item.escalation_required).length;
    const executed = 0;

    return [
      {
        label: "Revenue detected",
        value: totalAtRisk,
        percent: 100,
      },
      {
        label: "AI diagnosed",
        value: totalAtRisk,
        percent: totalAtRisk > 0 ? 100 : 0,
      },
      {
        label: "Action eligible",
        value: scenarios
          .filter((item) => !item.escalation_required)
          .reduce((sum, item) => sum + item.amount_at_risk, 0),
        percent: diagnosed > 0 ? Math.round((eligible / diagnosed) * 100) : 0,
      },
      {
        label: "Intervention executed",
        value: executed,
        percent: 0,
      },
      {
        label: "Recovered",
        value: recoveredRevenue,
        percent: 0,
      },
    ];
  }, [scenarios, totalAtRisk, recoveredRevenue]);

  const paymentMethodData = useMemo(() => {
    const methods = new Map<string, { success: number; failed: number }>();

    for (const transaction of transactions) {
      const current = methods.get(transaction.payment_method) ?? {
        success: 0,
        failed: 0,
      };

      if (transaction.status === "SUCCESS") {
        current.success += 1;
      } else if (transaction.status === "FAILED") {
        current.failed += 1;
      }

      methods.set(transaction.payment_method, current);
    }

    return [...methods.entries()].map(([name, counts]) => {
      const total = counts.success + counts.failed;

      return {
        name: labelFromEnum(name),
        success: total > 0 ? Math.round((counts.success / total) * 100) : 0,
        failed: total > 0 ? Math.round((counts.failed / total) * 100) : 0,
      };
    });
  }, [transactions]);

  const recentCases = scenarios.slice(0, 5).map((scenario) => ({
    id: scenario.case_id,
    customerId:
      transactions.find(
        (transaction) =>
          transaction.transaction_reference === scenario.transaction_reference,
      )?.customer_id ?? "—",
    type: scenario.recovery_type,
    amount: scenario.amount_at_risk,
    priority: scenario.priority,
    recoveryProbability: Math.round(scenario.recovery_probability * 100),
    status: scenario.escalation_required ? "ESCALATED" : "OPEN",
  }));

  const recentTransactions = transactions.slice(0, 5).map((transaction) => ({
    id: transaction.transaction_reference,
    customerId: transaction.customer_id,
    paymentMethod: transaction.payment_method,
    amount: transaction.amount,
    status: transaction.status,
  }));

  const recentAuditEvents: Array<{
    id: string;
    actor: string;
    event: string;
    result?: string;
    detail: string;
    caseId: string;
  }> = [];


  const recoveredRatio =
    totalAtRisk > 0
      ? Math.round((recoveredRevenue / totalAtRisk) * 1000) / 10
      : recoveryRate;

  return (
    <div className="page-container data-grid-background animate-fade-in">
      {/* ================================================================== */}
      {/* PAGE HEADER                                                        */}
      {/* ================================================================== */}

      <header className="page-header">
        <div className="page-eyebrow">
          RAI·01 — Revenue Recovery Intelligence
        </div>

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="page-title">
              Revenue Recovery Command Center
            </h1>

            <p className="page-description">
              A consolidated view of revenue at risk, AI recovery activity,
              intervention performance, and the money RecoverAI has already
              recovered.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-xl border border-border bg-surface px-4 py-2.5 shadow-xs">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                System status
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-success" />

                <span className="text-xs font-bold text-primary">
                  Recovery engine active
                </span>
              </div>
            </div>

            <Link
              href="/recovery"
              className="btn-primary"
            >
              Open Recovery Queue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ================================================================== */}
      {/* EXECUTIVE AI BRIEF                                                  */}
      {/* ================================================================== */}

      <section className="dashboard-section">
        <div className="ai-brief">
          <div className="relative z-10">
            <div className="ai-brief-label">
              <BrainCircuit className="h-4 w-4" />
              AI Executive Brief
            </div>

            <h2 className="ai-brief-title">
              RecoverAI is currently managing {formatCompactINR(totalAtRisk)} of at-risk revenue.
            </h2>

            <p className="ai-brief-text">
              The recovery engine has verified {formatCompactINR(recoveredRevenue)} so far, representing
              {` ${recoveredRatio}%`} of identified revenue at risk. High-value
              cases with stronger recovery probability are prioritized first,
              while policy-ineligible or exhausted cases are routed for
              controlled escalation.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="status-pill success">
                Policy engine healthy
              </span>

              <span className="status-pill success">
                Stopping rules active
              </span>

              <span className="status-pill info">
                Audit logging enabled
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* KPI GRID                                                            */}
      {/* ================================================================== */}

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              Recovery Performance
            </h2>

            <p className="section-description">
              The four numbers that matter most to revenue recovery.
            </p>
          </div>

          <span className="analysis-tag">
            Current period
          </span>
        </div>

        <div className="kpi-grid">
          <MetricCard
            label="Revenue at Risk"
            value={formatAmount(totalAtRisk)}
            detail={`${activeCases} active recovery cases`}
            tone="danger"
            icon={<AlertTriangle className="h-4 w-4" />}
          />

          <MetricCard
            label="Recovered Revenue"
            value={formatAmount(recoveredRevenue)}
            detail={`${analytics.successfulRecoveries} verified recoveries`}
            tone="success"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />

          <MetricCard
            label="Recovery Rate"
            value={`${recoveryRate}%`}
            detail="Recovered revenue / revenue at risk"
            tone="accent"
            icon={<Target className="h-4 w-4" />}
          />

          <MetricCard
            label="Active Cases"
            value={String(activeCases)}
            detail={`${analytics.humanEscalations} currently escalated`}
            tone="warning"
            icon={<Activity className="h-4 w-4" />}
          />
        </div>
      </section>

      {/* ================================================================== */}
      {/* REVENUE AT RISK VS RECOVERED                                       */}
      {/* ================================================================== */}

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              Revenue at Risk vs Recovered
            </h2>

            <p className="section-description">
              See the size of the opportunity and the portion already won back.
            </p>
          </div>

          <Link
            href="/analytics"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-dark hover:underline"
          >
            View analytics
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="analysis-grid">
          {/* Main comparison card */}
          <Card className="analysis-card large p-6">
            <div className="analysis-card-header">
              <div>
                <h3 className="analysis-card-title">
                  Recovery opportunity
                </h3>

                <p className="analysis-card-subtitle">
                  Identified risk compared with verified recovered value
                </p>
              </div>

              <span className="analysis-tag">
                INR
              </span>
            </div>

            <div className="revenue-comparison">
              <div className="revenue-box risk">
                <div className="flex items-center justify-between gap-3">
                  <p className="revenue-box-label">
                    Revenue at risk
                  </p>

                  <TrendingDown className="h-4 w-4 text-danger" />
                </div>

                <p className="revenue-box-value">
                  {formatAmount(totalAtRisk)}
                </p>

                <p className="mt-2 text-[11px] text-secondary">
                  Across payment, subscription, checkout and invoice risk.
                </p>
              </div>

              <div className="revenue-box recovered">
                <div className="flex items-center justify-between gap-3">
                  <p className="revenue-box-label">
                    Recovered
                  </p>

                  <TrendingUp className="h-4 w-4 text-success" />
                </div>

                <p className="revenue-box-value">
                  {formatAmount(recoveredRevenue)}
                </p>

                <p className="mt-2 text-[11px] text-secondary">
                  Verified successful recovery outcomes.
                </p>
              </div>
            </div>

            <div className="metric-strip">
              <div className="metric-strip-item">
                <p className="metric-strip-label">
                  Recovery rate
                </p>

                <p className="metric-strip-value">
                  {recoveryRate}%
                </p>
              </div>

              <div className="metric-strip-item">
                <p className="metric-strip-label">
                  Avg recovery time
                </p>

                <p className="metric-strip-value">
                  {analytics.averageRecoveryTimeMinutes} min
                </p>
              </div>

              <div className="metric-strip-item">
                <p className="metric-strip-label">
                  Intervention success
                </p>

                <p className="metric-strip-value">
                  {analytics.interventionSuccessRate}%
                </p>
              </div>
            </div>

            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-secondary">
                    Revenue recovered from identified risk
                  </span>

                  <span className="status-pill success">
                    Positive
                  </span>
                </div>

                <span className="text-xs font-bold text-success">
                  {recoveredRatio}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-[#ebe7de]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-dark to-brand transition-all"
                  style={{
                    width: `${Math.min(recoveredRatio, 100)}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Recovery funnel */}
          <Card className="analysis-card large p-6">
            <div className="analysis-card-header">
              <div>
                <h3 className="analysis-card-title">
                  Recovery Funnel
                </h3>

                <p className="analysis-card-subtitle">
                  From detection to actual recovered money
                </p>
              </div>

              <span className="analysis-tag">
                Pipeline
              </span>
            </div>

            <div className="recovery-funnel">
              {recoveryFunnel.map((item) => (
                <div
                  key={item.label}
                  className="funnel-row"
                >
                  <span className="funnel-label">
                    {item.label}
                  </span>

                  <div className="funnel-track">
                    <div
                      className="funnel-fill"
                      style={{
                        width: `${item.percent}%`,
                      }}
                    />
                  </div>

                  <span className="funnel-value">
                    {formatCompactINR(item.value)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-xl border border-brand/15 bg-brand-soft/35 p-4">
              <div className="flex items-start gap-3">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" />

                <div>
                  <p className="text-[11px] font-bold text-primary">
                    AI prioritization
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-secondary">
                    Cases are ranked using amount, recoverability,
                    customer history, failure signals and intervention
                    eligibility.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ================================================================== */}
      {/* TREND + AI INSIGHTS                                                 */}
      {/* ================================================================== */}

      <section className="dashboard-section">
        <div className="analysis-grid">
          {/* Revenue trend */}
          <Card className="analysis-card large p-6">
            <div className="analysis-card-header">
              <div>
                <h3 className="analysis-card-title">
                  Revenue Recovery Trend
                </h3>

                <p className="analysis-card-subtitle">
                  Revenue at risk compared with recovered revenue
                </p>
              </div>

              <span className="analysis-tag">
                Last 30 days
              </span>
            </div>

            <div className="chart-container tall">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={revenueTrend}
                  margin={{
                    top: 10,
                    right: 8,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="riskGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#d84b45"
                        stopOpacity={0.18}
                      />
                      <stop
                        offset="100%"
                        stopColor="#d84b45"
                        stopOpacity={0}
                      />
                    </linearGradient>

                    <linearGradient
                      id="recoveredGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#169b62"
                        stopOpacity={0.18}
                      />
                      <stop
                        offset="100%"
                        stopColor="#169b62"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#e8e3da"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="day"
                    tick={{
                      fill: "#969188",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fill: "#969188",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `₹${Math.round(value / 1000)}K`
                    }
                  />

                  <Tooltip
                    contentStyle={{
                      border: "1px solid #e6e1d8",
                      borderRadius: "12px",
                      background: "#fffdf9",
                      boxShadow:
                        "0 8px 24px rgb(25 20 10 / 0.08)",
                    }}
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      name === "atRisk"
                        ? "Revenue at risk"
                        : "Recovered",
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="atRisk"
                    stroke="#d84b45"
                    strokeWidth={2}
                    fill="url(#riskGradient)"
                  />

                  <Area
                    type="monotone"
                    dataKey="recovered"
                    stroke="#169b62"
                    strokeWidth={2}
                    fill="url(#recoveredGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-danger" />
                <span className="text-[10px] font-semibold text-secondary">
                  Revenue at risk
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                <span className="text-[10px] font-semibold text-secondary">
                  Recovered revenue
                </span>
              </div>
            </div>
          </Card>

          {/* AI insights */}
          <Card className="analysis-card large p-6">
            <div className="analysis-card-header">
              <div>
                <h3 className="analysis-card-title">
                  AI Operating Insights
                </h3>

                <p className="analysis-card-subtitle">
                  Signals detected by the recovery engine
                </p>
              </div>

              <span className="analysis-tag">
                Auto-generated
              </span>
            </div>

            <div className="insight-panel">
              <div className="insight-card">
                <div className="insight-icon">
                  <CircleDollarSign className="h-4 w-4" />
                </div>

                <div>
                  <p className="insight-title">
                    High-value payment failures
                  </p>

                  <p className="insight-text">
                    High-value failed payments with previous successful
                    transactions are currently the strongest recovery
                    candidates.
                  </p>
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-icon">
                  <CreditCard className="h-4 w-4" />
                </div>

                <div>
                  <p className="insight-title">
                    Payment method signal
                  </p>

                  <p className="insight-text">
                    Card and UPI failures account for the majority of
                    recoverable payment risk in the current queue.
                  </p>
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-icon">
                  <Clock3 className="h-4 w-4" />
                </div>

                <div>
                  <p className="insight-title">
                    Timing matters
                  </p>

                  <p className="insight-text">
                    Earlier intervention windows are prioritized because
                    recoverability decreases as unresolved payment age
                    increases.
                  </p>
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-icon">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>
                  <p className="insight-title">
                    Bounded automation
                  </p>

                  <p className="insight-text">
                    The policy engine prevents actions outside eligibility,
                    retry and stopping-rule boundaries.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ================================================================== */}
      {/* RECOVERY TYPE + PAYMENT METHOD                                     */}
      {/* ================================================================== */}

      <section className="dashboard-section">
        <div className="analysis-grid">
          {/* Recovery type */}
          <Card className="analysis-card p-6">
            <div className="analysis-card-header">
              <div>
                <h3 className="analysis-card-title">
                  Revenue at Risk by Recovery Type
                </h3>

                <p className="analysis-card-subtitle">
                  Distribution of current recovery opportunity
                </p>
              </div>

              <span className="analysis-tag">
                Mix
              </span>
            </div>

            <div className="flex min-h-[280px] items-center gap-5">
              <div className="h-[250px] w-[52%]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={recoveryByType}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={96}
                      paddingAngle={3}
                    >
                      {recoveryByType.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            recoveryColors[
                              index % recoveryColors.length
                            ]
                          }
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) => [
                        `${value}%`,
                        "Share",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-1 flex-col gap-4">
                {recoveryByType.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          background:
                            recoveryColors[
                              index % recoveryColors.length
                            ],
                        }}
                      />

                      <span className="truncate text-[11px] font-semibold text-secondary">
                        {item.name}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">
                        {item.value}%
                      </p>

                      <p className="text-[10px] text-muted">
                        {formatCompactINR(item.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Payment methods */}
          <Card className="analysis-card p-6">
            <div className="analysis-card-header">
              <div>
                <h3 className="analysis-card-title">
                  Payment Method Health
                </h3>

                <p className="analysis-card-subtitle">
                  Success and failure concentration across methods
                </p>
              </div>

              <span className="analysis-tag">
                Transactions
              </span>
            </div>

            <div className="chart-container">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={paymentMethodData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 12,
                    left: 12,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    stroke="#e8e3da"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{
                      fill: "#969188",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    tick={{
                      fill: "#68655d",
                      fontSize: 11,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value, name) => [
                      `${value}%`,
                      name === "success"
                        ? "Success"
                        : "Failed",
                    ]}
                  />

                  <Bar
                    dataKey="success"
                    stackId="payments"
                    fill="#169b62"
                    radius={[4, 0, 0, 4]}
                  />

                  <Bar
                    dataKey="failed"
                    stackId="payments"
                    fill="#d84b45"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PRIORITY RECOVERY CASES                                             */}
      {/* ================================================================== */}

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              Priority Recovery Cases
            </h2>

            <p className="section-description">
              Highest-value cases currently requiring AI or merchant action.
            </p>
          </div>

          <Link
            href="/recovery"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-dark hover:underline"
          >
            View full queue
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Priority</th>
                  <th>Recovery probability</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {recentCases.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div>
                        <p className="font-bold">
                          {item.id}
                        </p>

                        <p className="mt-1 text-[10px] text-muted">
                          Customer {item.customerId}
                        </p>
                      </div>
                    </td>

                    <td>
                      <span className="text-secondary">
                        {labelFromEnum(item.type)}
                      </span>
                    </td>

                    <td>
                      <span className="font-bold">
                        {formatCurrency(item.amount)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={getPriorityClass(
                          item.priority,
                        )}
                      >
                        {item.priority}
                      </span>
                    </td>

                    <td>
                      <div className="min-w-[130px]">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-muted">
                            Estimated
                          </span>

                          <span className="text-[11px] font-bold">
                            {item.recoveryProbability}%
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-[#ebe7de]">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{
                              width: `${item.recoveryProbability}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          item.status,
                        )}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="text-right">
                      <Link
                        href={`/recovery/${item.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-secondary transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand-dark"
                        aria-label={`Open ${item.id}`}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ================================================================== */}
      {/* RECENT TRANSACTIONS + AUDIT                                        */}
      {/* ================================================================== */}

      <section className="dashboard-section">
        <div className="analysis-grid">
          {/* Transactions */}
          <Card className="analysis-card p-6">
            <div className="analysis-card-header">
              <div>
                <h3 className="analysis-card-title">
                  Recent Transactions
                </h3>

                <p className="analysis-card-subtitle">
                  Latest payment activity entering the recovery system
                </p>
              </div>

              <Link
                href="/transactions"
                className="analysis-tag hover:border-brand hover:text-brand-dark"
              >
                View all
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <div>
                          <p className="font-bold">
                            {transaction.id}
                          </p>

                          <p className="mt-1 text-[10px] text-muted">
                            {transaction.customerId}
                          </p>
                        </div>
                      </td>

                      <td>
                        <span className="text-secondary">
                          {transaction.paymentMethod}
                        </span>
                      </td>

                      <td>
                        <span className="font-bold">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={getStatusClass(
                            transaction.status,
                          )}
                        >
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Audit */}
          <Card className="analysis-card p-6">
            <div className="analysis-card-header">
              <div>
                <h3 className="analysis-card-title">
                  Recent Audit Activity
                </h3>

                <p className="analysis-card-subtitle">
                  Immutable operational events from the recovery workflow
                </p>
              </div>

              <Link
                href="/audit"
                className="analysis-tag hover:border-brand hover:text-brand-dark"
              >
                Audit trail
              </Link>
            </div>

            <div className="flex flex-col gap-1">
              {recentAuditEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="flex gap-3 border-b border-border py-3 last:border-0"
                >
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
                      {event.actor === "AI_AGENT" ? (
                        <BrainCircuit className="h-4 w-4" />
                      ) : event.actor === "POLICY_ENGINE" ? (
                        <ShieldCheck className="h-4 w-4" />
                      ) : (
                        <Activity className="h-4 w-4" />
                      )}
                    </div>

                    {index < recentAuditEvents.length - 1 && (
                      <div className="mt-1 h-full w-px bg-border" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-[11px] font-bold text-primary">
                        {event.event}
                      </p>

                      {event.result && (
                        <span
                          className={getStatusClass(
                            event.result,
                          )}
                        >
                          {event.result}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-[11px] leading-5 text-secondary">
                      {event.detail}
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-[9px] uppercase tracking-[0.08em] text-muted">
                      <span>
                        {event.actor.replace("_", " ")}
                      </span>

                      <span>•</span>

                      <span>
                        {event.caseId}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* ================================================================== */}
      {/* OPERATIONS SNAPSHOT                                                 */}
      {/* ================================================================== */}

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              Recovery Operations Snapshot
            </h2>

            <p className="section-description">
              Supporting metrics that explain the health of the recovery
              operation.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="kpi-label">
                  Successful recoveries
                </p>

                <p className="mt-3 text-2xl font-bold tracking-tight">
                  {analytics.successfulRecoveries}
                </p>

                <p className="mt-2 text-[11px] text-secondary">
                  Verified revenue outcomes
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-soft text-success">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="kpi-label">
                  Human escalations
                </p>

                <p className="mt-3 text-2xl font-bold tracking-tight">
                  {analytics.humanEscalations}
                </p>

                <p className="mt-2 text-[11px] text-secondary">
                  {analytics.escalationRate}% of cases
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-soft text-warning">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="kpi-label">
                  Average recovery time
                </p>

                <p className="mt-3 text-2xl font-bold tracking-tight">
                  {analytics.averageRecoveryTimeMinutes}m
                </p>

                <p className="mt-2 text-[11px] text-secondary">
                  Detection → verified recovery
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info-soft text-info">
                <Clock3 className="h-4 w-4" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="kpi-label">
                  Policy compliance
                </p>

                <p className="mt-3 text-2xl font-bold tracking-tight text-success">
                  {scenarios.length > 0 ? "100%" : "0%"}
                </p>

                <p className="mt-2 text-[11px] text-secondary">
                  Automated actions within bounds
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-soft text-success">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ================================================================== */}
      {/* NAVIGATION / NEXT ACTIONS                                           */}
      {/* ================================================================== */}

      <section className="dashboard-section pb-8">
        <div className="action-panel">
          <div className="action-panel-copy">
            <h3>
              Continue recovery operations
            </h3>

            <p>
              Move from executive overview into the cases, transactions,
              agent execution or analytical detail.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/recovery"
              className="btn-primary"
            >
              Recovery Queue
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/agent"
              className="btn-secondary"
            >
              Agent
              <Zap className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/reports"
              className="btn-secondary"
            >
              Reports
              <FileText className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
    </div>
  );
}
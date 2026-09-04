"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";

import { formatCompactINR } from "@/lib/utils";

const metrics = [
  {
    label: "Revenue at Risk",
    value: 1842000,
    detail: "Across active recovery cases",
    trend: "8.2% lower than previous period",
    tone: "danger",
    icon: CircleDollarSign,
  },
  {
    label: "Recovered Revenue",
    value: 487500,
    detail: "Verified successful recoveries",
    trend: "18.4% improvement",
    tone: "success",
    icon: CheckCircle2,
  },
  {
    label: "Recovery Rate",
    value: "26.5%",
    detail: "Recovered / revenue at risk",
    trend: "3.1 pts above baseline",
    tone: "brand",
    icon: Target,
  },
  {
    label: "Active Cases",
    value: "324",
    detail: "Cases currently in workflow",
    trend: "12 require attention",
    tone: "warning",
    icon: Clock3,
  },
];

const insights = [
  {
    icon: BrainCircuit,
    title: "AI prioritization",
    text: "High-value payment failures with strong recovery probability are being surfaced first.",
  },
  {
    icon: TrendingUp,
    title: "Recovery efficiency",
    text: "Payment-failure recovery is currently producing the strongest expected recovery per intervention.",
  },
  {
    icon: ShieldCheck,
    title: "Policy compliance",
    text: "Every automated intervention passes eligibility and bounded-action checks before execution.",
  },
];

function toneClass(tone: string) {
  if (tone === "danger") return "text-danger";
  if (tone === "success") return "text-success";
  if (tone === "warning") return "text-warning";
  return "text-brand";
}

export default function RevenueRecoveryOverview() {
  return (
    <section className="dashboard-section space-y-5">
      {/* AI briefing */}
      <div className="ai-brief">
        <div className="ai-brief-label">
          <BrainCircuit className="h-4 w-4" />
          AI Revenue Intelligence
        </div>

        <h2 className="ai-brief-title">
          RecoverAI is actively identifying and prioritizing recoverable revenue.
        </h2>

        <p className="ai-brief-text">
          ₹18.42L is currently at risk across the recovery queue. The
          recovery engine estimates ₹4.88L of recoverable value based on
          transaction history, failure signals, customer behaviour, and
          intervention eligibility.
        </p>
      </div>

      {/* Main KPI layer */}
      <div className="kpi-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="card kpi-card"
            >
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <p className="kpi-label">
                    {metric.label}
                  </p>

                  <p
                    className={`kpi-value ${toneClass(
                      metric.tone,
                    )}`}
                  >
                    {typeof metric.value === "number"
                      ? formatCompactINR(metric.value)
                      : metric.value}
                  </p>

                  <p className="kpi-detail">
                    {metric.detail}
                  </p>

                  <div
                    className={`kpi-trend ${
                      metric.tone === "danger"
                        ? "danger"
                        : metric.tone === "success"
                          ? "success"
                          : metric.tone === "warning"
                            ? "warning"
                            : "success"
                    }`}
                  >
                    {metric.tone === "danger" ? (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    )}

                    {metric.trend}
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue comparison */}
      <div className="analysis-grid">
        <div className="card analysis-card">
          <div className="analysis-card-header">
            <div>
              <h3 className="analysis-card-title">
                Revenue at Risk vs Recovered
              </h3>

              <p className="analysis-card-subtitle">
                Current recovery opportunity and verified outcome
              </p>
            </div>

            <span className="analysis-tag">
              Live operations
            </span>
          </div>

          <div className="revenue-comparison">
            <div className="revenue-box risk">
              <p className="revenue-box-label">
                Revenue at risk
              </p>

              <p className="revenue-box-value">
                ₹18.42L
              </p>

              <p className="mt-2 text-[11px] text-secondary">
                324 active cases
              </p>
            </div>

            <div className="revenue-box recovered">
              <p className="revenue-box-label">
                Recovered
              </p>

              <p className="revenue-box-value">
                ₹4.88L
              </p>

              <p className="mt-2 text-[11px] text-secondary">
                176 successful recoveries
              </p>
            </div>
          </div>

          <div className="metric-strip">
            <div className="metric-strip-item">
              <p className="metric-strip-label">
                Recovery rate
              </p>
              <p className="metric-strip-value">
                26.5%
              </p>
            </div>

            <div className="metric-strip-item">
              <p className="metric-strip-label">
                Avg recovery time
              </p>
              <p className="metric-strip-value">
                23 min
              </p>
            </div>

            <div className="metric-strip-item">
              <p className="metric-strip-label">
                Intervention success
              </p>
              <p className="metric-strip-value">
                68.4%
              </p>
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-secondary">
                Revenue recovery progress
              </span>

              <span className="text-[11px] font-bold text-success">
                26.5%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-[#ebe7de]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-dark to-brand"
                style={{ width: "26.5%" }}
              />
            </div>
          </div>
        </div>

        {/* AI interpretation */}
        <div className="card analysis-card">
          <div className="analysis-card-header">
            <div>
              <h3 className="analysis-card-title">
                AI Operating Insights
              </h3>

              <p className="analysis-card-subtitle">
                What the recovery engine is seeing
              </p>
            </div>

            <span className="analysis-tag">
              AI
            </span>
          </div>

          <div className="insight-panel">
            {insights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="insight-card"
                >
                  <div className="insight-icon">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="insight-title">
                      {item.title}
                    </p>

                    <p className="insight-text">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-brand/15 bg-brand-soft/40 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />

              <div>
                <p className="text-[11px] font-bold text-primary">
                  Bounded automation
                </p>

                <p className="mt-1 text-[11px] leading-5 text-secondary">
                  Recovery actions are executed only when eligibility,
                  policy, retry limits, and stopping rules pass.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Circle,
  Clock3,
  Loader2,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { mockAgentSteps } from "@/data/mock";

type RunMode = "SUCCESS" | "ESCALATION";
type State = "IDLE" | "RUNNING" | "SUCCESS" | "ESCALATED";

const stepDescriptions = [
  "Detects the failed payment and identifies revenue exposure.",
  "Analyzes customer payment history, transaction context and prior outcomes.",
  "Determines the likely failure reason and recovery probability.",
  "Selects the highest-confidence intervention within configured policy.",
  "Validates amount, retry limits and automation eligibility.",
  "Creates the bounded recovery action for the selected channel.",
  "Records the recovery communication and execution outcome.",
  "Verifies whether the payment was successfully recovered.",
];

const successStepResults = [
  "₹24,999 revenue exposure identified.",
  "18 successful payments and 3 historical failures analyzed.",
  "UPI timeout classified as recoverable.",
  "Switch payment method selected.",
  "Policy checks passed.",
  "Recovery payment link generated.",
  "Recovery notification delivered.",
  "Payment verification successful.",
];

const escalationStepResults = [
  "₹24,999 revenue exposure identified.",
  "Customer history analyzed.",
  "Failure classified with insufficient recovery confidence.",
  "Escalation strategy selected.",
  "Policy checks passed.",
  "Retry threshold reached.",
  "No further automated notification sent.",
  "Case routed for merchant review.",
];

export default function AgentPage() {
  const [mode, setMode] = useState<RunMode>("SUCCESS");
  const [state, setState] = useState<State>("IDLE");
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (state !== "RUNNING") return;

    if (step < mockAgentSteps.length - 1) {
      const timer = window.setTimeout(() => {
        setStep((current) => current + 1);
      }, 850);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setState(mode === "SUCCESS" ? "SUCCESS" : "ESCALATED");
    }, 900);

    return () => window.clearTimeout(timer);
  }, [mode, state, step]);

  function start() {
    setState("RUNNING");
    setStep(0);
  }

  function reset() {
    setState("IDLE");
    setStep(-1);
  }

  const currentStepResults =
    mode === "SUCCESS"
      ? successStepResults
      : escalationStepResults;

  const completedSteps = Math.max(step, 0);

  const progress = useMemo(() => {
    if (state === "IDLE") return 0;

    if (state === "SUCCESS" || state === "ESCALATED") {
      return 100;
    }

    return Math.round(
      ((step + 1) / mockAgentSteps.length) * 100,
    );
  }, [state, step]);

  return (
    <div className="page-container data-grid-background animate-fade-in">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <PageHeader
        title="Recovery Agent"
        description="Observe the autonomous detect → diagnose → policy → execute → verify recovery workflow."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={mode}
              onChange={(event) => {
                setMode(event.target.value as RunMode);
                reset();
              }}
              className="h-10 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-primary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="SUCCESS">
                Success scenario
              </option>

              <option value="ESCALATION">
                Escalation scenario
              </option>
            </select>

            <Button
              onClick={state === "RUNNING" ? undefined : start}
              disabled={state === "RUNNING"}
            >
              <Play className="mr-2 h-4 w-4" />
              {state === "RUNNING" ? "Agent running..." : "Start Run"}
            </Button>
          </div>
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Agent status banner                                                */}
      {/* ------------------------------------------------------------------ */}

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="kpi-label">
                Agent state
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={[
                    "h-2.5 w-2.5 rounded-full",
                    state === "RUNNING"
                      ? "animate-pulse bg-brand"
                      : state === "SUCCESS"
                        ? "bg-success"
                        : state === "ESCALATED"
                          ? "bg-warning"
                          : "bg-muted",
                  ].join(" ")}
                />

                <p className="text-lg font-bold text-primary">
                  {state === "RUNNING"
                    ? "Executing"
                    : state === "SUCCESS"
                      ? "Recovered"
                      : state === "ESCALATED"
                        ? "Escalated"
                        : "Ready"}
                </p>
              </div>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
              <BrainCircuit className="h-4 w-4" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="kpi-label">
                Workflow progress
              </p>

              <p className="mt-3 text-lg font-bold text-primary">
                {progress}%
              </p>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ebe7de]">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info-soft text-info">
              <Activity className="h-4 w-4" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="kpi-label">
                Financial action
              </p>

              <p className="mt-3 text-lg font-bold text-primary">
                Bounded
              </p>

              <p className="mt-1 text-[11px] text-secondary">
                Policy-controlled execution
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-soft text-success">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
        </Card>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Target case + workflow                                             */}
      {/* ------------------------------------------------------------------ */}

      <section className="mb-5">
        <Card className="overflow-hidden">
          {/* Case header */}
          <div className="border-b border-border p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="status-pill danger">
                    HIGH PRIORITY
                  </span>

                  <span className="analysis-tag">
                    PAYMENT FAILURE
                  </span>

                  <span className="analysis-tag">
                    AI CONTROLLED
                  </span>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  Target case
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight text-primary">
                  PAY_83921
                </h2>

                <p className="mt-1 text-sm text-secondary">
                  Customer CUS_1042 · UPI timeout · 3 previous attempts
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 lg:min-w-[340px]">
                <div>
                  <p className="kpi-label">
                    Revenue at risk
                  </p>

                  <p className="mt-2 text-2xl font-bold text-danger">
                    ₹24,999
                  </p>
                </div>

                <div>
                  <p className="kpi-label">
                    Recovery probability
                  </p>

                  <p className="mt-2 text-2xl font-bold text-success">
                    84%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow header */}
          <div className="border-b border-border bg-surface-soft px-5 py-4 sm:px-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-bold text-primary">
                  Autonomous recovery workflow
                </h3>

                <p className="mt-1 text-[11px] text-secondary">
                  Every step is evaluated before the next action is allowed.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="analysis-tag">
                  {completedSteps}/{mockAgentSteps.length} steps
                </span>

                {state === "RUNNING" && (
                  <span className="status-pill info">
                    Agent executing
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-5 sm:p-7">
            <div className="relative">
              <div className="absolute bottom-8 left-[13px] top-4 w-px bg-border" />

              <div className="space-y-1">
                {mockAgentSteps.map((label, index) => {
                  const completed = step > index;
                  const running =
                    state === "RUNNING" && step === index;
                  const pending = step < index;

                  return (
                    <div
                      key={label}
                      className={[
                        "relative flex gap-4 rounded-xl px-2 py-3 transition-all duration-300",
                        pending
                          ? "opacity-45"
                          : "opacity-100",
                        running
                          ? "bg-brand-soft/35"
                          : "",
                      ].join(" ")}
                    >
                      {/* Node */}
                      <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface">
                        {completed ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : running ? (
                          <Loader2 className="h-5 w-5 animate-spin text-brand" />
                        ) : (
                          <Circle className="h-5 w-5 text-border-strong" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                          <div>
                            <p
                              className={[
                                "text-sm font-bold",
                                running
                                  ? "text-brand-dark"
                                  : "text-primary",
                              ].join(" ")}
                            >
                              {label}
                            </p>

                            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-secondary">
                              {stepDescriptions[index] ??
                                "Recovery workflow operation."}
                            </p>
                          </div>

                          <div className="shrink-0">
                            {completed && (
                              <span className="status-pill success">
                                Completed
                              </span>
                            )}

                            {running && (
                              <span className="status-pill info">
                                Running
                              </span>
                            )}

                            {pending && (
                              <span className="status-pill neutral">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>

                        {(completed || running) && (
                          <div
                            className={[
                              "mt-3 rounded-lg border px-3 py-2",
                              running
                                ? "border-brand/15 bg-brand-soft/30"
                                : "border-border bg-surface-soft",
                            ].join(" ")}
                          >
                            <div className="flex items-start gap-2">
                              {running ? (
                                <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-brand" />
                              ) : (
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                              )}

                              <p className="text-[10px] font-medium leading-5 text-secondary">
                                {running
                                  ? "Agent executing this operation and waiting for the result..."
                                  : currentStepResults[index]}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Result */}
          {state === "SUCCESS" && (
            <div className="border-t border-border p-5 sm:p-6">
              <div className="rounded-xl border border-success/20 bg-success-soft p-5">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />

                      <p className="font-bold text-success">
                        Recovery successful
                      </p>
                    </div>

                    <p className="mt-2 text-2xl font-bold tracking-tight text-primary">
                      ₹24,999 recovered
                    </p>

                    <p className="mt-1 text-sm text-secondary">
                      Payment verified after the recovery intervention ·
                      17 minutes
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <p className="kpi-label">
                        Outcome
                      </p>

                      <p className="mt-1 text-sm font-bold text-primary">
                        Verified
                      </p>
                    </div>

                    <div>
                      <p className="kpi-label">
                        Policy
                      </p>

                      <p className="mt-1 text-sm font-bold text-success">
                        Passed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {state === "ESCALATED" && (
            <div className="border-t border-border p-5 sm:p-6">
              <div className="rounded-xl border border-warning/20 bg-warning-soft p-5">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-warning" />

                      <p className="font-bold text-warning">
                        Agent escalated for human review
                      </p>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-secondary">
                      The stopping rule was triggered after the maximum
                      permitted automated recovery path. No additional
                      automated financial action was taken.
                    </p>
                  </div>

                  <span className="status-pill warning">
                    HUMAN REVIEW REQUIRED
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Agent controls                                                      */}
      {/* ------------------------------------------------------------------ */}

      <section className="mb-5">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              Agent Controls & Guardrails
            </h2>

            <p className="section-description">
              Controls that keep autonomous recovery bounded and auditable.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-bold text-primary">
                  Policy engine
                </p>

                <p className="mt-1 text-[11px] leading-5 text-secondary">
                  Validates every intervention before execution.
                </p>

                <div className="mt-3">
                  <Badge variant="success">
                    Guardrails enabled
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info-soft text-info">
                <Target className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-bold text-primary">
                  Decision strategy
                </p>

                <p className="mt-1 text-[11px] leading-5 text-secondary">
                  Prioritizes probability, value and customer context.
                </p>

                <p className="mt-3 text-xs font-bold text-primary">
                  Risk-aware ranking
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
                <Clock3 className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-bold text-primary">
                  Retry policy
                </p>

                <p className="mt-1 text-[11px] leading-5 text-secondary">
                  Limits repeated attempts and prevents recovery loops.
                </p>

                <p className="mt-3 text-xs font-bold text-primary">
                  Stopping rules active
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning">
                <Zap className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-bold text-primary">
                  Execution mode
                </p>

                <p className="mt-1 text-[11px] leading-5 text-secondary">
                  Demo execution uses the existing bounded provider layer.
                </p>

                <p className="mt-3 text-xs font-bold text-primary">
                  No uncontrolled actions
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Explainability                                                      */}
      {/* ------------------------------------------------------------------ */}

      <section className="mb-8">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-bold text-primary">
                  Why this action was selected
                </h2>

                <p className="mt-1 text-xs leading-5 text-secondary">
                  The agent exposes its decision context instead of behaving
                  like a black-box automation.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-border md:grid-cols-3">
            <div className="bg-surface p-5">
              <p className="kpi-label">
                Revenue exposure
              </p>

              <p className="mt-2 text-xl font-bold text-danger">
                ₹24,999
              </p>

              <p className="mt-2 text-[11px] leading-5 text-secondary">
                The failed transaction represents immediately recoverable
                revenue exposure.
              </p>
            </div>

            <div className="bg-surface p-5">
              <p className="kpi-label">
                Customer signal
              </p>

              <p className="mt-2 text-xl font-bold text-primary">
                Strong
              </p>

              <p className="mt-2 text-[11px] leading-5 text-secondary">
                Previous successful payment history increases the estimated
                probability of recovery.
              </p>
            </div>

            <div className="bg-surface p-5">
              <p className="kpi-label">
                Selected intervention
              </p>

              <p className="mt-2 text-xl font-bold text-success">
                Alternate method
              </p>

              <p className="mt-2 text-[11px] leading-5 text-secondary">
                A payment-method switch is preferred over repeated failed
                attempts under the current policy.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 border-t border-border bg-surface-soft p-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <p className="text-xs font-bold text-primary">
                Need the complete operational history?
              </p>

              <p className="mt-1 text-[11px] text-secondary">
                Every important agent decision is represented in the audit
                trail.
              </p>
            </div>

            <a
              href="/audit"
              className="btn-secondary"
            >
              Open Audit Trail
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </Card>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Reset                                                               */}
      {/* ------------------------------------------------------------------ */}

      {state !== "IDLE" && state !== "RUNNING" && (
        <div className="flex justify-end pb-8">
          <Button
            variant="secondary"
            onClick={reset}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset demo
          </Button>
        </div>
      )}
    </div>
  );
}
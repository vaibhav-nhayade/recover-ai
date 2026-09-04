"use client";

import { useMemo, useState } from "react";
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

import {
  runRecoveryAgent,
  type RecoveryAgentRunResponse,
} from "@/lib/api";

type State =
  | "IDLE"
  | "RUNNING"
  | "SUCCESS"
  | "ESCALATED";

const workflowSteps = [
  "Detect failed transactions and identify revenue exposure.",
  "Analyze customer and transaction context.",
  "Score recovery probability and confidence.",
  "Select the highest-confidence intervention.",
  "Validate policy, amount and retry limits.",
  "Execute the bounded recovery action.",
  "Record the intervention outcome.",
  "Verify recovery or escalate for human review.",
];

const stepResults = [
  "Failed revenue exposure identified.",
  "Transaction context and recovery signals analyzed.",
  "Recovery probability calculated.",
  "AI intervention selected within policy.",
  "Stopping rules and execution guardrails evaluated.",
  "Bounded intervention executed.",
  "Outcome recorded in the recovery audit trail.",
  "Recovery outcome verified or case escalated.",
];

export default function AgentPage() {
  const [state, setState] =
    useState<State>("IDLE");

  const [step, setStep] =
    useState(-1);

  const [result, setResult] =
    useState<RecoveryAgentRunResponse | null>(
      null,
    );

  const [error, setError] =
    useState<string | null>(null);

  async function start() {
    try {
      setState("RUNNING");
      setStep(0);
      setResult(null);
      setError(null);

      for (
        let index = 1;
        index < workflowSteps.length;
        index += 1
      ) {
        await new Promise<void>((resolve) => {
          window.setTimeout(
            resolve,
            350,
          );
        });

        setStep(index);
      }

      const agentResult =
        await runRecoveryAgent(100);

      setResult(agentResult);

      if (
        agentResult.escalated_cases > 0 &&
        agentResult.recovered_cases === 0
      ) {
        setState("ESCALATED");
      } else {
        setState("SUCCESS");
      }

      setStep(
        workflowSteps.length - 1,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to execute recovery agent.",
      );

      setState("ESCALATED");
    }
  }

  function reset() {
    setState("IDLE");
    setStep(-1);
    setResult(null);
    setError(null);
  }

  const progress = useMemo(() => {
    if (state === "IDLE") {
      return 0;
    }

    if (
      state === "SUCCESS" ||
      state === "ESCALATED"
    ) {
      return 100;
    }

    return Math.round(
      ((step + 1) /
        workflowSteps.length) *
        100,
    );
  }, [state, step]);

  const completedSteps =
    state === "IDLE"
      ? 0
      : Math.max(
          step,
          0,
        );

  return (
    <div className="page-container data-grid-background animate-fade-in">
      <PageHeader
        title="Recovery Agent"
        description="Observe the autonomous detect → diagnose → policy → execute → verify recovery workflow."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={
                state === "RUNNING"
                  ? undefined
                  : start
              }
              disabled={
                state === "RUNNING"
              }
            >
              <Play className="mr-2 h-4 w-4" />
              {state === "RUNNING"
                ? "Agent running..."
                : "Start Run"}
            </Button>
          </div>
        }
      />

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
                      ? "Completed"
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
                  style={{
                    width: `${progress}%`,
                  }}
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

      <section className="mb-5">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="status-pill danger">
                    AUTONOMOUS RUN
                  </span>

                  <span className="analysis-tag">
                    BATCH EVALUATION
                  </span>

                  <span className="analysis-tag">
                    AI CONTROLLED
                  </span>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  Recovery batch
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight text-primary">
                  RecoverAI Agent
                </h2>

                <p className="mt-1 text-sm text-secondary">
                  Detect → diagnose → authorize → execute
                  → verify
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 lg:min-w-[340px]">
                <div>
                  <p className="kpi-label">
                    Cases processed
                  </p>

                  <p className="mt-2 text-2xl font-bold text-primary">
                    {result?.processed_cases ?? 0}
                  </p>
                </div>

                <div>
                  <p className="kpi-label">
                    Recovered revenue
                  </p>

                  <p className="mt-2 text-2xl font-bold text-success">
                    ₹
                    {Number(
                      result?.recovered_revenue ?? 0,
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-border bg-surface-soft px-5 py-4 sm:px-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-bold text-primary">
                  Autonomous recovery workflow
                </h3>

                <p className="mt-1 text-[11px] text-secondary">
                  Every step is evaluated before the next
                  action is allowed.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="analysis-tag">
                  {completedSteps}/
                  {workflowSteps.length} steps
                </span>

                {state === "RUNNING" && (
                  <span className="status-pill info">
                    Agent executing
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="relative">
              <div className="absolute bottom-8 left-[13px] top-4 w-px bg-border" />

              <div className="space-y-1">
                {workflowSteps.map(
                  (label, index) => {
                    const completed =
                      state === "SUCCESS" ||
                      state === "ESCALATED"
                        ? true
                        : step > index;

                    const running =
                      state === "RUNNING" &&
                      step === index;

                    const pending =
                      !completed &&
                      !running;

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
                        <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface">
                          {completed ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : running ? (
                            <Loader2 className="h-5 w-5 animate-spin text-brand" />
                          ) : (
                            <Circle className="h-5 w-5 text-border-strong" />
                          )}
                        </div>

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
                                {stepResults[index]}
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

                          {(completed ||
                            running) && (
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
                                    : stepResults[index]}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>

          {result && (
            <div className="border-t border-border p-5 sm:p-6">
              <div className="rounded-xl border border-success/20 bg-success-soft p-5">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <p className="kpi-label">
                      Run ID
                    </p>

                    <p className="mt-1 truncate text-xs font-bold text-primary">
                      {result.run_id}
                    </p>
                  </div>

                  <div>
                    <p className="kpi-label">
                      Processed
                    </p>

                    <p className="mt-1 text-lg font-bold text-primary">
                      {result.processed_cases}
                    </p>
                  </div>

                  <div>
                    <p className="kpi-label">
                      Recovered
                    </p>

                    <p className="mt-1 text-lg font-bold text-success">
                      {result.recovered_cases}
                    </p>
                  </div>

                  <div>
                    <p className="kpi-label">
                      Escalated
                    </p>

                    <p className="mt-1 text-lg font-bold text-warning">
                      {result.escalated_cases}
                    </p>
                  </div>

                  <div>
                    <p className="kpi-label">
                      Blocked
                    </p>

                    <p className="mt-1 text-lg font-bold text-danger">
                      {result.blocked_cases}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="border-t border-border p-5 sm:p-6">
              <div className="rounded-xl border border-warning/20 bg-warning-soft p-5">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />

                  <div>
                    <p className="font-bold text-warning">
                      Agent execution stopped
                    </p>

                    <p className="mt-1 text-sm leading-6 text-secondary">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {state === "ESCALATED" &&
            !error && (
              <div className="border-t border-border p-5 sm:p-6">
                <div className="rounded-xl border border-warning/20 bg-warning-soft p-5">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-warning" />

                        <p className="font-bold text-warning">
                          Agent escalated cases for human review
                        </p>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-secondary">
                        RecoverAI applied its stopping rules and
                        did not continue uncontrolled automated
                        financial actions.
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
                  Execution is bounded by the configured provider layer.
                </p>

                <p className="mt-3 text-xs font-bold text-primary">
                  No uncontrolled actions
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="mb-8">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-bold text-primary">
                  Agent run result
                </h2>

                <p className="mt-1 text-xs leading-5 text-secondary">
                  This panel reflects the actual backend agent execution.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-border md:grid-cols-3">
            <div className="bg-surface p-5">
              <p className="kpi-label">
                Revenue recovered
              </p>

              <p className="mt-2 text-xl font-bold text-success">
                ₹
                {Number(
                  result?.recovered_revenue ?? 0,
                ).toLocaleString("en-IN")}
              </p>

              <p className="mt-2 text-[11px] leading-5 text-secondary">
                Verified recovery outcome recorded by the
                agent workflow.
              </p>
            </div>

            <div className="bg-surface p-5">
              <p className="kpi-label">
                Cases escalated
              </p>

              <p className="mt-2 text-xl font-bold text-warning">
                {result?.escalated_cases ?? 0}
              </p>

              <p className="mt-2 text-[11px] leading-5 text-secondary">
                Cases that reached controlled human-review
                escalation.
              </p>
            </div>

            <div className="bg-surface p-5">
              <p className="kpi-label">
                Execution status
              </p>

              <p className="mt-2 text-xl font-bold text-primary">
                {state === "RUNNING"
                  ? "Executing"
                  : result
                    ? "Completed"
                    : "Ready"}
              </p>

              <p className="mt-2 text-[11px] leading-5 text-secondary">
                Autonomous execution remains bounded by
                policy and stopping rules.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 border-t border-border bg-surface-soft p-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <p className="text-xs font-bold text-primary">
                Need the complete operational history?
              </p>

              <p className="mt-1 text-[11px] text-secondary">
                Agent decisions and recovery actions are persisted
                in the audit trail.
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

      {state !== "IDLE" &&
        state !== "RUNNING" && (
          <div className="flex justify-end pb-8">
            <Button
              variant="secondary"
              onClick={reset}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset run
            </Button>
          </div>
        )}
    </div>
  );
}
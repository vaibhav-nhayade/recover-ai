"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { mockAgentSteps } from "@/data/mock";

type RunMode = "SUCCESS" | "ESCALATION";
type State = "IDLE" | "RUNNING" | "SUCCESS" | "ESCALATED";

export default function AgentPage() {
  const [mode, setMode] = useState<RunMode>("SUCCESS");
  const [state, setState] = useState<State>("IDLE");
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (state !== "RUNNING") return;

    if (step < mockAgentSteps.length - 1) {
      const timer = window.setTimeout(
        () => setStep((current) => current + 1),
        900,
      );

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setState(mode === "SUCCESS" ? "SUCCESS" : "ESCALATED");
    }, 1000);

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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Recovery Agent"
        description="Deterministic simulation of the detect → diagnose → policy → execute → verify loop."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as RunMode);
                reset();
              }}
              className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10"
            >
              <option value="SUCCESS">Success scenario</option>
              <option value="ESCALATION">Escalation scenario</option>
            </select>

            <Button
              onClick={state === "RUNNING" ? undefined : start}
              disabled={state === "RUNNING"}
            >
              <Play className="mr-2 h-4 w-4" />
              Start Run
            </Button>
          </div>
        }
      />

      <Card className="p-5 sm:p-6">
        {/* Target information */}
        <div className="grid gap-5 border-b border-[var(--border)] pb-5 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase leading-4 tracking-[0.1em] text-[var(--text-muted)]">
              Target Case
            </p>

            <p className="mt-1.5 text-xl font-bold leading-7 tracking-[-0.02em] text-[var(--text-primary)]">
              PAY_83921
            </p>
          </div>

          <div className="min-w-0 sm:text-right">
            <p className="text-[10px] font-bold uppercase leading-4 tracking-[0.1em] text-[var(--text-muted)]">
              Revenue at Risk
            </p>

            <p className="mt-1.5 text-xl font-bold leading-7 tracking-[-0.02em] text-[var(--danger)] tabular-nums">
              ₹24,999
            </p>
          </div>
        </div>

        {/* Agent execution timeline */}
        <div className="relative mt-7">
          <div className="absolute bottom-7 left-[11px] top-2 w-px bg-[var(--border)]" />

          <div className="space-y-1">
            {mockAgentSteps.map((label, index) => {
              const completed = step > index;
              const running = state === "RUNNING" && step === index;
              const pending = step < index;

              return (
                <div
                  key={label}
                  className={`
                    relative flex min-h-[56px] items-start gap-4
                    ${pending ? "opacity-40" : ""}
                  `}
                >
                  {/* Timeline node */}
                  <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface)]">
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
                    ) : running ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--brand)]" />
                    ) : (
                      <Circle className="h-5 w-5 text-[var(--border-strong)]" />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium leading-5 text-[var(--text-primary)]">
                      {label}
                    </p>

                    <div className="min-h-5">
                      {running && (
                        <p className="mt-1 text-xs font-medium leading-4 text-[var(--brand)]">
                          Agent executing...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Success result */}
        {state === "SUCCESS" && (
          <div className="mt-5 rounded-xl border border-[var(--success)]/20 bg-[var(--success)]/5 p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--success)]" />

              <p className="font-bold text-[var(--success)]">
                Recovery successful
              </p>
            </div>

            <p className="mt-2 text-2xl font-bold leading-8 tracking-[-0.025em] text-[var(--text-primary)] tabular-nums">
              ₹24,999 recovered
            </p>

            <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
              Deterministic demo outcome · 17 minutes
            </p>
          </div>
        )}

        {/* Escalation result */}
        {state === "ESCALATED" && (
          <div className="mt-5 rounded-xl border border-[var(--warning)]/20 bg-[var(--warning)]/5 p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 shrink-0 text-[var(--warning)]" />

              <p className="font-bold text-[var(--warning)]">
                Agent escalated for human review
              </p>
            </div>

            <p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">
              Stopping rule triggered after the maximum permitted retry path.
              No further automated action was taken.
            </p>
          </div>
        )}

        {state !== "IDLE" && state !== "RUNNING" && (
          <Button
            variant="secondary"
            className="mt-4"
            onClick={reset}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset demo
          </Button>
        )}
      </Card>

      {/* Agent configuration */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="min-h-[116px] p-5">
          <CardTitle>Policy</CardTitle>

          <div className="mt-4 flex min-h-6 items-center">
            <Badge variant="success">Guardrails enabled</Badge>
          </div>
        </Card>

        <Card className="min-h-[116px] p-5">
          <CardTitle>Execution mode</CardTitle>

          <p className="mt-4 min-h-6 text-sm font-semibold leading-5 text-[var(--text-primary)]">
            Deterministic simulation
          </p>
        </Card>

        <Card className="min-h-[116px] p-5">
          <CardTitle>Financial action</CardTitle>

          <p className="mt-4 min-h-6 text-sm leading-5 text-[var(--text-secondary)]">
            No real payment is executed.
          </p>
        </Card>
      </div>
    </div>
  );
}
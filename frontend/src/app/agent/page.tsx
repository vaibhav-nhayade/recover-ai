"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Play, RotateCcw, ShieldAlert, Loader2 } from "lucide-react";
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
      const timer = window.setTimeout(() => setStep((current) => current + 1), 900);
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
          <div className="flex gap-2">
            <select value={mode} onChange={(e) => { setMode(e.target.value as RunMode); reset(); }} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm">
              <option value="SUCCESS">Success scenario</option>
              <option value="ESCALATION">Escalation scenario</option>
            </select>
            <Button onClick={state === "RUNNING" ? undefined : start} disabled={state === "RUNNING"}>
              <Play className="mr-2 h-4 w-4" /> Start Run
            </Button>
          </div>
        }
      />

      <Card>
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-semibold text-secondary">TARGET CASE</p><p className="mt-1 text-xl font-bold">PAY_83921</p></div>
          <div className="sm:text-right"><p className="text-xs font-semibold text-secondary">REVENUE AT RISK</p><p className="mt-1 text-xl font-bold text-danger">₹24,999</p></div>
        </div>

        <div className="relative mt-7 pl-1">
          <div className="absolute left-[11px] top-2 bottom-8 w-px bg-border" />
          {mockAgentSteps.map((label, index) => {
            const completed = step > index;
            const running = state === "RUNNING" && step === index;
            const pending = step < index;
            return (
              <div key={label} className="relative flex gap-4 pb-6">
                <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-surface">
                  {completed ? <CheckCircle2 className="h-5 w-5 text-success" /> : running ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : <Circle className="h-5 w-5 text-border" />}
                </div>
                <div className={pending ? "opacity-40" : ""}>
                  <p className="text-sm font-medium">{label}</p>
                  {running && <p className="mt-1 text-xs text-accent">Agent executing...</p>}
                </div>
              </div>
            );
          })}
        </div>

        {state === "SUCCESS" && (
          <div className="rounded-xl border border-success/20 bg-success/5 p-5">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-success" /><p className="font-bold text-success">Recovery successful</p></div>
            <p className="mt-2 text-2xl font-bold">₹24,999 recovered</p>
            <p className="mt-1 text-sm text-secondary">Deterministic demo outcome · 17 minutes</p>
          </div>
        )}

        {state === "ESCALATED" && (
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-5">
            <div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-warning" /><p className="font-bold text-warning">Agent escalated for human review</p></div>
            <p className="mt-2 text-sm text-secondary">Stopping rule triggered after the maximum permitted retry path. No further automated action was taken.</p>
          </div>
        )}

        {state !== "IDLE" && state !== "RUNNING" && (
          <Button variant="secondary" className="mt-4" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" /> Reset demo</Button>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardTitle>Policy</CardTitle><p className="mt-2"><Badge variant="success">Guardrails enabled</Badge></p></Card>
        <Card><CardTitle>Execution mode</CardTitle><p className="mt-2 text-sm font-semibold">Deterministic simulation</p></Card>
        <Card><CardTitle>Financial action</CardTitle><p className="mt-2 text-sm text-secondary">No real payment is executed.</p></Card>
      </div>
    </div>
  );
}

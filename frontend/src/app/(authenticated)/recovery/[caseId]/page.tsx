"use client";

import Link from "next/link";
import {
  useParams,
} from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  UserRound,
  Activity,
  ShieldCheck,
  Clock3,
  AlertTriangle,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";

import { useRecoveryCase } from "@/hooks/useRecoveryCase";

import {
  autoRecoverCase,
} from "@/lib/api";

import {
  formatCurrency,
  labelFromEnum,
} from "@/lib/utils";

function getCustomerId(
  caseId: string,
  transactionId: string,
) {
  return `CUS-${caseId.slice(0, 8) || transactionId.slice(0, 8)}`;
}

function getRecoverySteps(
  strategy: string | null,
) {
  if (strategy === "PAYMENT_RETRY") {
    return [
      "Validate recovery eligibility",
      "Retry the failed payment through the approved payment path",
      "Verify the resulting payment status",
      "Record the recovery outcome",
    ];
  }

  if (strategy === "CUSTOMER_CONTACT") {
    return [
      "Validate recovery eligibility",
      "Generate a customer recovery message",
      "Send the approved recovery communication",
      "Wait for and verify customer payment",
    ];
  }

  return [
    "Apply high-value recovery controls",
    "Route the case for human review",
    "Review payment and customer context",
    "Verify recovery outcome before closing",
  ];
}

export default function CaseInvestigationPage() {
  const params = useParams<{
    caseId: string;
  }>();

  const caseId = params.caseId;

  const {
    recoveryCase,
    score,
    attempts,
    outcome,
    auditEvents,
    loading,
    error,
    refresh,
  } = useRecoveryCase(caseId);

  const [running, setRunning] =
    useState(false);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const customerId = useMemo(() => {
    if (!recoveryCase) {
      return "";
    }

    return getCustomerId(
      recoveryCase.id,
      recoveryCase.transaction_id,
    );
  }, [recoveryCase]);

  const amount = Number(
    recoveryCase?.amount_at_risk ?? 0,
  );

  const probability =
    score?.probability_percent ?? 0;

  const confidence =
    score?.confidence_percent ?? 0;

  const expectedRecovery = Math.round(
    amount * (probability / 100),
  );

  const strategy =
    score?.recommended_strategy ??
    recoveryCase?.recovery_strategy ??
    "CUSTOMER_CONTACT";

  const recoverySteps =
    getRecoverySteps(strategy);

  async function handleRecovery() {
    try {
      setRunning(true);
      setActionError(null);

      await autoRecoverCase(caseId);

      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to execute recovery.",
      );
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/recovery"
          className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Recovery Queue
        </Link>

        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="font-semibold">
            Loading recovery case...
          </p>

          <p className="mt-1 text-sm text-secondary">
            RecoverAI is retrieving the live case,
            AI decision, and recovery history.
          </p>
        </div>
      </div>
    );
  }

  if (error || !recoveryCase) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/recovery"
          className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Recovery Queue
        </Link>

        <div className="rounded-xl border border-danger/30 bg-danger-soft p-12 text-center">
          <p className="font-semibold text-danger">
            Unable to load recovery case
          </p>

          <p className="mt-1 text-sm text-secondary">
            {error ?? "Recovery case not found."}
          </p>
        </div>
      </div>
    );
  }

  const latestAttempt =
    attempts.length > 0
      ? attempts[attempts.length - 1]
      : null;

  const isRecovered =
    recoveryCase.status === "RECOVERED" ||
    outcome?.outcome === "RECOVERED";

  const isEscalated =
    recoveryCase.status === "CLOSED" ||
    recoveryCase.status === "ESCALATED";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/recovery"
        className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Recovery Queue
      </Link>

      <PageHeader
        title={`Case ${
          recoveryCase.transaction_id ||
          recoveryCase.id
        }`}
        description={`${labelFromEnum(
          recoveryCase.recovery_strategy ??
            "PAYMENT_FAILURE",
        )} · ${recoveryCase.id}`}
        action={
          <PriorityBadge
            priority={
              recoveryCase.priority as
                | "HIGH"
                | "MEDIUM"
                | "LOW"
            }
          />
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>
            Customer Information
          </CardTitle>

          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                <UserRound className="h-5 w-5" />
              </div>

              <div>
                <p className="font-semibold">
                  {customerId}
                </p>

                <p className="text-xs text-secondary">
                  Customer context derived from
                  recovery case
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-secondary">
                  Revenue at risk
                </p>

                <p className="mt-1 font-semibold">
                  {formatCurrency(amount)}
                </p>
              </div>

              <div>
                <p className="text-xs text-secondary">
                  Recovery probability
                </p>

                <p className="mt-1 font-semibold">
                  {probability}%
                </p>
              </div>

              <div>
                <p className="text-xs text-secondary">
                  Recovery attempts
                </p>

                <p className="mt-1 font-semibold">
                  {attempts.length}
                </p>
              </div>

              <div>
                <p className="text-xs text-secondary">
                  Case ID
                </p>

                <p className="mt-1 truncate font-semibold">
                  {recoveryCase.id}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>
            Transaction Information
          </CardTitle>

          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-secondary">
                Transaction
              </p>

              <p className="mt-1 font-semibold">
                {recoveryCase.transaction_id}
              </p>
            </div>

            <div>
              <p className="text-xs text-secondary">
                Amount
              </p>

              <p className="mt-1 font-bold text-danger">
                {formatCurrency(amount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-secondary">
                Strategy
              </p>

              <p className="mt-1 font-semibold">
                {labelFromEnum(strategy)}
              </p>
            </div>

            <div>
              <p className="text-xs text-secondary">
                Attempts
              </p>

              <p className="mt-1 font-semibold">
                {attempts.length}
              </p>
            </div>

            <div className="col-span-2">
              <p className="text-xs text-secondary">
                Failure
              </p>

              <p className="mt-1 font-semibold">
                {recoveryCase.reason ||
                  "No payment failure reason recorded"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-accent/20 bg-accent/[0.04]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">
              AI Diagnosis
            </p>

            <h2 className="mt-2 text-lg font-bold">
              Why is this revenue at risk?
            </h2>
          </div>

          <Badge variant="accent">
            {confidence}% confidence
          </Badge>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-6 text-secondary">
          {score?.evidence?.[0] ??
            recoveryCase.reason ??
            "RecoverAI is evaluating the failed transaction for recovery."}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-secondary">
              Risk band
            </p>

            <p className="mt-1 font-semibold">
              {score?.risk_band
                ? labelFromEnum(
                    score.risk_band,
                  )
                : "Pending"}
            </p>
          </div>

          <div>
            <p className="text-xs text-secondary">
              Recoverability
            </p>

            <p className="mt-1 font-semibold">
              {probability}%
            </p>
          </div>

          <div>
            <p className="text-xs text-secondary">
              Expected recovery
            </p>

            <p className="mt-1 font-semibold text-success">
              {formatCurrency(
                expectedRecovery,
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {(
            score?.evidence ??
            [
              recoveryCase.reason,
              "Recovery eligibility evaluated by RecoverAI.",
            ]
          ).map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex items-center gap-2 text-sm text-secondary"
            >
              <CheckCircle2 className="h-4 w-4 text-success" />
              {item}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />

          <CardTitle>
            Recommended Action
          </CardTitle>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            {recoverySteps.map(
              (step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-lg border border-border bg-app p-3 text-sm"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                    {index + 1}
                  </span>

                  <span>{step}</span>
                </div>
              ),
            )}
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Expected recovery
            </p>

            <p className="mt-2 text-2xl font-bold text-success">
              {formatCurrency(
                expectedRecovery,
              )}
            </p>

            <p className="mt-1 text-xs text-secondary">
              {confidence}%
              {" "}recommendation confidence
            </p>

            <Button
              className="mt-4 w-full"
              disabled={
                running ||
                isRecovered ||
                isEscalated
              }
              onClick={handleRecovery}
            >
              {running
                ? "Executing..."
                : isRecovered
                  ? "Recovery Completed"
                  : isEscalated
                    ? "Escalated"
                    : "Run Recovery"}
            </Button>

            <Button
              variant="secondary"
              className="mt-2 w-full"
              onClick={() => {
                void refresh();
              }}
            >
              Refresh Decision
            </Button>

            {actionError && (
              <p className="mt-3 text-xs text-danger">
                {actionError}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />

          <CardTitle>
            Recovery Activity
          </CardTitle>
        </div>

        <div className="mt-5 space-y-3">
          {attempts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm font-semibold">
                No recovery attempts yet
              </p>

              <p className="mt-1 text-xs text-secondary">
                RecoverAI has not executed an
                intervention for this case.
              </p>
            </div>
          ) : (
            attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">
                      {labelFromEnum(
                        attempt.action,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-secondary">
                      {labelFromEnum(
                        attempt.channel,
                      )}
                      {" · "}
                      {new Date(
                        attempt.attempted_at,
                      ).toLocaleString()}
                    </p>
                  </div>

                  <StatusBadge
                    status={attempt.status}
                  />
                </div>

                {attempt.message && (
                  <p className="mt-3 text-sm text-secondary">
                    {attempt.message}
                  </p>
                )}

                {attempt.provider_reference && (
                  <p className="mt-2 text-xs text-secondary">
                    Provider reference:{" "}
                    {attempt.provider_reference}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />

          <CardTitle>
            Recovery Outcome
          </CardTitle>
        </div>

        <div className="mt-5">
          {outcome ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-secondary">
                  Outcome
                </p>

                <p className="mt-1 font-semibold">
                  {labelFromEnum(
                    outcome.outcome,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-secondary">
                  Verified amount
                </p>

                <p className="mt-1 font-semibold text-success">
                  {formatCurrency(
                    Number(
                      outcome.recovered_amount,
                    ),
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-secondary">
                  Verification
                </p>

                <p className="mt-1 font-semibold">
                  {labelFromEnum(
                    outcome.verification_status,
                  )}
                </p>
              </div>

              <div className="sm:col-span-3">
                <p className="text-xs text-secondary">
                  Verification source
                </p>

                <p className="mt-1 text-sm font-medium">
                  {outcome.verification_source}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-border p-5">
              <Clock3 className="mt-0.5 h-5 w-5 text-secondary" />

              <div>
                <p className="font-semibold">
                  Recovery not yet verified
                </p>

                <p className="mt-1 text-sm text-secondary">
                  A verified outcome will appear here
                  after an intervention produces a
                  recorded recovery result.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />

          <CardTitle>
            Agent Audit Trail
          </CardTitle>
        </div>

        <div className="mt-5 space-y-3">
          {auditEvents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm font-semibold">
                No audit events recorded
              </p>
            </div>
          ) : (
            auditEvents.map((event) => (
              <div
                key={event.id}
                className="flex gap-3 rounded-lg border border-border p-4"
              >
                <div className="mt-0.5">
                  {event.event_type.includes(
                    "ESCALATION",
                  ) ? (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold">
                      {labelFromEnum(
                        event.event_type,
                      )}
                    </p>

                    <p className="text-xs text-secondary">
                      {new Date(
                        event.occurred_at,
                      ).toLocaleString()}
                    </p>
                  </div>

                  {event.reason && (
                    <p className="mt-1 text-sm text-secondary">
                      {event.reason}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-secondary">
                    Actor: {event.actor}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {latestAttempt && (
        <div className="pb-4 text-center text-xs text-secondary">
          Latest intervention:{" "}
          {labelFromEnum(
            latestAttempt.action,
          )}
          {" · "}
          {labelFromEnum(
            latestAttempt.status,
          )}
        </div>
      )}
    </div>
  );
}
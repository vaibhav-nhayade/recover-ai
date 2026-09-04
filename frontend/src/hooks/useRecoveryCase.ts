"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getAuditEvents,
  getRecoveryAttempts,
  getRecoveryCase,
  getRecoveryOutcome,
  getRecoveryScore,
  type AuditEventResponse,
  type RecoveryAttemptResponse,
  type RecoveryCaseResponse,
  type RecoveryOutcomeResponse,
  type RecoveryScoreResponse,
} from "@/lib/api";

interface UseRecoveryCaseResult {
  recoveryCase: RecoveryCaseResponse | null;
  score: RecoveryScoreResponse | null;
  attempts: RecoveryAttemptResponse[];
  outcome: RecoveryOutcomeResponse | null;
  auditEvents: AuditEventResponse[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRecoveryCase(
  caseId: string,
): UseRecoveryCaseResult {
  const [recoveryCase, setRecoveryCase] =
    useState<RecoveryCaseResponse | null>(null);

  const [score, setScore] =
    useState<RecoveryScoreResponse | null>(null);

  const [attempts, setAttempts] =
    useState<RecoveryAttemptResponse[]>([]);

  const [outcome, setOutcome] =
    useState<RecoveryOutcomeResponse | null>(null);

  const [auditEvents, setAuditEvents] =
    useState<AuditEventResponse[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentCase =
        await getRecoveryCase(caseId);

      setRecoveryCase(currentCase);

      const [
        scoreResult,
        attemptsResult,
        auditResult,
      ] = await Promise.all([
        getRecoveryScore(
          currentCase.transaction_id,
        ).catch(() => null),

        getRecoveryAttempts(
          caseId,
        ).catch(() => []),

        getAuditEvents(
          caseId,
        ).catch(() => []),
      ]);

      setScore(scoreResult);
      setAttempts(attemptsResult);
      setAuditEvents(auditResult);

      const outcomeResult =
        await getRecoveryOutcome(
          caseId,
        ).catch(() => null);

      setOutcome(outcomeResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load recovery case.",
      );
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    recoveryCase,
    score,
    attempts,
    outcome,
    auditEvents,
    loading,
    error,
    refresh: load,
  };
}
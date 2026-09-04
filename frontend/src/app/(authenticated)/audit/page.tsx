"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import {
  getAuditEvents,
  getRecoveryCases,
  type AuditEventResponse,
  type RecoveryCaseResponse,
} from "@/lib/api";

interface AuditViewItem {
  id: string;
  event: string;
  detail: string;
  result: string | null;
  timestamp: string;
  actor: string;
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getEventResult(event: AuditEventResponse) {
  if (event.status) {
    return event.status.toUpperCase();
  }

  switch (event.event_type) {
    case "RECOVERY_COMPLETED":
    case "INTERVENTION_OUTCOME":
    case "RECOVERY_OUTCOME_VERIFIED":
      return "PASSED";

    case "POLICY_BLOCK":
    case "INTERVENTION_BLOCKED":
    case "STOPPING_RULE":
    case "ESCALATION":
      return "FAILED";

    default:
      return null;
  }
}

function getEventDetail(event: AuditEventResponse) {
  if (event.reason) {
    return event.reason;
  }

  if (event.action) {
    return event.action;
  }

  if (Object.keys(event.event_data).length > 0) {
    return Object.entries(event.event_data)
      .map(([key, value]) => {
        const label = key
          .replaceAll("_", " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

        return `${label}: ${
          typeof value === "object"
            ? JSON.stringify(value)
            : String(value)
        }`;
      })
      .join(" • ");
  }

  return "Recovery system recorded this event.";
}

function mapAuditEvent(event: AuditEventResponse): AuditViewItem {
  return {
    id: event.id,
    event: event.event_type
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    detail: getEventDetail(event),
    result: getEventResult(event),
    timestamp: formatTimestamp(event.occurred_at),
    actor: event.actor,
  };
}

export default function AuditPage() {
  const [cases, setCases] = useState<RecoveryCaseResponse[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    null,
  );
  const [events, setEvents] = useState<AuditEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCases() {
      try {
        setLoading(true);
        setError(null);

        const result = await getRecoveryCases();

        setCases(result);

        if (result.length > 0) {
          setSelectedCaseId(result[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load recovery cases.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCases();
  }, []);

  useEffect(() => {
    if (!selectedCaseId) {
      setEvents([]);
      return;
    }

    async function loadAuditEvents() {
      try {
        setEventsLoading(true);
        setError(null);

        const result = await getAuditEvents(selectedCaseId);

        setEvents(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load audit events.",
        );
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    }

    void loadAuditEvents();
  }, [selectedCaseId]);

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? null,
    [cases, selectedCaseId],
  );

  const auditItems = useMemo(
    () => events.map(mapAuditEvent),
    [events],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Audit Trail"
        description="A transparent record of what the recovery system decided, when, and why."
      />

      {error && (
        <Card className="border-[var(--danger)]/30 bg-[var(--danger-soft)] p-4">
          <p className="text-sm font-medium text-[var(--danger)]">
            {error}
          </p>
        </Card>
      )}

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            {selectedCase
              ? `Case ${selectedCase.transaction_id}`
              : "Recovery Case Audit"}
          </CardTitle>

          {cases.length > 0 && (
            <select
              value={selectedCaseId ?? ""}
              onChange={(event) =>
                setSelectedCaseId(event.target.value || null)
              }
              disabled={loading || eventsLoading}
              className="h-9 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-primary outline-none transition-colors focus:border-brand"
            >
              {cases.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.transaction_id} · {item.status}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading || eventsLoading ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-secondary">
              Loading audit trail…
            </p>
          </div>
        ) : auditItems.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-primary">
              No audit events recorded yet.
            </p>
            <p className="mt-1 text-xs text-secondary">
              Agent decisions and recovery actions will appear here.
            </p>
          </div>
        ) : (
          <div className="relative mt-6">
            {/* Timeline connector */}
            <div className="absolute bottom-2 left-[9px] top-2 w-px bg-[var(--border)]" />

            <div className="space-y-6">
              {auditItems.map((item) => (
                <div
                  key={item.id}
                  className="relative flex items-start gap-4"
                >
                  {/* Timeline node */}
                  <div className="relative z-10 mt-1 h-5 w-5 shrink-0 rounded-full border-4 border-[var(--surface)] bg-[var(--brand)]" />

                  {/* Event content */}
                  <div className="min-w-0 flex-1">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                      {/* Event information */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-5 text-[var(--text-primary)]">
                          {item.event}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                          {item.detail}
                        </p>
                      </div>

                      {/* Result + timestamp */}
                      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                        {item.result && (
                          <Badge
                            variant={
                              item.result === "PASSED"
                                ? "success"
                                : item.result === "FAILED"
                                  ? "danger"
                                  : "neutral"
                            }
                          >
                            {item.result}
                          </Badge>
                        )}

                        <span className="whitespace-nowrap text-xs tabular-nums text-[var(--text-secondary)]">
                          {item.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Actor */}
                    <p className="mt-2 text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-[var(--text-muted)]">
                      {item.actor}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
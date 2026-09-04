"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useRecoveryCases } from "@/hooks/useRecoveryCases";
import type {
  Priority,
  RecoveryType,
} from "@/types";
import {
  formatCurrency,
  labelFromEnum,
} from "@/lib/utils";

const typeOptions: Array<
  RecoveryType | "ALL"
> = [
  "ALL",
  "PAYMENT_FAILURE",
  "CHECKOUT_ABANDONMENT",
  "SUBSCRIPTION_FAILURE",
  "OVERDUE_INVOICE",
];

const priorityOptions: Array<
  Priority | "ALL"
> = [
  "ALL",
  "HIGH",
  "MEDIUM",
  "LOW",
];

function getRecoveryType(
  reason: string,
  strategy: string | null,
): RecoveryType {
  const value = `${reason} ${strategy ?? ""}`.toLowerCase();

  if (
    value.includes("subscription") ||
    value.includes("recurring")
  ) {
    return "SUBSCRIPTION_FAILURE";
  }

  if (
    value.includes("invoice") ||
    value.includes("overdue")
  ) {
    return "OVERDUE_INVOICE";
  }

  if (
    value.includes("checkout") ||
    value.includes("abandon")
  ) {
    return "CHECKOUT_ABANDONMENT";
  }

  return "PAYMENT_FAILURE";
}

function getCustomerId(
  notes: string | null,
  transactionId: string,
): string {
  if (notes) {
    const match = notes.match(
      /customer[_\s-]?id["']?\s*[:=]\s*["']?([A-Za-z0-9_-]+)/i,
    );

    if (match?.[1]) {
      return match[1];
    }
  }

  return transactionId;
}

function getRecoveryProbability(
  priority: string,
  strategy: string | null,
): number {
  if (strategy === "MANUAL_REVIEW") {
    return priority === "HIGH" ? 42 : 55;
  }

  if (priority === "HIGH") {
    return 78;
  }

  if (priority === "MEDIUM") {
    return 64;
  }

  return 51;
}

function getRecommendedAction(
  strategy: string | null,
  amount: number,
  probability: number,
) {
  if (strategy === "PAYMENT_RETRY") {
    return {
      title: "Retry payment",
      expectedRecovery: Math.round(
        amount * (probability / 100),
      ),
    };
  }

  if (strategy === "CUSTOMER_CONTACT") {
    return {
      title: "Contact customer",
      expectedRecovery: Math.round(
        amount * (probability / 100),
      ),
    };
  }

  return {
    title: "Manual review",
    expectedRecovery: Math.round(
      amount * (probability / 100),
    ),
  };
}

export default function RecoveryQueuePage() {
  const [type, setType] = useState<
    RecoveryType | "ALL"
  >("ALL");

  const [priority, setPriority] = useState<
    Priority | "ALL"
  >("ALL");

  const [search, setSearch] = useState("");

  const {
    data: recoveryCases,
    loading,
    error,
  } = useRecoveryCases();

  const cases = useMemo(() => {
    return recoveryCases.map((item) => {
      const amount = Number(item.amount_at_risk);

      const recoveryType = getRecoveryType(
        item.reason,
        item.recovery_strategy,
      );

      const probability =
        getRecoveryProbability(
          item.priority,
          item.recovery_strategy,
        );

      const customerId = getCustomerId(
        item.notes,
        item.transaction_id,
      );

      return {
        id: item.id,
        transactionId: item.transaction_id,
        customerId,
        amount,
        reason: item.reason,
        status: item.status,
        priority: item.priority,
        type: recoveryType,
        recoveryProbability: probability,
        recommendedAction:
          getRecommendedAction(
            item.recovery_strategy,
            amount,
            probability,
          ),
      };
    });
  }, [recoveryCases]);

  const filtered = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return cases.filter((item) => {
      const matchesType =
        type === "ALL" ||
        item.type === type;

      const matchesPriority =
        priority === "ALL" ||
        item.priority === priority;

      const matchesSearch =
        query.length === 0 ||
        item.id
          .toLowerCase()
          .includes(query) ||
        item.transactionId
          .toLowerCase()
          .includes(query) ||
        item.customerId
          .toLowerCase()
          .includes(query) ||
        item.reason
          .toLowerCase()
          .includes(query);

      return (
        matchesType &&
        matchesPriority &&
        matchesSearch
      );
    });
  }, [
    cases,
    type,
    priority,
    search,
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Recovery Queue"
        description="Prioritized revenue cases awaiting diagnosis, action, or verification."
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search case, transaction, or customer..."
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>

        <select
          value={type}
          onChange={(event) =>
            setType(
              event.target.value as
                | RecoveryType
                | "ALL",
            )
          }
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          {typeOptions.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option === "ALL"
                ? "All types"
                : labelFromEnum(option)}
            </option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(event) =>
            setPriority(
              event.target.value as
                | Priority
                | "ALL",
            )
          }
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          {priorityOptions.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option === "ALL"
                ? "All priorities"
                : option}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="font-semibold">
            Loading recovery cases...
          </p>

          <p className="mt-1 text-sm text-secondary">
            RecoverAI is retrieving the live recovery queue.
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-danger/30 bg-danger-soft p-12 text-center">
          <p className="font-semibold text-danger">
            Unable to load recovery cases
          </p>

          <p className="mt-1 text-sm text-secondary">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={`/recovery/${item.id}`}
              className="block rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-accent/40 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge
                      priority={
                        item.priority as Priority
                      }
                    />

                    <StatusBadge
                      status={item.status}
                    />

                    <span className="text-xs text-secondary">
                      {labelFromEnum(item.type)}
                    </span>
                  </div>

                  <h2 className="mt-3 text-base font-semibold">
                    {item.transactionId ||
                      item.id}
                  </h2>

                  <p className="mt-1 text-sm text-secondary">
                    Customer {item.customerId} ·{" "}
                    {formatCurrency(item.amount)} at risk
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-secondary">
                      Recovery probability
                    </p>

                    <p className="mt-1 font-semibold">
                      {item.recoveryProbability}%
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-secondary">
                      Recommendation
                    </p>

                    <p className="mt-1 max-w-[180px] font-medium">
                      {
                        item
                          .recommendedAction
                          .title
                      }
                    </p>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs text-secondary">
                      Expected recovery
                    </p>

                    <p className="mt-1 font-semibold text-success">
                      {formatCurrency(
                        item
                          .recommendedAction
                          .expectedRecovery,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading &&
        !error &&
        filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
            <p className="font-semibold">
              No recovery cases found
            </p>

            <p className="mt-1 text-sm text-secondary">
              Try changing your filters or search query.
            </p>
          </div>
        )}
    </div>
  );
}
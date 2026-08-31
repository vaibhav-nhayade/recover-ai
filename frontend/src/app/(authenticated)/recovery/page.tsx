"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { mockRecoveryCases } from "@/data/mock";
import type { Priority, RecoveryType } from "@/types";
import { formatCurrency, labelFromEnum } from "@/lib/utils";

const typeOptions: Array<RecoveryType | "ALL"> = ["ALL", "PAYMENT_FAILURE", "CHECKOUT_ABANDONMENT", "SUBSCRIPTION_FAILURE", "OVERDUE_INVOICE"];
const priorityOptions: Array<Priority | "ALL"> = ["ALL", "HIGH", "MEDIUM", "LOW"];

export default function RecoveryQueuePage() {
  const [type, setType] = useState<RecoveryType | "ALL">("ALL");
  const [priority, setPriority] = useState<Priority | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => mockRecoveryCases.filter((item) => {
    const matchesType = type === "ALL" || item.type === type;
    const matchesPriority = priority === "ALL" || item.priority === priority;
    const query = search.toLowerCase();
    return matchesType && matchesPriority && (
      item.id.toLowerCase().includes(query) ||
      (item.transactionId ?? "").toLowerCase().includes(query) ||
      item.customerId.toLowerCase().includes(query)
    );
  }), [type, priority, search]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Recovery Queue" description="Prioritized revenue cases awaiting diagnosis, action, or verification." />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search case, transaction, or customer..." className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-accent" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value as RecoveryType | "ALL")} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm">
          {typeOptions.map((option) => <option key={option} value={option}>{option === "ALL" ? "All types" : labelFromEnum(option)}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority | "ALL")} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm">
          {priorityOptions.map((option) => <option key={option} value={option}>{option === "ALL" ? "All priorities" : option}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((item) => (
          <Link key={item.id} href={`/recovery/${item.id}`} className="block rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-accent/40 hover:shadow-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <PriorityBadge priority={item.priority} />
                  <StatusBadge status={item.status} />
                  <span className="text-xs text-secondary">{labelFromEnum(item.type)}</span>
                </div>
                <h2 className="mt-3 text-base font-semibold">{item.transactionId ?? item.id}</h2>
                <p className="mt-1 text-sm text-secondary">Customer {item.customerId} · {formatCurrency(item.amount)} at risk</p>
              </div>
              <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
                <div><p className="text-xs text-secondary">Recovery probability</p><p className="mt-1 font-semibold">{item.recoveryProbability}%</p></div>
                <div><p className="text-xs text-secondary">Recommendation</p><p className="mt-1 max-w-[180px] font-medium">{item.recommendedAction.title}</p></div>
                <div className="col-span-2 sm:col-span-1"><p className="text-xs text-secondary">Expected recovery</p><p className="mt-1 font-semibold text-success">{formatCurrency(item.recommendedAction.expectedRecovery)}</p></div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="font-semibold">No recovery cases found</p>
          <p className="mt-1 text-sm text-secondary">Try changing your filters or search query.</p>
        </div>
      )}
    </div>
  );
}

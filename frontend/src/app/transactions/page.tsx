"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { mockCustomers, mockRecoveryCases, mockTransactions } from "@/data/mock";
import { formatCurrency } from "@/lib/utils";

export default function TransactionsPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => mockTransactions.filter((item) => {
    const customer = mockCustomers.find((c) => c.id === item.customerId);
    const text = `${item.id} ${item.customerId} ${customer?.name ?? ""}`.toLowerCase();
    return text.includes(query.toLowerCase());
  }), [query]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Transactions" description="Payment events and their recovery context." />
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transactions..." className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-accent" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="border-b border-border bg-app text-xs font-semibold text-secondary">
              <tr>
                <th className="px-5 py-3">Transaction</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Payment Method</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Recovery</th>
                <th className="px-5 py-3">Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => {
                const customer = mockCustomers.find((c) => c.id === item.customerId);
                const recovery = mockRecoveryCases.find((c) => c.transactionId === item.id);
                return (
                  <tr key={item.id} className="hover:bg-app/60">
                    <td className="px-5 py-4 font-semibold">{item.id}</td>
                    <td className="px-5 py-4"><p className="font-medium">{customer?.name}</p><p className="text-xs text-secondary">{item.customerId}</p></td>
                    <td className="px-5 py-4 font-semibold">{formatCurrency(item.amount)}</td>
                    <td className="px-5 py-4">{item.paymentMethod}</td>
                    <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                    <td className="px-5 py-4">{recovery ? <StatusBadge status={recovery.status} /> : <span className="text-xs text-secondary">Not flagged</span>}</td>
                    <td className="px-5 py-4">{item.attempts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

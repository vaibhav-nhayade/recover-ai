"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getRecoveryCases, getTransactions } from "@/lib/api";
import type {
  RecoveryCaseResponse,
  TransactionResponse,
} from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function TransactionsPage() {
  const [query, setQuery] = useState("");

  const [transactions, setTransactions] = useState<
    TransactionResponse[]
  >([]);

  const [recoveryCases, setRecoveryCases] = useState<
    RecoveryCaseResponse[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [transactionResult, recoveryResult] =
          await Promise.all([
            getTransactions(),
            getRecoveryCases(),
          ]);

        setTransactions(transactionResult);
        setRecoveryCases(recoveryResult);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load transactions.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return transactions;
    }

    return transactions.filter((item) => {
      const text = [
        item.transaction_reference,
        item.customer_name,
        item.customer_email,
        item.payment_method,
        item.status,
        item.failure_reason ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(normalizedQuery);
    });
  }, [query, transactions]);

  const recoveryByTransaction = useMemo(() => {
    return new Map(
      recoveryCases.map((item) => [
        item.transaction_id,
        item,
      ]),
    );
  }, [recoveryCases]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Transactions"
        description="Payment events and their recovery context."
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transactions..."
          className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-accent"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--danger)]">
            {error}
          </p>
        </div>
      )}

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
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-secondary"
                  >
                    Loading transactions…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-secondary"
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const recovery =
                    recoveryByTransaction.get(item.id);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-app/60"
                    >
                      <td className="px-5 py-4 font-semibold">
                        {item.transaction_reference}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium">
                          {item.customer_name}
                        </p>

                        <p className="text-xs text-secondary">
                          {item.customer_email}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {formatCurrency(Number(item.amount))}
                      </td>

                      <td className="px-5 py-4">
                        {item.payment_method}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="px-5 py-4">
                        {recovery ? (
                          <StatusBadge status={recovery.status} />
                        ) : (
                          <span className="text-xs text-secondary">
                            Not flagged
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {recovery
                          ? "Recovery attempts tracked"
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText, UserRound } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { mockCustomers, mockRecoveryCases, mockTransactions } from "@/data/mock";
import { expectedRecovery, formatCurrency, labelFromEnum } from "@/lib/utils";

export default async function CaseInvestigationPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const recoveryCase = mockRecoveryCases.find((item) => item.id === caseId);

  if (!recoveryCase) notFound();

  const customer = mockCustomers.find((item) => item.id === recoveryCase.customerId);
  const transaction = recoveryCase.transactionId ? mockTransactions.find((item) => item.id === recoveryCase.transactionId) : undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/recovery" className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to Recovery Queue
      </Link>

      <PageHeader
        title={`Case ${recoveryCase.transactionId ?? recoveryCase.id}`}
        description={`${labelFromEnum(recoveryCase.type)} · ${recoveryCase.id}`}
        action={<PriorityBadge priority={recoveryCase.priority} />}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Customer Information</CardTitle>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent"><UserRound className="h-5 w-5" /></div>
              <div><p className="font-semibold">{customer?.name ?? recoveryCase.customerId}</p><p className="text-xs text-secondary">{customer?.email}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-secondary">Lifetime value</p><p className="mt-1 font-semibold">{formatCurrency(customer?.ltv ?? 0)}</p></div>
              <div><p className="text-xs text-secondary">Successful payments</p><p className="mt-1 font-semibold">{customer?.successfulPayments ?? 0}</p></div>
              <div><p className="text-xs text-secondary">Failed payments</p><p className="mt-1 font-semibold">{customer?.failedPayments ?? 0}</p></div>
              <div><p className="text-xs text-secondary">Customer ID</p><p className="mt-1 font-semibold">{recoveryCase.customerId}</p></div>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Transaction Information</CardTitle>
          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-secondary">Transaction</p><p className="mt-1 font-semibold">{transaction?.id ?? "Not applicable"}</p></div>
            <div><p className="text-xs text-secondary">Amount</p><p className="mt-1 font-bold text-danger">{formatCurrency(recoveryCase.amount)}</p></div>
            <div><p className="text-xs text-secondary">Payment method</p><p className="mt-1 font-semibold">{transaction?.paymentMethod ?? "N/A"}</p></div>
            <div><p className="text-xs text-secondary">Attempts</p><p className="mt-1 font-semibold">{transaction?.attempts ?? "N/A"}</p></div>
            <div className="col-span-2"><p className="text-xs text-secondary">Failure</p><p className="mt-1 font-semibold">{transaction?.failureReason ?? "No payment failure recorded"}</p></div>
          </div>
        </Card>
      </div>

      <Card className="border-accent/20 bg-accent/[0.04]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">AI Diagnosis</p>
            <h2 className="mt-2 text-lg font-bold">Why is this revenue at risk?</h2>
          </div>
          <Badge variant="accent">{recoveryCase.diagnosis.confidence}% confidence</Badge>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-secondary">{recoveryCase.diagnosis.explanation}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div><p className="text-xs text-secondary">Diagnosis</p><p className="mt-1 font-semibold">{recoveryCase.diagnosis.reason}</p></div>
          <div><p className="text-xs text-secondary">Recoverability</p><p className="mt-1 font-semibold">{recoveryCase.diagnosis.recoverability}%</p></div>
          <div><p className="text-xs text-secondary">Expected recovery</p><p className="mt-1 font-semibold text-success">{formatCurrency(expectedRecovery(recoveryCase.amount, recoveryCase.recoveryProbability))}</p></div>
        </div>
        <div className="mt-5 space-y-2">
          {recoveryCase.diagnosis.evidence.map((item) => <div key={item} className="flex items-center gap-2 text-sm text-secondary"><CheckCircle2 className="h-4 w-4 text-success" />{item}</div>)}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-accent" /><CardTitle>Recommended Action</CardTitle></div>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            {recoveryCase.recommendedAction.steps.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-lg border border-border bg-app p-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Expected recovery</p>
            <p className="mt-2 text-2xl font-bold text-success">{formatCurrency(recoveryCase.recommendedAction.expectedRecovery)}</p>
            <p className="mt-1 text-xs text-secondary">{recoveryCase.recommendedAction.confidence}% recommendation confidence</p>
            <Button className="mt-4 w-full">Approve Recovery</Button>
            <Button variant="secondary" className="mt-2 w-full">Review Action</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

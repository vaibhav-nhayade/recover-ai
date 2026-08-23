import { Card, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { mockAuditEvents } from "@/data/mock";

export default function AuditPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Audit Trail" description="A transparent record of what the recovery system decided, when, and why." />
      <Card>
        <CardTitle>Case PAY_83921</CardTitle>
        <div className="relative mt-6">
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-6">
            {mockAuditEvents.map((item) => (
              <div key={item.id} className="relative flex gap-4">
                <div className="relative z-10 mt-1 h-5 w-5 rounded-full border-4 border-surface bg-accent" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{item.event}</p>
                      <p className="mt-1 text-xs text-secondary">{item.detail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.result && <Badge variant={item.result === "PASSED" ? "success" : item.result === "FAILED" ? "danger" : "neutral"}>{item.result}</Badge>}
                      <span className="text-xs text-secondary">{item.timestamp}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-secondary">{item.actor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

import { Card, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { mockAuditEvents } from "@/data/mock";

export default function AuditPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Audit Trail"
        description="A transparent record of what the recovery system decided, when, and why."
      />

      <Card className="p-5 sm:p-6">
        <CardTitle>Case PAY_83921</CardTitle>

        <div className="relative mt-6">
          {/* Timeline connector */}
          <div className="absolute bottom-2 left-[9px] top-2 w-px bg-[var(--border)]" />

          <div className="space-y-6">
            {mockAuditEvents.map((item) => (
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
      </Card>
    </div>
  );
}
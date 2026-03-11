import { AlertTriangle } from "lucide-react";
import type { Entry } from "../backend.d";
import { formatCurrency } from "../utils/currency";
import { isOverdue } from "../utils/currency";

interface SummaryBarProps {
  entries: Entry[];
}

export function SummaryBar({ entries }: SummaryBarProps) {
  const totalDue = entries
    .filter((e) => !e.paid)
    .reduce((sum, e) => sum + (Number(e.totalAmount) - Number(e.advance)), 0);

  const overdueCount = entries.filter((e) =>
    isOverdue(e.paid, e.dateCreated),
  ).length;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <div
        className="flex items-center gap-2 bg-card border border-border rounded px-3 py-1.5 min-w-0"
        data-ocid="summary.total_entries.card"
      >
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium whitespace-nowrap">
          Total Entries
        </span>
        <span className="text-sm font-semibold font-mono text-foreground tabular-nums">
          {entries.length}
        </span>
      </div>

      <div
        className="flex items-center gap-2 bg-card border border-border rounded px-3 py-1.5 min-w-0"
        data-ocid="summary.total_due.card"
      >
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium whitespace-nowrap">
          Total Due
        </span>
        <span className="text-sm font-semibold font-mono text-warning tabular-nums">
          {formatCurrency(BigInt(Math.round(totalDue)))}
        </span>
      </div>

      {overdueCount > 0 && (
        <div className="flex items-center gap-1.5 bg-[oklch(0.96_0.04_30/0.8)] border border-[oklch(0.75_0.14_28/0.4)] text-[oklch(0.52_0.2_28)] rounded px-3 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">
            {overdueCount} overdue payment{overdueCount > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

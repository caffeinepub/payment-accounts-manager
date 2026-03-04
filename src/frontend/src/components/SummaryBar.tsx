import { AlertTriangle } from "lucide-react";
import type { Entry } from "../backend.d";
import { getCommissionSplitMap } from "../utils/commissionSplitStorage";
import { formatCurrency } from "../utils/currency";
import { isOverdue } from "../utils/currency";

interface SummaryBarProps {
  entries: Entry[];
}

export function SummaryBar({ entries }: SummaryBarProps) {
  const totalDue = entries
    .filter((e) => !e.paid)
    .reduce((sum, e) => sum + Number(e.totalAmount), 0);

  const totalCollected = entries
    .filter((e) => e.paid)
    .reduce((sum, e) => sum + Number(e.totalAmount), 0);

  const overdueCount = entries.filter((e) =>
    isOverdue(e.paid, e.dateCreated),
  ).length;

  // Commission split totals from localStorage
  const splitMap = getCommissionSplitMap();
  const totalCommPrakash = entries.reduce((sum, e) => {
    const split = splitMap[e.id];
    return sum + (split ? Number.parseFloat(split.commPrakash) || 0 : 0);
  }, 0);
  const totalCommOthers = entries.reduce((sum, e) => {
    const split = splitMap[e.id];
    return sum + (split ? Number.parseFloat(split.commOthers) || 0 : 0);
  }, 0);

  const totalAmt = entries.reduce((sum, e) => sum + Number(e.totalAmount), 0);

  const stats = [
    {
      label: "Amount",
      value: formatCurrency(
        BigInt(Math.round(entries.reduce((s, e) => s + Number(e.amount), 0))),
      ),
      isNumber: true,
      color: "text-foreground" as const,
    },
    {
      label: "Comm Prakash",
      value: `₹${totalCommPrakash.toFixed(2)}`,
      isNumber: true,
      color: "text-[oklch(0.5_0.18_250)]" as const,
    },
    {
      label: "Comm Other",
      value: `₹${totalCommOthers.toFixed(2)}`,
      isNumber: true,
      color: "text-[oklch(0.5_0.18_145)]" as const,
    },
    {
      label: "Total Amt",
      value: formatCurrency(BigInt(Math.round(totalAmt))),
      isNumber: true,
      color: "text-foreground" as const,
    },
    {
      label: "Total Due",
      value: formatCurrency(BigInt(Math.round(totalDue))),
      isNumber: true,
      color: "text-warning" as const,
    },
    {
      label: "Total Collected",
      value: formatCurrency(BigInt(Math.round(totalCollected))),
      isNumber: true,
      color: "text-success" as const,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-2 bg-card border border-border rounded px-3 py-1.5 min-w-0"
        >
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium whitespace-nowrap">
            {stat.label}
          </span>
          <span
            className={`text-sm font-semibold font-mono ${stat.color} tabular-nums`}
          >
            {stat.value}
          </span>
        </div>
      ))}

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

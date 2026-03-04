import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp } from "lucide-react";
import { useState } from "react";
import type { Entry } from "../backend.d";
import { getCommissionSplitMap } from "../utils/commissionSplitStorage";
import { bigintNanosToMs, formatCurrency } from "../utils/currency";

interface MonthlyProfitButtonProps {
  entries: Entry[];
}

interface MonthRow {
  monthKey: string;
  monthLabel: string;
  totalCommPrakash: number;
}

export function MonthlyProfitButton({ entries }: MonthlyProfitButtonProps) {
  const [open, setOpen] = useState(false);

  // Compute monthly profit from commissionSplitMap (Comm Prakash amounts only)
  function computeRows(): MonthRow[] {
    const splitMap = getCommissionSplitMap();
    const monthMap = new Map<string, { label: string; total: number }>();

    for (const entry of entries) {
      const ms = bigintNanosToMs(entry.dateCreated);
      const date = new Date(ms);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });

      const split = splitMap[entry.id];
      const commPrakashAmt = split
        ? Number.parseFloat(split.commPrakash) || 0
        : 0;

      if (commPrakashAmt === 0) continue;

      const existing = monthMap.get(monthKey);
      if (existing) {
        monthMap.set(monthKey, {
          label: monthLabel,
          total: existing.total + commPrakashAmt,
        });
      } else {
        monthMap.set(monthKey, { label: monthLabel, total: commPrakashAmt });
      }
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, { label, total }]) => ({
        monthKey,
        monthLabel: label,
        totalCommPrakash: total,
      }));
  }

  const rows = open ? computeRows() : [];
  const grandTotal = rows.reduce((sum, r) => sum + r.totalCommPrakash, 0);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={() => setOpen(true)}
        data-ocid="monthly_profit.open_modal_button"
      >
        <TrendingUp className="h-3.5 w-3.5" />
        Profit
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-sm"
          data-ocid="monthly_profit.dialog"
          aria-describedby="monthly-profit-desc"
        >
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Monthly Profit – Comm Prakash
            </DialogTitle>
            <p
              id="monthly-profit-desc"
              className="text-xs text-muted-foreground"
            >
              Total Comm Prakash commission per month.
            </p>
          </DialogHeader>

          {rows.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No Comm Prakash commission entries yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-border">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="py-1.5 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                      Month
                    </TableHead>
                    <TableHead className="py-1.5 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground text-right">
                      Comm Prakash
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow
                      key={row.monthKey}
                      data-ocid={`monthly_profit.row.${idx + 1}`}
                      className="border-b border-border/50"
                    >
                      <TableCell className="py-1.5 font-medium text-foreground">
                        {row.monthLabel}
                      </TableCell>
                      <TableCell className="py-1.5 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                        {row.totalCommPrakash.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40 hover:bg-muted/40 font-semibold">
                    <TableCell className="py-1.5 text-xs font-bold text-foreground">
                      Total
                    </TableCell>
                    <TableCell className="py-1.5 text-right font-mono tabular-nums text-xs font-bold text-primary">
                      {grandTotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

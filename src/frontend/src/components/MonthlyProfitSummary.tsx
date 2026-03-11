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
import { Trash2, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  deleteProfitMonth,
  getMonthlyProfitRows,
} from "../utils/monthlyProfitStorage";

export function MonthlyProfitButton() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<
    Array<{
      monthKey: string;
      monthLabel: string;
      totalCommPrakash: number;
    }>
  >([]);

  function handleOpen() {
    setRows(getMonthlyProfitRows());
    setOpen(true);
  }

  function handleDelete(monthKey: string) {
    deleteProfitMonth(monthKey);
    setRows(getMonthlyProfitRows());
  }

  const grandTotal = rows.reduce((sum, r) => sum + r.totalCommPrakash, 0);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={handleOpen}
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
              Profit is preserved even if entries are deleted. Use the delete
              button to manually clear a month's record.
            </p>
          </DialogHeader>

          {rows.length === 0 ? (
            <div
              className="py-8 text-center text-xs text-muted-foreground"
              data-ocid="monthly_profit.empty_state"
            >
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
                    <TableHead className="py-1.5 w-8" />
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
                      <TableCell className="py-1 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(row.monthKey)}
                          title={`Delete ${row.monthLabel} profit record`}
                          data-ocid={`monthly_profit.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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
                    <TableCell />
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

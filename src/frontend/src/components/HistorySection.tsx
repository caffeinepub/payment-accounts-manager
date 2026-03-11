import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { HistoryEntry } from "../backend.d";
import { useDeleteHistoryEntry } from "../hooks/useQueries";
import { formatCurrency, formatDate } from "../utils/currency";

interface HistorySectionProps {
  entries: HistoryEntry[];
}

interface ValueChipProps {
  label: string;
  value: string;
  valueClass?: string;
}

function ValueChip({ label, value, valueClass }: ValueChipProps) {
  return (
    <div className="flex flex-col items-start min-w-0">
      <span className="text-[9px] uppercase tracking-wide text-muted-foreground/60 font-medium leading-none mb-0.5">
        {label}
      </span>
      <span
        className={cn(
          "text-[11px] font-mono tabular-nums leading-none font-semibold",
          valueClass ?? "text-muted-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function HistorySection({ entries }: HistorySectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const deleteHistoryEntry = useDeleteHistoryEntry();

  async function handleDelete(id: string, name: string) {
    try {
      await deleteHistoryEntry.mutateAsync(id);
      toast.success(`Removed ${name} from history`);
      setConfirmDeleteId(null);
    } catch {
      toast.error("Failed to delete history entry");
    }
  }

  async function handleDeleteAll() {
    setIsDeletingAll(true);
    try {
      for (const entry of entries) {
        await deleteHistoryEntry.mutateAsync(entry.id);
      }
      toast.success("All history entries deleted");
      setConfirmDeleteAll(false);
    } catch {
      toast.error("Failed to delete all history entries");
    } finally {
      setIsDeletingAll(false);
    }
  }

  return (
    <div className="mt-4 border border-border rounded overflow-hidden">
      {/* Toggle header */}
      <div className="flex items-center bg-muted/50 hover:bg-muted/80 transition-colors">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 flex items-center gap-2 px-3 py-2 text-left"
          data-ocid="history.toggle"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}
          <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-semibold text-foreground">History</span>
          <span className="text-[10px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded font-mono">
            {entries.length}
          </span>
        </button>
        {entries.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 mr-1 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDeleteAll(true);
            }}
            data-ocid="history.delete_all_button"
          >
            <Trash2 className="h-3 w-3" />
            Delete All
          </Button>
        )}
      </div>

      {/* Delete All confirmation dialog */}
      <AlertDialog open={confirmDeleteAll} onOpenChange={setConfirmDeleteAll}>
        <AlertDialogContent data-ocid="history.delete_all.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">
              Delete all history?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will permanently remove all{" "}
              <span className="font-semibold text-foreground">
                {entries.length}
              </span>{" "}
              history entries. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="text-xs h-8"
              data-ocid="history.delete_all.cancel_button"
              disabled={isDeletingAll}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="text-xs h-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleDeleteAll}
              data-ocid="history.delete_all.confirm_button"
              disabled={isDeletingAll}
            >
              {isDeletingAll ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Expanded content */}
      {expanded && (
        <div className="divide-y divide-border/50">
          {entries.length === 0 ? (
            <div className="py-8 text-center" data-ocid="history.empty_state">
              <p className="text-xs text-muted-foreground">No history yet</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Entries marked as paid will appear here
              </p>
            </div>
          ) : (
            entries.map((entry, idx) => {
              const rowIndex = idx + 1;
              const advanceNum = Number(entry.advance) / 100;
              const totalNum = Number(entry.totalAmount) / 100;
              const balance = totalNum - advanceNum;
              const commNum = Number(entry.commission) / 100;
              const isConfirmingDelete = confirmDeleteId === entry.id;

              return (
                <div
                  key={entry.id}
                  data-ocid={`history.row.${rowIndex}`}
                  className="px-3 py-2 bg-success/5 hover:bg-success/8 transition-colors"
                >
                  {/* Line 1: Name · Mobile · Date paid · Delete */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className="text-sm font-semibold text-foreground truncate max-w-[120px] sm:max-w-[180px]"
                        title={entry.name}
                      >
                        {entry.name}
                      </span>
                      <span className="text-[9px] text-muted-foreground/60 font-mono whitespace-nowrap flex-shrink-0">
                        {formatDate(entry.dateCreated)}
                      </span>
                    </div>

                    <span className="hidden sm:block text-[11px] font-mono text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {entry.mobileNumber}
                    </span>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[9px] text-success font-mono whitespace-nowrap">
                        Paid: {formatDate(entry.datePaid)}
                      </span>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-destructive">
                            Sure?
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-8 text-[10px] text-destructive hover:bg-destructive/10 font-semibold"
                            onClick={() => handleDelete(entry.id, entry.name)}
                            disabled={deleteHistoryEntry.isPending}
                            data-ocid={`history.confirm_button.${rowIndex}`}
                          >
                            Yes
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-8 text-[10px] text-muted-foreground hover:bg-muted font-semibold"
                            onClick={() => setConfirmDeleteId(null)}
                            data-ocid={`history.cancel_button.${rowIndex}`}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirmDeleteId(entry.id)}
                          data-ocid={`history.delete_button.${rowIndex}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Mobile on small screens */}
                  <div className="sm:hidden text-[10px] font-mono text-muted-foreground mt-0.5 mb-1">
                    {entry.mobileNumber}
                  </div>

                  {/* Line 2: Data chips */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                    <ValueChip
                      label="Amount"
                      value={formatCurrency(entry.amount)}
                    />
                    <ValueChip
                      label="Comm"
                      value={commNum > 0 ? commNum.toFixed(2) : "—"}
                      valueClass="text-primary"
                    />
                    <ValueChip
                      label="Total"
                      value={formatCurrency(entry.totalAmount)}
                      valueClass="text-foreground font-bold"
                    />
                    <ValueChip
                      label="Advance"
                      value={advanceNum > 0 ? advanceNum.toFixed(2) : "—"}
                      valueClass="text-warning"
                    />
                    <ValueChip
                      label="Balance"
                      value={
                        balance > 0
                          ? balance.toFixed(2)
                          : balance < 0
                            ? balance.toFixed(2)
                            : "0.00"
                      }
                      valueClass={
                        balance < 0
                          ? "text-destructive"
                          : balance > 0
                            ? "text-success"
                            : "text-muted-foreground"
                      }
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

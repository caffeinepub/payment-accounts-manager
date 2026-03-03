import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Edit2, MessageCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Entry } from "../backend.d";
import { useDeleteEntry } from "../hooks/useQueries";
import {
  buildWhatsAppUrl,
  formatCurrency,
  formatDate,
  isOverdue,
} from "../utils/currency";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { EntryFormDialog } from "./EntryFormDialog";

interface EntryTableProps {
  entries: Entry[];
  isLoading: boolean;
  search: string;
}

export function EntryTable({ entries, isLoading, search }: EntryTableProps) {
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const deleteEntry = useDeleteEntry();

  // Filter entries by search
  const filtered = entries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.mobileNumber.toLowerCase().includes(q) ||
      formatCurrency(e.amount).includes(q) ||
      formatCurrency(e.totalAmount).includes(q)
    );
  });

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEntry.mutateAsync(deleteTarget.id);
      toast.success(`Deleted ${deleteTarget.name}'s entry`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete entry");
    }
  }

  if (isLoading) {
    return (
      <div
        className="border border-border rounded overflow-hidden"
        data-ocid="entry.table"
      >
        <div className="bg-muted/50 px-3 py-2 border-b border-border">
          <div className="grid grid-cols-7 gap-4">
            {[
              "Name",
              "Mobile No",
              "Amount",
              "Commission",
              "Total Amt",
              "Paid",
              "Actions",
            ].map((h) => (
              <Skeleton key={h} className="h-3 w-full" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-border">
          {["r1", "r2", "r3", "r4", "r5"].map((rowKey) => (
            <div key={rowKey} className="px-3 py-2">
              <div className="grid grid-cols-7 gap-4">
                {["c1", "c2", "c3", "c4", "c5", "c6", "c7"].map((colKey) => (
                  <Skeleton key={colKey} className="h-3 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <Table
            className="compact-table text-xs w-full min-w-[640px]"
            data-ocid="entry.table"
          >
            <TableHeader className="sticky top-0 z-10 sticky-shadow">
              <TableRow className="bg-muted/70 hover:bg-muted/70">
                <TableHead className="py-2 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground w-[18%]">
                  Name
                </TableHead>
                <TableHead className="py-2 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground w-[16%]">
                  Mobile No
                </TableHead>
                <TableHead className="py-2 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground text-right w-[13%]">
                  Amount
                </TableHead>
                <TableHead className="py-2 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground text-right w-[13%]">
                  Commission
                </TableHead>
                <TableHead className="py-2 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground text-right w-[13%]">
                  Total Amt
                </TableHead>
                <TableHead className="py-2 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground w-[10%]">
                  Paid
                </TableHead>
                <TableHead className="py-2 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground w-[100px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center"
                    data-ocid="entry.empty_state"
                  >
                    <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                      <div className="text-sm font-medium">
                        {search ? "No matching entries" : "No entries yet"}
                      </div>
                      <div className="text-xs opacity-70">
                        {search
                          ? "Try a different search term"
                          : 'Click "Add Entry" to create your first entry'}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((entry, idx) => {
                const overdue = isOverdue(entry.paid, entry.dateCreated);
                const rowIndex = idx + 1;

                return (
                  <TableRow
                    key={entry.id}
                    data-ocid={`entry.row.${rowIndex}`}
                    className={cn(
                      "border-b border-border/50 transition-colors",
                      entry.paid
                        ? "row-paid"
                        : overdue
                          ? "row-overdue"
                          : "row-normal",
                    )}
                  >
                    {/* Name */}
                    <TableCell className="py-1 font-medium text-foreground">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="truncate max-w-[110px]"
                          title={entry.name}
                        >
                          {entry.name}
                        </span>
                        {overdue && (
                          <span className="inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold uppercase bg-[oklch(0.75_0.14_28/0.2)] text-[oklch(0.45_0.18_28)] border border-[oklch(0.75_0.14_28/0.4)] whitespace-nowrap flex-shrink-0">
                            URGENT
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-muted-foreground opacity-60 mt-0.5">
                        {formatDate(entry.dateCreated)}
                      </div>
                    </TableCell>

                    {/* Mobile */}
                    <TableCell className="py-1 font-mono text-muted-foreground">
                      {entry.mobileNumber}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="py-1 text-right font-mono tabular-nums">
                      {formatCurrency(entry.amount)}
                    </TableCell>

                    {/* Commission */}
                    <TableCell className="py-1 text-right font-mono tabular-nums text-muted-foreground">
                      {formatCurrency(entry.commission)}
                    </TableCell>

                    {/* Total */}
                    <TableCell className="py-1 text-right font-mono tabular-nums font-semibold">
                      {formatCurrency(entry.totalAmount)}
                    </TableCell>

                    {/* Paid badge */}
                    <TableCell className="py-1">
                      {entry.paid ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 border-[oklch(0.55_0.15_145/0.4)] text-[oklch(0.4_0.14_145)] bg-[oklch(0.95_0.05_145/0.5)]"
                        >
                          Yes
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4",
                            overdue
                              ? "border-[oklch(0.75_0.14_28/0.5)] text-[oklch(0.45_0.18_28)] bg-[oklch(0.97_0.03_28/0.5)]"
                              : "border-border text-muted-foreground bg-transparent",
                          )}
                        >
                          No
                        </Badge>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-1">
                      <div className="flex items-center gap-0.5">
                        {/* Edit */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-accent"
                              onClick={() => setEditEntry(entry)}
                              data-ocid={`entry.edit_button.${rowIndex}`}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Edit
                          </TooltipContent>
                        </Tooltip>

                        {/* Delete */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(entry)}
                              data-ocid={`entry.delete_button.${rowIndex}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Delete
                          </TooltipContent>
                        </Tooltip>

                        {/* WhatsApp */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-[oklch(0.5_0.18_145)] hover:bg-[oklch(0.95_0.05_145/0.5)]"
                              asChild
                              data-ocid={`entry.whatsapp_button.${rowIndex}`}
                            >
                              <a
                                href={buildWhatsAppUrl(
                                  entry.mobileNumber,
                                  entry.name,
                                  entry.totalAmount,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageCircle className="h-3 w-3" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Send WhatsApp reminder
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit modal */}
      <EntryFormDialog
        open={!!editEntry}
        onOpenChange={(open) => !open && setEditEntry(null)}
        editEntry={editEntry}
      />

      {/* Delete confirm */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        entryName={deleteTarget?.name ?? ""}
        onConfirm={handleConfirmDelete}
        isPending={deleteEntry.isPending}
      />
    </TooltipProvider>
  );
}

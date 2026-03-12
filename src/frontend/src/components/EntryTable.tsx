import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  MessageCircle,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Entry } from "../backend.d";
import { useDeleteEntry, useMoveEntryToHistory } from "../hooks/useQueries";
import {
  buildWhatsAppUrl,
  formatCurrency,
  formatDate,
  isOverdue,
} from "../utils/currency";
import { AdvancePaymentDialog } from "./AdvancePaymentDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { EntryFormDialog } from "./EntryFormDialog";
import { PaidConfirmDialog } from "./PaidConfirmDialog";

interface EntryTableProps {
  entries: Entry[];
  isLoading: boolean;
  search: string;
}

interface ValueChipProps {
  label: string;
  value: string;
  valueClass?: string;
}

function ValueChip({ label, value, valueClass }: ValueChipProps) {
  return (
    <div className="flex flex-col items-start min-w-0">
      <span className="text-[9px] uppercase tracking-wide text-muted-foreground/70 font-medium leading-none mb-0.5">
        {label}
      </span>
      <span
        className={cn(
          "text-[11px] font-mono tabular-nums leading-none font-semibold",
          valueClass ?? "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Returns the raw balance (may be negative for advance-only entries) */
function getEntryBalance(entry: Entry): number {
  const totalNum = Number(entry.totalAmount) / 100;
  const advNum = Number(entry.advance) / 100;
  return totalNum - advNum;
}

/** True when an entry is a pure advance-payment record (amount=0, advance>0) */
function isAdvanceOnlyEntry(entry: Entry): boolean {
  return Number(entry.totalAmount) === 0 && Number(entry.advance) > 0;
}

/** Single row in payment history dropdown */
function HistoryRow({ entry }: { entry: Entry }) {
  const rawBalance = getEntryBalance(entry);
  const totalNum = Number(entry.totalAmount) / 100;
  const advNum = Number(entry.advance) / 100;
  const isAdvOnly = isAdvanceOnlyEntry(entry);
  // For advance-only entries, display balance as 0
  const displayBal = isAdvOnly ? 0 : rawBalance;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-1.5 px-2 border-b last:border-b-0 border-border/40">
      <span className="text-[9px] font-mono text-muted-foreground/60 whitespace-nowrap">
        {formatDate(entry.dateCreated)}
      </span>
      {isAdvOnly && (
        <span className="text-[8px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-1 py-0.5 rounded">
          ADV PAID
        </span>
      )}
      <ValueChip label="Amt" value={totalNum.toFixed(2)} />
      <ValueChip
        label="Adv"
        value={advNum > 0 ? advNum.toFixed(2) : "—"}
        valueClass="text-warning"
      />
      <ValueChip
        label="Bal"
        value={displayBal.toFixed(2)}
        valueClass={
          displayBal < 0
            ? "text-destructive"
            : displayBal > 0
              ? "text-amber-600"
              : "text-success"
        }
      />
    </div>
  );
}

interface DeleteTarget {
  entry: Entry;
  group: Entry[];
}

interface AdvanceTarget {
  entry: Entry;
  totalBalance: number;
}

/** Renders one logical person group (latest entry + optional history dropdown) */
function EntryGroup({
  group,
  groupIndex,
  onEdit,
  onDelete,
  onPaid,
  onAdvance,
}: {
  group: Entry[];
  groupIndex: number;
  onEdit: (e: Entry) => void;
  onDelete: (target: DeleteTarget) => void;
  onPaid: (e: Entry) => void;
  onAdvance: (target: AdvanceTarget) => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);

  // Latest entry is last (sorted ascending by date)
  const latest = group[group.length - 1];
  const older = group.slice(0, group.length - 1);
  const hasHistory = older.length > 0;

  const overdue = isOverdue(latest.paid, latest.dateCreated);
  const rowIndex = groupIndex + 1;

  const rawBalance = getEntryBalance(latest);
  const totalNum = Number(latest.totalAmount) / 100;
  const advNum = Number(latest.advance) / 100;
  const isLatestAdvOnly = isAdvanceOnlyEntry(latest);

  // Display balance: 0 for advance-only entries (they carry no new debt)
  const displayBalance = isLatestAdvOnly ? 0 : rawBalance;

  // Total balance across all entries in group (uses raw balances so advance-only
  // entries correctly reduce the running total: rawBalance = -Y for advance-only)
  const totalGroupBalance = hasHistory
    ? rawBalance + older.reduce((sum, e) => sum + getEntryBalance(e), 0)
    : null;

  // Outstanding balance to pass to advance dialog
  const outstandingForAdvance =
    totalGroupBalance !== null ? totalGroupBalance : displayBalance;

  return (
    <div
      data-ocid={`entry.row.${rowIndex}`}
      className={cn(
        "border rounded transition-colors overflow-hidden",
        latest.paid
          ? "border-success/30 bg-success/5"
          : overdue
            ? "border-warning/40 bg-warning/5"
            : "border-border bg-card",
      )}
    >
      <div className="px-3 py-2">
        {/* ── Line 1: Name · Mobile · Actions ── */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span
              className="text-sm font-semibold text-foreground truncate max-w-[120px] sm:max-w-[180px]"
              title={latest.name}
            >
              {latest.name}
            </span>
            {isLatestAdvOnly && (
              <Badge
                variant="outline"
                className="text-[8px] px-1 py-0 h-4 border-primary/40 text-primary bg-primary/10 font-bold uppercase whitespace-nowrap flex-shrink-0"
              >
                ADV PAID
              </Badge>
            )}
            {overdue && !isLatestAdvOnly && (
              <Badge
                variant="outline"
                className="text-[8px] px-1 py-0 h-4 border-warning/60 text-warning bg-warning/10 font-bold uppercase whitespace-nowrap flex-shrink-0"
              >
                URGENT
              </Badge>
            )}
            {latest.paid && (
              <Badge
                variant="outline"
                className="text-[8px] px-1 py-0 h-4 border-success/50 text-success bg-success/10 font-bold uppercase whitespace-nowrap flex-shrink-0"
              >
                PAID
              </Badge>
            )}
            <span className="text-[9px] text-muted-foreground/60 font-mono whitespace-nowrap flex-shrink-0">
              {formatDate(latest.dateCreated)}
            </span>
          </div>

          <span className="hidden sm:block text-[11px] font-mono text-muted-foreground whitespace-nowrap flex-shrink-0">
            {latest.mobileNumber}
          </span>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  asChild
                  data-ocid={`entry.call_button.${rowIndex}`}
                >
                  <a href={`tel:${latest.mobileNumber}`}>
                    <Phone className="h-3 w-3" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Call
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-success hover:bg-success/10"
                  asChild
                  data-ocid={`entry.whatsapp_button.${rowIndex}`}
                >
                  <a
                    href={buildWhatsAppUrl(
                      latest.mobileNumber,
                      latest.name,
                      latest.totalAmount,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-3 w-3" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                WhatsApp
              </TooltipContent>
            </Tooltip>

            {/* + Advance Payment button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={() =>
                    onAdvance({
                      entry: latest,
                      totalBalance: outstandingForAdvance,
                    })
                  }
                  data-ocid={`entry.advance_button.${rowIndex}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Record Advance Payment
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={() => onEdit(latest)}
                  data-ocid={`entry.edit_button.${rowIndex}`}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Edit
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete({ entry: latest, group })}
                  data-ocid={`entry.delete_button.${rowIndex}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Delete
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Mobile (small screens) */}
        <div className="sm:hidden text-[10px] font-mono text-muted-foreground mt-0.5 mb-1">
          {latest.mobileNumber}
        </div>

        {/* ── Line 2: Data chips + Total Bal chip + Paid/Unpaid dropdown ── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
          <ValueChip label="Amount" value={totalNum.toFixed(2)} />
          <ValueChip
            label="Advance"
            value={advNum > 0 ? advNum.toFixed(2) : "—"}
            valueClass="text-warning"
          />
          <ValueChip
            label="Balance"
            value={displayBalance.toFixed(2)}
            valueClass={
              displayBalance < 0
                ? "text-destructive"
                : displayBalance > 0
                  ? "text-amber-600"
                  : "text-success"
            }
          />

          {/* Total Bal chip: sum across all entries for this person */}
          {totalGroupBalance !== null && (
            <>
              <div className="w-px h-5 bg-border/60 self-center" />
              <ValueChip
                label="Total Bal"
                value={totalGroupBalance.toFixed(2)}
                valueClass={
                  totalGroupBalance < 0
                    ? "text-destructive"
                    : totalGroupBalance === 0
                      ? "text-success"
                      : "text-primary font-bold"
                }
              />
            </>
          )}

          {/* Paid/Unpaid Select */}
          <div className="ml-auto flex-shrink-0">
            <Select
              value={latest.paid ? "paid" : "unpaid"}
              onValueChange={(val) => {
                if (val === "paid" && !latest.paid) {
                  onPaid(latest);
                }
              }}
            >
              <SelectTrigger
                className={cn(
                  "h-7 text-xs px-2 w-[88px] font-semibold",
                  latest.paid
                    ? "border-success/50 text-success bg-success/10"
                    : overdue
                      ? "border-warning/50 text-warning bg-warning/10"
                      : "border-border text-muted-foreground",
                )}
                data-ocid={`entry.select.${rowIndex}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="unpaid"
                  className="text-xs"
                  data-ocid={`entry.unpaid_option.${rowIndex}`}
                >
                  Unpaid
                </SelectItem>
                <SelectItem
                  value="paid"
                  className="text-xs"
                  data-ocid={`entry.paid_option.${rowIndex}`}
                >
                  Paid
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payment History toggle button */}
        {hasHistory && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setHistoryOpen((prev) => !prev)}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
              data-ocid={`entry.history_toggle.${rowIndex}`}
            >
              {historyOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              Payment History ({older.length})
            </button>
          </div>
        )}
      </div>

      {/* History rows — newest at top, oldest at bottom */}
      {hasHistory && historyOpen && (
        <div className="border-t border-border/40 bg-muted/20">
          {[...older].reverse().map((e) => (
            <HistoryRow key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}

export function EntryTable({ entries, isLoading, search }: EntryTableProps) {
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [paidTarget, setPaidTarget] = useState<Entry | null>(null);
  const [advanceTarget, setAdvanceTarget] = useState<AdvanceTarget | null>(
    null,
  );
  const deleteEntry = useDeleteEntry();
  const moveToHistory = useMoveEntryToHistory();

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

  // Group filtered entries by name (lowercase)
  const groupMap: Map<string, Entry[]> = new Map();
  for (const e of filtered) {
    const key = e.name.trim().toLowerCase();
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(e);
  }
  // Sort each group by dateCreated ascending
  for (const group of groupMap.values()) {
    group.sort((a, b) =>
      a.dateCreated < b.dateCreated
        ? -1
        : a.dateCreated > b.dateCreated
          ? 1
          : 0,
    );
  }
  // Flatten groups ordered by the latest entry's date descending (newest person first)
  const groups: Entry[][] = Array.from(groupMap.values()).sort((a, b) => {
    const aLatest = a[a.length - 1].dateCreated;
    const bLatest = b[b.length - 1].dateCreated;
    return bLatest < aLatest ? -1 : bLatest > aLatest ? 1 : 0;
  });

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEntry.mutateAsync(deleteTarget.entry.id);
      toast.success(`Deleted ${deleteTarget.entry.name}'s entry`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete entry");
    }
  }

  async function handleConfirmDeleteAll() {
    if (!deleteTarget) return;
    const { entry, group } = deleteTarget;
    try {
      for (const e of group) {
        await deleteEntry.mutateAsync(e.id);
      }
      toast.success(`Deleted all ${group.length} entries for ${entry.name}`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete all entries");
    }
  }

  async function handleConfirmPaid() {
    if (!paidTarget) return;
    try {
      await moveToHistory.mutateAsync(paidTarget.id);
      toast.success(`${paidTarget.name}'s entry moved to history`);
      setPaidTarget(null);
    } catch {
      toast.error("Failed to move entry to history");
    }
  }

  const deleteHistoryCount = deleteTarget ? deleteTarget.group.length - 1 : 0;

  if (isLoading) {
    return (
      <div className="space-y-1.5" data-ocid="entry.table">
        {["s1", "s2", "s3", "s4", "s5"].map((k) => (
          <div
            key={k}
            className="border border-border rounded px-3 py-2 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-20" />
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-6 w-6 rounded" />
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-7 w-14 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div
        className="border border-border rounded py-10 text-center"
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
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-1.5" data-ocid="entry.table">
        {groups.map((group, idx) => (
          <EntryGroup
            key={group[group.length - 1].id}
            group={group}
            groupIndex={idx}
            onEdit={setEditEntry}
            onDelete={setDeleteTarget}
            onPaid={setPaidTarget}
            onAdvance={setAdvanceTarget}
          />
        ))}
      </div>

      {/* Edit modal */}
      <EntryFormDialog
        open={!!editEntry}
        onOpenChange={(open) => !open && setEditEntry(null)}
        editEntry={editEntry}
      />

      {/* Advance payment modal — creates new entry with amount=0, advance=paid */}
      <AdvancePaymentDialog
        open={!!advanceTarget}
        onOpenChange={(open) => !open && setAdvanceTarget(null)}
        entry={advanceTarget?.entry ?? null}
        totalBalance={advanceTarget?.totalBalance ?? 0}
      />

      {/* Delete confirm */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        entryName={deleteTarget?.entry.name ?? ""}
        onConfirm={handleConfirmDelete}
        onConfirmAll={handleConfirmDeleteAll}
        historyCount={deleteHistoryCount}
        isPending={deleteEntry.isPending}
      />

      {/* Paid confirm → move to history */}
      <PaidConfirmDialog
        open={!!paidTarget}
        onOpenChange={(open) => {
          if (!open) setPaidTarget(null);
        }}
        entryName={paidTarget?.name ?? ""}
        balance={(() => {
          if (!paidTarget) return 0;
          const totalNum = Number(paidTarget.totalAmount) / 100;
          const advNum = Number(paidTarget.advance) / 100;
          return Math.max(0, totalNum - advNum);
        })()}
        isPending={moveToHistory.isPending}
        onConfirm={handleConfirmPaid}
      />
    </TooltipProvider>
  );
}

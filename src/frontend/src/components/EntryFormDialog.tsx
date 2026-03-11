import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BookUser, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Entry } from "../backend.d";
import { useCreateEntry, useUpdateEntry } from "../hooks/useQueries";
import {
  getCommissionSplit,
  setCommissionSplit,
} from "../utils/commissionSplitStorage";
import { fromCurrencyBigInt, toCurrencyBigInt } from "../utils/currency";

interface EntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEntry?: Entry | null;
  prefillData?: {
    name: string;
    mobileNumber: string;
    amount: string;
  };
  onSaved?: () => void;
}

interface FormState {
  name: string;
  mobileNumber: string;
  amount: string;
  advance: string;
  paid: boolean;
}

const DEFAULT_FORM: FormState = {
  name: "",
  mobileNumber: "+91",
  amount: "",
  advance: "",
  paid: false,
};

// Extend Navigator type to include contacts API
interface ContactsManager {
  select(
    properties: string[],
    options?: { multiple?: boolean },
  ): Promise<Array<{ name?: string[]; tel?: string[] }>>;
  getProperties(): Promise<string[]>;
}

declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }
}

export function EntryFormDialog({
  open,
  onOpenChange,
  editEntry,
  prefillData,
  onSaved,
}: EntryFormDialogProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();

  const isEditing = !!editEntry;
  const isPrefill = !!prefillData && !isEditing;
  const isPending = createEntry.isPending || updateEntry.isPending;

  // Populate form when editing or prefilling
  useEffect(() => {
    if (open) {
      if (editEntry) {
        const split = getCommissionSplit(editEntry.id);
        setForm({
          name: editEntry.name,
          mobileNumber: editEntry.mobileNumber,
          amount: fromCurrencyBigInt(editEntry.amount),
          advance: split.advance || fromCurrencyBigInt(editEntry.advance),
          paid: editEntry.paid,
        });
      } else if (prefillData) {
        setForm({
          ...DEFAULT_FORM,
          name: prefillData.name,
          mobileNumber: prefillData.mobileNumber,
          amount: prefillData.amount,
        });
      } else {
        setForm({ ...DEFAULT_FORM });
      }
    }
  }, [open, editEntry, prefillData]);

  const amountNum = Number.parseFloat(form.amount) || 0;
  const advanceNum = Number.parseFloat(form.advance) || 0;
  const newBalance = Math.max(0, amountNum - advanceNum);
  const balanceDisplay = newBalance.toFixed(2);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePickFromPhonebook() {
    if (!navigator.contacts) {
      toast.error("Phonebook not supported on this browser");
      return;
    }
    try {
      const results = await navigator.contacts.select(["name", "tel"], {
        multiple: false,
      });
      if (results.length > 0) {
        const contact = results[0];
        if (contact.name?.[0]) {
          update("name", contact.name[0]);
        }
        if (contact.tel?.[0]) {
          const rawTel = contact.tel[0].replace(/\D/g, "");
          const cleaned =
            rawTel.length === 12 && rawTel.startsWith("91")
              ? rawTel.slice(2)
              : rawTel;
          update("mobileNumber", `+91${cleaned}`);
        }
      }
    } catch {
      toast.error("Could not access phonebook");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const amountBigInt = toCurrencyBigInt(form.amount || "0");
    const advanceBigInt = toCurrencyBigInt(form.advance || "0");

    try {
      if (isEditing && editEntry) {
        await updateEntry.mutateAsync({
          id: editEntry.id,
          name: form.name.trim(),
          mobileNumber: form.mobileNumber.trim(),
          amount: amountBigInt,
          commission: BigInt(0),
          paid: form.paid,
          advance: advanceBigInt,
        });
        setCommissionSplit(editEntry.id, {
          commPrakash: "0",
          commOthers: "0",
          advance: form.advance,
        });
        onSaved?.();
        toast.success("Entry updated");
      } else {
        const newId = await createEntry.mutateAsync({
          name: form.name.trim(),
          mobileNumber: form.mobileNumber.trim(),
          amount: amountBigInt,
          commission: BigInt(0),
          advance: advanceBigInt,
        });
        setCommissionSplit(newId, {
          commPrakash: "0",
          commOthers: "0",
          advance: form.advance,
        });
        onSaved?.();
        toast.success("Entry created");
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save entry. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm"
        data-ocid="entry_form.dialog"
        aria-describedby="entry-form-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {isEditing
              ? "Edit Entry"
              : isPrefill
                ? "Record Advance Payment"
                : "Add New Entry"}
          </DialogTitle>
          <p id="entry-form-desc" className="text-xs text-muted-foreground">
            {isEditing
              ? "Update the entry details below."
              : isPrefill
                ? `Outstanding balance: ₹${amountNum.toFixed(2)}. Enter the advance paid to record new balance.`
                : "Fill in the details for the new payment entry."}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-1">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="entry-name" className="text-xs font-medium">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="entry-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Customer name"
              className="h-8 text-xs"
              data-ocid="entry_form.name.input"
              required
              readOnly={isPrefill}
            />
          </div>

          {/* Mobile */}
          <div className="space-y-1">
            <Label htmlFor="entry-mobile" className="text-xs font-medium">
              Mobile Number
            </Label>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center flex-1">
                <div className="h-8 px-2.5 flex items-center bg-muted border border-border rounded-l text-xs font-mono font-semibold text-foreground select-none whitespace-nowrap border-r-0">
                  +91
                </div>
                <Input
                  id="entry-mobile"
                  value={form.mobileNumber.replace(/^\+91/, "")}
                  onChange={(e) =>
                    update(
                      "mobileNumber",
                      `+91${e.target.value.replace(/^\+91/, "")}`,
                    )
                  }
                  placeholder="9876543210"
                  className="h-8 text-xs font-mono rounded-l-none"
                  data-ocid="entry_form.mobile.input"
                  readOnly={isPrefill}
                />
              </div>
              {!isPrefill && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={handlePickFromPhonebook}
                  title="Add from phonebook"
                  data-ocid="entry_form.phonebook.button"
                >
                  <BookUser className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="entry-amount" className="text-xs font-medium">
              {isPrefill ? "Outstanding Balance (Total Due)" : "Amount"}
            </Label>
            <Input
              id="entry-amount"
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              placeholder="0.00"
              className="h-8 text-xs font-mono"
              data-ocid="entry_form.amount.input"
              readOnly={isPrefill}
            />
          </div>

          {/* Advance */}
          <div className="space-y-1">
            <Label htmlFor="entry-advance" className="text-xs font-medium">
              {isPrefill ? "Advance Paid Now" : "Advance"}
            </Label>
            <Input
              id="entry-advance"
              type="number"
              step="0.01"
              min="0"
              value={form.advance}
              onChange={(e) => update("advance", e.target.value)}
              placeholder="0.00"
              className="h-8 text-xs font-mono"
              data-ocid="entry_form.advance.input"
              autoFocus={isPrefill}
            />
          </div>

          {/* Balance (read-only, auto-calculated) */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">
              {isPrefill
                ? "New Balance After Payment"
                : "Balance (Amount − Advance)"}
            </Label>
            <div className="h-8 px-3 flex items-center bg-muted rounded border border-border">
              <span
                className={`text-xs font-mono font-semibold tabular-nums ${
                  newBalance === 0 ? "text-success" : "text-warning"
                }`}
              >
                {balanceDisplay}
              </span>
              {newBalance === 0 && (
                <span className="ml-2 text-[10px] text-success font-semibold">
                  ✓ Fully Paid
                </span>
              )}
            </div>
          </div>

          {/* Paid toggle (only for edit mode) */}
          {isEditing && (
            <div className="flex items-center justify-between py-1">
              <Label
                htmlFor="entry-paid"
                className="text-xs font-medium cursor-pointer"
              >
                Paid
              </Label>
              <Switch
                id="entry-paid"
                checked={form.paid}
                onCheckedChange={(checked) => update("paid", checked)}
                data-ocid="entry_form.paid.switch"
              />
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              data-ocid="entry_form.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              data-ocid="entry_form.submit_button"
            >
              {isPending && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Update"
                  : isPrefill
                    ? "Record Payment"
                    : "Add Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

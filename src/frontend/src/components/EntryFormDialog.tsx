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
  onSaved?: () => void;
}

interface FormState {
  name: string;
  mobileNumber: string;
  amount: string;
  commPrakash: string;
  commOthers: string;
  paid: boolean;
}

const DEFAULT_FORM: FormState = {
  name: "",
  mobileNumber: "+91",
  amount: "",
  commPrakash: "",
  commOthers: "",
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
  onSaved,
}: EntryFormDialogProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();

  const isEditing = !!editEntry;
  const isPending = createEntry.isPending || updateEntry.isPending;

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (editEntry) {
        const split = getCommissionSplit(editEntry.id);
        setForm({
          name: editEntry.name,
          mobileNumber: editEntry.mobileNumber,
          amount: fromCurrencyBigInt(editEntry.amount),
          commPrakash: split.commPrakash,
          commOthers: split.commOthers,
          paid: editEntry.paid,
        });
      } else {
        setForm({ ...DEFAULT_FORM });
      }
    }
  }, [open, editEntry]);

  const amountNum = Number.parseFloat(form.amount) || 0;
  const commPrakashNum = Number.parseFloat(form.commPrakash) || 0;
  const commOthersNum = Number.parseFloat(form.commOthers) || 0;
  const totalDisplay = (amountNum + commPrakashNum + commOthersNum).toFixed(2);

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

    const combinedCommission = toCurrencyBigInt(
      (commPrakashNum + commOthersNum).toFixed(2),
    );
    const amountBigInt = toCurrencyBigInt(form.amount || "0");

    try {
      if (isEditing && editEntry) {
        await updateEntry.mutateAsync({
          id: editEntry.id,
          name: form.name.trim(),
          mobileNumber: form.mobileNumber.trim(),
          amount: amountBigInt,
          commission: combinedCommission,
          paid: form.paid,
        });
        setCommissionSplit(editEntry.id, {
          commPrakash: form.commPrakash,
          commOthers: form.commOthers,
        });
        onSaved?.();
        toast.success("Entry updated");
      } else {
        const newId = await createEntry.mutateAsync({
          name: form.name.trim(),
          mobileNumber: form.mobileNumber.trim(),
          amount: amountBigInt,
          commission: combinedCommission,
        });
        setCommissionSplit(newId, {
          commPrakash: form.commPrakash,
          commOthers: form.commOthers,
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
            {isEditing ? "Edit Entry" : "Add New Entry"}
          </DialogTitle>
          <p id="entry-form-desc" className="text-xs text-muted-foreground">
            {isEditing
              ? "Update the entry details below."
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
                />
              </div>
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
            </div>
          </div>

          {/* Amount (full width) */}
          <div className="space-y-1">
            <Label htmlFor="entry-amount" className="text-xs font-medium">
              Amount
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
            />
          </div>

          {/* Comm Prakash & Comm Others side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label
                htmlFor="entry-comm-prakash"
                className="text-xs font-medium"
              >
                Comm Prakash
              </Label>
              <Input
                id="entry-comm-prakash"
                type="number"
                step="0.01"
                min="0"
                value={form.commPrakash}
                onChange={(e) => update("commPrakash", e.target.value)}
                placeholder="0.00"
                className="h-8 text-xs font-mono"
                data-ocid="entry_form.comm_prakash.input"
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="entry-comm-others"
                className="text-xs font-medium"
              >
                Comm Others
              </Label>
              <Input
                id="entry-comm-others"
                type="number"
                step="0.01"
                min="0"
                value={form.commOthers}
                onChange={(e) => update("commOthers", e.target.value)}
                placeholder="0.00"
                className="h-8 text-xs font-mono"
                data-ocid="entry_form.comm_others.input"
              />
            </div>
          </div>

          {/* Total (read-only, auto-calculated) */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">
              Total (auto-calculated)
            </Label>
            <div className="h-8 px-3 flex items-center bg-muted rounded border border-border">
              <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
                {totalDisplay}
              </span>
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
              {isPending ? "Saving..." : isEditing ? "Update" : "Add Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

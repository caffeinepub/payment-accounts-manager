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
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Entry } from "../backend.d";
import { useCreateEntry, useUpdateEntry } from "../hooks/useQueries";
import { fromCurrencyBigInt, toCurrencyBigInt } from "../utils/currency";

interface EntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEntry?: Entry | null;
}

interface FormState {
  name: string;
  mobileNumber: string;
  amount: string;
  commission: string;
  paid: boolean;
}

const DEFAULT_FORM: FormState = {
  name: "",
  mobileNumber: "+91",
  amount: "",
  commission: "",
  paid: false,
};

export function EntryFormDialog({
  open,
  onOpenChange,
  editEntry,
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
        setForm({
          name: editEntry.name,
          mobileNumber: editEntry.mobileNumber,
          amount: fromCurrencyBigInt(editEntry.amount),
          commission: fromCurrencyBigInt(editEntry.commission),
          paid: editEntry.paid,
        });
      } else {
        setForm(DEFAULT_FORM);
      }
    }
  }, [open, editEntry]);

  const amountNum = Number.parseFloat(form.amount) || 0;
  const commissionNum = Number.parseFloat(form.commission) || 0;
  const totalDisplay = (amountNum + commissionNum).toFixed(2);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.mobileNumber.trim()) {
      toast.error("Name and Mobile Number are required");
      return;
    }

    const amountBigInt = toCurrencyBigInt(form.amount);
    const commissionBigInt = toCurrencyBigInt(form.commission);

    try {
      if (isEditing && editEntry) {
        await updateEntry.mutateAsync({
          id: editEntry.id,
          name: form.name.trim(),
          mobileNumber: form.mobileNumber.trim(),
          amount: amountBigInt,
          commission: commissionBigInt,
          paid: form.paid,
        });
        toast.success("Entry updated");
      } else {
        await createEntry.mutateAsync({
          name: form.name.trim(),
          mobileNumber: form.mobileNumber.trim(),
          amount: amountBigInt,
          commission: commissionBigInt,
        });
        toast.success("Entry created");
      }
      onOpenChange(false);
    } catch {
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
              Mobile Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="entry-mobile"
              value={form.mobileNumber}
              onChange={(e) => update("mobileNumber", e.target.value)}
              placeholder="+1234567890"
              className="h-8 text-xs font-mono"
              data-ocid="entry_form.mobile.input"
              required
            />
          </div>

          {/* Amount & Commission side by side */}
          <div className="grid grid-cols-2 gap-2">
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
            <div className="space-y-1">
              <Label htmlFor="entry-commission" className="text-xs font-medium">
                Commission
              </Label>
              <Input
                id="entry-commission"
                type="number"
                step="0.01"
                min="0"
                value={form.commission}
                onChange={(e) => update("commission", e.target.value)}
                placeholder="0.00"
                className="h-8 text-xs font-mono"
                data-ocid="entry_form.commission.input"
              />
            </div>
          </div>

          {/* Total (read-only) */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">
              Total Amount (auto-calculated)
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

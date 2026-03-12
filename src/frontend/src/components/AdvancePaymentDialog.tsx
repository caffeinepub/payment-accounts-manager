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
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Entry } from "../backend.d";
import { useCreateEntry } from "../hooks/useQueries";
import { toCurrencyBigInt } from "../utils/currency";

interface AdvancePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: Entry | null;
  totalBalance: number;
}

export function AdvancePaymentDialog({
  open,
  onOpenChange,
  entry,
  totalBalance,
}: AdvancePaymentDialogProps) {
  const [advancePaid, setAdvancePaid] = useState("");
  const createEntry = useCreateEntry();

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setAdvancePaid("");
    }
  }, [open]);

  const advanceNum = Number.parseFloat(advancePaid) || 0;
  const newTotalBalance = totalBalance - advanceNum;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!entry || advanceNum <= 0) return;

    try {
      // Create a new entry with amount=0, advance=paid amount
      // This records the payment; balance on this entry = 0
      // The group's Total Bal is automatically reduced by advanceNum
      await createEntry.mutateAsync({
        name: entry.name,
        mobileNumber: entry.mobileNumber,
        amount: BigInt(0),
        commission: BigInt(0),
        advance: toCurrencyBigInt(advanceNum),
      });
      toast.success("Advance payment recorded");
      onOpenChange(false);
    } catch {
      toast.error("Failed to record advance payment");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" data-ocid="advance_payment.dialog">
        <DialogHeader>
          <DialogTitle>Record Advance Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Outstanding balance info */}
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Outstanding balance: </span>
            <span className="font-semibold font-mono">
              ₹{totalBalance.toFixed(2)}
            </span>
          </div>

          {/* Advance input */}
          <div className="space-y-1.5">
            <Label htmlFor="advance-paid">Advance Paid Now</Label>
            <Input
              id="advance-paid"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={advancePaid}
              onChange={(e) => setAdvancePaid(e.target.value)}
              autoFocus
              data-ocid="advance_payment.amount.input"
            />
          </div>

          {/* Preview */}
          {advanceNum > 0 && (
            <div className="rounded-md bg-muted/30 px-3 py-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">New entry Amount:</span>
                <span className="font-semibold font-mono">₹0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  New entry Advance:
                </span>
                <span className="font-semibold font-mono">
                  ₹{advanceNum.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  New entry Balance:
                </span>
                <span className="font-semibold font-mono text-success">
                  ₹0.00
                </span>
              </div>
              <div className="border-t border-border/40 pt-1 mt-1 flex justify-between">
                <span className="text-muted-foreground">
                  Total Balance after:
                </span>
                <span
                  className={`font-semibold font-mono ${
                    newTotalBalance <= 0 ? "text-success" : "text-amber-600"
                  }`}
                >
                  ₹{newTotalBalance.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="advance_payment.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEntry.isPending || advanceNum <= 0}
              data-ocid="advance_payment.submit_button"
            >
              {createEntry.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {createEntry.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

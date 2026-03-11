import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Loader2 } from "lucide-react";

interface PaidConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryName: string;
  balance: number;
  isPending: boolean;
  onConfirm: () => void;
}

export function PaidConfirmDialog({
  open,
  onOpenChange,
  entryName,
  balance,
  isPending,
  onConfirm,
}: PaidConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm"
        data-ocid="paid_confirm.dialog"
        aria-describedby="paid-confirm-desc"
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <DialogTitle className="text-sm font-semibold">
              Mark as Paid?
            </DialogTitle>
          </div>
        </DialogHeader>

        <div id="paid-confirm-desc" className="space-y-2 px-1 pb-1">
          {/* Balance change message */}
          <div className="rounded-md bg-success/10 border border-success/30 px-3 py-2">
            <p className="text-xs font-semibold text-foreground">
              <span className="text-success">{entryName}</span>'s balance has
              been changed to zero.
            </p>
            {balance > 0 && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Previous balance:{" "}
                <span className="font-mono font-semibold text-foreground">
                  ₹{balance.toFixed(2)}
                </span>{" "}
                →{" "}
                <span className="font-mono font-semibold text-success">
                  ₹0.00
                </span>
              </p>
            )}
          </div>

          {/* Move to history warning */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            This will move{" "}
            <span className="font-semibold text-foreground">{entryName}</span>
            's entry to History.{" "}
            <span className="text-destructive font-medium">
              This cannot be undone.
            </span>
          </p>
        </div>

        <DialogFooter className="gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            data-ocid="paid_confirm.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-success hover:bg-success/90 text-success-foreground"
            onClick={onConfirm}
            disabled={isPending}
            data-ocid="paid_confirm.confirm_button"
          >
            {isPending && (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            )}
            {isPending ? "Moving..." : "Confirm Paid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

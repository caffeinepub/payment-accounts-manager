import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryName: string;
  onConfirm: () => void;
  onConfirmAll?: () => void;
  historyCount?: number;
  isPending: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  entryName,
  onConfirm,
  onConfirmAll,
  historyCount = 0,
  isPending,
}: DeleteConfirmDialogProps) {
  const [deleteAll, setDeleteAll] = useState(false);

  function handleClose() {
    setDeleteAll(false);
    onOpenChange(false);
  }

  function handleConfirm() {
    if (deleteAll && onConfirmAll) {
      onConfirmAll();
    } else {
      onConfirm();
    }
  }

  const hasHistory = historyCount > 0 && !!onConfirmAll;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <AlertDialogContent
        className="max-w-xs"
        data-ocid="delete_confirm.dialog"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm font-semibold">
            Delete this entry?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            This will permanently delete{" "}
            <span className="font-medium text-foreground">{entryName}</span>
            {"'s"} entry. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasHistory && (
          <div className="mt-1 mb-1">
            <label className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={deleteAll}
                onChange={(e) => setDeleteAll(e.target.checked)}
                className="mt-0.5 cursor-pointer accent-destructive"
                data-ocid="delete_confirm.delete_all.checkbox"
              />
              <span className="text-xs text-muted-foreground group-hover:text-foreground leading-snug">
                Also delete all{" "}
                <span className="font-semibold text-foreground">
                  {historyCount} payment history
                </span>{" "}
                {historyCount === 1 ? "entry" : "entries"} for{" "}
                <span className="font-semibold text-foreground">
                  {entryName}
                </span>
              </span>
            </label>
          </div>
        )}

        <AlertDialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={isPending}
            onClick={handleClose}
            data-ocid="delete_confirm.cancel_button"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            onClick={handleConfirm}
            disabled={isPending}
            data-ocid="delete_confirm.confirm_button"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Deleting...
              </>
            ) : deleteAll ? (
              `Delete All (${historyCount + 1})`
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

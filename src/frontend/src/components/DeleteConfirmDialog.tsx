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
import { Loader2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryName: string;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  entryName,
  onConfirm,
  isPending,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            className="h-8 text-xs"
            disabled={isPending}
            data-ocid="delete_confirm.cancel_button"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-8 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            onClick={onConfirm}
            disabled={isPending}
            data-ocid="delete_confirm.confirm_button"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

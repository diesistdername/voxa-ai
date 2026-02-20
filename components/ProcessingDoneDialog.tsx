"use client";

import { CheckCircle, ClipboardList, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProcessingDoneDialogProps {
  onCollect: () => void;
  onDismiss: () => void;
}

export const ProcessingDoneDialog = ({
  onCollect,
  onDismiss,
}: ProcessingDoneDialogProps) => (
  <div className="fixed left-1/2 top-6 z-[400] flex w-[460px] -translate-x-1/2 flex-col gap-5 rounded-2xl border border-border bg-background p-6 shadow-2xl">
    {/* Header */}
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold leading-none">All done!</p>
        <p className="text-sm text-muted-foreground">
          You&apos;ve reviewed all blocks in this document. What would you like to do with the result?
        </p>
      </div>
    </div>

    {/* Actions */}
    <div className="flex flex-col gap-2">
      <Button onClick={onCollect} className="h-11 w-full justify-start gap-3 text-sm">
        <ClipboardList className="h-4 w-4 shrink-0" />
        <span className="flex flex-col items-start text-left leading-tight">
          <span className="font-medium">Collect visible blocks</span>
          <span className="text-xs font-normal opacity-80">
            Appends all non-hidden blocks as new content at the bottom
          </span>
        </span>
      </Button>
      <Button
        variant="ghost"
        onClick={onDismiss}
        className="h-9 w-full justify-start gap-3 text-sm text-muted-foreground"
      >
        <X className="h-4 w-4 shrink-0" />
        Dismiss — keep the document as-is
      </Button>
    </div>
  </div>
);

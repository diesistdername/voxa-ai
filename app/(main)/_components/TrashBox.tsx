"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { Search, Trash2, Undo, Trash } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Spinner } from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const TrashBox = () => {
  const router = useRouter();
  const params = useParams();
  const documents = useQuery(api.documents.getTrash);
  const restore = useMutation(api.documents.restore);
  const remove = useMutation(api.documents.remove);
  const removeAll = useMutation(api.documents.removeAll);

  const [search, setSearch] = useState("");

  const filtered = documents?.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()),
  );

  const onClick = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  const onRestore = (e: React.MouseEvent, documentId: Id<"documents">) => {
    e.stopPropagation();
    toast.promise(restore({ id: documentId }), {
      loading: "Restoring note…",
      success: "Note restored.",
      error: "Failed to restore note.",
    });
  };

  const onRemove = (documentId: Id<"documents">) => {
    toast.promise(remove({ id: documentId }), {
      loading: "Deleting note…",
      success: "Note deleted.",
      error: "Failed to delete note.",
    });
    if (params.documentId === documentId) {
      router.push("/documents");
    }
  };

  const onEmptyTrash = () => {
    toast.promise(removeAll(), {
      loading: "Emptying trash…",
      success: "Trash emptied.",
      error: "Failed to empty trash.",
    });
    if (params.documentId) {
      const isInTrash = documents?.some((d) => d._id === params.documentId);
      if (isInTrash) router.push("/documents");
    }
  };

  if (documents === undefined) {
    return (
      <div className="flex items-center justify-center p-6">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="text-sm">
        {/* Search row */}
        <div className="flex items-center gap-x-1 border-b border-border p-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 border-none bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
            placeholder="Filter by title…"
          />
          {documents.length > 0 && (
            <ConfirmModal onConfirm={onEmptyTrash}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="shrink-0 rounded-sm p-1 transition-colors duration-150 hover:bg-accent"
                    aria-label="Empty trash"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-xs">Empty trash</p>
                </TooltipContent>
              </Tooltip>
            </ConfirmModal>
          )}
        </div>

        {/* List */}
        <div className="px-1 py-1">
          {documents.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Trash is empty.
            </p>
          ) : filtered?.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No results found.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {filtered?.map((doc) => (
                <div
                  key={doc._id}
                  role="button"
                  onClick={() => onClick(doc._id)}
                  className="group flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-accent"
                >
                  <span className="truncate text-foreground/80">
                    {doc.title || "Untitled"}
                  </span>
                  <div className="flex shrink-0 items-center gap-x-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => onRestore(e, doc._id)}
                          className="rounded-sm p-1 transition-colors duration-150 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                          aria-label="Restore"
                        >
                          <Undo className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="text-xs">Restore</p>
                      </TooltipContent>
                    </Tooltip>
                    <ConfirmModal onConfirm={() => onRemove(doc._id)}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="rounded-sm p-1 transition-colors duration-150 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                            aria-label="Delete permanently"
                          >
                            <Trash className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="text-xs">Delete forever</p>
                        </TooltipContent>
                      </Tooltip>
                    </ConfirmModal>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

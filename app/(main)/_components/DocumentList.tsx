"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, ChevronRight } from "lucide-react";

interface DocumentListProps {
  search?: string;
}

export const DocumentList = ({ search = "" }: DocumentListProps) => {
  const params = useParams();
  const router = useRouter();
  const documents = useQuery(api.documents.getAllForSidebar);
  const create = useMutation(api.documents.create);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const childrenMap = useMemo(() => {
    const map = new Map<string, Doc<"documents">[]>();
    if (!documents) return map;
    for (const doc of documents) {
      const key = doc.parentDocument ?? "root";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(doc);
    }
    return map;
  }, [documents]);

  const filtered = documents?.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase()),
  );

  const onClick = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  const onCreateSubPage = (
    e: React.MouseEvent,
    parentId: Id<"documents">,
  ) => {
    e.stopPropagation();
    setExpanded((prev) => new Set(prev).add(parentId));
    const promise = create({ title: "Untitled", parentDocument: parentId }).then(
      (documentId) => router.push(`/documents/${documentId}`),
    );
    toast.promise(promise, {
      loading: "Creating sub-page...",
      success: "Sub-page created.",
      error: "Failed to create sub-page.",
    });
  };

  const toggleExpand = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const renderNode = (doc: Doc<"documents">, level: number) => {
    const isActive = params.documentId === doc._id;
    const isExpanded = expanded.has(doc._id);
    const children = childrenMap.get(doc._id) ?? [];
    const hasChildren = children.length > 0;

    return (
      <div key={doc._id}>
        <div
          onClick={() => onClick(doc._id)}
          role="button"
          style={{ paddingLeft: `${12 + level * 16}px` }}
          className={cn(
            "group flex h-9 w-full cursor-pointer items-center gap-x-1 rounded-md pr-3 text-sm transition-colors duration-150",
            isActive
              ? "bg-accent text-accent-foreground"
              : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <button
            onClick={(e) => toggleExpand(e, doc._id)}
            className={cn(
              "shrink-0 rounded-sm p-0.5 transition-colors duration-150 hover:bg-neutral-200 dark:hover:bg-neutral-700",
              !hasChildren && "pointer-events-none opacity-0",
            )}
            tabIndex={hasChildren ? 0 : -1}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform duration-150",
                isExpanded && "rotate-90",
              )}
            />
          </button>
          <FileText
            className={cn(
              "h-4 w-4 shrink-0",
              isActive ? "text-accent-foreground" : "text-muted-foreground",
            )}
          />
          <span className="truncate">{doc.title || "Untitled"}</span>
          <div
            role="button"
            title="Add sub-page"
            onClick={(e) => onCreateSubPage(e, doc._id)}
            className="ml-auto rounded-sm p-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
        {isExpanded && children.map((child) => renderNode(child, level + 1))}
      </div>
    );
  };

  if (documents === undefined) {
    return (
      <div className="space-y-1 px-1">
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    );
  }

  // Search mode: flat filtered list
  if (search) {
    if (filtered?.length === 0) {
      return (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          No matching notes.
        </p>
      );
    }
    return (
      <div className="space-y-0.5">
        {filtered?.map((document) => {
          const isActive = params.documentId === document._id;
          return (
            <div
              key={document._id}
              onClick={() => onClick(document._id)}
              role="button"
              className={cn(
                "group flex h-9 w-full cursor-pointer items-center gap-x-2 rounded-md px-3 text-sm transition-colors duration-150",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <FileText
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-accent-foreground" : "text-muted-foreground",
                )}
              />
              <span className="truncate">{document.title || "Untitled"}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Tree mode: no search
  const roots = childrenMap.get("root") ?? [];

  if (roots.length === 0) {
    return (
      <p className="px-3 py-2 text-xs text-muted-foreground">No notes yet.</p>
    );
  }

  return (
    <div className="space-y-0.5">
      {roots.map((doc) => renderNode(doc, 0))}
    </div>
  );
};

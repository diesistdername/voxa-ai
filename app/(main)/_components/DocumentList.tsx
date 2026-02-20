"use client";

import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

interface DocumentListProps {
  search?: string;
}

export const DocumentList = ({ search = "" }: DocumentListProps) => {
  const params = useParams();
  const router = useRouter();
  const documents = useQuery(api.documents.getAllForSidebar);

  const filtered = documents?.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase()),
  );

  const onClick = (documentId: string) => {
    router.push(`/documents/${documentId}`);
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

  if (filtered?.length === 0) {
    return (
      <p className="px-3 py-2 text-xs text-muted-foreground">
        {search ? "No matching notes." : "No notes yet."}
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
              "flex h-9 w-full cursor-pointer items-center gap-x-2 rounded-md px-3 text-sm transition-colors duration-150",
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
};

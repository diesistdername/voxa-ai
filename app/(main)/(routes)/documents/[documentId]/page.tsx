"use client";

import dynamic from "next/dynamic";
import { useMemo, use } from "react";

import { Toolbar } from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

interface DocumentIdPageProps {
  params: Promise<{
    documentId: Id<"documents">;
  }>;
}

const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const { documentId } = use(params);

  const Editor = useMemo(
    () => dynamic(() => import("@/components/editor"), { ssr: false }),
    [],
  );

  const document = useQuery(api.documents.getById, {
    documentId: documentId,
  });

  const update = useMutation(api.documents.update);
  const create = useMutation(api.documents.create);
  const archive = useMutation(api.documents.archive);

  const onChange = (content: string) => {
    update({ id: documentId, content });
  };

  // Creates a child document and returns its ID.
  // The editor inserts a page block at the cursor position.
  const onCreatePage = async (title: string): Promise<string> => {
    return await create({ title, parentDocument: documentId });
  };

  // Archives a child document when its page block is deleted from the editor.
  const onArchivePage = (pageId: string) => {
    archive({ id: pageId as Id<"documents"> });
  };

  if (document === undefined) {
    return (
      <div className="w-full max-w-5xl pl-16 pr-12 pt-10 pb-40">
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>
    );
  }

  if (document === null) {
    return <div>Not found</div>;
  }

  return (
    <div className="w-full max-w-5xl pl-16 pr-12 pt-10 pb-40">
      <Toolbar initialData={document} />
      <Editor
        onChange={onChange}
        initialContent={document.content}
        onCreatePage={onCreatePage}
        onArchivePage={onArchivePage}
      />
    </div>
  );
};

export default DocumentIdPage;

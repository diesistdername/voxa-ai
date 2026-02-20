"use client";

import dynamic from "next/dynamic";
import { useMemo, use, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { BlockNoteEditor } from "@blocknote/core";

import { Toolbar } from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { ProcessingControls } from "@/components/ProcessingControls";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

import { useProcessingMode } from "@/hooks/useProcessingMode";
import { HIGHLIGHT_BG_VALUE } from "@/lib/processingMode";

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

  const doc = useQuery(api.documents.getById, { documentId });
  const update = useMutation(api.documents.update);
  const create = useMutation(api.documents.create);
  const archive = useMutation(api.documents.archive);

  // --- Processing Mode ---
  const {
    isActive: processingActive,
    currentBlockId,
    startRequested,
    setActive,
    setCurrentBlockId,
    clearStartRequest,
  } = useProcessingMode();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<BlockNoteEditor<any, any, any> | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorReady = useCallback((editor: BlockNoteEditor<any, any, any>) => {
    editorRef.current = editor;
  }, []);

  // Stop processing when navigating to a different document
  useEffect(() => {
    return () => {
      setActive(false);
      setCurrentBlockId(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const scrollToBlock = useCallback((id: string) => {
    requestAnimationFrame(() => {
      const el = window.document.querySelector(`[data-id="${id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const isEligible = (block: { type: string }) =>
    block.type !== "page" && block.type !== "hidden";

  const startProcessing = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let firstBlock: any = null;
    editor.forEachBlock((block) => {
      if (isEligible(block)) {
        firstBlock = block;
        return false; // halt at first eligible block
      }
      return true;
    });

    if (!firstBlock) {
      toast.info("No blocks to process.");
      return;
    }

    setCurrentBlockId(firstBlock.id);
    setActive(true);
    scrollToBlock(firstBlock.id);
  }, [setActive, setCurrentBlockId, scrollToBlock]);

  const advanceProcessing = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !currentBlockId) return;

    let found = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let nextBlock: any = null;

    editor.forEachBlock((block) => {
      if (found && isEligible(block)) {
        nextBlock = block;
        return false; // stop at first eligible block after current
      }
      if (block.id === currentBlockId) {
        found = true;
      }
      return true;
    });

    if (nextBlock) {
      setCurrentBlockId(nextBlock.id);
      scrollToBlock(nextBlock.id);
    } else {
      // End of document — or current block was deleted (found === false)
      setCurrentBlockId(null);
      setActive(false);
      toast.success("All done!", {
        description: "You've reviewed all blocks in this document.",
      });
    }
  }, [currentBlockId, setActive, setCurrentBlockId, scrollToBlock]);

  // Listen for start request fired from the Navbar "Process" button
  useEffect(() => {
    if (!startRequested) return;
    clearStartRequest();
    startProcessing();
  }, [startRequested, clearStartRequest, startProcessing]);

  // --- Action handlers ---
  const handleKeep = useCallback(() => {
    advanceProcessing();
  }, [advanceProcessing]);

  const handleHighlight = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !currentBlockId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor as any).updateBlock(currentBlockId, {
      props: { backgroundColor: HIGHLIGHT_BG_VALUE },
    });
    advanceProcessing();
  }, [currentBlockId, advanceProcessing]);

  const handleHide = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !currentBlockId) return;

    // Capture current block content + find next eligible block before replacing.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentBlock: any = null;
    let found = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let nextBlock: any = null;
    editor.forEachBlock((block) => {
      if (block.id === currentBlockId) {
        currentBlock = block;
        found = true;
      } else if (found && isEligible(block)) {
        nextBlock = block;
        return false;
      }
      return true;
    });

    if (!currentBlock) return;

    // Replace with a hidden toggle block. Cmd/Ctrl+Z undoes this via ProseMirror history.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor as any).replaceBlocks(
      [currentBlockId],
      [{ type: "hidden", props: { originalContent: JSON.stringify(currentBlock) } }],
    );

    if (nextBlock) {
      setCurrentBlockId(nextBlock.id);
      scrollToBlock(nextBlock.id);
    } else {
      setCurrentBlockId(null);
      setActive(false);
      toast.success("All done!", {
        description: "You've reviewed all blocks in this document.",
      });
    }
  }, [currentBlockId, setActive, setCurrentBlockId, scrollToBlock]);

  const handleExit = useCallback(() => {
    setCurrentBlockId(null);
    setActive(false);
  }, [setActive, setCurrentBlockId]);

  // --- Convex handlers ---
  const onChange = (content: string) => {
    update({ id: documentId, content });
  };

  const onCreatePage = async (title: string): Promise<string> => {
    return await create({ title, parentDocument: documentId });
  };

  const onArchivePage = (pageId: string) => {
    archive({ id: pageId as Id<"documents"> });
  };

  // --- Render ---
  if (doc === undefined) {
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

  if (doc === null) {
    return <div>Not found</div>;
  }

  return (
    <div className="w-full max-w-5xl pl-16 pr-12 pt-10 pb-40">
      <Toolbar initialData={doc} />
      <Editor
        onChange={onChange}
        initialContent={doc.content}
        onCreatePage={onCreatePage}
        onArchivePage={onArchivePage}
        onEditorReady={handleEditorReady}
      />
      {processingActive && currentBlockId && (
        <ProcessingControls
          blockId={currentBlockId}
          onKeep={handleKeep}
          onHighlight={handleHighlight}
          onHide={handleHide}
          onExit={handleExit}
        />
      )}
    </div>
  );
};

export default DocumentIdPage;

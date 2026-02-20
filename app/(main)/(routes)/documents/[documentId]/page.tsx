"use client";

import dynamic from "next/dynamic";
import { useMemo, use, useRef, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { BlockNoteEditor } from "@blocknote/core";

import { Toolbar } from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { ProcessingControls } from "@/components/ProcessingControls";
import { ProcessingDoneDialog } from "@/components/ProcessingDoneDialog";

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

  const [showDoneDialog, setShowDoneDialog] = useState(false);
  const [extraSelectedIds, setExtraSelectedIds] = useState<string[]>([]);

  // --- Processing Mode ---
  const {
    isActive: processingActive,
    currentBlockId,
    startRequested,
    setActive,
    setCurrentBlockId,
    clearStartRequest,
    cancelRequested,
    clearCancelRequest,
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
      setCurrentBlockId(null);
      setActive(false);
      setShowDoneDialog(true);
    }
  }, [currentBlockId, setActive, setCurrentBlockId, scrollToBlock, setShowDoneDialog]);

  // Listen for start request fired from the Navbar "Process" button
  useEffect(() => {
    if (!startRequested) return;
    clearStartRequest();
    startProcessing();
  }, [startRequested, clearStartRequest, startProcessing]);

  // --- Action handlers ---
  const handleKeep = useCallback(() => {
    if (extraSelectedIds.length > 0) setExtraSelectedIds([]);
    advanceProcessing();
  }, [advanceProcessing, extraSelectedIds]);

  const handleHighlight = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !currentBlockId) return;
    for (const id of extraSelectedIds) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor as any).updateBlock(id, { props: { backgroundColor: HIGHLIGHT_BG_VALUE } });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor as any).updateBlock(currentBlockId, {
      props: { backgroundColor: HIGHLIGHT_BG_VALUE },
    });
    if (extraSelectedIds.length > 0) setExtraSelectedIds([]);
    advanceProcessing();
  }, [currentBlockId, advanceProcessing, extraSelectedIds]);

  const handleHide = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !currentBlockId) return;

    // All IDs to hide: any extra-selected blocks (in document order) + current
    const idsToHide = extraSelectedIds.length > 0
      ? [...extraSelectedIds, currentBlockId]
      : [currentBlockId];
    const idsToHideSet = new Set(idsToHide);
    // currentBlockId is always the last in document order (Shift+Down moves forward)
    const lastIdToHide = currentBlockId;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let prevBlock: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tempPrev: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let nextImmediate: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let nextEligible: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blockObjects = new Map<string, any>();
    let enteredRange = false;
    let foundLast = false;

    editor.forEachBlock((block) => {
      if (idsToHideSet.has(block.id)) {
        if (!enteredRange) {
          prevBlock = tempPrev;
          enteredRange = true;
        }
        blockObjects.set(block.id, block);
        if (block.id === lastIdToHide) foundLast = true;
      } else if (!enteredRange) {
        tempPrev = block;
      } else if (foundLast) {
        if (nextImmediate === null) nextImmediate = block;
        if (isEligible(block) && nextEligible === null) {
          nextEligible = block;
          return false;
        }
      }
      return true;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blocksToHide = idsToHide.map((id) => blockObjects.get(id)).filter(Boolean) as any[];
    if (blocksToHide.length === 0) return;

    if (prevBlock?.type === "hidden" && nextImmediate?.type === "hidden") {
      // Merge: prev hidden + blocks + next hidden → single prev hidden block
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prevExisting: any[] = JSON.parse(prevBlock.props.originalContent || "[]");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nextExisting: any[] = JSON.parse(nextImmediate.props.originalContent || "[]");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor as any).updateBlock(prevBlock.id, {
        props: { originalContent: JSON.stringify([...prevExisting, ...blocksToHide, ...nextExisting]) },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor as any).removeBlocks([...idsToHide, nextImmediate.id]);
    } else if (prevBlock?.type === "hidden") {
      // Append to preceding hidden block
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing: any[] = JSON.parse(prevBlock.props.originalContent || "[]");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor as any).updateBlock(prevBlock.id, {
        props: { originalContent: JSON.stringify([...existing, ...blocksToHide]) },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor as any).removeBlocks(idsToHide);
    } else if (nextImmediate?.type === "hidden") {
      // Prepend to following hidden block
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing: any[] = JSON.parse(nextImmediate.props.originalContent || "[]");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor as any).updateBlock(nextImmediate.id, {
        props: { originalContent: JSON.stringify([...blocksToHide, ...existing]) },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor as any).removeBlocks(idsToHide);
    } else {
      // Create a new hidden block (replace first, remove rest)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor as any).replaceBlocks(
        [idsToHide[0]],
        [{ type: "hidden", props: { originalContent: JSON.stringify(blocksToHide) } }],
      );
      if (idsToHide.length > 1) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editor as any).removeBlocks(idsToHide.slice(1));
      }
    }

    if (extraSelectedIds.length > 0) setExtraSelectedIds([]);

    if (nextEligible) {
      setCurrentBlockId(nextEligible.id);
      scrollToBlock(nextEligible.id);
    } else {
      setCurrentBlockId(null);
      setActive(false);
      setShowDoneDialog(true);
    }
  }, [currentBlockId, extraSelectedIds, setActive, setCurrentBlockId, scrollToBlock, setShowDoneDialog]);

  const handlePrevious = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !currentBlockId) return;

    if (extraSelectedIds.length > 0) setExtraSelectedIds([]);

    // Walk forward and keep updating prevBlock until we reach currentBlockId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let prevBlock: any = null;
    editor.forEachBlock((block) => {
      if (block.id === currentBlockId) return false; // stop
      if (isEligible(block)) prevBlock = block;
      return true;
    });

    if (prevBlock) {
      setCurrentBlockId(prevBlock.id);
      scrollToBlock(prevBlock.id);
    }
  }, [currentBlockId, extraSelectedIds, setCurrentBlockId, scrollToBlock]);

  const handleCancel = useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      // 1. Restore all hidden blocks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hiddenBlocks: any[] = [];
      editor.forEachBlock((block) => {
        if (block.type === "hidden") hiddenBlocks.push(block);
        return true;
      });
      for (const hidden of hiddenBlocks) {
        try {
          const parsed = JSON.parse(hidden.props.originalContent || "[]");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const originals: any[] = Array.isArray(parsed) ? parsed : [parsed];
          if (originals.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (editor as any).replaceBlocks([hidden.id], originals);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (editor as any).removeBlocks([hidden.id]);
          }
        } catch {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (editor as any).removeBlocks([hidden.id]);
        }
      }

      // 2. Strip all highlights
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const highlightedIds: string[] = [];
      editor.forEachBlock((block) => {
        if (block.props?.backgroundColor === HIGHLIGHT_BG_VALUE) {
          highlightedIds.push(block.id);
        }
        return true;
      });
      for (const id of highlightedIds) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editor as any).updateBlock(id, { props: { backgroundColor: "default" } });
      }
    }

    // 3. Exit processing mode
    setCurrentBlockId(null);
    setActive(false);
    setExtraSelectedIds([]);
    setShowDoneDialog(false);
  }, [setActive, setCurrentBlockId]);

  const handleAddSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !currentBlockId) return;

    // Add current block to selection pile
    setExtraSelectedIds((prev) => [...prev, currentBlockId]);

    // Advance cursor to next eligible block without taking any action
    let found = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let nextBlock: any = null;
    editor.forEachBlock((block) => {
      if (found && isEligible(block)) {
        nextBlock = block;
        return false;
      }
      if (block.id === currentBlockId) found = true;
      return true;
    });

    if (nextBlock) {
      setCurrentBlockId(nextBlock.id);
      scrollToBlock(nextBlock.id);
    }
    // If no next block, stay on current (can't advance past end)
  }, [currentBlockId, setCurrentBlockId, scrollToBlock]);

  // Listen for cancel request fired from the Navbar button
  useEffect(() => {
    if (!cancelRequested) return;
    clearCancelRequest();
    handleCancel();
  }, [cancelRequested, clearCancelRequest, handleCancel]);


  // Recursively strip block IDs so BlockNote assigns fresh ones on insert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripIds = (block: any): any => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = block;
    return { ...rest, children: (block.children ?? []).map(stripIds) };
  };

  const handleCollectBlocks = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) { setShowDoneDialog(false); return; }

    // --- Summary blocks: only visible (non-hidden) blocks, fresh IDs ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summaryBlocks: any[] = [];
    editor.forEachBlock((block) => {
      if (block.type !== "hidden") summaryBlocks.push(stripIds(block));
      return true;
    });

    // --- Raw blocks: all original content in document order, highlights stripped ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripHighlight = (block: any): any => {
      const s = stripIds(block);
      if (s.props?.backgroundColor && s.props.backgroundColor !== "default") {
        s.props = { ...s.props, backgroundColor: "default" };
      }
      return s;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawBlocks: any[] = [];
    editor.forEachBlock((block) => {
      if (block.type === "hidden") {
        try {
          const parsed = JSON.parse(block.props.originalContent || "[]");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const originals: any[] = Array.isArray(parsed) ? parsed : [parsed];
          rawBlocks.push(...originals.map(stripHighlight));
        } catch { /* skip malformed */ }
      } else {
        rawBlocks.push(stripHighlight(block));
      }
      return true;
    });

    // 3. Create sub-pages and fill with content (await so data is safe before clearing)
    const [rawId, summaryId] = await Promise.all([
      create({ title: "Raw", parentDocument: documentId }),
      create({ title: "Summary", parentDocument: documentId }),
    ]);
    await Promise.all([
      rawBlocks.length > 0
        ? update({ id: rawId, content: JSON.stringify(rawBlocks) })
        : Promise.resolve(),
      summaryBlocks.length > 0
        ? update({ id: summaryId, content: JSON.stringify(summaryBlocks) })
        : Promise.resolve(),
    ]);

    // 4. Replace current page content with two page-link blocks.
    //    Collect all block IDs, replace the first with the two links, remove the rest.
    const allIds: string[] = [];
    editor.forEachBlock((block) => { allIds.push(block.id); return true; });
    const [firstId, ...restIds] = allIds;
    if (firstId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor as any).replaceBlocks(
        [firstId],
        [
          { type: "page", props: { pageId: rawId } },
          { type: "page", props: { pageId: summaryId } },
        ],
      );
      if (restIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editor as any).removeBlocks(restIds);
      }
    }

    setShowDoneDialog(false);
  }, [create, update, documentId]);

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
      <div className="w-full max-w-5xl pl-24 pr-16 pt-10 pb-40">
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
    <div className="w-full max-w-5xl pl-24 pr-16 pt-10 pb-40">
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
          extraBlockIds={extraSelectedIds}
          onKeep={handleKeep}
          onHighlight={handleHighlight}
          onHide={handleHide}
          onPrevious={handlePrevious}
          onExit={handleCancel}
          onAddSelection={handleAddSelection}
        />
      )}
      {showDoneDialog && (
        <ProcessingDoneDialog
          onCollect={handleCollectBlocks}
          onDismiss={handleCancel}
        />
      )}
    </div>
  );
};

export default DocumentIdPage;

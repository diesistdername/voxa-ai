"use client";

import { useEffect, useCallback, useState } from "react";
import { Check, EyeOff, Highlighter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProcessingControlsProps {
  blockId: string;
  onKeep: () => void;
  onHighlight: () => void;
  onHide: () => void;
  onExit: () => void;
}

export const ProcessingControls = ({
  blockId,
  onKeep,
  onHighlight,
  onHide,
  onExit,
}: ProcessingControlsProps) => {
  // --- Overlay (block highlight) ---
  // React-owned fixed div — immune to ProseMirror DOM re-renders.
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({
    display: "none",
  });

  const updateOverlay = useCallback(() => {
    const blockEl = window.document.querySelector(`[data-id="${blockId}"]`);
    if (!blockEl) {
      setOverlayStyle({ display: "none" });
      return;
    }
    const r = blockEl.getBoundingClientRect();
    setOverlayStyle({
      position: "fixed",
      pointerEvents: "none",
      zIndex: 39,
      top: r.top,
      left: r.left,
      width: r.width,
      height: Math.max(r.height, 24),
    });
  }, [blockId]);

  // Update overlay when blockId changes
  useEffect(() => {
    const raf = requestAnimationFrame(updateOverlay);
    return () => cancelAnimationFrame(raf);
  }, [blockId, updateOverlay]);

  // Keep overlay in sync while scrolling / resizing
  useEffect(() => {
    const scroller = window.document.querySelector("main");
    scroller?.addEventListener("scroll", updateOverlay, { passive: true });
    window.addEventListener("resize", updateOverlay);
    return () => {
      scroller?.removeEventListener("scroll", updateOverlay);
      window.removeEventListener("resize", updateOverlay);
    };
  }, [updateOverlay]);

  // --- Keyboard shortcuts ---
  // Left=hide, down=keep, right=highlight, esc=stop
  // Skipped when the user is typing inside the editor
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inEditor = (e.target as Element | null)?.closest?.(".bn-editor");
      if (inEditor) return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          onHide();
          break;
        case "ArrowDown":
          e.preventDefault();
          onKeep();
          break;
        case "ArrowRight":
          e.preventDefault();
          onHighlight();
          break;
        case "Escape":
          onExit();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onHide, onKeep, onHighlight, onExit]);

  return (
    <>
      {/* Block highlight overlay */}
      <div style={overlayStyle} className="processing-active-block" />

      {/* Action bar — fixed at bottom-center, never moves */}
      <div className="fixed bottom-10 left-1/2 z-[350] flex -translate-x-1/2 items-stretch rounded-xl border border-border bg-background shadow-xl">
        {/* Three primary action buttons */}
        <div className="flex gap-1 p-2">
          {/* Order matches arrow keys: ← Hide | ↓ Keep | → Highlight */}
          <Button
            variant="ghost"
            onClick={onHide}
            className="flex h-24 w-28 flex-col items-center justify-center gap-2 rounded-lg px-2"
          >
            <EyeOff className="h-6 w-6 shrink-0" />
            <span className="text-xs font-medium leading-none">Hide</span>
            <kbd className="font-mono text-[10px] leading-none text-muted-foreground">←</kbd>
          </Button>
          <Button
            variant="ghost"
            onClick={onKeep}
            className="flex h-24 w-28 flex-col items-center justify-center gap-2 rounded-lg px-2"
          >
            <Check className="h-6 w-6 shrink-0" />
            <span className="text-xs font-medium leading-none">Keep</span>
            <kbd className="font-mono text-[10px] leading-none text-muted-foreground">↓</kbd>
          </Button>
          <Button
            variant="ghost"
            onClick={onHighlight}
            className="flex h-24 w-28 flex-col items-center justify-center gap-2 rounded-lg px-2"
          >
            <Highlighter className="h-6 w-6 shrink-0" />
            <span className="text-xs font-medium leading-none">Highlight</span>
            <kbd className="font-mono text-[10px] leading-none text-muted-foreground">→</kbd>
          </Button>
        </div>

        {/* Vertical divider */}
        <div className="my-3 w-px bg-border" />

        {/* Stop button */}
        <div className="flex items-center px-2">
          <Button
            variant="ghost"
            onClick={onExit}
            className="flex h-14 w-16 flex-col items-center justify-center gap-1.5 rounded-lg text-muted-foreground"
          >
            <X className="h-5 w-5 shrink-0" />
            <span className="text-[11px] font-medium leading-none">Stop</span>
            <kbd className="font-mono text-[9px] leading-none">Esc</kbd>
          </Button>
        </div>
      </div>
    </>
  );
};

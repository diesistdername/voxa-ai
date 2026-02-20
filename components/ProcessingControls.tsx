"use client";

import { useEffect, useRef, useCallback, useState } from "react";
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
  const panelRef = useRef<HTMLDivElement>(null);

  // --- Overlay (block highlight) ---
  // Rendered as a React-owned fixed div — immune to ProseMirror DOM re-renders.
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
      height: Math.max(r.height, 24), // minimum visible height
    });
  }, [blockId]);

  // Update overlay when blockId changes
  useEffect(() => {
    const raf = requestAnimationFrame(updateOverlay);
    return () => cancelAnimationFrame(raf);
  }, [blockId, updateOverlay]);

  // Track scrolling so the overlay follows the block
  useEffect(() => {
    const scroller = window.document.querySelector("main");
    scroller?.addEventListener("scroll", updateOverlay, { passive: true });
    window.addEventListener("resize", updateOverlay);
    return () => {
      scroller?.removeEventListener("scroll", updateOverlay);
      window.removeEventListener("resize", updateOverlay);
    };
  }, [updateOverlay]);

  // --- Panel (fixed center, doesn't follow blocks) ---
  const repositionPanel = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const panelW = panel.offsetWidth || 112;
    const panelH = panel.offsetHeight || 176;
    const anyBlock = window.document.querySelector("[data-id]");
    const left = anyBlock
      ? Math.max(4, anyBlock.getBoundingClientRect().left - panelW - 8)
      : 8;
    const top = Math.max(56, (window.innerHeight - panelH) / 2);
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(repositionPanel);
    return () => cancelAnimationFrame(raf);
  }, [repositionPanel]);

  useEffect(() => {
    window.addEventListener("resize", repositionPanel);
    return () => window.removeEventListener("resize", repositionPanel);
  }, [repositionPanel]);

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
      {/* Block highlight overlay — React-managed, never mutates BlockNote DOM */}
      <div style={overlayStyle} className="processing-active-block" />

      {/* Action panel — stays at vertical center of viewport */}
      <div
        ref={panelRef}
        style={{ position: "fixed", top: 0, left: 0 }}
        className="z-50 flex flex-col gap-0.5 rounded-lg border border-border bg-background p-1 shadow-md"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onHighlight}
          className="h-8 justify-start gap-x-1.5 px-2 text-xs"
        >
          <Highlighter className="h-3.5 w-3.5 shrink-0" />
          <span>Highlight</span>
          <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">→</kbd>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onKeep}
          className="h-8 justify-start gap-x-1.5 px-2 text-xs"
        >
          <Check className="h-3.5 w-3.5 shrink-0" />
          <span>Keep</span>
          <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">↓</kbd>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onHide}
          className="h-8 justify-start gap-x-1.5 px-2 text-xs"
        >
          <EyeOff className="h-3.5 w-3.5 shrink-0" />
          <span>Hide</span>
          <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">←</kbd>
        </Button>
        <div className="my-0.5 h-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="h-8 justify-start gap-x-1.5 px-2 text-xs text-muted-foreground"
        >
          <X className="h-3.5 w-3.5 shrink-0" />
          <span>Stop</span>
          <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Esc</kbd>
        </Button>
      </div>
    </>
  );
};

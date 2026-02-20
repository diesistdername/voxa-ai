"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { Check, FoldVertical, Highlighter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

interface ProcessingControlsProps {
  blockId: string;
  extraBlockIds?: string[];
  onKeep: () => void;
  onHighlight: () => void;
  onHide: () => void;
  onPrevious: () => void;
  onExit: () => void;
  onAddSelection: () => void;
}

export const ProcessingControls = ({
  blockId,
  extraBlockIds,
  onKeep,
  onHighlight,
  onHide,
  onPrevious,
  onExit,
  onAddSelection,
}: ProcessingControlsProps) => {
  // --- Overlays ---
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({
    display: "none",
  });
  const [extraOverlays, setExtraOverlays] = useState<React.CSSProperties[]>([]);

  // Refs always hold the latest prop values so the stable callback never goes stale
  const blockIdRef = useRef(blockId);
  const extraBlockIdsRef = useRef(extraBlockIds);
  blockIdRef.current = blockId;
  extraBlockIdsRef.current = extraBlockIds;

  // Stable callback — reads from refs, never needs to be recreated
  const updateOverlays = useCallback(() => {
    const bid = blockIdRef.current;
    const eids = extraBlockIdsRef.current;

    // Primary (current block) overlay
    const blockEl = document.querySelector(`[data-id="${bid}"]`);
    if (!blockEl) {
      setOverlayStyle({ display: "none" });
    } else {
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
    }

    // Extra (selected) overlays
    if (eids && eids.length > 0) {
      setExtraOverlays(
        eids.map((id) => {
          const el = document.querySelector(`[data-id="${id}"]`);
          if (!el) return { display: "none" } as React.CSSProperties;
          const r = el.getBoundingClientRect();
          return {
            position: "fixed" as const,
            pointerEvents: "none" as const,
            zIndex: 38,
            top: r.top,
            left: r.left,
            width: r.width,
            height: Math.max(r.height, 24),
          };
        }),
      );
    } else {
      setExtraOverlays([]);
    }
  }, []); // stable — deps accessed via refs

  // Re-run overlay calculation whenever blockId or extraBlockIds change
  useEffect(() => {
    const raf = requestAnimationFrame(updateOverlays);
    return () => cancelAnimationFrame(raf);
  }, [blockId, extraBlockIds, updateOverlays]);

  // Keep overlays in sync while scrolling / resizing
  useEffect(() => {
    const scroller = document.querySelector("main");
    scroller?.addEventListener("scroll", updateOverlays, { passive: true });
    window.addEventListener("resize", updateOverlays);
    return () => {
      scroller?.removeEventListener("scroll", updateOverlays);
      window.removeEventListener("resize", updateOverlays);
    };
  }, [updateOverlays]); // registers once — updateOverlays is stable

  // --- Keyboard shortcuts ---
  // Up=previous, Space=hide, Shift+Down=add to selection, Down=keep,
  // Enter/Right=highlight, Esc=stop  (ArrowLeft unbound)
  //
  // capture:true ensures we intercept before BlockNote, which calls
  // stopPropagation on Shift+ArrowDown (its text-selection gesture).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Shift+Down: always intercept — explicit processing-mode gesture.
      // stopPropagation prevents BlockNote from extending text selection.
      if (e.key === "ArrowDown" && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        onAddSelection();
        return;
      }

      // All other shortcuts: skip while the user is typing inside the editor
      const inEditor = (e.target as Element | null)?.closest?.(".bn-editor");
      if (inEditor) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          onPrevious();
          break;
        case " ":
          e.preventDefault();
          onHide();
          break;
        case "ArrowDown":
          e.preventDefault();
          onKeep();
          break;
        case "Enter":
        case "ArrowRight":
          e.preventDefault();
          onHighlight();
          break;
        case "Escape":
          onExit();
          break;
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [onHide, onKeep, onHighlight, onPrevious, onExit, onAddSelection]);

  return (
    <>
      {/* Extra (selected) block overlays */}
      {extraOverlays.map((style, i) => (
        <div key={i} style={style} className="processing-selected-block" />
      ))}

      {/* Primary (current) block highlight overlay */}
      <div style={overlayStyle} className="processing-active-block" />

      {/* Action bar — fixed at bottom-center, never moves */}
      <div className="fixed bottom-10 left-1/2 z-[350] flex -translate-x-1/2 items-stretch rounded-xl border border-border bg-background shadow-xl">
        {/* Three primary action buttons */}
        <div className="flex gap-1 p-2">
          {/* Order: Space=Hide | ↓=Keep | Enter=Highlight */}
          <Button
            variant="ghost"
            onClick={onHide}
            className="flex h-24 w-28 flex-col items-center justify-center gap-2 rounded-lg px-2"
          >
            <FoldVertical className="h-6 w-6 shrink-0" />
            <span className="text-xs font-medium leading-none">Hide</span>
            <Kbd>Space</Kbd>
          </Button>
          <Button
            variant="ghost"
            onClick={onKeep}
            className="flex h-24 w-28 flex-col items-center justify-center gap-2 rounded-lg px-2"
          >
            <Check className="h-6 w-6 shrink-0" />
            <span className="text-xs font-medium leading-none">Keep</span>
            <Kbd>↓</Kbd>
          </Button>
          <Button
            variant="ghost"
            onClick={onHighlight}
            className="flex h-24 w-28 flex-col items-center justify-center gap-2 rounded-lg px-2"
          >
            <Highlighter className="h-6 w-6 shrink-0" />
            <span className="text-xs font-medium leading-none">Highlight</span>
            <Kbd>Enter</Kbd>
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
            <Kbd>Esc</Kbd>
          </Button>
        </div>
      </div>
    </>
  );
};

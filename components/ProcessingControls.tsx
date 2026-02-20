"use client";

import { useEffect, useRef, useCallback } from "react";
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

  const reposition = useCallback(() => {
    const blockEl = document.querySelector(`[data-id="${blockId}"]`);
    const panel = panelRef.current;
    if (!blockEl || !panel) return;

    const rect = blockEl.getBoundingClientRect();
    const panelH = panel.offsetHeight || 160; // fallback before first paint
    const panelW = panel.offsetWidth || 100;

    const top = rect.top + rect.height / 2 - panelH / 2;
    const left = rect.left - panelW - 8;

    panel.style.top = `${Math.max(56, top)}px`; // clamp below navbar
    panel.style.left = `${Math.max(4, left)}px`;
  }, [blockId]);

  // Reposition when blockId changes or on mount
  useEffect(() => {
    // Defer to let the DOM settle after React commits the new blockId
    const id = requestAnimationFrame(reposition);
    return () => cancelAnimationFrame(id);
  }, [blockId, reposition]);

  // Reposition on scroll and window resize
  useEffect(() => {
    const scroller = document.querySelector("main");
    scroller?.addEventListener("scroll", reposition, { passive: true });
    window.addEventListener("resize", reposition);
    return () => {
      scroller?.removeEventListener("scroll", reposition);
      window.removeEventListener("resize", reposition);
    };
  }, [reposition]);

  // Add/remove outline class on the current active block
  useEffect(() => {
    const el = document.querySelector(`[data-id="${blockId}"]`);
    el?.classList.add("processing-active-block");
    return () => {
      el?.classList.remove("processing-active-block");
    };
  }, [blockId]);

  return (
    <div
      ref={panelRef}
      style={{ position: "fixed", top: 0, left: 0 }}
      className="z-50 flex flex-col gap-0.5 rounded-lg border border-border bg-background p-1 shadow-md"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onHighlight}
        className="h-8 justify-start px-2 text-xs"
      >
        <Highlighter className="mr-1.5 h-3.5 w-3.5" />
        Highlight
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onKeep}
        className="h-8 justify-start px-2 text-xs"
      >
        <Check className="mr-1.5 w-3.5 h-3.5" />
        Keep
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onHide}
        className="h-8 justify-start px-2 text-xs"
      >
        <EyeOff className="mr-1.5 h-3.5 w-3.5" />
        Hide
      </Button>
      <div className="my-0.5 h-px bg-border" />
      <Button
        variant="ghost"
        size="sm"
        onClick={onExit}
        className="h-8 justify-start px-2 text-xs text-muted-foreground"
      >
        <X className="mr-1.5 h-3.5 w-3.5" />
        Stop
      </Button>
    </div>
  );
};

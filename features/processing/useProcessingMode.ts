import { create } from "zustand";

interface ProcessingModeStore {
  isActive: boolean;
  currentBlockId: string | null;
  /** Set to true by Navbar; page.tsx reads and clears it to start processing. */
  startRequested: boolean;
  requestStart: () => void;
  clearStartRequest: () => void;
  setActive: (active: boolean) => void;
  setCurrentBlockId: (id: string | null) => void;
  /** Set to true by Navbar/cancel button; page.tsx reads and clears it to cancel. */
  cancelRequested: boolean;
  requestCancel: () => void;
  clearCancelRequest: () => void;
}

export const useProcessingMode = create<ProcessingModeStore>((set) => ({
  isActive: false,
  currentBlockId: null,
  startRequested: false,
  requestStart: () => set({ startRequested: true }),
  clearStartRequest: () => set({ startRequested: false }),
  setActive: (active) => set({ isActive: active }),
  setCurrentBlockId: (id) => set({ currentBlockId: id }),
  cancelRequested: false,
  requestCancel: () => set({ cancelRequested: true }),
  clearCancelRequest: () => set({ cancelRequested: false }),
}));

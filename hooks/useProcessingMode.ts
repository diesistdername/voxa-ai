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
}

export const useProcessingMode = create<ProcessingModeStore>((set) => ({
  isActive: false,
  currentBlockId: null,
  startRequested: false,
  requestStart: () => set({ startRequested: true }),
  clearStartRequest: () => set({ startRequested: false }),
  setActive: (active) => set({ isActive: active }),
  setCurrentBlockId: (id) => set({ currentBlockId: id }),
}));

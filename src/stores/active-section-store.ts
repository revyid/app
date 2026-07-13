import { create } from 'zustand';

interface ActiveSectionStore {
  activeSection: string;
  setActiveSection: (id: string) => void;
}

export const useActiveSectionStore = create<ActiveSectionStore>((set) => ({
  activeSection: '',
  setActiveSection: (id) => set({ activeSection: id }),
}));

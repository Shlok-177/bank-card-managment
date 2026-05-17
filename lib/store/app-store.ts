"use client";

import { create } from "zustand";

type AppState = {
  sidebarOpen: boolean;
  filters: {
    month?: string;
    bank?: string;
    dseName?: string;
    cardType?: string;
    userName?: string;
  };
  setSidebarOpen: (open: boolean) => void;
  setFilter: (key: keyof AppState["filters"], value: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  filters: {},
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value || undefined } }))
}));

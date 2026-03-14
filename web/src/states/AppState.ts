import { create } from "zustand";
import { persist } from "zustand/middleware";

const initial = {
  apiKey: "",
};

type AppState = typeof initial & {
  setApiKey: (apiKey: string) => void;
};

export const useAppState = create<AppState>()(
  persist(
    (set) => ({
      ...initial,
      setApiKey: (apiKey: string) => set({ apiKey }),
    }),
    {
      name: "tobyfiles-storage",
      partialize: (state) => ({
        apiKey: state.apiKey,
      }),
    },
  ),
);

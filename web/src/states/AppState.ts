import { create } from "zustand";
import { persist } from "zustand/middleware";

const initial = {
  apiKey: "",
  redacted: true,
};

type AppState = typeof initial & {
  setApiKey: (apiKey: string) => void;
  setRedacted: (redacted: boolean) => void;
  toggleRedacted: () => void;
};

export const useAppState = create<AppState>()(
  persist(
    (set) => ({
      ...initial,
      setApiKey: (apiKey: string) => set({ apiKey }),
      setRedacted: (redacted: boolean) => set({ redacted }),
      toggleRedacted: () => set((state) => ({ redacted: !state.redacted })),
    }),
    {
      name: "tobyfiles-storage",
      partialize: (state) => ({
        apiKey: state.apiKey,
        redacted: state.redacted,
      }),
    },
  ),
);

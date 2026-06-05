"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AuthPayload, TokenPair, User } from "@/lib/types";

type AuthState = {
  user: User | null;
  tokens: TokenPair | null;
  hasHydrated: boolean;
  setHydrated: (hasHydrated: boolean) => void;
  setSession: (payload: AuthPayload) => void;
  setUser: (user: User) => void;
  setTokens: (tokens: TokenPair) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      hasHydrated: false,
      setHydrated: (hasHydrated) => set({ hasHydrated }),
      setSession: ({ user, tokens }) => set({ user, tokens }),
      setUser: (user) => set({ user }),
      setTokens: (tokens) => set({ tokens }),
      clearSession: () => set({ user: null, tokens: null })
    }),
    {
      name: "skillbridge-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);

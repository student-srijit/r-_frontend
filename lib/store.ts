import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { User } from "./auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hasHydrated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      hasHydrated: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
);

interface ResearchFilter {
  field?: string;
  difficulty?: string;
  searchTerm?: string;
}

interface ResearchState {
  filters: ResearchFilter;
  setFilters: (filters: ResearchFilter) => void;
  clearFilters: () => void;
}

export const useResearchStore = create<ResearchState>((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: {} }),
}));

interface LLMSessionCredentials {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
}

interface LLMSessionState {
  credentials: LLMSessionCredentials;
  setCredentials: (credentials: Partial<LLMSessionCredentials>) => void;
  clearCredentials: () => void;
  hasCredentials: () => boolean;
}

const defaultLLMSessionCredentials: LLMSessionCredentials = {
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  apiKey: "",
  baseUrl: "",
};

export const useLLMSessionStore = create<LLMSessionState>()(
  persist(
    (set, get) => ({
      credentials: defaultLLMSessionCredentials,
      setCredentials: (incoming) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            ...incoming,
          },
        })),
      clearCredentials: () =>
        set({ credentials: defaultLLMSessionCredentials }),
      hasCredentials: () => {
        const { apiKey, provider, model, baseUrl } = get().credentials;
        if (!apiKey.trim() || !provider.trim() || !model.trim()) {
          return false;
        }
        if (provider === "custom" && !baseUrl.trim()) {
          return false;
        }
        return true;
      },
    }),
    {
      name: "llm-session-credentials",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state || typeof window === "undefined") {
          return;
        }

        try {
          const currentHasApiKey = Boolean(state.credentials.apiKey.trim());
          if (currentHasApiKey) {
            return;
          }

          const legacyRaw = window.sessionStorage.getItem(
            "llm-session-credentials",
          );
          if (!legacyRaw) {
            return;
          }

          const legacyParsed = JSON.parse(legacyRaw);
          const legacyCredentials = legacyParsed?.state?.credentials;

          if (!legacyCredentials || !legacyCredentials.apiKey) {
            return;
          }

          state.setCredentials({
            provider:
              legacyCredentials.provider ||
              defaultLLMSessionCredentials.provider,
            model:
              legacyCredentials.model || defaultLLMSessionCredentials.model,
            apiKey: legacyCredentials.apiKey,
            baseUrl: legacyCredentials.baseUrl || "",
          });

          window.sessionStorage.removeItem("llm-session-credentials");
        } catch {
          // Ignore malformed legacy storage payload.
        }
      },
    },
  ),
);

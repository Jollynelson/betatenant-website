import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: { email: string; userId: string; fullName: string; role: string } | null;
  setAuth: (token: string, user: AuthState["user"]) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setAuth: (token, user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("BT_TOKEN", token);
      localStorage.setItem("BT_USER", JSON.stringify(user));
    }
    set({ token, user });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("BT_TOKEN");
      localStorage.removeItem("BT_USER");
    }
    set({ token: null, user: null });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("BT_TOKEN");
    const userRaw = localStorage.getItem("BT_USER");
    if (token && userRaw) {
      try {
        set({ token, user: JSON.parse(userRaw) });
      } catch {
        // malformed storage
      }
    }
  },
}));

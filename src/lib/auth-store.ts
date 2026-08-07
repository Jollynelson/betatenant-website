import { create } from "zustand";

interface AuthUser {
  email: string;
  userId: string;
  fullName: string;
  role: string;
  profilePic?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  setProfilePic: (url: string) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,

  setAuth: (token, user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("BT_TOKEN", token);
      localStorage.setItem("BT_USER", JSON.stringify(user));
    }
    set({ token, user });
  },

  setProfilePic: (url: string) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, profilePic: url };
    if (typeof window !== "undefined") {
      localStorage.setItem("BT_USER", JSON.stringify(updated));
    }
    set({ user: updated });
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

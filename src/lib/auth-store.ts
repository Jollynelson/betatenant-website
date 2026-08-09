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

// Safe storage wrapper — falls back to sessionStorage if localStorage is blocked
// (Chrome mobile in some privacy/incognito modes blocks localStorage)
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    try { sessionStorage.setItem(key, value); } catch { /* both blocked */ }
  }
}

function safeGet(key: string): string | null {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return v;
  } catch {}
  try {
    return sessionStorage.getItem(key);
  } catch {}
  return null;
}

function safeRemove(key: string) {
  try { localStorage.removeItem(key); } catch {}
  try { sessionStorage.removeItem(key); } catch {}
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,

  setAuth: (token, user) => {
    if (typeof window !== "undefined") {
      safeSet("BT_TOKEN", token);
      safeSet("BT_USER", JSON.stringify(user));
    }
    set({ token, user });
  },

  setProfilePic: (url: string) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, profilePic: url };
    if (typeof window !== "undefined") {
      safeSet("BT_USER", JSON.stringify(updated));
    }
    set({ user: updated });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      safeRemove("BT_TOKEN");
      safeRemove("BT_USER");
    }
    set({ token: null, user: null });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    const token   = safeGet("BT_TOKEN");
    const userRaw = safeGet("BT_USER");
    if (token && userRaw) {
      try {
        set({ token, user: JSON.parse(userRaw) });
      } catch {
        // malformed — clear it
        safeRemove("BT_TOKEN");
        safeRemove("BT_USER");
      }
    }
  },
}));

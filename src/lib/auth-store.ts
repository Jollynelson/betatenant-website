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

// Read from storage synchronously at module load — before any component renders.
// This guarantees AuthGuard always sees the correct token on hard refresh.
function readStoredAuth(): { token: string | null; user: AuthUser | null } {
  if (typeof window === "undefined") return { token: null, user: null };
  const token   = safeGet("BT_TOKEN");
  const userRaw = safeGet("BT_USER");
  if (!token || !userRaw) return { token: null, user: null };
  try { return { token, user: JSON.parse(userRaw) }; }
  catch { safeRemove("BT_TOKEN"); safeRemove("BT_USER"); return { token: null, user: null }; }
}

const initial = readStoredAuth();

export const useAuthStore = create<AuthState>((set, get) => ({
  token: initial.token,
  user:  initial.user,

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
    // Already hydrated synchronously at module load — this is a no-op kept for
    // backwards compatibility with any callers that still invoke it.
    if (get().token) return;
    const { token, user } = readStoredAuth();
    if (token) set({ token, user });
  },
}));

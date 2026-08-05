// localStorage-based favourites — matches live site exactly (no backend API)
const KEY = "BT_Favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorited(id: string): boolean {
  return getFavorites().includes(id);
}

export function toggleFavorite(id: string): boolean {
  const favs = getFavorites();
  let next: string[];
  if (favs.includes(id)) {
    next = favs.filter((f) => f !== id);
  } else {
    next = [...favs, id];
  }
  localStorage.setItem(KEY, JSON.stringify(next));
  return next.includes(id);
}

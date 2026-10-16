import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Only allow same-origin relative paths as post-login redirect targets.
export function sanitizeRedirect(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.startsWith("/") || url.startsWith("//")) return null;
  return url;
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return Promise.resolve(false);

  // Try legacy execCommand FIRST because it must run synchronously 
  // in the same tick as the user interaction on older iOS browsers.
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Prevent zooming and scrolling on iOS
    textArea.style.fontSize = "16px";
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (success) {
      return Promise.resolve(true);
    }
  } catch (err) {
    console.error("execCommand copy failed:", err);
  }

  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false);
  }

  return Promise.resolve(false);
}

export function formatLocation(address?: string, lga?: string, state?: string): string {
  const parts: string[] = [];
  const cleanAddr = (address || "").trim();
  const cleanLga = (lga || "").trim();
  const cleanState = (state || "").trim();

  if (
    cleanAddr &&
    cleanAddr.toLowerCase() !== cleanLga.toLowerCase() &&
    cleanAddr.toLowerCase() !== cleanState.toLowerCase()
  ) {
    parts.push(cleanAddr);
  }
  if (cleanLga && cleanLga.toLowerCase() !== cleanState.toLowerCase()) {
    parts.push(cleanLga);
  }
  if (cleanState) {
    parts.push(cleanState);
  }
  return parts.join(", ");
}


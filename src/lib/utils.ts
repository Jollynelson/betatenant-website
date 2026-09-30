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

  // If fallback failed, try modern API
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false);
  }

  return Promise.resolve(false);
}

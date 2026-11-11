// Shared browser helpers for review-page tracking (Phase 6).

const SESSION_KEY_STORAGE = "reviewflow-session-key";

// One stable random id per browser, kept in localStorage. It is NOT a
// fingerprint and carries no personal data — the server uses it only to
// avoid counting the same visit again within the dedupe window.
export function getSessionKey(): string {
  try {
    let key = window.localStorage.getItem(SESSION_KEY_STORAGE);
    if (!key) {
      key =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem(SESSION_KEY_STORAGE, key);
    }
    return key;
  } catch {
    // Storage blocked (private mode etc.) — fall back to a per-page id.
    return `s-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

// Fire-and-forget POST that survives opening a new tab / navigation.
// sendBeacon is preferred; fetch with keepalive is the fallback.
export function sendTrackingBeacon(path: string, payload: unknown): void {
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(path, blob)) return;
    }
  } catch {
    // fall through to fetch
  }
  fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Tracking must never break the visitor's experience.
  });
}

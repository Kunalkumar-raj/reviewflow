// Small date helpers (Asia/Kolkata friendly — uses the viewer's locale,
// dates are stored in UTC in Supabase).

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

// Key used to group events by calendar day in the viewer's timezone.
export function dayKey(date: Date): string {
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

export function dayLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

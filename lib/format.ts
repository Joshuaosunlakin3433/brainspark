/** Seconds → "18h 24m", "45m", or "0m". */
export function formatDuration(totalSeconds: number | null | undefined): string {
  const minutes = Math.round((totalSeconds ?? 0) / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** 2140 → "2.1k", 18240 → "18.2k", 950 → "950". */
export function formatCount(value: number | null | undefined): string {
  const n = value ?? 0;
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${trimZero((n / 1000).toFixed(1))}k`;
  return `${trimZero((n / 1_000_000).toFixed(1))}m`;
}

export function capitalize(value: string | null | undefined): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function trimZero(s: string) {
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

/** Seconds → "12:45" or "1:02:03" (video clock). */
export function formatClock(totalSeconds: number | null | undefined): string {
  const s = Math.max(0, Math.floor(totalSeconds ?? 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

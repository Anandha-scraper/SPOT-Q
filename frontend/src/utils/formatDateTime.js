// Format an ISO timestamp into "DD / MM / YYYY" + 12-hour "hh:mm:ss AM/PM".
export const formatDateTime = (iso) => {
  if (!iso) return { date: "—", time: "" };
  const d = new Date(iso);
  const date = d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, " / ");
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  return { date, time };
};

// Format a remaining duration as its two largest non-zero units: "12h 10m", "5m 30s", "45s".
// Anything at or below zero is "0s" — callers treat that as expired.
export const formatRemaining = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [
    [days, "d"],
    [hours, "h"],
    [minutes, "m"],
    [seconds, "s"],
  ]
    .filter(([value]) => value > 0)
    .slice(0, 2)
    .map(([value, unit]) => `${value}${unit}`);

  return parts.length ? parts.join(" ") : "0s";
};

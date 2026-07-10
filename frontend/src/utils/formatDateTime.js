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

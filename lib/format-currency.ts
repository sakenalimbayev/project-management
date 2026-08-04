export function formatTenge(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return "₸0";
  return `₸${Math.round(num).toLocaleString("en-US")}`;
}

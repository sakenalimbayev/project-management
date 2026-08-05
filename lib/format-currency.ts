export function formatTenge(
  value: string | number,
  options?: { decimals?: number }
): string {
  const num = typeof value === "string" ? Number(value) : value;
  const decimals = options?.decimals ?? 0;
  if (!Number.isFinite(num)) {
    return `₸${(0).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }
  return `₸${num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

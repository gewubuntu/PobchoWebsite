// Number formatting shared by server-rendered markup and the live token script.

const withCommas = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 10000000 → "10M", 92985 → "93K", 1234567 → "1.2M", 9999 → "9,999". */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  // [threshold, divisor, suffix] – thousands are only abbreviated above 10,000.
  const units: [number, number, string][] = [
    [1e12, 1e12, "T"],
    [1e9, 1e9, "B"],
    [1e6, 1e6, "M"],
    [1e4, 1e3, "K"],
  ];
  const [, divisor, suffix] = units.find(([limit]) => abs > limit) ?? [0, 1, ""];
  let text = (value / divisor).toFixed(1);
  if (text.endsWith(".0")) text = text.slice(0, -2);
  const [int = "0", dec] = text.split(".");
  return withCommas(int) + (dec ? `.${dec}` : "") + suffix;
}

/** Prices ≥ 1 get 2 decimals; small prices keep 4 significant digits (max 10 decimals). */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  if (Math.abs(value) >= 1) return value.toFixed(2);
  const zeros = -Math.floor(Math.log10(Math.abs(value)) + 1);
  if (zeros > 10) return "0";
  return String(parseFloat(value.toFixed(Math.min(zeros + 4, 10))));
}

/**
 * Formats a numeric price into a human-readable string with comma separators and kobo decimals (.00).
 * Examples:
 * - 800 => "800.00"
 * - 1200 => "1,200.00"
 * - 20000 => "20,000.00"
 * - 100000 => "100,000.00"
 * - 3000000 => "3,000,000.00"
 * - 1250.50 => "1,250.50"
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === "") return "0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return "0.00";

  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats price with currency symbol (default: ₦) and kobo precision.
 * Examples:
 * - 800 => "₦800.00"
 * - 1200 => "₦1,200.00"
 * - 20000 => "₦20,000.00"
 * - 100000 => "₦100,000.00"
 * - 3000000 => "₦3,000,000.00"
 */
export function formatPrice(amount: number | string | undefined | null, symbol = "₦"): string {
  return `${symbol}${formatCurrency(amount)}`;
}

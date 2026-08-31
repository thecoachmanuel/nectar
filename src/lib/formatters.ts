/**
 * Formats a numeric price into a human-readable string with comma separators.
 * Examples:
 * - 800 => "800"
 * - 1000 => "1,000"
 * - 20000 => "20,000"
 * - 100000 => "100,000"
 * - 3000000 => "3,000,000"
 * - 1250.50 => "1,250.50"
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === "") return "0";
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return "0";

  return num.toLocaleString("en-US", {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats price with currency symbol (default: ₦).
 * Examples:
 * - 800 => "₦800"
 * - 1000 => "₦1,000"
 * - 20000 => "₦20,000"
 * - 100000 => "₦100,000"
 * - 3000000 => "₦3,000,000"
 */
export function formatPrice(amount: number | string | undefined | null, symbol = "₦"): string {
  return `${symbol}${formatCurrency(amount)}`;
}

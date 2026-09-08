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

/**
 * Default Nigerian Timezone: West Africa Time (WAT, UTC+1)
 */
export const NIGERIAN_TIMEZONE = "Africa/Lagos";

/**
 * Helper to ensure a valid Date object is produced.
 */
function parseDate(dateInput: Date | string | number | undefined | null): Date | null {
  if (!dateInput) return null;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a Date/timestamp into a full Date & Time string in Nigerian Time (WAT, UTC+1).
 * Example output: "08 Sep 2026, 06:45 PM"
 */
export function formatDateTime(
  dateInput: Date | string | number | undefined | null,
  options?: Intl.DateTimeFormatOptions,
  timeZone = NIGERIAN_TIMEZONE
): string {
  const d = parseDate(dateInput);
  if (!d) return "N/A";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  };

  try {
    return new Intl.DateTimeFormat("en-NG", defaultOptions).format(d);
  } catch {
    return d.toLocaleString("en-NG", { timeZone, ...options });
  }
}

/**
 * Formats a Date/timestamp into a Date string in Nigerian Time (WAT, UTC+1).
 * Example output: "08 Sep 2026"
 */
export function formatDate(
  dateInput: Date | string | number | undefined | null,
  options?: Intl.DateTimeFormatOptions,
  timeZone = NIGERIAN_TIMEZONE
): string {
  const d = parseDate(dateInput);
  if (!d) return "N/A";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  };

  try {
    return new Intl.DateTimeFormat("en-NG", defaultOptions).format(d);
  } catch {
    return d.toLocaleDateString("en-NG", { timeZone, ...options });
  }
}

/**
 * Formats a Date/timestamp into a Time string in Nigerian Time (WAT, UTC+1).
 * Example output: "06:45 PM"
 */
export function formatTime(
  dateInput: Date | string | number | undefined | null,
  options?: Intl.DateTimeFormatOptions,
  timeZone = NIGERIAN_TIMEZONE
): string {
  const d = parseDate(dateInput);
  if (!d) return "N/A";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  };

  try {
    return new Intl.DateTimeFormat("en-NG", defaultOptions).format(d);
  } catch {
    return d.toLocaleTimeString("en-NG", { timeZone, ...options });
  }
}

/**
 * Returns current timestamp formatted directly in Nigerian Time (WAT, UTC+1).
 */
export function getNowNigerian(): string {
  return formatDateTime(new Date());
}

/**
 * Returns the current hour (0-23) in Nigerian Time (WAT, UTC+1).
 */
export function getNigerianHour(dateInput: Date | string | number = new Date()): number {
  const d = parseDate(dateInput) || new Date();
  try {
    const hourStr = new Intl.DateTimeFormat("en-NG", {
      timeZone: NIGERIAN_TIMEZONE,
      hour: "numeric",
      hour12: false,
    }).format(d);
    return parseInt(hourStr, 10) % 24;
  } catch {
    return d.getHours();
  }
}

/**
 * Returns a warm greeting ("Good Morning,", "Good Afternoon,", "Good Evening,") based on Nigerian Time.
 */
export function getNigerianGreeting(): string {
  const hour = getNigerianHour();
  if (hour < 12) return "Good Morning,";
  if (hour < 18) return "Good Afternoon,";
  return "Good Evening,";
}


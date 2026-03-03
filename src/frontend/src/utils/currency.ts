/** Convert user-facing float input to integer bigint (multiply by 100) */
export function toCurrencyBigInt(value: number | string): bigint {
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(num)) return BigInt(0);
  return BigInt(Math.round(num * 100));
}

/** Convert bigint storage units back to display float string */
export function fromCurrencyBigInt(value: bigint): string {
  const num = Number(value) / 100;
  return num.toFixed(2);
}

/** Format for display with 2 decimal places */
export function formatCurrency(value: bigint): string {
  return fromCurrencyBigInt(value);
}

/** Convert nanosecond bigint to milliseconds number */
export function bigintNanosToMs(nanos: bigint): number {
  return Number(nanos) / 1_000_000;
}

/** Check if an entry is overdue (unpaid + > 2 days old) */
export function isOverdue(paid: boolean, dateCreatedNanos: bigint): boolean {
  if (paid) return false;
  const createdMs = bigintNanosToMs(dateCreatedNanos);
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  return Date.now() - createdMs > twoDaysMs;
}

/** Format nanosecond bigint date to locale date string */
export function formatDate(nanos: bigint): string {
  const ms = bigintNanosToMs(nanos);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Build WhatsApp URL */
export function buildWhatsAppUrl(
  mobileNumber: string,
  name: string,
  totalAmount: bigint,
): string {
  // Strip non-digit chars, preserve leading +
  const hasPlus = mobileNumber.startsWith("+");
  const digits = mobileNumber.replace(/\D/g, "");
  const cleaned = hasPlus ? `+${digits}` : digits;
  const amount = formatCurrency(totalAmount);
  const message = `Hi ${name}, this is a payment reminder. Your total amount due is ${amount}. Please make the payment at your earliest convenience. Thank you!`;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

/**
 * Shared date / currency / label formatters.
 *
 * - formatCurrency:  1234.56 → "$1,234.56"   (USD, with cents)
 * - formatWholeCurrency:  1234.56 → "$1,235"  (no cents, for summary rows)
 * - formatSignedAmount:  Plaid amounts are sign-flipped — see note below.
 * - formatRelativeTime:  "2 min ago", "5 hr ago", "3 d ago"
 * - formatTransactionDate:  "Today" / "Yesterday" / "Mar 12"
 * - formatLastSynced:  "Last synced 2 min ago"
 */

// ─── Currency ───────────────────────────────────────────────

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || !isFinite(amount)) return "$0.00";
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatWholeCurrency(amount: number | null | undefined): string {
  if (amount == null || !isFinite(amount)) return "$0";
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format a Plaid transaction amount with the correct sign convention for UI.
 *
 * Plaid convention: positive = money leaving account (debit/spend),
 *                   negative = money arriving (credit/deposit).
 *
 * Charlie convention for UI: we show spending as negative ("-$45.00") and
 * income as positive ("+$1,200.00"), which matches what users expect from
 * banking apps.
 */
export function formatSignedAmount(
  amount: number,
  opts: { withSign?: boolean } = {}
): string {
  const { withSign = true } = opts;
  const isSpend = amount > 0;
  const abs = Math.abs(amount);
  const base = formatCurrency(abs);
  if (!withSign) return base;
  return isSpend ? `-${base}` : `+${base}`;
}

/**
 * Signed delta ("+$12.34" / "-$8.00") for arbitrary gains/losses — used for
 * today's-change labels where a positive number really IS a gain.
 */
export function formatSignedDelta(amount: number): string {
  const sign = amount >= 0 ? "+" : "-";
  return `${sign}${formatCurrency(Math.abs(amount))}`;
}

// ─── Time ───────────────────────────────────────────────────

const MIN_MS = 60 * 1000;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Short "x ago" label. Used for sync timestamps and action rows.
 */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (!isFinite(then)) return "never";

  const delta = Date.now() - then;
  if (delta < MIN_MS) return "just now";
  if (delta < HOUR_MS) {
    const m = Math.round(delta / MIN_MS);
    return `${m} min ago`;
  }
  if (delta < DAY_MS) {
    const h = Math.round(delta / HOUR_MS);
    return `${h} hr ago`;
  }
  if (delta < 7 * DAY_MS) {
    const d = Math.round(delta / DAY_MS);
    return `${d} d ago`;
  }
  // Fall back to short date
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Section-header style date grouping for the Activity screen.
 * - Today
 * - Yesterday
 * - Mar 12 (same year)
 * - Mar 12, 2024 (older)
 */
export function formatTransactionDate(iso: string): string {
  // Plaid txn dates are "YYYY-MM-DD" (local date, no time). Parse as local.
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  const txn = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (sameDay(txn, today)) return "Today";
  if (sameDay(txn, yesterday)) return "Yesterday";

  if (txn.getFullYear() === today.getFullYear()) {
    return txn.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return txn.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Group key used when bucketing transactions by day into section headers.
 * Returns a YYYY-MM-DD string so equal-day rows share a key.
 */
export function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function formatLastSynced(iso: string | null | undefined): string {
  if (!iso) return "Not synced yet";
  return `Last synced ${formatRelativeTime(iso)}`;
}

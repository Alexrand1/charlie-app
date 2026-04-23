/**
 * Account-level helpers for the Accounts + Account Detail screens.
 *
 * - groupAccounts: buckets Plaid accounts by type into the named sections
 *   shown in the flow (Checking / Savings / Credit Cards / Investing / Other).
 * - getAccountInitial: single-letter badge fallback when we don't have an
 *   institution logo.
 * - getAccountColor: deterministic accent color so each account row has a
 *   recognizable swatch.
 * - getAccountSubtitle: e.g. "Checking · 2.5% APY" or "Credit card · $2,500 limit"
 */

import type { PlaidAccount } from "@/services/plaid";
import { colors } from "@/constants/theme";

// Account "types" we collapse into a single section in the UI.
export type AccountSectionKey =
  | "checking"
  | "savings"
  | "credit"
  | "investment"
  | "loan"
  | "other";

export const SECTION_ORDER: AccountSectionKey[] = [
  "checking",
  "savings",
  "credit",
  "investment",
  "loan",
  "other",
];

export const SECTION_TITLES: Record<AccountSectionKey, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit Cards",
  investment: "Investing",
  loan: "Loans",
  other: "Other",
};

/** A PlaidAccount with any extra fields the detail endpoint sends back. */
export interface AppAccount extends PlaidAccount {
  itemId?: string;
  mask?: string | null;
  creditLimit?: number | null;
  apy?: number | null;
  institutionName?: string | null;
  lastSyncedAt?: string | null;
  updatedAt?: string;
}

export function sectionFor(a: AppAccount): AccountSectionKey {
  const t = (a.type || "").toLowerCase();
  if (t === "depository") {
    const sub = (a.subtype || "").toLowerCase();
    if (sub === "savings" || sub === "money market" || sub === "cd") return "savings";
    return "checking";
  }
  if (t === "credit") return "credit";
  if (t === "investment" || t === "brokerage") return "investment";
  if (t === "loan") return "loan";
  return "other";
}

/**
 * Bucket accounts into sections and preserve a stable order.
 * Sections with no accounts are omitted.
 */
export function groupAccounts(
  accounts: AppAccount[]
): { key: AccountSectionKey; title: string; accounts: AppAccount[] }[] {
  const buckets: Record<AccountSectionKey, AppAccount[]> = {
    checking: [],
    savings: [],
    credit: [],
    investment: [],
    loan: [],
    other: [],
  };
  for (const a of accounts) {
    buckets[sectionFor(a)].push(a);
  }
  // Within each section, sort by balance descending for a tidy layout.
  for (const key of SECTION_ORDER) {
    buckets[key].sort(
      (a, b) => (b.currentBalance ?? 0) - (a.currentBalance ?? 0)
    );
  }
  return SECTION_ORDER
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({ key: k, title: SECTION_TITLES[k], accounts: buckets[k] }));
}

export function getAccountInitial(a: AppAccount): string {
  const src = a.institutionName || a.officialName || a.name || "?";
  return src.trim()[0]?.toUpperCase() || "?";
}

// Deterministic palette — hash the accountId to pick a consistent color.
const ACCENTS = [
  colors.blue,
  "#3DAA6E",
  "#C94040",
  "#FF6B00",
  "#5B3DC9",
  "#0F7A9A",
];

export function getAccountColor(a: AppAccount): string {
  const id = a.accountId || a.name || "";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}

export function getAccountSubtitle(a: AppAccount): string {
  const sub = a.subtype ? capitalize(a.subtype) : capitalize(a.type || "Account");
  const parts: string[] = [sub];
  if (a.apy && a.apy > 0) {
    parts.push(`${(a.apy * 100).toFixed(2)}% APY`);
  } else if (a.creditLimit && a.creditLimit > 0) {
    parts.push(
      `$${a.creditLimit.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })} limit`
    );
  } else if (a.availableBalance != null && a.type?.toLowerCase() === "depository") {
    parts.push(
      `$${a.availableBalance.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })} available`
    );
  }
  return parts.join(" · ");
}

export function getAccountMask(a: AppAccount): string | null {
  return a.mask ? `••${a.mask}` : null;
}

function capitalize(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * Sum net worth across accounts, treating credit / loan balances as debt.
 * Shared by the Accounts screen header + Settings stats card.
 */
const DEBT_TYPES = new Set(["credit", "loan"]);
export function totalNetWorth(accounts: AppAccount[]): number {
  return accounts.reduce((sum, a) => {
    const bal = a.currentBalance ?? 0;
    return sum + (DEBT_TYPES.has((a.type || "").toLowerCase()) ? -bal : bal);
  }, 0);
}

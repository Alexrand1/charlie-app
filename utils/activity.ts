/**
 * Activity-feed helpers — merge acted-on insights with Plaid transactions
 * into a single timeline of section-grouped rows.
 */

import type { Insight } from "@/services/insights";
import type { PlaidTransaction } from "@/services/plaid";
import { dateKey, formatTransactionDate } from "./format";

export type FeedRow =
  | { kind: "action"; insight: Insight; date: string }
  | { kind: "txn"; txn: PlaidTransaction; date: string };

export type FeedSection = {
  key: string;     // YYYY-MM-DD
  title: string;   // "Today" / "Yesterday" / "Apr 20"
  rows: FeedRow[];
};

export type ActivityFilter = "all" | "actions" | "spending";

export function buildActivityFeed(
  transactions: PlaidTransaction[],
  actions: Insight[],
  filter: ActivityFilter = "all"
): FeedSection[] {
  const rows: FeedRow[] = [];

  if (filter === "all" || filter === "actions") {
    for (const insight of actions) {
      // Use actedAt if the backend provided it; otherwise fall back to
      // createdAt so the row always has a date.
      const actedAt = (insight as any).actedAt || insight.createdAt;
      rows.push({
        kind: "action",
        insight,
        date: actedAt,
      });
    }
  }
  if (filter === "all" || filter === "spending") {
    for (const txn of transactions) {
      rows.push({ kind: "txn", txn, date: txn.date });
    }
  }

  // Sort newest-first
  rows.sort((a, b) => b.date.localeCompare(a.date));

  // Bucket by date key
  const sectionMap = new Map<string, FeedRow[]>();
  for (const row of rows) {
    const k = dateKey(row.date);
    const bucket = sectionMap.get(k);
    if (bucket) bucket.push(row);
    else sectionMap.set(k, [row]);
  }

  return Array.from(sectionMap.entries()).map(([key, sectionRows]) => ({
    key,
    title: formatTransactionDate(key),
    rows: sectionRows,
  }));
}

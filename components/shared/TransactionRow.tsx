import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";
import { formatSignedAmount } from "@/utils/format";
import type { PlaidTransaction } from "@/services/plaid";

interface TransactionRowProps {
  txn: PlaidTransaction;
  showCategoryChip?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  dining: "🍽️",
  groceries: "🛒",
  transport: "🚗",
  shopping: "🛍️",
  subscriptions: "🔁",
  bills: "📄",
  other: "💳",
};

export function TransactionRow({ txn, showCategoryChip }: TransactionRowProps) {
  const title = txn.merchantName || txn.name || "Transaction";
  const isSpend = txn.amount > 0;
  const category = txn.category || "other";
  const icon = CATEGORY_ICONS[category] || "💳";

  return (
    <View style={s.row}>
      <View style={s.iconWrap}>
        <Text style={s.icon}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={s.metaRow}>
          <Text style={s.meta} numberOfLines={1}>
            {capitalize(category)}
            {txn.pending ? " · Pending" : ""}
          </Text>
        </View>
      </View>
      <Text style={[s.amount, !isSpend && { color: colors.positive }]}>
        {formatSignedAmount(txn.amount)}
      </Text>
    </View>
  );
}

function capitalize(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 16 },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  meta: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  amount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
});

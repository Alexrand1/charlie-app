import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  BackPill,
  Eyebrow,
  CharlieHeadline,
  CharlieSub,
  CharlieCard,
} from "@/components/shared";
import { getAccounts, PlaidAccount } from "@/services/plaid";
import { usePlaidLink } from "@/hooks/usePlaidLink";
import { colors } from "@/constants/theme";

const ADD_CATEGORIES = [
  { emoji: "🐷", title: "Savings", sub: "High-yield or checking savings" },
  { emoji: "📈", title: "Investing", sub: "Brokerage, IRA, or 401k" },
  { emoji: "🎯", title: "Betting", sub: "Kalshi, DraftKings, FanDuel" },
  { emoji: "➕", title: "Other", sub: "Credit cards, loans, crypto" },
];

export default function LinkAccountsScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);

  useEffect(() => {
    getAccounts().then(setAccounts).catch(() => {});
  }, []);

  const { openLink } = usePlaidLink({
    onSuccess: (freshAccounts) => {
      setAccounts(freshAccounts);
    },
  });

  const handleAddAccount = () => openLink();

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <BackPill />
      <View style={{ height: 14 }} />

      <Eyebrow text="Link accounts" />
      <View style={{ height: 4 }} />
      <CharlieHeadline
        plainPrefix="Unlock "
        italicEmphasis="more"
        plainSuffix={"\nwith more accounts"}
        size={26}
      />
      <View style={{ height: 6 }} />
      <CharlieSub text="The more you connect, the more Charlie can do for you." />
      <View style={{ height: 16 }} />

      {/* Connected accounts */}
      {accounts.length > 0 && (
        <>
          <Text style={s.sectionLabel}>CONNECTED</Text>
          {accounts.map((acct) => (
            <CharlieCard key={acct.accountId} cornerRadius={14} padding={12} style={{ marginBottom: 8 }}>
              <View style={s.connectedRow}>
                <View style={s.bankIcon}>
                  <Text style={{ fontSize: 18 }}>🏦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.bankName}>{acct.name}</Text>
                  <Text style={s.bankStatus}>● Connected</Text>
                </View>
                <Text style={s.bankBalance}>
                  ${(acct.currentBalance ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </Text>
              </View>
            </CharlieCard>
          ))}
          <View style={{ height: 16 }} />
        </>
      )}

      {/* Add accounts */}
      <Text style={s.sectionLabel}>ADD ACCOUNTS</Text>
      <View style={{ gap: 8, marginBottom: 16 }}>
        {ADD_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.title}
            style={s.addRow}
            onPress={handleAddAccount}
            activeOpacity={0.7}
          >
            <View style={s.addIcon}>
              <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.addTitle}>{cat.title}</Text>
              <Text style={s.addSub}>{cat.sub}</Text>
            </View>
            <View style={s.addBadge}>
              <Text style={s.addBadgeText}>+ Add</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.trustText}>
        Powered by Plaid · Read-only · 256-bit encryption
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 24, paddingTop: 54, paddingBottom: 24 },
  sectionLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  connectedRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  bankIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  bankName: { fontSize: 13, fontWeight: "600", color: colors.ink },
  bankStatus: { fontSize: 10, fontWeight: "600", color: colors.positive, marginTop: 2 },
  bankBalance: { fontSize: 13, fontWeight: "700", color: colors.ink },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMid,
    borderStyle: "dashed",
    gap: 11,
  },
  addIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  addTitle: { fontSize: 13, fontWeight: "600", color: colors.ink },
  addSub: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  addBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(22,40,68,0.08)",
    borderRadius: 8,
  },
  addBadgeText: { fontSize: 11, fontWeight: "700", color: colors.blue },
  trustText: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

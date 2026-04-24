import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import {
  BackPill,
  Eyebrow,
  CharlieHeadline,
  CharlieSub,
  CharlieCard,
  PlaidConnectSheet,
} from "@/components/shared";
import { getAccounts, removeAccount, removeAllItems, PlaidAccount } from "@/services/plaid";
import { usePlaidLink } from "@/hooks/usePlaidLink";
import { colors } from "@/constants/theme";

/**
 * Categories shown in the "Add accounts" section. Motivational copy per
 * the new design — the sub-line tells the user *why* they'd add each
 * category, not just what goes there. Reduced from 4 → 3; the old
 * "Other" catch-all is dropped (user can still link any product via
 * Plaid search once the sheet opens).
 */
const ADD_CATEGORIES = [
  { emoji: "🐷", title: "Savings account", sub: "Track your savings goal" },
  { emoji: "📈", title: "Brokerage / investing", sub: "Put surplus to work" },
  { emoji: "🎯", title: "Betting markets", sub: "Kalshi, prediction markets" },
];

export default function LinkAccountsScreen() {
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    getAccounts().then(setAccounts).catch(() => {});
  }, []);

  const { openLink, loading: plaidLoading } = usePlaidLink({
    onSuccess: (freshAccounts) => {
      setAccounts(freshAccounts);
    },
  });

  /** Show the Charlie intro sheet; on Continue we kick off Plaid Link. */
  const handleAddAccount = () => setSheetVisible(true);

  const handleContinueWithPlaid = () => {
    setSheetVisible(false);
    // Give the Modal a tick to finish dismissing before Plaid's SDK
    // tries to present its own modal — otherwise iOS can refuse to stack.
    setTimeout(() => openLink(), 220);
  };

  /** Long-press a connected row to confirm removal. Tapping the row alone
   *  is a no-op for now (we may route to an account detail later). */
  const handleLongPressAccount = (acct: PlaidAccount) => {
    Alert.alert(
      "Remove Account",
      `Remove ${acct.name}? This will also delete its transaction history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeAccount(acct.accountId);
              setAccounts((prev) => prev.filter((a) => a.accountId !== acct.accountId));
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.message || err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <BackPill />
      <View style={{ height: 14 }} />

      <Eyebrow text="Link accounts" />
      <View style={{ height: 4 }} />
      <CharlieHeadline
        plainPrefix="Link "
        italicEmphasis="more"
        plainSuffix=" accounts"
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
            <CharlieCard
              key={acct.accountId}
              cornerRadius={14}
              padding={12}
              style={{ marginBottom: 8 }}
            >
              <TouchableOpacity
                onLongPress={() => handleLongPressAccount(acct)}
                delayLongPress={400}
                activeOpacity={0.85}
              >
                <View style={s.connectedRow}>
                  <View style={s.bankIcon}>
                    <Text style={{ fontSize: 18 }}>🏦</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.bankName}>{acct.name}</Text>
                    <Text style={s.bankStatus}>● Connected</Text>
                  </View>
                  <Text
                    style={[
                      s.bankBalance,
                      ["credit", "loan"].includes(acct.type) && s.debtBalance,
                    ]}
                  >
                    {["credit", "loan"].includes(acct.type) ? "-" : ""}$
                    {(acct.currentBalance ?? 0).toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            </CharlieCard>
          ))}
          <Text style={s.holdHint}>Hold a bank to remove</Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Remove All Accounts",
                "This will remove all linked banks, accounts, and transaction history. You can re-link afterwards.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove All",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await removeAllItems();
                        setAccounts([]);
                      } catch (err: any) {
                        Alert.alert("Error", err.response?.data?.message || err.message);
                      }
                    },
                  },
                ]
              )
            }
          >
            <Text style={s.removeAllText}>Remove all accounts</Text>
          </TouchableOpacity>
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

      <PlaidConnectSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onContinue={handleContinueWithPlaid}
        loading={plaidLoading}
      />
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
  debtBalance: { color: colors.negative },
  holdHint: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  removeAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.negative,
    textAlign: "center",
    marginTop: 2,
  },
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

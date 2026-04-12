import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/services/api";
import { auth, AuthUser } from "@/services/auth";
import {
  getAccounts,
  getTransactions,
  sandboxConnect,
  syncTransactions,
  getLinkToken,
  PlaidAccount,
  PlaidTransaction,
} from "@/services/plaid";
import { colors, spacing, radii } from "@/constants/theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:3000";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      try {
        const response = await api.get("/users/me");
        setUser(response.data.user);
      } catch {
        const cached = await auth.getUser();
        if (cached) setUser(cached);
      }
      try {
        const accts = await getAccounts();
        setAccounts(accts);
        if (accts.length > 0) {
          const txns = await getTransactions({ limit: 20 }).catch(() => []);
          setTransactions(txns);
        }
      } catch {
        // No accounts yet
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleConnectBank = () => {
    Alert.alert("Connect Bank", "Choose how to connect:", [
      { text: "Sandbox (Quick Test)", onPress: handleSandboxConnect },
      { text: "Plaid Link (Browser)", onPress: handlePlaidLink },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSandboxConnect = async () => {
    setConnecting(true);
    try {
      const result = await sandboxConnect();
      Alert.alert(
        "Bank Connected!",
        `${result.institution}: ${result.accounts} account(s), ${result.transactions_synced} transactions synced.`
      );
      fetchData();
    } catch (err: any) {
      Alert.alert("Connection Failed", err.response?.data?.message || err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handlePlaidLink = async () => {
    setConnecting(true);
    try {
      const linkToken = await getLinkToken();
      await Linking.openURL(
        `${API_URL}/plaid/link-page?link_token=${linkToken}&scheme=charlie`
      );
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncTransactions();
      Alert.alert("Sync Complete", `${result.synced} new transaction(s).`);
      fetchData();
    } catch (err: any) {
      Alert.alert("Sync Failed", err.response?.data?.message || err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.yellow} />
      </View>
    );
  }

  const hasAccounts = accounts.length > 0;
  const netWorth = hasAccounts
    ? accounts.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0)
    : null;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.yellow}
        />
      }
    >
      {/* ─── Greeting ────────────────────────────── */}
      <Text style={s.greeting}>
        {getGreeting()},{"\n"}
        <Text style={s.greetingName}>{user?.firstName || "there"}</Text>
      </Text>
      <Text style={s.date}>{formatDate()}</Text>

      {/* ─── Net Worth ───────────────────────────── */}
      <View style={s.netWorthCard}>
        <Text style={s.sectionLabel}>NET WORTH</Text>
        {netWorth !== null ? (
          <Text style={s.netWorthValue}>
            ${netWorth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Text>
        ) : (
          <>
            <Text style={s.netWorthPlaceholder}>$—</Text>
            <TouchableOpacity onPress={handleConnectBank}>
              <Text style={s.netWorthLink}>+ Link accounts →</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ─── Action Row ──────────────────────────── */}
      <View style={s.actionRow}>
        {[
          { label: "Transfer", icon: "↗", onPress: () => {} },
          { label: "Budget", icon: "📊", onPress: () => {} },
          { label: "Goals", icon: "🎯", onPress: () => router.push("/tabs/goals") },
        ].map((action, i) => (
          <TouchableOpacity
            key={i}
            style={s.actionBtn}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <Text style={s.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Accounts (if linked) ────────────────── */}
      {hasAccounts && (
        <>
          <View style={s.sectionRow}>
            <Text style={s.sectionLabel}>ACCOUNTS</Text>
            <TouchableOpacity onPress={handleConnectBank}>
              <Text style={s.yellowLink}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {accounts.map((acct) => (
            <View key={acct.accountId} style={s.card}>
              <View style={s.cardRow}>
                <View>
                  <Text style={s.cardTitle}>{acct.name}</Text>
                  <Text style={s.cardMeta}>
                    {acct.type} · {acct.subtype}
                  </Text>
                </View>
                <Text style={s.amountText}>
                  ${(acct.currentBalance ?? 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* ─── Transactions (if linked) ────────────── */}
      {hasAccounts && (
        <>
          <View style={s.sectionRow}>
            <Text style={s.sectionLabel}>RECENT TRANSACTIONS</Text>
            <TouchableOpacity onPress={handleSync} disabled={syncing}>
              <Text style={s.yellowLink}>
                {syncing ? "Syncing..." : "↻ Sync"}
              </Text>
            </TouchableOpacity>
          </View>
          {transactions.length === 0 ? (
            <View style={s.card}>
              <Text style={s.cardMeta}>
                Tap Sync to pull your latest transactions
              </Text>
            </View>
          ) : (
            transactions.map((txn) => (
              <View key={txn.transactionId} style={s.card}>
                <View style={s.cardRow}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={s.cardTitle}>
                      {txn.merchantName || "Unknown"}
                    </Text>
                    <Text style={s.cardMeta}>
                      {txn.date} · {txn.category}
                      {txn.pending ? " · Pending" : ""}
                    </Text>
                  </View>
                  <Text
                    style={[
                      s.amountText,
                      { color: txn.amount > 0 ? colors.negative : colors.positive },
                    ]}
                  >
                    {txn.amount > 0 ? "-" : "+"}$
                    {Math.abs(txn.amount).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </>
      )}

      {/* ─── Module Cards (empty state) ──────────── */}
      {!hasAccounts && (
        <>
          {[
            { emoji: "💳", title: "Spending", hint: "See where your money goes" },
            { emoji: "💰", title: "Savings", hint: "Track what you're building" },
            { emoji: "📈", title: "Investments", hint: "Watch your money grow" },
          ].map((mod, i) => (
            <TouchableOpacity
              key={i}
              style={s.moduleCard}
              onPress={handleConnectBank}
              activeOpacity={0.7}
            >
              <Text style={s.moduleEmoji}>{mod.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{mod.title}</Text>
                <Text style={s.cardMeta}>{mod.hint}</Text>
              </View>
              <View style={s.ghostBtn}>
                <Text style={s.ghostBtnText}>Link</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* ─── Ask Charlie CTA ─────────────────────── */}
      <TouchableOpacity
        style={s.charlieCta}
        onPress={() => router.push("/tabs/ask")}
        activeOpacity={0.7}
      >
        <Text style={s.charlieCtaText}>Ask Charlie anything →</Text>
      </TouchableOpacity>

      {/* ─── Bottom Status ───────────────────────── */}
      <View style={s.bottomStatus}>
        <Text style={s.bottomText}>
          Charlie has {accounts.length} account
          {accounts.length !== 1 ? "s" : ""} connected
        </Text>
        {!hasAccounts && (
          <TouchableOpacity onPress={handleConnectBank}>
            <Text style={s.bottomLink}>Connect your first account →</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface0,
  },
  scroll: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: spacing.xl, paddingBottom: 40 },

  // Greeting
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  greetingName: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.cream,
  },
  date: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xl,
  },

  // Net Worth
  netWorthCard: {
    backgroundColor: colors.surface1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.xxl,
    marginBottom: spacing.lg,
  },
  netWorthValue: {
    fontSize: 32,
    fontWeight: "400",
    color: colors.cream,
    marginTop: spacing.sm,
  },
  netWorthPlaceholder: {
    fontSize: 32,
    fontWeight: "400",
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  netWorthLink: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.yellow,
    marginTop: spacing.sm,
  },

  // Section labels (DM Mono style — uppercase, sage)
  sectionLabel: {
    fontSize: 11,
    fontWeight: "400",
    color: colors.sage,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },

  // Action Row
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.yellow,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textOnYellow,
  },

  // Generic card
  card: {
    backgroundColor: colors.surface1,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.cream,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "400",
    color: colors.cream,
  },

  // Yellow link
  yellowLink: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.yellow,
  },

  // Module cards (empty state)
  moduleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface1,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  moduleEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.yellow,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  ghostBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.yellow,
  },

  // Charlie CTA
  charlieCta: {
    backgroundColor: colors.yellow,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  charlieCtaText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textOnYellow,
  },

  // Bottom status
  bottomStatus: {
    alignItems: "center",
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  bottomText: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  bottomLink: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.yellow,
    marginTop: spacing.sm,
  },
});

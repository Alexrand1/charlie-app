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
import {
  getInsights,
  generateInsights,
  dismissInsight,
  Insight,
} from "@/services/insights";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:3000";

const INSIGHT_ICONS: Record<string, string> = {
  MOVE_MONEY: "💸",
  STOP_LEAK: "🚨",
  PATTERN: "📊",
  NONE: "💡",
};

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
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);
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
          const [txns, insightData] = await Promise.all([
            getTransactions({ limit: 20 }).catch(() => []),
            getInsights().catch(() => []),
          ]);
          setTransactions(txns);
          setInsights(insightData);
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

  const handleConnectBank = async () => {
    Alert.alert(
      "Connect Bank",
      "Choose how to connect your bank account:",
      [
        { text: "Sandbox (Quick Test)", onPress: handleSandboxConnect },
        { text: "Plaid Link (Browser)", onPress: handlePlaidLink },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleSandboxConnect = async () => {
    setConnecting(true);
    try {
      const result = await sandboxConnect();
      Alert.alert(
        "Bank Connected!",
        `${result.institution}: ${result.accounts} account(s) linked, ${result.transactions_synced} transactions synced.`
      );
      fetchData();
    } catch (err: any) {
      Alert.alert(
        "Connection Failed",
        err.response?.data?.message || err.message || "Unknown error"
      );
    } finally {
      setConnecting(false);
    }
  };

  const handlePlaidLink = async () => {
    setConnecting(true);
    try {
      const linkToken = await getLinkToken();
      const url = `${API_URL}/plaid/link-page?link_token=${linkToken}&scheme=charlie`;
      await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || err.message || "Could not start Plaid Link"
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleGenerateInsights = async () => {
    setGeneratingInsights(true);
    try {
      const result = await generateInsights();
      setInsights(result.insights);
      if (result.generated === 0) {
        Alert.alert("No New Insights", "Charlie didn't find anything new to flag right now.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || err.message);
    } finally {
      setGeneratingInsights(false);
    }
  };

  const handleDismissInsight = async (insight: Insight) => {
    try {
      await dismissInsight(insight.insightId, insight.createdAt);
      setInsights((prev) => prev.filter((i) => i.insightId !== insight.insightId));
    } catch {
      // silently fail
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncTransactions();
      Alert.alert(
        "Sync Complete",
        `${result.synced} new transaction(s) from ${result.items} item(s).`
      );
      fetchData();
    } catch (err: any) {
      Alert.alert("Sync Failed", err.response?.data?.message || err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1B2A4A" />
      </View>
    );
  }

  const hasAccounts = accounts.length > 0;
  const netWorth = hasAccounts
    ? accounts.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0)
    : null;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* ─── Header ──────────────────────────────────── */}
      <Text style={styles.greeting}>
        {getGreeting()}, {user?.firstName || "there"}
      </Text>
      <Text style={styles.date}>{formatDate()}</Text>

      {/* ─── Net Worth ───────────────────────────────── */}
      <View style={styles.netWorthCard}>
        <Text style={styles.netWorthLabel}>Net Worth</Text>
        {netWorth !== null ? (
          <Text style={styles.netWorthValue}>
            ${netWorth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Text>
        ) : (
          <View>
            <Text style={styles.netWorthPlaceholder}>$—</Text>
            <Text style={styles.netWorthHint}>
              Link accounts to see your number
            </Text>
          </View>
        )}
      </View>

      {/* ─── Action Row ──────────────────────────────── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleConnectBank}
          disabled={connecting}
        >
          {connecting ? (
            <ActivityIndicator size="small" color="#1B2A4A" />
          ) : (
            <>
              <Text style={styles.actionIcon}>+</Text>
              <Text style={styles.actionLabel}>Link Account</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
          <Text style={styles.actionIcon}>↗</Text>
          <Text style={styles.actionLabel}>Transfer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionLabel}>Budget</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Charlie CTA ─────────────────────────────── */}
      <TouchableOpacity
        style={styles.charlieCta}
        onPress={() => router.push("/tabs/ask")}
        activeOpacity={0.7}
      >
        <Text style={styles.charlieCtaText}>
          Ask Charlie anything about your money →
        </Text>
      </TouchableOpacity>

      {/* ─── Insights ────────────────────────────────── */}
      {hasAccounts && insights.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Insights</Text>
            <TouchableOpacity
              onPress={handleGenerateInsights}
              disabled={generatingInsights}
            >
              <Text style={styles.linkBtn}>
                {generatingInsights ? "Analyzing..." : "↻ Refresh"}
              </Text>
            </TouchableOpacity>
          </View>
          {insights.map((insight) => (
            <View key={insight.insightId} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightIcon}>
                  {INSIGHT_ICONS[insight.actionType] || "💡"}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDismissInsight(insight)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.dismissBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.insightText}>{insight.insight}</Text>
              {insight.actionLabel && (
                <View style={styles.insightAction}>
                  <Text style={styles.insightActionText}>
                    {insight.actionLabel}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </>
      )}

      {/* ─── Spending Module ─────────────────────────── */}
      {hasAccounts ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={handleSync} disabled={syncing}>
              <Text style={styles.linkBtn}>
                {syncing ? "Syncing..." : "↻ Sync"}
              </Text>
            </TouchableOpacity>
          </View>
          {transactions.length === 0 ? (
            <View style={styles.moduleCard}>
              <Text style={styles.moduleEmoji}>💳</Text>
              <View style={styles.moduleContent}>
                <Text style={styles.moduleTitle}>Spending</Text>
                <Text style={styles.moduleHint}>
                  Tap Sync to pull your latest transactions
                </Text>
              </View>
            </View>
          ) : (
            transactions.map((txn) => (
              <View key={txn.transactionId} style={styles.txnCard}>
                <View style={styles.txnRow}>
                  <View style={styles.txnLeft}>
                    <Text style={styles.txnMerchant}>
                      {txn.merchantName || "Unknown"}
                    </Text>
                    <Text style={styles.txnMeta}>
                      {txn.date} · {txn.category}
                      {txn.pending ? " · Pending" : ""}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txnAmount,
                      txn.amount > 0 ? styles.txnDebit : styles.txnCredit,
                    ]}
                  >
                    {txn.amount > 0 ? "-" : "+"}$
                    {Math.abs(txn.amount).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* Accounts */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accounts</Text>
            <TouchableOpacity onPress={handleConnectBank} disabled={connecting}>
              <Text style={styles.linkBtn}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {accounts.map((acct) => (
            <View key={acct.accountId} style={styles.accountCard}>
              <View style={styles.accountRow}>
                <View>
                  <Text style={styles.accountName}>{acct.name}</Text>
                  <Text style={styles.accountType}>
                    {acct.type} · {acct.subtype}
                  </Text>
                </View>
                <Text style={styles.balance}>
                  ${(acct.currentBalance ?? 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          ))}
        </>
      ) : (
        <>
          {/* ─── Empty Modules ───────────────────────── */}
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={handleConnectBank}
            activeOpacity={0.7}
          >
            <Text style={styles.moduleEmoji}>💳</Text>
            <View style={styles.moduleContent}>
              <View style={styles.moduleRow}>
                <Text style={styles.moduleTitle}>Spending</Text>
                <Text style={styles.moduleLinkText}>Link</Text>
              </View>
              <Text style={styles.moduleHint}>
                See where your money goes
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => router.push("/tabs/goals")}
            activeOpacity={0.7}
          >
            <Text style={styles.moduleEmoji}>💰</Text>
            <View style={styles.moduleContent}>
              <View style={styles.moduleRow}>
                <Text style={styles.moduleTitle}>Savings Goals</Text>
                <Text style={styles.moduleLinkText}>Link</Text>
              </View>
              <Text style={styles.moduleHint}>
                Track what you're building
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleCard}
            onPress={handleConnectBank}
            activeOpacity={0.7}
          >
            <Text style={styles.moduleEmoji}>📈</Text>
            <View style={styles.moduleContent}>
              <View style={styles.moduleRow}>
                <Text style={styles.moduleTitle}>Investments</Text>
                <Text style={styles.moduleLinkText}>Link</Text>
              </View>
              <Text style={styles.moduleHint}>
                Watch your money grow
              </Text>
            </View>
          </TouchableOpacity>
        </>
      )}

      {/* ─── Generate Insights CTA ───────────────────── */}
      {hasAccounts && insights.length === 0 && (
        <TouchableOpacity
          style={styles.generateCard}
          onPress={handleGenerateInsights}
          disabled={generatingInsights}
          activeOpacity={0.8}
        >
          {generatingInsights ? (
            <ActivityIndicator color="#1B2A4A" />
          ) : (
            <>
              <Text style={styles.generateIcon}>✨</Text>
              <Text style={styles.generateText}>
                Get personalized insights from Charlie
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* ─── Bottom Status ───────────────────────────── */}
      <View style={styles.bottomStatus}>
        <Text style={styles.bottomText}>
          Charlie connected {accounts.length} account
          {accounts.length !== 1 ? "s" : ""}
        </Text>
        {!hasAccounts && (
          <TouchableOpacity onPress={handleConnectBank}>
            <Text style={styles.bottomLink}>
              Connect your first account →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  scroll: { flex: 1, backgroundColor: "#F5F7FA" },
  content: { padding: 20, paddingBottom: 40 },

  // Header
  greeting: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1B2A4A",
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 20,
  },

  // Net Worth
  netWorthCard: {
    backgroundColor: "#1B2A4A",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  netWorthLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  netWorthValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  netWorthPlaceholder: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#475569",
  },
  netWorthHint: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  // Action Row
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  actionIcon: { fontSize: 20, marginBottom: 4 },
  actionLabel: { fontSize: 12, fontWeight: "600", color: "#1B2A4A" },

  // Charlie CTA
  charlieCta: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  charlieCtaText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4338CA",
    textAlign: "center",
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1B2A4A" },
  linkBtn: { fontSize: 14, fontWeight: "600", color: "#3B82F6" },

  // Module cards (empty state)
  moduleCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  moduleEmoji: { fontSize: 28, marginRight: 14 },
  moduleContent: { flex: 1 },
  moduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moduleTitle: { fontSize: 16, fontWeight: "600", color: "#1B2A4A" },
  moduleLinkText: { fontSize: 13, fontWeight: "600", color: "#3B82F6" },
  moduleHint: { fontSize: 13, color: "#94A3B8", marginTop: 2 },

  // Account cards
  accountCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountName: { fontSize: 16, fontWeight: "600", color: "#1B2A4A" },
  accountType: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  balance: { fontSize: 18, fontWeight: "bold", color: "#1B2A4A" },

  // Transaction cards
  txnCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  txnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  txnLeft: { flex: 1, marginRight: 12 },
  txnMerchant: { fontSize: 15, fontWeight: "500", color: "#1B2A4A" },
  txnMeta: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  txnAmount: { fontSize: 16, fontWeight: "600" },
  txnDebit: { color: "#1B2A4A" },
  txnCredit: { color: "#10B981" },

  // Insight cards
  insightCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  insightIcon: { fontSize: 20 },
  dismissBtn: { fontSize: 16, color: "#94A3B8", padding: 4 },
  insightText: {
    fontSize: 14,
    color: "#1E293B",
    lineHeight: 20,
    marginBottom: 8,
  },
  insightAction: {
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  insightActionText: { fontSize: 13, fontWeight: "600", color: "#92400E" },

  // Generate insights CTA
  generateCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  generateIcon: { fontSize: 18, marginRight: 8 },
  generateText: { fontSize: 14, color: "#64748B", fontWeight: "500" },

  // Bottom status
  bottomStatus: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    marginTop: 12,
  },
  bottomText: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 4,
  },
  bottomLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
    marginTop: 4,
  },
});

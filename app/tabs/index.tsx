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

export default function HomeScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch profile
      try {
        const response = await api.get("/users/me");
        setUser(response.data.user);
      } catch {
        const cached = await auth.getUser();
        if (cached) setUser(cached);
      }

      // Fetch accounts
      try {
        const accts = await getAccounts();
        setAccounts(accts);

        // If we have accounts, also fetch recent transactions and insights
        if (accts.length > 0) {
          const [txns, insightData] = await Promise.all([
            getTransactions({ limit: 20 }).catch(() => []),
            getInsights().catch(() => []),
          ]);
          setTransactions(txns);
          setInsights(insightData);
        }
      } catch {
        // No accounts yet, that's fine
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
        {
          text: "Sandbox (Quick Test)",
          onPress: handleSandboxConnect,
        },
        {
          text: "Plaid Link (Browser)",
          onPress: handlePlaidLink,
        },
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
      fetchData(); // Refresh to show new accounts
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
      Alert.alert("Sync Complete", `${result.synced} new transaction(s) from ${result.items} item(s).`);
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

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Greeting */}
      <Text style={styles.greeting}>Hey, {user?.firstName || "there"}</Text>
      <Text style={styles.subtitle}>
        {hasAccounts ? "Here's your financial snapshot" : "Welcome to Charlie"}
      </Text>

      {/* Insights */}
      {hasAccounts && insights.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Insights</Text>
            <TouchableOpacity
              onPress={handleGenerateInsights}
              disabled={generatingInsights}
            >
              <Text style={styles.addButton}>
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

      {/* Generate Insights CTA (when accounts exist but no insights) */}
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

      {/* Connect Bank Card (shown when no accounts) */}
      {!hasAccounts && (
        <TouchableOpacity
          style={styles.connectCard}
          onPress={handleConnectBank}
          disabled={connecting}
          activeOpacity={0.8}
        >
          {connecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.connectIcon}>🏦</Text>
              <Text style={styles.connectTitle}>Connect Your Bank</Text>
              <Text style={styles.connectBody}>
                Link your bank account to start tracking spending and get
                personalized insights.
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Accounts */}
      {hasAccounts && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accounts</Text>
            <TouchableOpacity onPress={handleConnectBank} disabled={connecting}>
              <Text style={styles.addButton}>+ Add</Text>
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
      )}

      {/* Transactions */}
      {hasAccounts && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={handleSync} disabled={syncing}>
              <Text style={styles.addButton}>
                {syncing ? "Syncing..." : "↻ Sync"}
              </Text>
            </TouchableOpacity>
          </View>
          {transactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No transactions yet. Tap Sync to pull from your bank.
              </Text>
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
        </>
      )}
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
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1B2A4A",
    marginBottom: 4,
  },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 20 },

  // Connect bank card
  connectCard: {
    backgroundColor: "#1B2A4A",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  connectIcon: { fontSize: 40, marginBottom: 12 },
  connectTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  connectBody: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
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
  addButton: { fontSize: 14, fontWeight: "600", color: "#3B82F6" },

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
  insightText: { fontSize: 14, color: "#1E293B", lineHeight: 20, marginBottom: 8 },
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

  // Empty state
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, color: "#94A3B8", textAlign: "center" },
});

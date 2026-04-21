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
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/services/api";
import { auth, AuthUser } from "@/services/auth";
import {
  getAccounts,
  getTransactions,
  syncAllItems,
  PlaidAccount,
  PlaidTransaction,
} from "@/services/plaid";
import { getInsights, generateInsights, dismissInsight, Insight } from "@/services/insights";
import { usePlaidLink } from "@/hooks/usePlaidLink";
import { colors, spacing, radii } from "@/constants/theme";

// ─── Tag display mapping for insight action types ────────────
const ACTION_TAG: Record<string, string> = {
  MOVE_MONEY: "Move Money",
  STOP_LEAK: "Stop a Leak",
  PATTERN: "Fix a Habit",
  NONE: "Insight",
};

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch user
      try {
        const response = await api.get("/users/me");
        setUser(response.data.user);
      } catch {
        const cached = await auth.getUser();
        if (cached) setUser(cached);
      }
      // Fetch accounts + transactions
      let accts: PlaidAccount[] = [];
      try {
        accts = await getAccounts();
        setAccounts(accts);
        if (accts.length > 0) {
          const txns = await getTransactions({ limit: 20 }).catch(() => []);
          setTransactions(txns);
        }
      } catch {
        // No accounts yet
      }
      // Fetch insights / actions — auto-generate if none exist
      try {
        let ins = await getInsights();
        // If no insights exist and user has linked accounts, generate on-demand
        if (ins.length === 0 && accts.length > 0) {
          try {
            console.log("[Charlie] No insights found, generating via Claude...");
            const result = await generateInsights();
            console.log("[Charlie] Generated", result.generated, "insight(s)");
            ins = result.insights;
          } catch (genErr: any) {
            console.error("[Charlie] Insight generation failed:", genErr.response?.status, genErr.response?.data || genErr.message);
          }
        }
        setInsights(ins);
      } catch (fetchErr: any) {
        console.error("[Charlie] Fetch insights failed:", fetchErr.response?.status, fetchErr.response?.data || fetchErr.message);
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

  const { openLink: openPlaidLink, loading: plaidLoading } = usePlaidLink({
    onSuccess: () => {
      fetchData();
    },
  });

  const handleConnectBank = () => openPlaidLink();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncAllItems();
      // After syncing fresh transactions, regenerate insights
      try {
        const insightResult = await generateInsights();
        if (insightResult.insights.length > 0) {
          setInsights(insightResult.insights);
        }
      } catch {
        // Insight generation is best-effort after sync
      }
      const msg = result.errors.length > 0
        ? `${result.totalSynced} new transaction(s). ${result.errors.length} item(s) failed.`
        : `${result.totalSynced} new transaction(s).`;
      Alert.alert("Sync Complete", msg);
      fetchData();
    } catch (err: any) {
      Alert.alert("Sync Failed", err.response?.data?.message || err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleActionPress = (insight: Insight) => {
    const routes: Record<string, string> = {
      MOVE_MONEY: "/actions/move-money",
      STOP_LEAK: "/actions/cancel-subscription",
      PATTERN: "/actions/fix-habit",
    };
    const route = routes[insight.actionType];
    if (route) {
      // Pass insight data as route params so action screens use real data
      router.push({
        pathname: route as any,
        params: {
          insightId: insight.insightId,
          createdAt: insight.createdAt,
          insightText: insight.insight,
          actionLabel: insight.actionLabel || "",
          actionDetail: insight.actionDetail || "",
          actionValue: JSON.stringify(insight.actionValue || {}),
        },
      });
    }
  };

  const handleDismissInsight = async (insight: Insight) => {
    try {
      await dismissInsight(insight.insightId, insight.createdAt);
      setInsights((prev) =>
        prev.filter((i) => i.insightId !== insight.insightId)
      );
    } catch {
      // Silently fail — will reappear on next refresh
    }
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  const hasAccounts = accounts.length > 0;
  const DEBT_TYPES = ["credit", "loan"];
  const totalBalance = hasAccounts
    ? accounts.reduce((sum, a) => {
        const bal = a.currentBalance ?? 0;
        return sum + (DEBT_TYPES.includes(a.type) ? -bal : bal);
      }, 0)
    : null;

  return (
    <View style={s.root}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.blue}
          />
        }
      >
        {/* ─── Greeting ────────────────────────────────── */}
        <Text style={s.greeting}>
          Hey {user?.firstName || "there"} 👋
        </Text>

        {/* ─── Total Balance ───────────────────────────── */}
        <Text style={s.balanceLabel}>TOTAL BALANCE</Text>
        {totalBalance !== null ? (
          <>
            <Text style={s.balanceValue}>
              ${totalBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </Text>
            <Text style={s.balanceTrend}>↑ this month</Text>
          </>
        ) : (
          <>
            <Text style={s.balancePlaceholder}>$—</Text>
            <TouchableOpacity onPress={handleConnectBank}>
              <Text style={s.linkAccounts}>+ Link accounts →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─── Account Chips ───────────────────────────── */}
        {hasAccounts && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.chipScroll}
            contentContainerStyle={s.chipRow}
          >
            {accounts.map((acct) => (
              <View key={acct.accountId} style={s.accountChip}>
                <Text style={s.chipLabel} numberOfLines={1}>
                  {acct.name.length > 12
                    ? acct.name.slice(0, 10) + "."
                    : acct.name}
                </Text>
                <Text style={s.chipValue}>
                  {DEBT_TYPES.includes(acct.type) ? "-" : ""}$
                  {(acct.currentBalance ?? 0).toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={s.addChip}
              onPress={handleConnectBank}
              activeOpacity={0.7}
            >
              <Text style={s.addChipText}>+ Add</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ─── Actions For You ─────────────────────────── */}
        <View style={s.actionsHeader}>
          <Text style={s.sectionLabel}>ACTIONS FOR YOU</Text>
          {insights.length > 0 ? (
            <View style={s.countBadge}>
              <Text style={s.countBadgeText}>{insights.length}</Text>
            </View>
          ) : (
            <View style={s.checkBadge}>
              <Text style={s.checkBadgeText}>✓</Text>
            </View>
          )}
        </View>

        {insights.length > 0 ? (
          <View style={s.actionCards}>
            {insights.map((insight) => (
              <View key={insight.insightId} style={s.actionCard}>
                <Text style={s.actionTag}>
                  {ACTION_TAG[insight.actionType] || "Insight"}
                </Text>
                <Text style={s.actionBody}>{insight.insight}</Text>
                <View style={s.actionBtns}>
                  <TouchableOpacity
                    style={s.actionPrimaryBtn}
                    onPress={() => handleActionPress(insight)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.actionPrimaryText}>
                      {insight.actionLabel || "Review"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.actionSecondaryBtn}
                    onPress={() => handleDismissInsight(insight)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.actionSecondaryText}>
                      {insight.actionType === "STOP_LEAK"
                        ? "Keep it"
                        : insight.actionType === "PATTERN"
                        ? "Dismiss"
                        : "Not now"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          // All caught up state (App11)
          <View style={s.allClear}>
            <Text style={s.allClearEmoji}>🏖</Text>
            <Text style={s.allClearTitle}>You're all caught up</Text>
            <Text style={s.allClearSub}>
              Charlie's watching for new ways to save.{"\n"}We'll ping you when
              something comes up.
            </Text>
          </View>
        )}

        {/* ─── Transactions ────────────────────────────── */}
        {hasAccounts && (
          <>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>RECENT TRANSACTIONS</Text>
              <TouchableOpacity onPress={handleSync} disabled={syncing}>
                <Text style={s.blueLink}>
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
                        {
                          color:
                            txn.amount > 0 ? colors.negative : colors.positive,
                        },
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

        {/* ─── Referral Strip ──────────────────────────── */}
        <TouchableOpacity style={s.referralStrip} activeOpacity={0.7} onPress={() => router.push("/referral" as any)}>
          <Text style={s.referralText}>🎁  Give $10, get $10</Text>
          <Text style={s.referralCta}>Invite →</Text>
        </TouchableOpacity>

        {/* ─── Module Cards (no accounts) ──────────────── */}
        {!hasAccounts && (
          <>
            {[
              {
                emoji: "💳",
                title: "Spending",
                hint: "See where your money goes",
              },
              {
                emoji: "💰",
                title: "Savings",
                hint: "Track what you're building",
              },
              {
                emoji: "📈",
                title: "Investments",
                hint: "Watch your money grow",
              },
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

        {/* Bottom spacer for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ─── Chat FAB ──────────────────────────────────── */}
      <TouchableOpacity
        style={s.chatFab}
        onPress={() => router.push("/tabs/ask")}
        activeOpacity={0.8}
      >
        <View style={s.chatFabRing}>
          <View style={s.chatFabInner}>
            <Text style={s.chatFabIcon}>💬</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface0 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface0,
  },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 54, paddingBottom: 40 },

  // ── Greeting ────────────────────────────────────────────
  greeting: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 14,
  },

  // ── Balance ─────────────────────────────────────────────
  balanceLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  balanceValue: {
    fontSize: 42,
    fontWeight: "400",
    fontStyle: "italic",
    color: colors.ink,
  },
  balanceTrend: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.positive,
    marginBottom: 14,
  },
  balancePlaceholder: {
    fontSize: 42,
    fontWeight: "400",
    fontStyle: "italic",
    color: colors.mutedLt,
  },
  linkAccounts: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.blue,
    marginTop: spacing.sm,
    marginBottom: 14,
  },

  // ── Account Chips ───────────────────────────────────────
  chipScroll: { marginBottom: 14 },
  chipRow: { gap: 6 },
  accountChip: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderMid,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  chipLabel: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 2,
  },
  chipValue: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.ink,
  },
  addChip: {
    backgroundColor: "transparent",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderMid,
    borderStyle: "dashed",
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
  },
  addChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.blue,
  },

  // ── Actions Header ──────────────────────────────────────
  actionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  countBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.blue,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  countBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.positive,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  checkBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },

  // ── Action Cards ────────────────────────────────────────
  actionCards: { gap: 8, marginBottom: 14 },
  actionCard: {
    backgroundColor: colors.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
  },
  actionTag: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.blue,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  actionBody: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 19,
    marginBottom: 12,
  },
  actionBtns: { flexDirection: "row", gap: 8 },
  actionPrimaryBtn: {
    flex: 1,
    backgroundColor: colors.blue,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionPrimaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textOnBlue,
  },
  actionSecondaryBtn: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionSecondaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  // ── All Caught Up ───────────────────────────────────────
  allClear: {
    alignItems: "center",
    paddingVertical: 40,
    marginBottom: 14,
  },
  allClearEmoji: { fontSize: 40, marginBottom: 10 },
  allClearTitle: {
    fontSize: 22,
    fontWeight: "400",
    fontStyle: "italic",
    color: colors.ink,
    marginBottom: 8,
  },
  allClearSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },

  // ── Transactions / Cards ────────────────────────────────
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
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
    color: colors.ink,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "400",
    color: colors.ink,
  },
  blueLink: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.blue,
  },

  // ── Referral Strip ──────────────────────────────────────
  referralStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.blue,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: spacing.xl,
  },
  referralText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textOnBlue,
  },
  referralCta: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textOnBlue,
  },

  // ── Module Cards (empty state) ──────────────────────────
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
    borderColor: colors.blue,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  ghostBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.blue,
  },

  // ── Chat FAB ────────────────────────────────────────────
  chatFab: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  chatFabRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(13,20,96,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  chatFabInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  chatFabIcon: { fontSize: 20 },
});

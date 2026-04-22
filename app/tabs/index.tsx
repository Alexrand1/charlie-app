import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
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

const ACTION_ICON: Record<string, string> = {
  MOVE_MONEY: "💰",
  STOP_LEAK: "💧",
  PATTERN: "📊",
  NONE: "💡",
};

const { width: SCREEN_W } = Dimensions.get("window");
const ACCT_CARD_WIDTH = Math.floor((SCREEN_W - 48 - 20) / 3.3); // 3 visible + peek of 4th

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedInsightIdx, setExpandedInsightIdx] = useState(0); // first insight is expanded by default
  const generatingRef = useRef(false); // prevent concurrent generate calls
  const hasGeneratedRef = useRef(false); // only auto-generate once per session

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
      // Fetch insights / actions — auto-generate once if none exist
      try {
        let ins = await getInsights();
        if (
          ins.length === 0 &&
          accts.length > 0 &&
          !hasGeneratedRef.current &&
          !generatingRef.current
        ) {
          try {
            generatingRef.current = true;
            hasGeneratedRef.current = true;
            console.log("[Charlie] No insights found, generating via Claude...");
            const result = await generateInsights();
            console.log("[Charlie] Generated", result.generated, "insight(s)");
            ins = result.insights;
          } catch (genErr: any) {
            console.error("[Charlie] Insight generation failed:", genErr.response?.status, genErr.response?.data || genErr.message);
          } finally {
            generatingRef.current = false;
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

  // Re-fetch insights when screen regains focus (e.g. returning from action screen)
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Lightweight refresh — just re-fetch insights to drop acted-on / dismissed cards
      getInsights()
        .then((ins) => setInsights(ins))
        .catch(() => {});
    });
    return unsubscribe;
  }, [navigation]);

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
        {/* ─── Greeting + Profile ─────────────────────── */}
        <View style={s.greetingRow}>
          <Text style={s.greeting}>
            Hey {user?.firstName || "there"} 👋
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/tabs/settings")}
            activeOpacity={0.7}
          >
            <View style={s.profileAvatar}>
              <Text style={s.profileInitial}>
                {(user?.firstName || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

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

        {/* ─── Account Cards ───────────────────────────── */}
        {hasAccounts && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.acctCardScroll}
            contentContainerStyle={s.acctCardRow}
            snapToInterval={ACCT_CARD_WIDTH + 10}
            decelerationRate="fast"
          >
            {accounts.slice(0, 6).map((acct) => (
              <View key={acct.accountId} style={s.acctCard}>
                <Text style={s.acctCardName} numberOfLines={1}>
                  {acct.name}
                </Text>
                <Text style={s.acctCardBalance}>
                  {DEBT_TYPES.includes(acct.type) ? "-" : ""}$
                  {(acct.currentBalance ?? 0).toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </Text>
                <Text style={s.acctCardDelta}>+ this month</Text>
              </View>
            ))}
            <TouchableOpacity
              style={s.acctCardLink}
              onPress={handleConnectBank}
              activeOpacity={0.7}
            >
              <Text style={s.acctCardLinkIcon}>+</Text>
              <Text style={s.acctCardLinkText}>Link Account</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ─── Actions For You ─────────────────────────── */}
        <View style={s.actionsHeader}>
          <Text style={s.sectionLabel}>Actions for you</Text>
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
            {insights.map((insight, idx) => {
              const isExpanded = idx === expandedInsightIdx;
              // Split insight text: first sentence = headline, rest = sub copy
              const dotIdx = insight.insight.indexOf(". ");
              const headline =
                dotIdx > 0
                  ? insight.insight.slice(0, dotIdx + 1)
                  : insight.insight;
              const subCopy =
                dotIdx > 0 ? insight.insight.slice(dotIdx + 2) : "";
              // Brief description for compact row
              const brief = insight.actionDetail || headline;

              if (isExpanded) {
                // ── Featured blue card ──
                return (
                  <View key={insight.insightId} style={s.featuredCard}>
                    <Text style={s.featuredTag}>
                      {ACTION_TAG[insight.actionType] || "Insight"}
                    </Text>
                    <Text style={s.featuredHeadline}>{headline}</Text>
                    {subCopy.length > 0 && (
                      <Text style={s.featuredSub}>{subCopy}</Text>
                    )}
                    <View style={s.featuredBtns}>
                      <TouchableOpacity
                        style={s.featuredPrimaryBtn}
                        onPress={() => handleActionPress(insight)}
                        activeOpacity={0.7}
                      >
                        <Text style={s.featuredPrimaryText}>
                          {insight.actionLabel || "Review"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.featuredSecondaryBtn}
                        onPress={() => handleDismissInsight(insight)}
                        activeOpacity={0.7}
                      >
                        <Text style={s.featuredSecondaryText}>Not now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              // ── Compact row ──
              return (
                <TouchableOpacity
                  key={insight.insightId}
                  style={s.compactCard}
                  onPress={() => setExpandedInsightIdx(idx)}
                  activeOpacity={0.7}
                >
                  <View style={s.compactIcon}>
                    <Text style={s.compactIconText}>
                      {ACTION_ICON[insight.actionType] || "💡"}
                    </Text>
                  </View>
                  <View style={s.compactContent}>
                    <Text style={s.compactTag}>
                      {ACTION_TAG[insight.actionType] || "Insight"}
                    </Text>
                    <Text style={s.compactBrief} numberOfLines={1}>
                      {brief}
                    </Text>
                  </View>
                  <Text style={s.compactChevron}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          // All caught up state
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

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
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
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  greeting: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
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

  // ── Account Cards ────────────────────────────────────────
  acctCardScroll: { marginBottom: 14 },
  acctCardRow: { gap: 10, paddingRight: 24 },
  acctCard: {
    width: ACCT_CARD_WIDTH,
    backgroundColor: colors.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "space-between",
    minHeight: 100,
  },
  acctCardName: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.muted,
    marginBottom: 6,
  },
  acctCardBalance: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 4,
  },
  acctCardDelta: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.positive,
  },
  acctCardLink: {
    width: ACCT_CARD_WIDTH,
    backgroundColor: "transparent",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderMid,
    borderStyle: "dashed",
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 100,
  },
  acctCardLinkIcon: {
    fontSize: 22,
    fontWeight: "300",
    color: colors.blue,
    marginBottom: 4,
  },
  acctCardLinkText: {
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
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    letterSpacing: 0.5,
  },
  countBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.blue,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.positive,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  checkBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },

  // ── Action Cards ────────────────────────────────────────
  actionCards: { gap: 8, marginBottom: 14 },

  // Featured (expanded) card — dark navy blue
  featuredCard: {
    backgroundColor: colors.blue,
    borderRadius: 16,
    padding: 20,
  },
  featuredTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  featuredHeadline: {
    fontSize: 22,
    fontWeight: "400",
    fontStyle: "italic",
    color: "#fff",
    lineHeight: 28,
    marginBottom: 8,
  },
  featuredSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 19,
    marginBottom: 16,
  },
  featuredBtns: { flexDirection: "row", gap: 8 },
  featuredPrimaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  featuredPrimaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.blue,
  },
  featuredSecondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
  },
  featuredSecondaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },

  // Compact (collapsed) row
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  compactIconText: {
    fontSize: 14,
  },
  compactContent: {
    flex: 1,
  },
  compactTag: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.blue,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  compactBrief: {
    fontSize: 13,
    color: colors.ink,
  },
  compactChevron: {
    fontSize: 20,
    fontWeight: "300",
    color: colors.blue,
    marginLeft: 8,
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

});

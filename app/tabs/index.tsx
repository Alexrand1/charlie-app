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
import { PlaidConnectSheet } from "@/components/shared";
import { colors, spacing, radii } from "@/constants/theme";
import { FLOATING_TAB_BAR_CLEARANCE } from "./_layout";

// Client-side sentinel — used in place of a real insightId for the
// synthetic "Connect Accounts" featured card.
const CONNECT_CARD_ID = "__connect_accounts__";

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

/**
 * Shorten long account names so four pills fit on one row. We only
 * abbreviate the common "Savings" / "Checking" suffixes — everything else
 * falls through to a length cap so bank-specific names like "Kalshi" or
 * "Fidelity" render verbatim.
 */
function shortAcctName(raw: string): string {
  const trimmed = (raw || "").trim();
  // Common suffixes — keep the bank name, abbreviate the product.
  const rules: Array<[RegExp, string]> = [
    [/\bSavings\b/i, "Sav."],
    [/\bSaving\b/i, "Sav."],
    [/\bChecking\b/i, "Chk."],
    [/\bCredit Card\b/i, "CC"],
    [/\bInvestment\b/i, "Inv."],
  ];
  let out = trimmed;
  for (const [pattern, repl] of rules) {
    out = out.replace(pattern, repl);
  }
  out = out.replace(/\s+/g, " ").trim();
  return out.length > 10 ? out.slice(0, 10) + "…" : out;
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Track expanded insight by ID (not index) so swaps are stable across refetches
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  // Ephemeral: when the user dismisses the synthetic Connect Accounts card
  // we hide it for this session (reappears on next app open — intentional).
  const [connectDismissed, setConnectDismissed] = useState(false);
  // Plaid intro sheet visibility (shown before handing to Plaid Link SDK).
  const [plaidSheetVisible, setPlaidSheetVisible] = useState(false);
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

  /** Show the Charlie intro sheet first; Plaid Link opens after Continue. */
  const handleConnectBank = () => setPlaidSheetVisible(true);

  const handleContinueWithPlaid = () => {
    setPlaidSheetVisible(false);
    // Let the bottom sheet finish its dismiss animation before the Plaid
    // SDK tries to present its own modal — iOS otherwise refuses to stack.
    setTimeout(() => openPlaidLink(), 220);
  };

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
    // Synthetic "Connect Accounts" card — route to /link-accounts rather
    // than any action screen. Nothing else in the action pipeline should
    // run for it (no createdAt, no approve call).
    if (insight.insightId === CONNECT_CARD_ID) {
      router.push("/link-accounts" as any);
      return;
    }
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
    // Synthetic Connect Accounts card — ephemeral local dismiss only.
    if (insight.insightId === CONNECT_CARD_ID) {
      setConnectDismissed(true);
      return;
    }
    try {
      await dismissInsight(insight.insightId, insight.createdAt);
      setInsights((prev) =>
        prev.filter((i) => i.insightId !== insight.insightId)
      );
    } catch {
      // Silently fail — will reappear on next refresh
    }
  };

  /** Build the synthetic "Connect Accounts" featured card. Returned only
   *  when the user has 0–1 accounts connected and hasn't dismissed it for
   *  this session. */
  const buildConnectCard = (acctCount: number): Insight | null => {
    if (connectDismissed) return null;
    if (acctCount > 1) return null;
    return {
      insightId: CONNECT_CARD_ID,
      actionType: "NONE",
      insight:
        acctCount === 0
          ? "Link an account. Charlie works best when it can see all your money — checking, savings, investments, and credit cards."
          : "Link more accounts. Charlie works best when it can see all your money — checking, savings, investments, and credit cards.",
      actionLabel: acctCount === 0 ? "Link accounts" : "Add more",
      actionDetail: "Connect accounts",
      confidence: "HIGH",
      createdAt: "",
    };
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

  // ── Compute monthly deltas per account from transactions ──
  // Plaid: positive amount = money out, negative = money in
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyTxns = transactions.filter((t) => t.date.startsWith(monthPrefix));

  const acctDeltas: Record<string, number> = {};
  for (const t of monthlyTxns) {
    // Negative amount in Plaid = deposit/income → positive delta for the user
    acctDeltas[t.accountId] = (acctDeltas[t.accountId] || 0) - t.amount;
  }
  const totalDelta = Object.values(acctDeltas).reduce((s, v) => s + v, 0);

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
        <Text style={s.balanceLabel}>Total Balance</Text>
        {totalBalance !== null ? (
          <>
            <Text style={s.balanceValue}>
              ${totalBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </Text>
            <Text
              style={[
                s.balanceTrend,
                totalDelta < 0 && { color: colors.negative },
              ]}
            >
              {totalDelta >= 0 ? "+" : "−"} $
              {Math.abs(totalDelta).toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}{" "}
              this month
            </Text>
          </>
        ) : (
          <>
            <Text style={s.balancePlaceholder}>$—</Text>
            <TouchableOpacity onPress={handleConnectBank}>
              <Text style={s.linkAccounts}>+ Link accounts →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ─── Account Pills (horizontal scroll — all accounts) ──
         *  Pills are fixed-width so ~3 fit in the viewport; additional
         *  accounts reveal by sliding right. A dashed "+ Add account" pill
         *  always sits at the end, routing to /link-accounts. */}
        {hasAccounts && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.acctPillScroll}
            contentContainerStyle={s.acctPillScrollContent}
          >
            {accounts.map((acct) => {
              const balance = acct.currentBalance ?? 0;
              const display = DEBT_TYPES.includes(acct.type) ? -balance : balance;
              return (
                <TouchableOpacity
                  key={acct.accountId}
                  style={s.acctPill}
                  onPress={() =>
                    router.push(`/accounts/${acct.accountId}` as any)
                  }
                  activeOpacity={0.7}
                >
                  <Text style={s.acctPillName} numberOfLines={1}>
                    {shortAcctName(acct.name)}
                  </Text>
                  <Text
                    style={[
                      s.acctPillBalance,
                      display < 0 && { color: colors.negative },
                    ]}
                    numberOfLines={1}
                  >
                    ${Math.abs(display).toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {/* Trailing "+ Add account" pill. */}
            <TouchableOpacity
              style={s.acctPillAdd}
              onPress={() => router.push("/link-accounts" as any)}
              activeOpacity={0.7}
            >
              <Text style={s.acctPillAddPlus}>＋</Text>
              <Text style={s.acctPillAddLabel} numberOfLines={1}>
                Add account
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ─── Actions For You ───────────────────────────
         *  Build a merged card list: synthetic "Connect Accounts" card first
         *  (when acctCount <= 1 and not dismissed), then LLM insights. The
         *  total drives the count badge. */}
        {(() => {
          const connectCard = buildConnectCard(accounts.length);
          const cards: Insight[] = connectCard
            ? [connectCard, ...insights]
            : insights;

          if (cards.length === 0) {
            return (
              <>
                <View style={s.actionsHeader}>
                  <Text style={s.sectionLabel}>Actions for you</Text>
                  <View style={s.checkBadge}>
                    <Text style={s.checkBadgeText}>✓</Text>
                  </View>
                </View>
                {/* All caught up state */}
                <View style={s.allClear}>
                  <Text style={s.allClearEmoji}>🏖</Text>
                  <Text style={s.allClearTitle}>You're all caught up</Text>
                  <Text style={s.allClearSub}>
                    Charlie's watching your accounts.{"\n"}We'll let you know the
                    moment there's money to be moved or saved.
                  </Text>
                </View>
              </>
            );
          }

          // Resolve which card is currently expanded. Default to the first
          // (synthetic card wins when present) when nothing is explicitly
          // expanded or the previously expanded card is gone.
          const expandedInsight =
            cards.find((i) => i.insightId === expandedInsightId) || cards[0];
          const collapsedInsights = cards.filter(
            (i) => i.insightId !== expandedInsight.insightId
          );

          // Split insight text: first sentence = headline, rest = sub copy
          const dotIdx = expandedInsight.insight.indexOf(". ");
          const headline =
            dotIdx > 0
              ? expandedInsight.insight.slice(0, dotIdx + 1)
              : expandedInsight.insight;
          const subCopy =
            dotIdx > 0 ? expandedInsight.insight.slice(dotIdx + 2) : "";

          const tagFor = (insight: Insight) =>
            insight.insightId === CONNECT_CARD_ID
              ? "Connect Accounts · Recommended"
              : ACTION_TAG[insight.actionType] || "Insight";

          const iconFor = (insight: Insight) =>
            insight.insightId === CONNECT_CARD_ID
              ? "🏦"
              : ACTION_ICON[insight.actionType] || "💡";

          return (
            <>
              <View style={s.actionsHeader}>
                <Text style={s.sectionLabel}>Actions for you</Text>
                <View style={s.countBadge}>
                  <Text style={s.countBadgeText}>{cards.length}</Text>
                </View>
              </View>
              <View style={s.actionCards}>
                {/* ── Featured blue card (always at top) ── */}
                <View style={s.featuredCard}>
                  <Text style={s.featuredTag}>{tagFor(expandedInsight)}</Text>
                  <Text style={s.featuredHeadline}>{headline}</Text>
                  {subCopy.length > 0 && (
                    <Text style={s.featuredSub}>{subCopy}</Text>
                  )}
                  <View style={s.featuredBtns}>
                    <TouchableOpacity
                      style={s.featuredPrimaryBtn}
                      onPress={() => handleActionPress(expandedInsight)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.featuredPrimaryText}>
                        {expandedInsight.actionLabel || "Review"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.featuredSecondaryBtn}
                      onPress={() => handleDismissInsight(expandedInsight)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.featuredSecondaryText}>Not now</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ── Compact rows below ── */}
                {collapsedInsights.map((insight) => {
                  const cDot = insight.insight.indexOf(". ");
                  const cHead =
                    cDot > 0
                      ? insight.insight.slice(0, cDot + 1)
                      : insight.insight;
                  const brief = insight.actionDetail || cHead;
                  return (
                    <TouchableOpacity
                      key={insight.insightId}
                      style={s.compactCard}
                      onPress={() => setExpandedInsightId(insight.insightId)}
                      activeOpacity={0.7}
                    >
                      <View style={s.compactIcon}>
                        <Text style={s.compactIconText}>{iconFor(insight)}</Text>
                      </View>
                      <View style={s.compactContent}>
                        <Text style={s.compactTag}>{tagFor(insight)}</Text>
                        <Text style={s.compactBrief} numberOfLines={1}>
                          {brief}
                        </Text>
                      </View>
                      <Text style={s.compactChevron}>›</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          );
        })()}

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
                <TouchableOpacity
                  key={txn.transactionId}
                  style={s.card}
                  onPress={() =>
                    router.push(`/accounts/${txn.accountId}` as any)
                  }
                  activeOpacity={0.7}
                >
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
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* ─── Referral Strip ──────────────────────────── */}
        <TouchableOpacity style={s.referralStrip} activeOpacity={0.7} onPress={() => router.push("/tabs/refer" as any)}>
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

      {/* Plaid intro sheet — shown before handing off to Plaid Link SDK. */}
      <PlaidConnectSheet
        visible={plaidSheetVisible}
        onClose={() => setPlaidSheetVisible(false)}
        onContinue={handleContinueWithPlaid}
        loading={plaidLoading}
      />
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
  content: { padding: 24, paddingTop: 54, paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 8 },

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
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
    letterSpacing: 0.2,
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

  // ── Account Pills (horizontal scroll) ────────────────────
  // Pills are fixed-width so roughly 3 fit in the visible viewport on
  // standard phones; additional accounts reveal by swiping right.
  acctPillScroll: {
    marginBottom: 16,
    marginHorizontal: -24, // bleed past the screen's horizontal padding so
    // pills can scroll edge-to-edge instead of being clipped inside the 24pt
    // gutter.
  },
  acctPillScrollContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  acctPill: {
    width: 108,
    backgroundColor: colors.surface1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  acctPillName: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.muted,
    marginBottom: 4,
  },
  acctPillBalance: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  // Trailing dashed "+ Add account" pill — same fixed width as real pills
  // so it lines up visually at the end of the carousel.
  acctPillAdd: {
    width: 108,
    backgroundColor: "transparent",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderMid,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  acctPillAddPlus: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.blue,
    marginBottom: 2,
  },
  acctPillAddLabel: {
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

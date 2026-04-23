import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  BackPill,
  ProgressCard,
  SectionHeader,
  TransactionRow,
} from "@/components/shared";
import { colors } from "@/constants/theme";
import {
  getAccountDetail,
  PlaidAccount,
  PlaidTransaction,
} from "@/services/plaid";
import { getGoals, Goal } from "@/services/goals";
import {
  formatCurrency,
  formatSignedDelta,
  formatTransactionDate,
  dateKey,
} from "@/utils/format";
import {
  AppAccount,
  getAccountMask,
  getAccountSubtitle,
} from "@/utils/accounts";

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [account, setAccount] = useState<AppAccount | null>(null);
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [linkedGoal, setLinkedGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [detail, goals] = await Promise.all([
        getAccountDetail(id),
        getGoals().catch(() => [] as Goal[]),
      ]);
      setAccount(detail.account as AppAccount);
      setTransactions(detail.transactions);

      const match = goals.find((g) => g.linkedAccountId === id);
      setLinkedGoal(match || null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  // Today's change — sum of transactions posted today. Plaid uses positive
  // for debits, so flip the sign so deposits read as gains.
  const todaysChange = useMemo(() => {
    const todayKey = dateKey(new Date().toISOString());
    return transactions
      .filter((t) => dateKey(t.date) === todayKey)
      .reduce((sum, t) => sum - t.amount, 0);
  }, [transactions]);

  const grouped = useMemo(() => {
    const map = new Map<string, PlaidTransaction[]>();
    for (const t of transactions) {
      const k = dateKey(t.date);
      const bucket = map.get(k);
      if (bucket) bucket.push(t);
      else map.set(k, [t]);
    }
    return Array.from(map.entries()).map(([k, rows]) => ({
      key: k,
      title: formatTransactionDate(k),
      rows,
    }));
  }, [transactions]);

  if (loading && !account) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  if (!account) {
    return (
      <View style={s.center}>
        <BackPill />
        <Text style={s.missing}>Account not found.</Text>
      </View>
    );
  }

  const mask = getAccountMask(account);
  const subtitle = getAccountSubtitle(account);
  const balance = account.currentBalance ?? 0;
  const isDebt =
    (account.type || "").toLowerCase() === "credit" ||
    (account.type || "").toLowerCase() === "loan";
  const displayBalance = isDebt ? Math.abs(balance) : balance;

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <BackPill />

        <View style={s.header}>
          <Text style={s.name}>{account.name}</Text>
          <View style={s.subRow}>
            <Text style={s.sub}>{subtitle}</Text>
            {mask ? <Text style={s.mask}>{mask}</Text> : null}
          </View>
        </View>

        {/* Balance hero */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>
            {isDebt ? "CURRENT BALANCE" : "AVAILABLE"}
          </Text>
          <Text style={s.balance}>
            {isDebt ? `-${formatCurrency(displayBalance)}` : formatCurrency(balance)}
          </Text>
          {Math.abs(todaysChange) > 0.01 ? (
            <Text
              style={[
                s.change,
                { color: todaysChange >= 0 ? colors.positive : colors.negative },
              ]}
            >
              {formatSignedDelta(todaysChange)} today
            </Text>
          ) : (
            <Text style={s.change}>No change today</Text>
          )}
        </View>

        {/* Optional linked goal */}
        {linkedGoal ? (
          <View style={{ marginTop: 14 }}>
            <ProgressCard
              tag="Savings goal"
              label={linkedGoal.label}
              current={formatCurrency(linkedGoal.currentAmount)}
              target={formatCurrency(linkedGoal.targetAmount)}
              percent={
                linkedGoal.targetAmount > 0
                  ? linkedGoal.currentAmount / linkedGoal.targetAmount
                  : 0
              }
              context={
                linkedGoal.deadline
                  ? `Deadline ${new Date(linkedGoal.deadline).toLocaleDateString()}`
                  : undefined
              }
            />
          </View>
        ) : null}

        {/* Recent transactions */}
        <SectionHeader title="Recent transactions" variant="heading" />
        {grouped.length === 0 ? (
          <Text style={s.empty}>No transactions yet.</Text>
        ) : (
          grouped.map((section) => (
            <View key={section.key} style={{ marginBottom: 10 }}>
              <SectionHeader
                variant="eyebrow"
                title={section.title}
                style={{ marginTop: 8 }}
              />
              <View style={s.card}>
                {section.rows.map((txn, i) => (
                  <View key={txn.transactionId}>
                    <TransactionRow txn={txn} />
                    {i < section.rows.length - 1 ? (
                      <View style={s.divider} />
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 24, paddingTop: 54, paddingBottom: 48 },
  center: {
    flex: 1,
    backgroundColor: colors.surface0,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14,
  },
  missing: { fontSize: 13, color: colors.textSecondary },

  header: { marginTop: 14, marginBottom: 14 },
  name: { fontSize: 22, fontStyle: "italic", color: colors.ink },
  subRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 4,
  },
  sub: { fontSize: 12, color: colors.textSecondary },
  mask: { fontSize: 12, color: colors.textMuted },

  balanceCard: {
    backgroundColor: colors.blue,
    borderRadius: 18,
    padding: 20,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(245,240,232,0.7)",
  },
  balance: {
    fontSize: 36,
    fontStyle: "italic",
    color: colors.textOnBlue,
    marginTop: 6,
  },
  change: {
    fontSize: 12,
    color: "rgba(245,240,232,0.75)",
    marginTop: 6,
    fontWeight: "600",
  },

  card: {
    backgroundColor: colors.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginLeft: 54,
  },
  empty: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
  },
});

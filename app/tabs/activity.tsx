import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  FilterTabs,
  FilterTab,
  SectionHeader,
  TransactionRow,
  ActionRow,
} from "@/components/shared";
import { colors } from "@/constants/theme";
import {
  getTransactions,
  syncAllItems,
  PlaidTransaction,
} from "@/services/plaid";
import { getActedInsights, Insight } from "@/services/insights";
import {
  buildActivityFeed,
  ActivityFilter,
  FeedRow,
} from "@/utils/activity";
import { FLOATING_TAB_BAR_CLEARANCE } from "./_layout";

const TABS: FilterTab<ActivityFilter>[] = [
  { key: "all", label: "All" },
  { key: "actions", label: "Actions" },
  { key: "spending", label: "Spending" },
];

export default function ActivityScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [txns, setTxns] = useState<PlaidTransaction[]>([]);
  const [actions, setActions] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, a] = await Promise.all([
        getTransactions({ limit: 100 }).catch(() => []),
        getActedInsights().catch(() => []),
      ]);
      setTxns(t);
      setActions(a);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncAllItems().catch(() => {});
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const sections = useMemo(
    () => buildActivityFeed(txns, actions, filter),
    [txns, actions, filter]
  );
  const isEmpty = sections.every((s) => s.rows.length === 0);

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={s.title}>Activity</Text>

        <FilterTabs
          tabs={TABS}
          active={filter}
          onChange={setFilter}
          style={s.filter}
        />

        {loading && isEmpty ? (
          <Text style={s.empty}>Loading…</Text>
        ) : isEmpty ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>✨</Text>
            <Text style={s.emptyTitle}>
              {filter === "actions"
                ? "No Charlie actions yet"
                : filter === "spending"
                ? "No transactions yet"
                : "Nothing to show yet"}
            </Text>
            <Text style={s.emptySub}>
              {filter === "actions"
                ? "When you act on a Charlie suggestion, it will show up here."
                : "Connect a bank or wait for your next sync to see activity."}
            </Text>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.key}>
              <SectionHeader variant="eyebrow" title={section.title} />
              <View style={s.card}>
                {section.rows.map((row, i) => (
                  <View key={rowKey(row)}>
                    {row.kind === "action" ? (
                      <ActionRow
                        insight={row.insight}
                        onPress={() =>
                          router.push(
                            ("/insights/" + row.insight.insightId) as any
                          )
                        }
                      />
                    ) : (
                      <TransactionRow txn={row.txn} />
                    )}
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

function rowKey(row: FeedRow): string {
  if (row.kind === "action") return `a-${row.insight.insightId}`;
  return `t-${row.txn.transactionId}`;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface0 },
  content: {
    padding: 24,
    paddingTop: 54,
    paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 8,
  },
  title: {
    fontSize: 26,
    fontStyle: "italic",
    color: colors.ink,
    marginBottom: 14,
  },
  filter: { marginBottom: 10 },

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
    marginTop: 40,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIcon: { fontSize: 32, marginBottom: 12 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});

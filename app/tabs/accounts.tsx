import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { getAccounts, syncAllItems } from "@/services/plaid";
import { AccountRow, SectionHeader } from "@/components/shared";
import { colors } from "@/constants/theme";
import { formatLastSynced, formatWholeCurrency } from "@/utils/format";
import {
  AppAccount,
  groupAccounts,
  totalNetWorth,
} from "@/utils/accounts";
import { FLOATING_TAB_BAR_CLEARANCE } from "./_layout";

export default function AccountsScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AppAccount[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = (await getAccounts()) as AppAccount[];
      setAccounts(data);
      // Pick the most recent lastSyncedAt across accounts as a summary.
      const latest = data.reduce<string | null>((acc, a) => {
        const t = a.lastSyncedAt || a.updatedAt || null;
        if (!t) return acc;
        return !acc || t > acc ? t : acc;
      }, null);
      setLastSynced(latest);
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
      await syncAllItems();
      await load();
    } catch {
      // swallow — the subsequent load will reflect whatever was synced
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const sections = useMemo(() => groupAccounts(accounts), [accounts]);
  const net = useMemo(() => totalNetWorth(accounts), [accounts]);

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Accounts</Text>
          <Text style={s.synced}>{formatLastSynced(lastSynced)}</Text>
        </View>

        {/* Net-worth summary card */}
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>NET WORTH</Text>
          <Text style={s.summaryValue}>{formatWholeCurrency(net)}</Text>
          <Text style={s.summarySub}>
            Across {accounts.length}{" "}
            {accounts.length === 1 ? "account" : "accounts"}
          </Text>
        </View>

        {loading && accounts.length === 0 ? (
          <Text style={s.empty}>Loading…</Text>
        ) : accounts.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🏦</Text>
            <Text style={s.emptyTitle}>No accounts yet</Text>
            <Text style={s.emptySub}>
              Connect a bank to start seeing balances and activity.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/link-accounts" as any)}
              style={s.cta}
              activeOpacity={0.85}
            >
              <Text style={s.ctaText}>Connect a bank</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.key}>
              <SectionHeader variant="heading" title={section.title} />
              <View style={s.card}>
                {section.accounts.map((acct, i) => (
                  <View key={acct.accountId}>
                    <AccountRow
                      account={acct}
                      debt={section.key === "credit" || section.key === "loan"}
                      onPress={() =>
                        router.push(`/accounts/${acct.accountId}` as any)
                      }
                    />
                    {i < section.accounts.length - 1 ? (
                      <View style={s.divider} />
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        {accounts.length > 0 ? (
          <TouchableOpacity
            onPress={() => router.push("/link-accounts" as any)}
            style={s.addRow}
            activeOpacity={0.7}
          >
            <Text style={s.addRowIcon}>＋</Text>
            <Text style={s.addRowText}>Connect another bank</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface0 },
  content: {
    padding: 24,
    paddingTop: 54,
    paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 8,
  },
  header: { marginBottom: 12 },
  title: {
    fontSize: 26,
    fontStyle: "italic",
    color: colors.ink,
  },
  synced: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },

  summaryCard: {
    backgroundColor: colors.blue,
    borderRadius: 16,
    padding: 18,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(245,240,232,0.7)",
  },
  summaryValue: {
    fontSize: 32,
    fontStyle: "italic",
    color: colors.textOnBlue,
    marginTop: 6,
  },
  summarySub: {
    fontSize: 11,
    color: "rgba(245,240,232,0.7)",
    marginTop: 4,
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
    marginTop: 40,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  cta: {
    backgroundColor: colors.blue,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  ctaText: {
    color: colors.textOnBlue,
    fontSize: 13,
    fontWeight: "600",
  },

  addRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderStyle: "dashed",
  },
  addRowIcon: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  addRowText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});

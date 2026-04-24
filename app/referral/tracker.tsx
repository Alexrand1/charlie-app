import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  BackPill,
  Eyebrow,
  CharlieHeadline,
  CTAButton,
  CharlieCard,
} from "@/components/shared";
import { colors } from "@/constants/theme";
import { formatWholeCurrency } from "@/utils/format";
import {
  getMyReferral,
  getInvites,
  Referral,
  ReferralInvite,
} from "@/services/referral";

export default function ReferralTrackerScreen() {
  const router = useRouter();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [invites, setInvites] = useState<ReferralInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [r, inv] = await Promise.all([getMyReferral(), getInvites()]);
      setReferral(r);
      setInvites(inv);
    } catch (err) {
      console.warn("[Tracker] load failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const earnedDollars = referral ? referral.totalEarnedCents / 100 : 0;
  const completedCount = referral?.friendsJoined ?? 0;
  const pendingCount = referral?.pendingCount ?? 0;

  // Newest-first — backend returns them in attribution order, so we reverse.
  const sortedInvites = [...invites].sort((a, b) =>
    b.attributedAt.localeCompare(a.attributedAt)
  );

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <BackPill />
      <View style={{ height: 14 }} />

      <Eyebrow text="Referrals" />
      <View style={{ height: 4 }} />
      <CharlieHeadline
        plainPrefix="You've earned "
        italicEmphasis={formatWholeCurrency(earnedDollars)}
        plainSuffix={"\nso far"}
        size={26}
      />
      <View style={{ height: 14 }} />

      {/* Stats card */}
      <View style={s.statsCard}>
        <View style={s.statCol}>
          <Text style={s.statNumber}>{formatWholeCurrency(earnedDollars)}</Text>
          <Text style={s.statLabel}>earned</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCol}>
          <Text style={s.statNumber}>{completedCount}</Text>
          <Text style={s.statLabel}>joined</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCol}>
          <Text style={s.statNumber}>{pendingCount}</Text>
          <Text style={s.statLabel}>pending</Text>
        </View>
      </View>

      <Text style={s.sectionLabel}>INVITES</Text>

      {loading ? (
        <View style={s.loadingCard}>
          <ActivityIndicator color={colors.blue} />
        </View>
      ) : sortedInvites.length === 0 ? (
        <View style={s.emptyCard}>
          <Text style={{ fontSize: 28, marginBottom: 8 }}>📭</Text>
          <Text style={s.emptyTitle}>No invites yet</Text>
          <Text style={s.emptySub}>
            Share your link — you'll see friends show up here as they join.
          </Text>
        </View>
      ) : (
        <CharlieCard cornerRadius={14} padding={4}>
          {sortedInvites.map((inv, i) => {
            const complete = inv.status === "completed";
            const amountDollars = inv.rewardAmountCents / 100;
            const statusText = complete
              ? `Joined ${formatDate(inv.completedAt || inv.attributedAt)}`
              : "Pending — no first action yet";
            return (
              <View key={`${inv.refereeUserId}-${inv.attributedAt}`}>
                <View style={s.inviteRow}>
                  <View style={s.inviteIcon}>
                    <Text style={{ fontSize: 16 }}>
                      {complete ? "✅" : "⏳"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.inviteName}>
                      {inv.refereeFirstName || "New friend"}
                    </Text>
                    <Text style={s.inviteStatus}>{statusText}</Text>
                  </View>
                  <Text
                    style={[
                      s.inviteAmount,
                      { color: complete ? colors.positive : colors.textMuted },
                    ]}
                  >
                    {complete ? "+" : ""}
                    {formatWholeCurrency(amountDollars)}
                  </Text>
                </View>
                {i < sortedInvites.length - 1 && <View style={s.divider} />}
              </View>
            );
          })}
        </CharlieCard>
      )}
      <View style={{ height: 16 }} />

      <CTAButton
        title="Invite another friend"
        variant="blue"
        onPress={() => router.push("/referral/share" as any)}
      />
    </ScrollView>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "recently";
  }
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 24, paddingTop: 54, paddingBottom: 24 },
  statsCard: {
    flexDirection: "row",
    backgroundColor: colors.blue,
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    alignItems: "center",
  },
  statCol: { flex: 1, alignItems: "center" },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  statNumber: { fontSize: 22, fontStyle: "italic", color: colors.textOnBlue },
  statLabel: {
    fontSize: 10,
    color: colors.textOnBlue,
    marginTop: 2,
    opacity: 0.7,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  loadingCard: {
    backgroundColor: colors.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 28,
    alignItems: "center",
  },
  emptyCard: {
    backgroundColor: colors.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 28,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 11,
  },
  inviteIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  inviteName: { fontSize: 13, fontWeight: "600", color: colors.ink },
  inviteStatus: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  inviteAmount: { fontSize: 13, fontWeight: "700" },
  divider: { height: 1, backgroundColor: colors.borderSubtle, marginLeft: 56 },
});

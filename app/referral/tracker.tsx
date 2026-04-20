import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  BackPill,
  Eyebrow,
  CharlieHeadline,
  CTAButton,
  CharlieCard,
} from "@/components/shared";
import { colors } from "@/constants/theme";

interface Invite {
  emoji: string;
  name: string;
  status: string;
  amount: string;
  complete: boolean;
}

const INVITES: Invite[] = [
  { emoji: "✅", name: "Michael K.", status: "Signed up", amount: "+$10", complete: true },
  { emoji: "⏳", name: "Jamie L.", status: "Pending — no bank yet", amount: "$10", complete: false },
  { emoji: "⏳", name: "Dana R.", status: "Pending — no bank yet", amount: "$10", complete: false },
];

export default function ReferralTrackerScreen() {
  const router = useRouter();

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <BackPill />
      <View style={{ height: 14 }} />

      <Eyebrow text="Referrals" />
      <View style={{ height: 4 }} />
      <CharlieHeadline
        plainPrefix="You've earned "
        italicEmphasis="$67"
        plainSuffix={"\nso far"}
        size={26}
      />
      <View style={{ height: 14 }} />

      {/* Stats card */}
      <View style={s.statsCard}>
        <View style={s.statLeft}>
          <Text style={s.statNumber}>$67</Text>
          <Text style={s.statLabel}>earned</Text>
        </View>
        <View style={s.statRight}>
          <Text style={s.statNumber}>2</Text>
          <Text style={s.statLabel}>complete</Text>
        </View>
      </View>

      <Text style={s.sectionLabel}>ACTIVE INVITES</Text>

      <CharlieCard cornerRadius={14} padding={4}>
        {INVITES.map((inv, i) => (
          <View key={inv.name}>
            <View style={s.inviteRow}>
              <View style={s.inviteIcon}>
                <Text style={{ fontSize: 16 }}>{inv.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.inviteName}>{inv.name}</Text>
                <Text style={s.inviteStatus}>{inv.status}</Text>
              </View>
              <Text
                style={[
                  s.inviteAmount,
                  { color: inv.complete ? colors.positive : colors.textMuted },
                ]}
              >
                {inv.amount}
              </Text>
            </View>
            {i < INVITES.length - 1 && <View style={s.divider} />}
          </View>
        ))}
      </CharlieCard>
      <View style={{ height: 16 }} />

      <CTAButton title="Invite another friend" variant="blue" onPress={() => router.push("/referral/share")} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 24, paddingTop: 54, paddingBottom: 24 },
  statsCard: {
    flexDirection: "row",
    backgroundColor: colors.navyLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
  },
  statLeft: { flex: 1 },
  statRight: { flex: 1, alignItems: "flex-end" },
  statNumber: { fontSize: 28, fontStyle: "italic", color: "#fff" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  sectionLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: 8,
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
  inviteName: { fontSize: 13, fontWeight: "600", color: colors.cream },
  inviteStatus: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  inviteAmount: { fontSize: 13, fontWeight: "700" },
  divider: { height: 1, backgroundColor: colors.borderSubtle, marginLeft: 56 },
});

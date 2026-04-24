import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { WinBackground } from "@/components/shared";
import { colors } from "@/constants/theme";
import { formatWholeCurrency } from "@/utils/format";

/**
 * Celebration screen shown when a referral completes (the referee took their
 * first action). Pushed in response to a push notification or deep link.
 *
 * Params:
 *   friendName   — referee's first name ("Jamie")
 *   amountCents  — reward credited to the current user (1000 = $10)
 */
export default function RewardEarnedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    friendName?: string;
    amountCents?: string;
  }>();

  const friendName = params.friendName || "Your friend";
  const amountCents = parseInt(params.amountCents || "1000", 10);
  const amountDollars = amountCents / 100;
  const amountLabel = formatWholeCurrency(amountDollars);

  return (
    <WinBackground color={colors.blue}>
      <View style={s.container}>
        <View style={{ flex: 1 }} />

        <Text style={s.emoji}>🎉</Text>
        <Text style={s.eyebrow}>YOU EARNED</Text>
        <Text style={s.amount}>{amountLabel}</Text>
        <Text style={s.sub}>
          {friendName} took their first action on Charlie
        </Text>

        {/* 3-row referral summary card */}
        <View style={s.detailCard}>
          <Row
            icon="👋"
            label="Friend joined"
            value={friendName}
            checked
          />
          <View style={s.rowDivider} />
          <Row
            icon="💸"
            label="Their reward"
            value={amountLabel}
            checked
          />
          <View style={s.rowDivider} />
          <Row
            icon="💰"
            label="Your reward"
            value={amountLabel}
            checked
          />
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => router.replace("/tabs" as any)}
          activeOpacity={0.85}
        >
          <Text style={s.primaryBtnText}>Back to home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/referral/share" as any)}
          activeOpacity={0.7}
          style={s.secondaryBtn}
        >
          <Text style={s.secondaryBtnText}>Invite another friend</Text>
        </TouchableOpacity>
      </View>
    </WinBackground>
  );
}

function Row({
  icon,
  label,
  value,
  checked,
}: {
  icon: string;
  label: string;
  value: string;
  checked?: boolean;
}) {
  return (
    <View style={s.row}>
      <Text style={s.rowIcon}>{icon}</Text>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
      {checked && <Text style={s.rowCheck}>✓</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 76,
    paddingBottom: 22,
    paddingHorizontal: 24,
  },
  emoji: { fontSize: 52, marginBottom: 12 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 4,
  },
  amount: { fontSize: 52, fontStyle: "italic", color: "#fff" },
  sub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 24,
    textAlign: "center",
  },
  detailCard: {
    width: "100%",
    paddingVertical: 4,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
  },
  rowIcon: { fontSize: 16 },
  rowLabel: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  rowValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  rowCheck: {
    fontSize: 14,
    color: colors.positive,
    marginLeft: 6,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  primaryBtn: {
    width: "100%",
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: colors.blue },
  secondaryBtn: {
    width: "100%",
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
});

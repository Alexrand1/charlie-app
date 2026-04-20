import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { WinBackground } from "@/components/shared";
import { colors } from "@/constants/theme";

export default function RewardEarnedScreen() {
  const router = useRouter();

  return (
    <WinBackground color={colors.navyLight}>
      <View style={s.container}>
        <View style={{ flex: 1 }} />

        <Text style={s.emoji}>🎉</Text>
        <Text style={s.eyebrow}>YOU EARNED</Text>
        <Text style={s.amount}>$10</Text>
        <Text style={s.sub}>from a friend's sign-up</Text>

        {/* Detail card */}
        <View style={s.detailCard}>
          <View style={s.checkRow}>
            <Text style={s.checkIcon}>✓</Text>
            <Text style={s.checkText}>Credited to Chase Savings</Text>
          </View>
          <View style={s.checkRow}>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>👥</Text>
            <Text style={s.pendingText}>2 more invites pending</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={s.btn}
          onPress={() => router.replace("/referral")}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>Invite more friends</Text>
        </TouchableOpacity>
      </View>
    </WinBackground>
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
  sub: { fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 24 },
  detailCard: {
    width: "100%",
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    gap: 10,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkIcon: { fontSize: 12, color: colors.positive },
  checkText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  pendingText: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  btn: {
    width: "100%",
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { fontSize: 15, fontWeight: "600", color: colors.navyLight },
});

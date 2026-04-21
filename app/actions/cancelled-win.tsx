import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { WinBackground } from "@/components/shared";
import { colors } from "@/constants/theme";

const BG = colors.blue;

export default function CancelledWinScreen() {
  const router = useRouter();

  return (
    <WinBackground color={BG}>
      <View style={s.container}>
        <View style={{ flex: 1 }} />

        <Text style={s.emoji}>✂️</Text>
        <Text style={s.eyebrow}>CANCELLED</Text>
        <Text style={s.amount}>$179.88</Text>
        <Text style={s.sub}>saved this year</Text>

        {/* Detail card */}
        <View style={s.detailCard}>
          <Text style={s.detailLabel}>WHAT JUST HAPPENED</Text>
          <View style={s.checkRow}>
            <Text style={s.checkIcon}>✓</Text>
            <Text style={s.checkText}>Cancelled Paramount+</Text>
          </View>
          <View style={s.checkRow}>
            <Text style={s.checkIcon}>✓</Text>
            <Text style={s.checkText}>Confirmation email sent</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={s.btn} onPress={() => router.replace("/tabs")} activeOpacity={0.8}>
          <Text style={s.btnText}>See what's next</Text>
        </TouchableOpacity>
        <Text style={s.actionsWaiting}>3 more actions waiting</Text>
      </View>
    </WinBackground>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 76,
    paddingBottom: 20,
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
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 10,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  checkIcon: { fontSize: 12, color: colors.positive },
  checkText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  btn: {
    width: "100%",
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { fontSize: 15, fontWeight: "600", color: colors.blue },
  actionsWaiting: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    marginTop: 10,
  },
});

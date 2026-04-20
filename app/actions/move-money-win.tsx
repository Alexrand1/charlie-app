import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { WinBackground } from "@/components/shared";
import { colors } from "@/constants/theme";

const BG = colors.navyLight;

export default function MoveMoneyWinScreen() {
  const router = useRouter();

  return (
    <WinBackground color={BG}>
      <View style={s.container}>
        <View style={{ flex: 1 }} />

        <Text style={s.emoji}>💸</Text>
        <Text style={s.eyebrow}>DONE</Text>
        <Text style={s.amount}>$90</Text>
        <Text style={s.sub}>moved to Chase Savings</Text>

        {/* Detail card */}
        <View style={s.detailCard}>
          <Text style={s.detailLabel}>WHAT JUST HAPPENED</Text>
          <View style={s.detailRow}>
            <Text style={s.detailLeft}>Chase Checking</Text>
            <Text style={s.detailRight}>−$90</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLeft}>Chase Savings</Text>
            <Text style={s.detailRight}>+$90</Text>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: "69%" }]} />
          </View>
          <Text style={s.progressText}>69% of emergency fund goal</Text>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={s.btn} onPress={() => router.replace("/tabs")} activeOpacity={0.8}>
          <Text style={s.btnText}>Nice</Text>
        </TouchableOpacity>
        <Text style={s.actionsWaiting}>2 more actions waiting</Text>
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
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLeft: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  detailRight: { fontSize: 12, fontWeight: "600", color: "#fff" },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 4,
    marginBottom: 6,
  },
  progressFill: { height: 6, backgroundColor: "#fff", borderRadius: 3 },
  progressText: { fontSize: 10, color: "rgba(255,255,255,0.55)" },
  btn: {
    width: "100%",
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { fontSize: 15, fontWeight: "600", color: colors.navyLight },
  actionsWaiting: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    marginTop: 10,
  },
});

import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { WinBackground } from "@/components/shared";
import { colors } from "@/constants/theme";

const BG = "#1B4332"; // charlieInvestDark

export default function InvestWinScreen() {
  const router = useRouter();

  return (
    <WinBackground color={BG}>
      <View style={s.container}>
        <View style={{ flex: 1 }} />

        <Text style={s.emoji}>🌱</Text>
        <Text style={s.eyebrow}>INVESTED</Text>
        <Text style={s.amount}>$150</Text>
        <Text style={s.sub}>into Fidelity Brokerage</Text>

        {/* Detail card */}
        <View style={s.detailCard}>
          <View style={s.detailHeader}>
            <View style={s.detailIcon}>
              <Text style={{ fontSize: 18 }}>📈</Text>
            </View>
            <Text style={s.detailName}>Fidelity Brokerage</Text>
            <Text style={s.detailAmount}>$2,580</Text>
          </View>
          <View style={s.detailDivider} />
          <View style={s.detailRow}>
            <Text style={s.detailLeft}>At $150/mo</Text>
            <Text style={s.detailRight}>~$23k in 10 years</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLeft}>Savings</Text>
            <View style={s.checkRow}>
              <Text style={s.checkIcon}>✓</Text>
              <Text style={s.detailRight}>Fully funded</Text>
            </View>
          </View>
        </View>

        <Text style={s.disclaimer}>Estimates only — not investment advice.</Text>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={s.btn} onPress={() => router.replace("/tabs/goals" as any)} activeOpacity={0.8}>
          <Text style={[s.btnText, { color: BG }]}>See portfolio</Text>
        </TouchableOpacity>
        <Text style={s.actionsWaiting}>1 more action waiting</Text>
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
    marginBottom: 12,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  detailIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailName: { flex: 1, fontSize: 12, fontWeight: "600", color: "#fff" },
  detailAmount: { fontSize: 12, fontWeight: "700", color: "#fff" },
  detailDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  detailLeft: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  detailRight: { fontSize: 11, fontWeight: "700", color: "#fff" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  checkIcon: { fontSize: 12, color: colors.positive },
  disclaimer: { fontSize: 10, color: "rgba(255,255,255,0.25)" },
  btn: {
    width: "100%",
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { fontSize: 15, fontWeight: "600" },
  actionsWaiting: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    marginTop: 10,
  },
});

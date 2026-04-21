import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  BackPill,
  Eyebrow,
  CharlieHeadline,
  CharlieSub,
  CTAButton,
  CharlieCard,
} from "@/components/shared";
import { colors } from "@/constants/theme";

const CHIPS = ["$50", "$100", "$150", "Custom"];
const GREEN = "#2D6A4F";

export default function InvestSurplusScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState("$150");

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <BackPill />
      <View style={{ height: 14 }} />

      <Eyebrow text="Invest Surplus" color={GREEN} />
      <View style={{ height: 4 }} />
      <CharlieHeadline
        plainPrefix="Invest "
        italicEmphasis="$150"
        plainSuffix={"\nof your extra cash"}
      />
      <View style={{ height: 6 }} />
      <CharlieSub text="Your savings goal is full. This surplus would work harder in the market." />
      <View style={{ height: 14 }} />

      {/* Fidelity card */}
      <CharlieCard
        background="rgba(45,106,79,0.06)"
        border={GREEN}
        cornerRadius={14}
        padding={14}
      >
        <View style={s.fidelityRow}>
          <View style={s.fidelityIcon}>
            <Text style={{ fontSize: 20 }}>📈</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.fidelityName}>Fidelity Brokerage</Text>
            <Text style={s.fidelityMeta}>$2,430 today</Text>
          </View>
          <Text style={[s.fidelityTarget, { color: GREEN }]}>→ $2,580</Text>
        </View>
      </CharlieCard>
      <View style={{ height: 10 }} />

      {/* Amount input */}
      <View style={s.inputBox}>
        <Text style={s.inputLabel}>Amount</Text>
        <Text style={s.inputValue}>{selected}</Text>
      </View>
      <View style={{ height: 10 }} />

      {/* Amount chips */}
      <View style={s.chipRow}>
        {CHIPS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[s.chip, selected === c && { backgroundColor: GREEN }]}
            onPress={() => setSelected(c)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, selected === c && s.chipTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height: 10 }} />

      {/* Why card */}
      <View style={s.whyCard}>
        <Text style={[s.whyLabel, { color: GREEN }]}>WHY CHARLIE RECOMMENDS THIS</Text>
        {["Savings already fully funded", "Surplus 3 months in a row", "Fidelity balance up 3.2% YTD"].map(
          (text) => (
            <View key={text} style={s.checkRow}>
              <Text style={[s.checkMark, { color: GREEN }]}>✓</Text>
              <Text style={s.checkText}>{text}</Text>
            </View>
          )
        )}
      </View>
      <View style={{ height: 10 }} />

      <Text style={s.routeText}>From Chase Checking → Fidelity Brokerage</Text>

      <View style={{ flex: 1, minHeight: 40 }} />

      <CTAButton
        title={`Invest ${selected}`}
        variant="green"
        onPress={() => router.push("/actions/invest-win")}
      />
      <View style={{ height: 8 }} />
      <CTAButton title="Not now" variant="ghost" onPress={() => router.back()} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 24, paddingTop: 54, paddingBottom: 24, minHeight: "100%" },
  fidelityRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  fidelityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  fidelityName: { fontSize: 13, fontWeight: "600", color: colors.ink },
  fidelityMeta: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  fidelityTarget: { fontSize: 13, fontWeight: "700" },
  inputBox: {
    backgroundColor: colors.surface1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.blue,
    padding: 14,
  },
  inputLabel: { fontSize: 10, color: colors.textSecondary, marginBottom: 4 },
  inputValue: { fontSize: 20, fontWeight: "600", color: colors.ink },
  chipRow: { flexDirection: "row", gap: 6 },
  chip: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  chipText: { fontSize: 11, fontWeight: "600", color: colors.textSecondary },
  chipTextActive: { color: "#fff" },
  whyCard: {
    padding: 12,
    backgroundColor: "rgba(45,106,79,0.08)",
    borderRadius: 12,
  },
  whyLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  checkMark: { fontSize: 12 },
  checkText: { fontSize: 11, color: colors.ink },
  routeText: { fontSize: 11, color: colors.textSecondary },
});

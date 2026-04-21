import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  BackPill,
  Eyebrow,
  CharlieHeadline,
  CharlieSub,
  CTAButton,
  ProgressCard,
} from "@/components/shared";
import { colors } from "@/constants/theme";

const CHIPS = ["$50", "$90", "$150", "Custom"];

export default function MoveMoneyScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState("$90");

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <BackPill />
      <View style={{ height: 14 }} />

      <Eyebrow text="Move money" />
      <View style={{ height: 4 }} />
      <CharlieHeadline
        plainPrefix={"Finish your\n"}
        italicEmphasis="emergency fund"
      />
      <View style={{ height: 6 }} />
      <CharlieSub text="You're 68% of the way there. $90 closes the gap." />
      <View style={{ height: 14 }} />

      <ProgressCard
        tag="Goal"
        label="Emergency fund"
        current="$6,810"
        target="$10,000"
        percent={0.68}
        context="At $50/week you'd finish in 13 weeks."
      />
      <View style={{ height: 14 }} />

      {/* Amount input display */}
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
            style={[s.chip, selected === c && s.chipActive]}
            onPress={() => {
              if (c === "Custom") {
                Alert.prompt("Custom amount", "Enter the amount to move", (value) => {
                  if (value) setSelected(`$${value}`);
                });
              } else {
                setSelected(c);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, selected === c && s.chipTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height: 10 }} />

      <Text style={s.routeText}>From Chase Checking → Chase Savings</Text>

      <View style={{ flex: 1, minHeight: 40 }} />

      <CTAButton title={`Move ${selected}`} variant="blue" onPress={() => router.push("/actions/move-money-win")} />
      <View style={{ height: 8 }} />
      <CTAButton title="Not now" variant="ghost" onPress={() => router.back()} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 24, paddingTop: 54, paddingBottom: 24, minHeight: "100%" },
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
  chipActive: { backgroundColor: colors.blue },
  chipText: { fontSize: 11, fontWeight: "600", color: colors.textSecondary },
  chipTextActive: { color: colors.textOnBlue },
  routeText: { fontSize: 11, color: colors.textSecondary },
});

import { View, Text, ScrollView, StyleSheet } from "react-native";
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

const WEEKS = [
  { label: "2w ago", value: 0.42, highlight: false },
  { label: "Last", value: 0.48, highlight: false },
  { label: "This", value: 0.38, highlight: false },
  { label: "Now", value: 1.0, highlight: true },
];

export default function FixHabitScreen() {
  const router = useRouter();

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <BackPill />
      <View style={{ height: 14 }} />

      <Eyebrow text="Fix a habit" />
      <View style={{ height: 4 }} />
      <CharlieHeadline
        plainPrefix="Uber up "
        italicEmphasis="2.4×"
        plainSuffix={"\nthis week"}
      />
      <View style={{ height: 6 }} />
      <CharlieSub text="You've spent $148 on rides — well above your usual." />
      <View style={{ height: 16 }} />

      {/* Bar chart card */}
      <CharlieCard cornerRadius={14} padding={14}>
        <View style={s.chartRow}>
          {WEEKS.map((w) => (
            <View key={w.label} style={s.barCol}>
              <View
                style={[
                  s.bar,
                  {
                    height: 70 * w.value,
                    backgroundColor: w.highlight ? colors.negative : colors.surface2,
                  },
                ]}
              />
              <Text style={s.barLabel}>{w.label}</Text>
            </View>
          ))}
        </View>
        <View style={s.divider} />
        <View style={s.usualRow}>
          <Text style={s.usualLabel}>Your usual</Text>
          <Text style={s.usualValue}>~$62/week</Text>
        </View>
      </CharlieCard>
      <View style={{ height: 14 }} />

      {/* Suggestion callout */}
      <View style={s.callout}>
        <Text style={s.calloutLabel}>CHARLIE'S SUGGESTION</Text>
        <Text style={s.calloutText}>
          "Try a $70 weekly cap. I'll alert you before you hit it."
        </Text>
      </View>

      <View style={{ flex: 1, minHeight: 40 }} />

      <CTAButton title="Set a weekly cap" variant="blue" onPress={() => router.back()} />
      <View style={{ height: 8 }} />
      <CTAButton title="Not now" variant="sand" onPress={() => router.back()} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 24, paddingTop: 54, paddingBottom: 24, minHeight: "100%" },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 10,
  },
  barCol: { flex: 1, alignItems: "center", gap: 6 },
  bar: { width: "100%", borderRadius: 4 },
  barLabel: { fontSize: 9, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.borderSubtle, marginBottom: 8 },
  usualRow: { flexDirection: "row", justifyContent: "space-between" },
  usualLabel: { fontSize: 11, color: colors.textSecondary },
  usualValue: { fontSize: 11, fontWeight: "700", color: colors.ink },
  callout: {
    padding: 12,
    backgroundColor: colors.sand2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(26,20,16,0.12)",
  },
  calloutLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.blue,
    marginBottom: 6,
  },
  calloutText: {
    fontSize: 12,
    color: colors.ink,
    lineHeight: 18,
  },
});

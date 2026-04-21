import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  BackPill,
  Eyebrow,
  CharlieHeadline,
  CharlieSub,
  CTAButton,
  CharlieCard,
} from "@/components/shared";
import { approveInsight } from "@/services/insights";
import { createGoal } from "@/services/goals";
import { colors } from "@/constants/theme";

export default function FixHabitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [saving, setSaving] = useState(false);

  // Parse insight data from route params, with fallbacks
  const actionValue = params.actionValue
    ? JSON.parse(params.actionValue as string)
    : {};

  const category = actionValue.category || "transport";
  const currentMtd = actionValue.current_mtd || 148;
  const avg3mo = actionValue.avg_3mo || 62;
  const suggestedLimit = actionValue.suggested_limit || Math.round(avg3mo * 1.15);
  const insightText = (params.insightText as string) || `You've spent $${currentMtd} on ${category} — well above your usual.`;

  const ratio = avg3mo > 0 ? (currentMtd / avg3mo).toFixed(1) : "?";

  // Build a simple visual bar chart — current vs average
  const maxVal = Math.max(currentMtd, avg3mo);
  const bars = [
    { label: "3-mo avg", value: avg3mo / maxVal, highlight: false },
    { label: "This month", value: currentMtd / maxVal, highlight: true },
  ];

  const handleSetCap = async () => {
    setSaving(true);
    try {
      // Mark insight as acted on
      if (params.insightId && params.createdAt) {
        await approveInsight(
          params.insightId as string,
          params.createdAt as string
        ).catch(() => {}); // Non-blocking
      }

      // Create a spend_limit goal
      const label = `${category.charAt(0).toUpperCase() + category.slice(1)} monthly cap`;
      await createGoal({
        type: "spend_limit",
        label,
        targetAmount: suggestedLimit,
      });

      Alert.alert(
        "Spending Cap Set!",
        `Charlie set a $${suggestedLimit}/month cap for ${category}. You'll see this tracked in your Goals tab.`,
        [{ text: "Got it", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <BackPill />
      <View style={{ height: 14 }} />

      <Eyebrow text="Fix a habit" />
      <View style={{ height: 4 }} />
      <CharlieHeadline
        plainPrefix={`${category.charAt(0).toUpperCase() + category.slice(1)} up `}
        italicEmphasis={`${ratio}×`}
        plainSuffix={"\nthis month"}
      />
      <View style={{ height: 6 }} />
      <CharlieSub text={insightText} />
      <View style={{ height: 16 }} />

      {/* Bar chart card */}
      <CharlieCard cornerRadius={14} padding={14}>
        <View style={s.chartRow}>
          {bars.map((w) => (
            <View key={w.label} style={s.barCol}>
              <Text style={[s.barAmount, w.highlight && { color: colors.negative }]}>
                ${w.highlight ? currentMtd : avg3mo}
              </Text>
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
          <Text style={s.usualLabel}>Your 3-month average</Text>
          <Text style={s.usualValue}>~${avg3mo}/mo</Text>
        </View>
      </CharlieCard>
      <View style={{ height: 14 }} />

      {/* Suggestion callout */}
      <View style={s.callout}>
        <Text style={s.calloutLabel}>CHARLIE'S SUGGESTION</Text>
        <Text style={s.calloutText}>
          "Try a ${suggestedLimit}/month cap on {category}. I'll track it for you in Goals."
        </Text>
      </View>

      <View style={{ flex: 1, minHeight: 40 }} />

      <CTAButton
        title={saving ? "Setting cap..." : `Set $${suggestedLimit}/month cap`}
        variant="blue"
        onPress={handleSetCap}
        disabled={saving}
      />
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
  barAmount: { fontSize: 12, fontWeight: "700", color: colors.ink },
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

import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  BackPill,
  Eyebrow,
  CharlieHeadline,
  CharlieSub,
  CTAButton,
  ProgressCard,
} from "@/components/shared";
import { approveInsight } from "@/services/insights";
import { colors } from "@/constants/theme";

// Bank app deep links (iOS URL schemes)
const BANK_APP_URLS: Record<string, string> = {
  chase: "chase://",
  "bank of america": "bofa://",
  wells: "wellsfargo://",
  citi: "citi://",
  capital: "capitalone://",
};

export default function MoveMoneyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const actionValue = params.actionValue
    ? JSON.parse(params.actionValue as string)
    : {};

  const suggestedAmount = actionValue.amount || 90;
  const fromAccount = actionValue.from_account || "Checking";
  const toAccount = actionValue.to_account || "Savings";
  const insightText = (params.insightText as string) || `Charlie found $${suggestedAmount} you can safely move to savings.`;

  const CHIPS = [
    `$${Math.round(suggestedAmount * 0.5)}`,
    `$${suggestedAmount}`,
    `$${Math.round(suggestedAmount * 1.5)}`,
    "Custom",
  ];

  const [selected, setSelected] = useState(`$${suggestedAmount}`);

  const handleMove = async () => {
    // Mark insight as acted on
    if (params.insightId && params.createdAt) {
      await approveInsight(
        params.insightId as string,
        params.createdAt as string
      ).catch(() => {});
    }

    // Try to open the user's bank app
    const fromLower = fromAccount.toLowerCase();
    for (const [key, url] of Object.entries(BANK_APP_URLS)) {
      if (fromLower.includes(key)) {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          Alert.alert(
            "Opening Bank App",
            `Transfer ${selected} from ${fromAccount} to ${toAccount} in your bank app.`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Bank",
                onPress: async () => {
                  await Linking.openURL(url);
                  router.push("/actions/move-money-win" as any);
                },
              },
            ]
          );
          return;
        }
      }
    }

    // Fallback: show instructions
    Alert.alert(
      "Transfer Instructions",
      `Open your bank app and transfer ${selected} from ${fromAccount} to ${toAccount}.`,
      [{ text: "Done", onPress: () => router.push("/actions/move-money-win" as any) }]
    );
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <BackPill />
      <View style={{ height: 14 }} />

      <Eyebrow text="Move money" />
      <View style={{ height: 4 }} />
      <CharlieHeadline
        plainPrefix={"Move to\n"}
        italicEmphasis={toAccount.toLowerCase()}
      />
      <View style={{ height: 6 }} />
      <CharlieSub text={insightText} />
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

      <Text style={s.routeText}>From {fromAccount} → {toAccount}</Text>

      <View style={{ flex: 1, minHeight: 40 }} />

      <CTAButton title={`Move ${selected}`} variant="blue" onPress={handleMove} />
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

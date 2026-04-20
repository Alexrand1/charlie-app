import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { OnboardingButton } from "@/components/onboarding/OnboardingButton";
import { ProgressDots } from "@/components/onboarding/ProgressDots";
import { colors, radii } from "@/constants/theme";

// Mock savings items — in production these come from POST /insights/analyze
const SAVINGS_ITEMS = [
  { id: "1", name: "Duplicate streaming", value: "$47/mo" },
  { id: "2", name: "Overcharged on internet", value: "$29/mo" },
  { id: "3", name: "Unused gym membership", value: "$67/mo" },
];

const TOTAL_SAVINGS = "$143/mo";

export default function ResultsScreen() {
  const router = useRouter();
  const { update } = useOnboarding();

  // Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(30)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Store opportunities in context
    update({
      opportunities: SAVINGS_ITEMS.map((item) => ({
        id: item.id,
        icon: "",
        title: item.name,
        subtitle: "",
        amount: item.value,
      })),
    });

    // Staggered entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={s.container}>
      {/* Eyebrow + Headline */}
      <Animated.View
        style={[
          s.headerSection,
          { opacity: headerFade, transform: [{ translateY: headerSlide }] },
        ]}
      >
        <View style={s.eyebrow}>
          <Text style={s.eyebrowText}>✦ Analysis complete</Text>
        </View>
        <Text style={s.title}>
          We found{"\n"}
          <Text style={s.titleItalic}>{TOTAL_SAVINGS}</Text>
          {"\n"}you could keep
        </Text>
      </Animated.View>

      {/* Savings card */}
      <Animated.View
        style={[
          s.savingsCard,
          { opacity: cardFade, transform: [{ translateY: cardSlide }] },
        ]}
      >
        <Text style={s.cardEyebrow}>SAVINGS FOUND</Text>
        <View style={s.cardItems}>
          {SAVINGS_ITEMS.map((item) => (
            <View key={item.id} style={s.cardItem}>
              <Text style={s.itemName}>{item.name}</Text>
              <Text style={s.itemValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Subtext */}
      <Animated.View style={{ opacity: cardFade }}>
        <Text style={s.helpText}>
          Charlie can fix all of this. Most takes one tap.
        </Text>
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* Bottom */}
      <ProgressDots total={5} current={2} />
      <OnboardingButton
        title="Let's fix it →"
        onPress={() => router.push("/onboarding/paywall")}
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface0,
    paddingHorizontal: 26,
    paddingTop: 60,
    paddingBottom: 26,
  },
  headerSection: {
    marginBottom: 16,
  },
  eyebrow: {
    marginBottom: 6,
  },
  eyebrowText: {
    fontSize: 12,
    color: colors.yellow,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 28,
    color: colors.cream,
    fontWeight: "400",
    lineHeight: 36,
  },
  titleItalic: {
    fontStyle: "italic",
  },
  savingsCard: {
    backgroundColor: colors.surface1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 10,
  },
  cardEyebrow: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.sage,
    marginBottom: 10,
  },
  cardItems: {
    gap: 6,
  },
  cardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.cream,
  },
  itemValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.yellow,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

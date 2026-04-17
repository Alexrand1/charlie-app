import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding, OpportunityItem } from "@/components/onboarding/OnboardingContext";
import { OnboardingButton } from "@/components/onboarding/OnboardingButton";
import { ProgressDots } from "@/components/onboarding/ProgressDots";
import { colors, spacing, radii } from "@/constants/theme";

// Mock analysis results — in production these come from POST /insights/analyze
const MOCK_OPPORTUNITIES: OpportunityItem[] = [
  {
    id: "1",
    icon: "📺",
    title: "Duplicate streaming services",
    subtitle: "Netflix + Hulu + Disney+ — save by picking two",
    amount: "$15.99/mo",
  },
  {
    id: "2",
    icon: "📱",
    title: "Phone bill optimization",
    subtitle: "Switch to a prepaid plan for the same data",
    amount: "$35/mo",
  },
  {
    id: "3",
    icon: "💳",
    title: "Unused subscription detected",
    subtitle: "Gym membership — no charges at location in 3 months",
    amount: "$49.99/mo",
  },
  {
    id: "4",
    icon: "🏦",
    title: "High-yield savings opportunity",
    subtitle: "Move idle cash to earn 4.5% APY instead of 0.01%",
    amount: "$180/yr",
  },
];

const POLL_INTERVAL = 2000;
const POLL_TIMEOUT = 8000; // Shorter for demo; spec says 30s

export default function ResultsScreen() {
  const router = useRouter();
  const { state, update } = useOnboarding();
  const [analyzing, setAnalyzing] = useState(true);
  const [items, setItems] = useState<OpportunityItem[]>([]);
  const [progress, setProgress] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnims = useRef<Animated.Value[]>([]);

  useEffect(() => {
    // Spin animation for loader
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    spin.start();

    // Simulate analysis polling — reveal items one by one
    let idx = 0;
    const revealInterval = setInterval(() => {
      if (idx < MOCK_OPPORTUNITIES.length) {
        const item = MOCK_OPPORTUNITIES[idx];
        setItems((prev) => [...prev, item]);
        setProgress((idx + 1) / MOCK_OPPORTUNITIES.length);
        idx++;
      }
    }, POLL_INTERVAL);

    // Analysis complete after all items revealed
    const timeout = setTimeout(() => {
      clearInterval(revealInterval);
      setAnalyzing(false);
      spin.stop();
      update({ opportunities: MOCK_OPPORTUNITIES });
    }, POLL_INTERVAL * MOCK_OPPORTUNITIES.length + 500);

    return () => {
      clearInterval(revealInterval);
      clearTimeout(timeout);
      spin.stop();
    };
  }, []);

  // Create fade anims for each new item
  useEffect(() => {
    if (items.length > fadeAnims.current.length) {
      const newAnim = new Animated.Value(0);
      fadeAnims.current.push(newAnim);
      Animated.timing(newAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [items.length]);

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const totalSavings = items.reduce((sum, item) => {
    const match = item.amount?.match(/\$(\d+(?:\.\d+)?)/);
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0);

  const renderItem = ({ item, index }: { item: OpportunityItem; index: number }) => {
    const anim = fadeAnims.current[index];
    return (
      <Animated.View
        style={[
          s.opportunityCard,
          anim ? { opacity: anim, transform: [{ translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          })}]} : {},
        ]}
      >
        <Text style={s.oppIcon}>{item.icon}</Text>
        <View style={s.oppContent}>
          <Text style={s.oppTitle}>{item.title}</Text>
          <Text style={s.oppSubtitle}>{item.subtitle}</Text>
        </View>
        {item.amount && (
          <View style={s.oppAmount}>
            <Text style={s.oppAmountText}>{item.amount}</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={s.container}>
      <ProgressDots total={6} current={3} />

      <View style={s.header}>
        <Text style={s.title}>
          {analyzing ? "Analyzing your finances..." : "Here's what we found"}
        </Text>
        {analyzing && (
          <View style={s.analyzeRow}>
            <Animated.Text
              style={[
                s.spinner,
                { transform: [{ rotate: spinInterpolation }] },
              ]}
            >
              ⟳
            </Animated.Text>
            <Text style={s.analyzeText}>
              Looking for savings opportunities...
            </Text>
          </View>
        )}
        {!analyzing && (
          <Text style={s.savingsTotal}>
            We found up to ${totalSavings.toFixed(0)} in potential savings
          </Text>
        )}
      </View>

      {/* Progress bar */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Results list */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />

      {/* CTA */}
      {!analyzing && (
        <View style={s.actions}>
          <OnboardingButton
            title="Unlock All Savings"
            onPress={() => router.push("/onboarding/paywall")}
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface0,
    paddingHorizontal: spacing.xxl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontStyle: "italic",
    color: colors.cream,
    marginBottom: 8,
  },
  analyzeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  spinner: {
    fontSize: 18,
    color: colors.yellow,
  },
  analyzeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  savingsTotal: {
    fontSize: 16,
    color: colors.sage,
    fontWeight: "600",
  },
  progressBar: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.yellow,
    borderRadius: 2,
  },
  list: {
    gap: 10,
    paddingBottom: 16,
  },
  opportunityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface1,
    borderRadius: radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  oppIcon: {
    fontSize: 24,
  },
  oppContent: {
    flex: 1,
  },
  oppTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cream,
    marginBottom: 2,
  },
  oppSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  oppAmount: {
    backgroundColor: "rgba(245,200,66,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  oppAmountText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.yellow,
  },
  actions: {
    gap: 8,
    paddingTop: 8,
  },
});

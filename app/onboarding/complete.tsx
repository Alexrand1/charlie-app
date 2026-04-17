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

interface ActionItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  type: "action" | "info";
}

function buildActionQueue(
  bankConnected: boolean,
  plan: "free" | "pro",
  opportunities: OpportunityItem[]
): ActionItem[] {
  const actions: ActionItem[] = [];

  if (bankConnected && opportunities.length > 0) {
    actions.push({
      id: "savings",
      icon: "💰",
      title: `${opportunities.length} savings opportunities ready`,
      subtitle: "Charlie will guide you through each one",
      type: "action",
    });
  }

  actions.push({
    id: "chat",
    icon: "💬",
    title: "Ask Charlie anything",
    subtitle: "\"How much did I spend on food this month?\"",
    type: "action",
  });

  if (!bankConnected) {
    actions.push({
      id: "link",
      icon: "🏦",
      title: "Link your bank for full insights",
      subtitle: "Head to Settings to connect your accounts",
      type: "action",
    });
  }

  actions.push({
    id: "goals",
    icon: "🎯",
    title: "Set your first savings goal",
    subtitle: "Tell Charlie what you're saving for",
    type: "action",
  });

  if (plan === "pro") {
    actions.push({
      id: "pro",
      icon: "⭐",
      title: "Pro features unlocked",
      subtitle: "Unlimited scans, AI chat, and more",
      type: "info",
    });
  }

  return actions;
}

export default function CompleteScreen() {
  const router = useRouter();
  const { state, completeOnboarding } = useOnboarding();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Animations
  const checkScale = useRef(new Animated.Value(0)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const listFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Build action queue with slight delay for skeleton effect
    const timer = setTimeout(() => {
      const queue = buildActionQueue(
        state.bankConnected,
        state.userPlan,
        state.opportunities
      );
      setActions(queue);
      setLoading(false);
    }, 1200);

    // Entrance animations
    Animated.sequence([
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(titleFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(listFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    return () => clearTimeout(timer);
  }, []);

  async function handleContinue() {
    await completeOnboarding();
    router.replace("/tabs");
  }

  const renderAction = ({ item }: { item: ActionItem }) => (
    <View style={s.actionCard}>
      <Text style={s.actionIcon}>{item.icon}</Text>
      <View style={s.actionContent}>
        <Text style={s.actionTitle}>{item.title}</Text>
        <Text style={s.actionSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  const renderSkeleton = () => (
    <View style={s.actionCard}>
      <View style={s.skeletonIcon} />
      <View style={s.actionContent}>
        <View style={s.skeletonTitle} />
        <View style={s.skeletonSubtitle} />
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <ProgressDots total={6} current={5} />

      {/* Celebration */}
      <View style={s.celebration}>
        <Animated.View
          style={[s.checkCircle, { transform: [{ scale: checkScale }] }]}
        >
          <Text style={s.checkMark}>✓</Text>
        </Animated.View>
        <Animated.View style={{ opacity: titleFade }}>
          <Text style={s.title}>
            You're all set{state.firstName ? `, ${state.firstName}` : ""}!
          </Text>
          <Text style={s.subtitle}>
            Charlie is ready to help you take control of your money.
          </Text>
        </Animated.View>
      </View>

      {/* Action queue */}
      <Animated.View style={[s.listSection, { opacity: listFade }]}>
        <Text style={s.listLabel}>YOUR NEXT STEPS</Text>
        {loading ? (
          <View style={s.list}>
            {renderSkeleton()}
            {renderSkeleton()}
            {renderSkeleton()}
          </View>
        ) : (
          <FlatList
            data={actions}
            renderItem={renderAction}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>

      {/* CTA */}
      <View style={s.actions}>
        <OnboardingButton
          title="Go to Dashboard"
          onPress={handleContinue}
        />
      </View>
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
  celebration: {
    alignItems: "center",
    marginBottom: 28,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.yellow,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  checkMark: {
    fontSize: 36,
    color: colors.textOnYellow,
    fontWeight: "700",
  },
  title: {
    fontSize: 28,
    fontStyle: "italic",
    color: colors.cream,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  listSection: {
    flex: 1,
  },
  listLabel: {
    fontSize: 11,
    color: colors.sage,
    letterSpacing: 1.5,
    fontWeight: "600",
    marginBottom: 12,
  },
  list: {
    gap: 10,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface1,
    borderRadius: radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cream,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  skeletonIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface2,
  },
  skeletonTitle: {
    width: "70%",
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.surface2,
    marginBottom: 6,
  },
  skeletonSubtitle: {
    width: "90%",
    height: 10,
    borderRadius: 4,
    backgroundColor: colors.surface2,
  },
  actions: {
    gap: 8,
    paddingTop: 8,
  },
});

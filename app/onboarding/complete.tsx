import React, { useEffect, useRef, useState } from "react";
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

type ActionState = "inProgress" | "queued";

interface ActionPillData {
  id: string;
  title: string;
  subtitle: string;
  state: ActionState;
}

function buildActions(
  plan: "free" | "pro",
  bankConnected: boolean
): ActionPillData[] {
  if (plan === "pro" && bankConnected) {
    return [
      {
        id: "1",
        title: "Canceling Peacock",
        subtitle: "Saving $7.99/mo · In progress",
        state: "inProgress",
      },
      {
        id: "2",
        title: "Negotiate Comcast",
        subtitle: "Est. $29/mo savings · Queued",
        state: "queued",
      },
      {
        id: "3",
        title: "Auto-save setup",
        subtitle: "$50/wk to high-yield · Queued",
        state: "queued",
      },
    ];
  }

  // Free plan or no bank
  const actions: ActionPillData[] = [];
  if (!bankConnected) {
    actions.push({
      id: "link",
      title: "Connect your bank",
      subtitle: "Link an account to unlock insights",
      state: "queued",
    });
  }
  actions.push({
    id: "chat",
    title: "Ask Charlie anything",
    subtitle: "Try: \"How much did I spend eating out?\"",
    state: "queued",
  });
  actions.push({
    id: "goal",
    title: "Set your first goal",
    subtitle: "Tell Charlie what you're saving for",
    state: "queued",
  });
  return actions;
}

export default function CompleteScreen() {
  const router = useRouter();
  const { state, completeOnboarding } = useOnboarding();
  const [actions, setActions] = useState<ActionPillData[]>([]);
  const [showActions, setShowActions] = useState(false);

  // Animations
  const iconScale = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const listFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Build actions after short delay for skeleton effect
    const timer = setTimeout(() => {
      setActions(buildActions(state.userPlan, state.bankConnected));
      setShowActions(true);
    }, 800);

    // Entrance animations
    Animated.sequence([
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(headerFade, {
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

  async function handleDashboard() {
    await completeOnboarding();
    router.replace("/tabs");
  }

  return (
    <View style={s.container}>
      {/* Lightning bolt icon */}
      <Animated.View style={[s.iconBox, { transform: [{ scale: iconScale }] }]}>
        <Text style={s.iconEmoji}>⚡</Text>
      </Animated.View>

      {/* Headline */}
      <Animated.View style={[s.headerSection, { opacity: headerFade }]}>
        <Text style={s.title}>
          Charlie's on it,{"\n"}
          <Text style={s.titleItalic}>
            {state.firstName || "friend"}
          </Text>
        </Text>
        <Text style={s.subtitle}>Here's what's happening right now.</Text>
      </Animated.View>

      {/* Action pills */}
      <Animated.View style={[s.actionList, { opacity: listFade }]}>
        {!showActions ? (
          // Skeleton loaders
          <>
            <SkeletonPill />
            <SkeletonPill />
            <SkeletonPill />
          </>
        ) : (
          actions.map((action) => (
            <View key={action.id} style={s.actionPill}>
              <View style={s.actionPillLeft}>
                <View
                  style={[
                    s.statusDot,
                    action.state === "inProgress"
                      ? s.statusDotActive
                      : s.statusDotQueued,
                  ]}
                />
              </View>
              <View style={s.actionPillContent}>
                <Text style={s.actionTitle}>{action.title}</Text>
                <Text style={s.actionSubtitle}>{action.subtitle}</Text>
              </View>
            </View>
          ))
        )}
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* Bottom */}
      <ProgressDots total={5} current={4} />
      <OnboardingButton
        title="Go to my dashboard →"
        onPress={handleDashboard}
        style={{ marginTop: 10, backgroundColor: colors.surface2 }}
      />
    </View>
  );
}

function SkeletonPill() {
  return (
    <View style={s.actionPill}>
      <View style={s.actionPillLeft}>
        <View style={[s.statusDot, s.statusDotQueued]} />
      </View>
      <View style={s.actionPillContent}>
        <View style={s.skeletonTitle} />
        <View style={s.skeletonSubtitle} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface0,
    paddingHorizontal: 26,
    paddingTop: 52,
    paddingBottom: 26,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(59,130,246,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(59,130,246,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 14,
  },
  iconEmoji: {
    fontSize: 24,
  },
  headerSection: {
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    color: colors.ink,
    fontWeight: "400",
    lineHeight: 36,
  },
  titleItalic: {
    fontStyle: "italic",
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  actionList: {
    gap: 7,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface1,
    borderRadius: radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 12,
  },
  actionPillLeft: {
    justifyContent: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotActive: {
    backgroundColor: colors.blue,
  },
  statusDotQueued: {
    backgroundColor: colors.textSecondary,
    opacity: 0.4,
  },
  actionPillContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  skeletonTitle: {
    width: "60%",
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.surface2,
    marginBottom: 6,
  },
  skeletonSubtitle: {
    width: "85%",
    height: 10,
    borderRadius: 4,
    backgroundColor: colors.surface2,
  },
});

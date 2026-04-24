import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "@/constants/theme";

const STEPS = [
  "Subscription located",
  "Sending cancellation...",
  "Confirming cancellation",
];

export default function CancellingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    merchant?: string;
    annualSavings?: string;
    monthlyCost?: string;
    lastSeenDate?: string;
  }>();
  const merchant = params.merchant || "your subscription";

  const [activeStep, setActiveStep] = useState(0);

  // Big hollow ring: gentle pulse so the screen feels alive while we fake
  // the cancellation work.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Step timeline — matches the "usually 10-30 seconds" footer loosely.
  useEffect(() => {
    const t1 = setTimeout(() => setActiveStep(1), 1600);
    const t2 = setTimeout(() => setActiveStep(2), 3400);
    const t3 = setTimeout(
      () =>
        router.replace({
          pathname: "/actions/cancelled-win" as any,
          params: {
            merchant: params.merchant || "",
            annualSavings: params.annualSavings || "",
            monthlyCost: params.monthlyCost || "",
            lastSeenDate: params.lastSeenDate || "",
          },
        }),
      5000
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [router, params.merchant, params.annualSavings, params.monthlyCost, params.lastSeenDate]);

  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });
  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <View style={s.container}>
      <View style={{ flex: 1 }} />

      {/* Large empty pulsing ring — matches design's hollow circle */}
      <Animated.View
        style={[
          s.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      <Text style={s.title}>Charlie's on it</Text>
      <Text style={s.subtitle}>
        Cancelling your {merchant} subscription right now...
      </Text>

      {/* Steps */}
      <View style={s.steps}>
        {STEPS.map((step, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          return (
            <View key={step} style={s.stepRow}>
              <View
                style={[
                  s.dot,
                  done && s.dotDone,
                  active && s.dotActive,
                ]}
              >
                {done && <Text style={s.dotCheck}>✓</Text>}
                {active && <View style={s.dotPulse} />}
              </View>
              <Text
                style={[
                  s.stepText,
                  done && s.stepDone,
                  active && s.stepActive,
                  !done && !active && s.stepPending,
                ]}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />
      <Text style={s.timeHint}>This usually takes 10–30 seconds</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface0,
    alignItems: "center",
    paddingTop: 54,
    paddingBottom: 24,
    paddingHorizontal: 32,
  },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.blue,
    marginBottom: 28,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 22,
    fontStyle: "italic",
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 26,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 16,
  },
  steps: { width: "100%", gap: 14 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  dotDone: { backgroundColor: colors.positive },
  dotActive: { backgroundColor: "rgba(22,40,68,0.4)" },
  dotCheck: { fontSize: 10, fontWeight: "700", color: "#fff" },
  dotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.blue,
  },
  stepText: { fontSize: 13 },
  stepDone: { color: colors.textSecondary },
  stepActive: { fontWeight: "600", color: colors.ink },
  stepPending: { color: colors.textMuted },
  timeHint: { fontSize: 11, color: colors.textMuted },
});

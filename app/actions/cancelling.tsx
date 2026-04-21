import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";

const STEPS = [
  "Confirming account",
  "Sending cancellation",
  "Verifying",
];

export default function CancellingScreen() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);

  // Simulate progress then navigate to win screen
  useEffect(() => {
    const t1 = setTimeout(() => setActiveStep(1), 1500);
    const t2 = setTimeout(() => setActiveStep(2), 3000);
    const t3 = setTimeout(() => router.replace("/actions/cancelled-win"), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <View style={s.container}>
      <View style={{ flex: 1 }} />

      {/* Spinner */}
      <View style={s.spinnerWrap}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>

      <Text style={s.title}>Charlie's on it</Text>
      <Text style={s.subtitle}>Cancelling Paramount+</Text>

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
      <Text style={s.timeHint}>Usually 10–30 seconds</Text>
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
  spinnerWrap: { marginBottom: 20 },
  title: {
    fontSize: 26,
    fontStyle: "italic",
    color: colors.ink,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 22,
  },
  steps: { width: "100%", gap: 12 },
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
  stepText: { fontSize: 12 },
  stepDone: { color: colors.textSecondary },
  stepActive: { fontWeight: "600", color: colors.ink },
  stepPending: { color: colors.textMuted },
  timeHint: { fontSize: 11, color: colors.textMuted },
});

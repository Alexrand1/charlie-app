import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  BackPill,
  CTAButton,
  CharlieCard,
} from "@/components/shared";
import { colors } from "@/constants/theme";

const STEPS = [
  "Share your code or link",
  "They sign up & connect a bank",
  "You both get $10",
];

export default function ReferralHubScreen() {
  const router = useRouter();

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <BackPill />
      <View style={{ height: 14 }} />

      {/* Hero card */}
      <View style={s.heroCard}>
        <Text style={{ fontSize: 32 }}>🎁</Text>
        <Text style={s.heroTitle}>Give $10, get $10</Text>
        <Text style={s.heroSub}>
          Every friend who signs up and links a bank earns you both $10.
        </Text>
      </View>

      {/* Code card */}
      <CharlieCard cornerRadius={14} padding={20}>
        <View style={{ alignItems: "center" }}>
          <Text style={s.codeLabel}>YOUR REFERRAL CODE</Text>
          <Text style={s.codeValue}>CHARLIE10</Text>
        </View>
      </CharlieCard>
      <View style={{ height: 16 }} />

      {/* How it works */}
      <Text style={s.sectionLabel}>HOW IT WORKS</Text>
      <View style={{ gap: 12, marginBottom: 20 }}>
        {STEPS.map((step, i) => (
          <View key={i} style={s.stepRow}>
            <View style={s.stepBadge}>
              <Text style={s.stepNum}>{i + 1}</Text>
            </View>
            <Text style={s.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <CTAButton
        title="Share code"
        variant="blue"
        onPress={() => router.push("/referral/share")}
      />
      <View style={{ height: 8 }} />
      <CTAButton title="Copy invite link" variant="sand" />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 24, paddingTop: 54, paddingBottom: 24 },
  heroCard: {
    backgroundColor: colors.navyLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  heroTitle: { fontSize: 22, fontStyle: "italic", color: "#fff" },
  heroSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 18 },
  codeLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 28,
    fontStyle: "italic",
    color: colors.yellow,
    letterSpacing: 2,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.navyLight,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNum: { fontSize: 12, fontWeight: "700", color: "#fff" },
  stepText: { fontSize: 12, color: colors.cream },
});

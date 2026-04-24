import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { CTAButton, CharlieCard } from "@/components/shared";
import { colors } from "@/constants/theme";
import { copyToClipboard } from "@/utils/clipboard";
import { getMyReferral, Referral } from "@/services/referral";
import { FLOATING_TAB_BAR_CLEARANCE } from "./_layout";

const STEPS = [
  "Share your code or link with a friend",
  "They sign up and connect their bank",
  "You both get $10 when they act",
];

// The "Get $10" tab renders the referral hub inline so the bottom tab bar
// stays visible and the user can exit by tapping another tab.
// Sub-screens (share / tracker / reward-earned) are still separate stack
// screens under /referral/* and get pushed on top when needed.
export default function ReferTab() {
  const router = useRouter();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await getMyReferral();
      setReferral(r);
    } catch (err) {
      // Leave referral null — render a degraded hub that still explains
      // the program but hides the code block.
      console.warn("[Refer] getMyReferral failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCopyCode = () => {
    if (!referral) return;
    copyToClipboard(referral.code, "Code copied!");
  };

  return (
    <View style={s.root}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <View style={s.headerRow}>
          <Text style={s.screenTitle}>Get $10</Text>
          <TouchableOpacity
            onPress={() => router.push("/referral/tracker" as any)}
            activeOpacity={0.7}
            style={s.trackerPill}
          >
            <Text style={s.trackerPillText}>Track →</Text>
          </TouchableOpacity>
        </View>

        {/* Hero card */}
        <View style={s.heroCard}>
          <Text style={{ fontSize: 32 }}>🎁</Text>
          <Text style={s.heroTitle}>Give $10, get $10</Text>
          <Text style={s.heroSub}>
            When your friend signs up and takes their first action, you both
            get $10.
          </Text>
        </View>

        {/* Code card — tap to copy */}
        {referral ? (
          <TouchableOpacity activeOpacity={0.7} onPress={handleCopyCode}>
            <CharlieCard cornerRadius={14} padding={20}>
              <View style={{ alignItems: "center" }}>
                <Text style={s.codeLabel}>YOUR REFERRAL CODE</Text>
                <Text style={s.codeValue}>{referral.code}</Text>
                <Text style={s.codeHint}>Tap to copy</Text>
              </View>
            </CharlieCard>
          </TouchableOpacity>
        ) : loading ? (
          <View style={s.codeLoadingCard}>
            <ActivityIndicator color={colors.blue} />
          </View>
        ) : null}
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
          title="Share my invite link"
          variant="blue"
          onPress={() => router.push("/referral/share" as any)}
          disabled={!referral}
        />
        <View style={{ height: 8 }} />
        <CTAButton
          title={referral ? `Copy code · ${referral.code}` : "Copy code"}
          variant="sand"
          onPress={handleCopyCode}
          disabled={!referral}
        />

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface0 },
  scroll: { flex: 1 },
  content: {
    padding: 24,
    paddingTop: 54,
    paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.ink,
  },
  trackerPill: {
    backgroundColor: colors.surface2,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  trackerPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.ink,
  },
  heroCard: {
    backgroundColor: colors.blue,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  heroTitle: { fontSize: 22, fontStyle: "italic", color: colors.textOnBlue },
  heroSub: {
    fontSize: 12,
    color: colors.textOnBlue,
    lineHeight: 18,
    opacity: 0.7,
  },
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
    color: colors.blue,
    letterSpacing: 2,
  },
  codeHint: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 6,
    letterSpacing: 0.4,
  },
  codeLoadingCard: {
    backgroundColor: colors.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 28,
    alignItems: "center",
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
    backgroundColor: colors.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNum: { fontSize: 12, fontWeight: "700", color: colors.textOnBlue },
  stepText: { fontSize: 12, color: colors.ink, flex: 1 },
});

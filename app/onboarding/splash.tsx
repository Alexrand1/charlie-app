import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { OnboardingButton } from "@/components/onboarding/OnboardingButton";
import { colors, spacing } from "@/constants/theme";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <Animated.View
        style={[
          s.logoSection,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={s.logo}>Charlie</Text>
        <Text style={s.tagline}>
          The money app that actually{"\n"}does the work for you.
        </Text>
      </Animated.View>

      {/* Floating mini-dashboard */}
      <Animated.View
        style={[
          s.dashboardWrapper,
          { opacity: cardFade, transform: [{ translateY: cardSlide }] },
        ]}
      >
        <View style={s.dashboard}>
          {/* Status bar mock */}
          <View style={s.mockStatusBar}>
            <Text style={s.mockTime}>9:41</Text>
            <Text style={s.mockDots}>●●●</Text>
          </View>

          <Text style={s.dashGreeting}>Hey Jordan 👋</Text>
          <Text style={s.dashLabel}>TOTAL BALANCE</Text>
          <Text style={s.dashAmount}>$12,480</Text>
          <Text style={s.dashChange}>↑ $340 this month</Text>

          {/* Mini account cards */}
          <View style={s.accountRow}>
            {[
              { label: "Checking", value: "$3,240" },
              { label: "Savings", value: "$6,810" },
              { label: "Invest", value: "$2,430" },
            ].map((a) => (
              <View key={a.label} style={s.miniAccount}>
                <Text style={s.miniLabel}>{a.label}</Text>
                <Text style={s.miniValue}>{a.value}</Text>
              </View>
            ))}
          </View>

          {/* Actions header */}
          <View style={s.actionsHeader}>
            <Text style={s.actionsLabel}>ACTIONS FOR YOU</Text>
            <View style={s.actionsBadge}>
              <Text style={s.actionsBadgeText}>3</Text>
            </View>
          </View>

          {/* Action cards */}
          <View style={s.actionCard}>
            <Text style={s.actionTag}>MOVE MONEY</Text>
            <Text style={s.actionBody}>
              Extra ~$210 free. Move $90 to finish your emergency fund.
            </Text>
            <View style={s.actionBtnRow}>
              <View style={[s.actionBtn, s.actionBtnPrimary]}>
                <Text style={s.actionBtnTextLight}>Move $90 →</Text>
              </View>
              <View style={[s.actionBtn, s.actionBtnSecondary]}>
                <Text style={s.actionBtnTextMuted}>Not now</Text>
              </View>
            </View>
          </View>

          <View style={s.actionCard}>
            <Text style={s.actionTag}>STOP A LEAK</Text>
            <Text style={s.actionBody}>
              Paramount+ billing $14.99/mo for 7 months.
            </Text>
            <View style={s.actionBtnRow}>
              <View style={[s.actionBtn, s.actionBtnPrimary]}>
                <Text style={s.actionBtnTextLight}>Cancel it</Text>
              </View>
              <View style={[s.actionBtn, s.actionBtnSecondary]}>
                <Text style={s.actionBtnTextMuted}>Keep it</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* CTAs */}
      <View style={s.ctaSection}>
        <OnboardingButton
          title="Get started"
          variant="secondary"
          onPress={() => router.push("/onboarding/signup")}
          style={{ backgroundColor: "#FFFFFF" }}
        />
        <OnboardingButton
          title="I already have an account"
          variant="ghost"
          onPress={() => router.replace("/auth/sign-in")}
        />
      </View>
    </View>
  );
}

const DASH_BG = "#F5F0E8"; // charlieCream
const DASH_SAND = "#EDE8DD";
const DASH_SAND2 = "#DDD8CE";
const DASH_INK = "#1A1A1A";
const DASH_MUTED = "#7A7A72";
const DASH_GREEN = "#3A8A4A";
const DASH_BLUE = colors.surface0;

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface0,
    paddingHorizontal: 26,
    paddingTop: 48,
    paddingBottom: 26,
  },
  logoSection: {
    marginBottom: 16,
  },
  logo: {
    fontSize: 28,
    fontStyle: "italic",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  tagline: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 18,
    maxWidth: 200,
  },
  dashboardWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  dashboard: {
    width: 190,
    backgroundColor: DASH_BG,
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingTop: 26,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 20 },
    elevation: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  mockStatusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  mockTime: {
    fontSize: 8,
    fontWeight: "600",
    color: DASH_MUTED,
  },
  mockDots: {
    fontSize: 8,
    color: "rgba(122,122,114,0.4)",
  },
  dashGreeting: {
    fontSize: 10,
    color: DASH_MUTED,
    marginBottom: 3,
  },
  dashLabel: {
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: DASH_MUTED,
    marginBottom: 2,
  },
  dashAmount: {
    fontSize: 26,
    fontStyle: "italic",
    color: DASH_INK,
    marginBottom: 2,
  },
  dashChange: {
    fontSize: 9,
    fontWeight: "600",
    color: DASH_GREEN,
    marginBottom: 11,
  },
  accountRow: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 12,
  },
  miniAccount: {
    flex: 1,
    backgroundColor: DASH_SAND,
    borderRadius: 8,
    padding: 7,
    borderWidth: 1,
    borderColor: DASH_SAND2,
  },
  miniLabel: {
    fontSize: 7,
    fontWeight: "500",
    color: DASH_MUTED,
    marginBottom: 2,
  },
  miniValue: {
    fontSize: 10,
    fontWeight: "700",
    color: DASH_INK,
  },
  actionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  actionsLabel: {
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: DASH_MUTED,
  },
  actionsBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: DASH_BLUE,
    justifyContent: "center",
    alignItems: "center",
  },
  actionsBadgeText: {
    fontSize: 7,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  actionCard: {
    backgroundColor: DASH_SAND,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: DASH_SAND2,
    marginBottom: 6,
  },
  actionTag: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: DASH_BLUE,
    marginBottom: 4,
  },
  actionBody: {
    fontSize: 9,
    color: DASH_INK,
    lineHeight: 13,
    marginBottom: 6,
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: 5,
  },
  actionBtn: {
    flex: 1,
    height: 22,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnPrimary: {
    backgroundColor: DASH_BLUE,
  },
  actionBtnSecondary: {
    backgroundColor: DASH_SAND2,
  },
  actionBtnTextLight: {
    fontSize: 8,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionBtnTextMuted: {
    fontSize: 8,
    fontWeight: "700",
    color: DASH_MUTED,
  },
  ctaSection: {
    gap: 8,
  },
});

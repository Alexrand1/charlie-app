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
    // Staggered entrance animation
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

      {/* Hero Section */}
      <View style={s.heroSection}>
        <Animated.View
          style={[
            s.logoContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={s.logo}>Charlie</Text>
          <Text style={s.tagline}>Your money, moving.</Text>
        </Animated.View>

        {/* Phone mockup illustration */}
        <Animated.View
          style={[
            s.mockupContainer,
            { opacity: cardFade, transform: [{ translateY: cardSlide }] },
          ]}
        >
          <View style={s.phoneMockup}>
            <View style={s.mockupNotch} />
            <View style={s.mockupContent}>
              <View style={s.mockupCard}>
                <Text style={s.mockupLabel}>NET WORTH</Text>
                <Text style={s.mockupAmount}>$24,832</Text>
                <View style={s.mockupBar}>
                  <View style={[s.mockupBarFill, { width: "68%" }]} />
                </View>
              </View>
              <View style={s.mockupRow}>
                <View style={[s.mockupChip, { backgroundColor: colors.yellow }]}>
                  <Text style={s.mockupChipText}>Saved $142</Text>
                </View>
                <View style={[s.mockupChip, { backgroundColor: colors.sage }]}>
                  <Text style={s.mockupChipText}>3 Goals</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Value props */}
      <Animated.View style={[s.valueProps, { opacity: cardFade }]}>
        <View style={s.valueProp}>
          <View style={s.valueIcon}>
            <Text style={s.valueEmoji}>🔍</Text>
          </View>
          <View style={s.valueTextContainer}>
            <Text style={s.valueTitle}>Find hidden savings</Text>
            <Text style={s.valueSubtitle}>
              Charlie spots subscriptions and fees you forgot about
            </Text>
          </View>
        </View>
        <View style={s.valueProp}>
          <View style={s.valueIcon}>
            <Text style={s.valueEmoji}>💬</Text>
          </View>
          <View style={s.valueTextContainer}>
            <Text style={s.valueTitle}>Ask anything about your money</Text>
            <Text style={s.valueSubtitle}>
              AI that knows your finances and gives real answers
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* CTA */}
      <View style={s.ctaSection}>
        <OnboardingButton
          title="Get Started"
          onPress={() => router.push("/onboarding/signup")}
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

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface0,
    paddingHorizontal: spacing.xxl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    fontSize: 44,
    fontStyle: "italic",
    color: colors.cream,
    fontWeight: "300",
  },
  tagline: {
    fontSize: 17,
    color: colors.textSecondary,
    marginTop: 4,
  },
  mockupContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  phoneMockup: {
    width: width * 0.6,
    height: width * 0.85,
    backgroundColor: colors.surface1,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.borderMid,
    overflow: "hidden",
    padding: 12,
  },
  mockupNotch: {
    width: 60,
    height: 6,
    backgroundColor: colors.borderSubtle,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 16,
  },
  mockupContent: {
    flex: 1,
    gap: 12,
  },
  mockupCard: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    padding: 16,
  },
  mockupLabel: {
    fontSize: 9,
    color: colors.sage,
    letterSpacing: 1.5,
    fontWeight: "600",
    marginBottom: 4,
  },
  mockupAmount: {
    fontSize: 28,
    color: colors.cream,
    fontWeight: "300",
    marginBottom: 10,
  },
  mockupBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
  },
  mockupBarFill: {
    height: 4,
    backgroundColor: colors.yellow,
    borderRadius: 2,
  },
  mockupRow: {
    flexDirection: "row",
    gap: 8,
  },
  mockupChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mockupChipText: {
    fontSize: 11,
    color: colors.textOnYellow,
    fontWeight: "600",
  },
  valueProps: {
    gap: 16,
    marginBottom: 24,
  },
  valueProp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  valueIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  valueEmoji: {
    fontSize: 18,
  },
  valueTextContainer: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.cream,
  },
  valueSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ctaSection: {
    gap: 8,
  },
});

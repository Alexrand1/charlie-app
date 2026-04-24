import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
  Alert,
  ScrollView,
  Linking,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { auth } from "@/services/auth";
import { pendingReferral, PendingReferral } from "@/services/pendingReferral";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { OnboardingButton } from "@/components/onboarding/OnboardingButton";
import { ProgressDots } from "@/components/onboarding/ProgressDots";
import { colors, spacing, radii } from "@/constants/theme";

export default function SignUpScreen() {
  const router = useRouter();
  const { update } = useOnboarding();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [invite, setInvite] = useState<PendingReferral | null>(null);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    // If the user arrived via a deep link (/invite/CODE), the pending
    // referral store will have the code + referrer name already — surface
    // it as a banner so they see who invited them.
    pendingReferral.get().then((r) => {
      if (r) setInvite(r);
    });
  }, []);

  function validate(): string | null {
    if (!firstName.trim()) return "First name is required";
    if (!email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email";
    if (password.length < 8) return "Password must be at least 8 characters";
    return null;
  }

  async function handleCreate() {
    const error = validate();
    if (error) {
      Alert.alert("Hold on", error);
      return;
    }

    setLoading(true);
    try {
      await auth.register(email.trim(), password, firstName.trim());
      update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      router.push("/onboarding/connect");
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ||
        err.message ||
        "Something went wrong";
      Alert.alert("Sign Up Failed", message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignIn() {
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert("Sign In Failed", "Apple did not return an identity token.");
        return;
      }

      const user = await auth.signInWithApple({
        identityToken: credential.identityToken,
        email: credential.email,
        firstName: credential.fullName?.givenName,
        lastName: credential.fullName?.familyName,
      });
      update({
        firstName: user.firstName || credential.fullName?.givenName || "",
        lastName: credential.fullName?.familyName || "",
        email: user.email || credential.email || "",
      });
      router.push("/onboarding/connect");
    } catch (err: any) {
      if (err.code === "ERR_REQUEST_CANCELED") return;
      const message =
        err.response?.data?.error?.message ||
        err.message ||
        "Apple sign-in failed";
      Alert.alert("Sign In Failed", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back pill */}
          <TouchableOpacity
            style={s.backPill}
            onPress={() => router.back()}
          >
            <Text style={s.backArrow}>‹</Text>
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>

          {/* Invited-by banner — shown only when a deep-link referral is
              pending (user came in via /invite/CODE). */}
          {invite && (
            <View style={s.inviteBanner}>
              <Text style={s.inviteGift}>🎁</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.inviteTitle}>
                  {invite.referrerFirstName
                    ? `Invited by ${invite.referrerFirstName}`
                    : "You've got an invite"}
                </Text>
                <Text style={s.inviteSub}>
                  Sign up and you both get $10 when you take your first
                  action.
                </Text>
              </View>
            </View>
          )}

          {/* Headline */}
          <View style={s.header}>
            <Text style={s.title}>
              Let's get{"\n"}you <Text style={s.titleItalic}>started</Text>
            </Text>
            <Text style={s.subtitle}>Takes about 2 minutes.</Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            {/* First / Last name side by side */}
            <View style={s.nameRow}>
              <View style={[s.inputGroup, { flex: 1 }]}>
                <Text style={s.inputLabel}>FIRST NAME</Text>
                <TextInput
                  style={s.input}
                  placeholder="First name"
                  placeholderTextColor={colors.textMuted}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              <View style={[s.inputGroup, { flex: 1 }]}>
                <Text style={s.inputLabel}>LAST NAME</Text>
                <TextInput
                  style={s.input}
                  placeholder="Last name"
                  placeholderTextColor={colors.textMuted}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>EMAIL</Text>
              <TextInput
                style={s.input}
                placeholder="you@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>PHONE NUMBER</Text>
              <TextInput
                style={s.input}
                placeholder="+1 (000) 000-0000"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>PASSWORD</Text>
              <TextInput
                style={s.input}
                placeholder="Create a password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />
            </View>
          </View>

          {/* Terms */}
          <Text style={s.terms}>
            By continuing you agree to Charlie's{" "}
            <Text style={s.termsLink} onPress={() => Linking.openURL("https://charlie.app/terms")}>Terms</Text> &{" "}
            <Text style={s.termsLink} onPress={() => Linking.openURL("https://charlie.app/privacy")}>Privacy Policy</Text>
          </Text>

          <View style={{ flex: 1 }} />

          {/* Bottom section */}
          <ProgressDots total={5} current={0} />

          <OnboardingButton
            title="Create account"
            onPress={handleCreate}
            loading={loading}
            style={{ marginTop: 10 }}
          />

          {appleAvailable && (
            <TouchableOpacity
              style={s.appleRow}
              onPress={handleAppleSignIn}
            >
              <Text style={s.appleText}>
                Or{" "}
                <Text style={s.appleLink}>continue with Apple</Text>
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface0,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 52,
    paddingBottom: 26,
  },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surface2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 18,
    gap: 4,
  },
  backArrow: {
    fontSize: 18,
    color: colors.ink,
    fontWeight: "600",
    marginTop: -1,
  },
  backText: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: "500",
  },
  inviteBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  inviteGift: { fontSize: 22 },
  inviteTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 2,
  },
  inviteSub: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  header: {
    marginBottom: 20,
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
    marginTop: 7,
  },
  form: {
    gap: 9,
  },
  nameRow: {
    flexDirection: "row",
    gap: 8,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 11,
    color: colors.sage,
    letterSpacing: 1.2,
    fontWeight: "600",
  },
  input: {
    height: 48,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderMid,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    color: colors.ink,
  },
  terms: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 10,
    marginBottom: 18,
  },
  termsLink: {
    textDecorationLine: "underline",
    color: colors.textSecondary,
  },
  appleRow: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  appleText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  appleLink: {
    color: colors.ink,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

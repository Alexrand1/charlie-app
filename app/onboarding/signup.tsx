import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { auth } from "@/services/auth";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { OnboardingButton } from "@/components/onboarding/OnboardingButton";
import { ProgressDots } from "@/components/onboarding/ProgressDots";
import { colors, spacing, radii } from "@/constants/theme";

export default function SignUpScreen() {
  const router = useRouter();
  const { update } = useOnboarding();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  function validate(): string | null {
    if (!firstName.trim()) return "First name is required";
    if (!email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email";
    if (password.length < 8) return "Password must be at least 8 characters";
    return null;
  }

  async function handleSignUp() {
    const error = validate();
    if (error) {
      Alert.alert("Hold on", error);
      return;
    }

    setLoading(true);
    try {
      await auth.register(email.trim(), password, firstName.trim());
      update({ firstName: firstName.trim(), email: email.trim() });
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
          <ProgressDots total={6} current={1} />

          <View style={s.header}>
            <Text style={s.title}>Create your account</Text>
            <Text style={s.subtitle}>
              We just need a few details to get you started.
            </Text>
          </View>

          <View style={s.form}>
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>FIRST NAME</Text>
              <TextInput
                style={s.input}
                placeholder="Your first name"
                placeholderTextColor={colors.textMuted}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>EMAIL</Text>
              <TextInput
                style={s.input}
                placeholder="you@example.com"
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
              <Text style={s.inputLabel}>PASSWORD</Text>
              <TextInput
                style={s.input}
                placeholder="8+ characters"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
            </View>
          </View>

          <View style={s.actions}>
            <OnboardingButton
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
            />

            {appleAvailable && (
              <>
                <View style={s.divider}>
                  <View style={s.dividerLine} />
                  <Text style={s.dividerText}>OR</Text>
                  <View style={s.dividerLine} />
                </View>

                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={radii.md}
                  style={s.appleButton}
                  onPress={handleAppleSignIn}
                />
              </>
            )}

            <OnboardingButton
              title="Already have an account? Sign in"
              variant="ghost"
              onPress={() => router.replace("/auth/sign-in")}
            />
          </View>
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
    paddingHorizontal: spacing.xxl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontStyle: "italic",
    color: colors.cream,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    gap: 16,
    marginBottom: 28,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    color: colors.sage,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  input: {
    height: 52,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderMid,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.cream,
  },
  actions: {
    gap: 12,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
    marginHorizontal: spacing.md,
  },
  appleButton: {
    width: "100%",
    height: 54,
  },
});

import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { auth } from "@/services/auth";
import { colors, spacing, radii } from "@/constants/theme";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required");
      return;
    }
    if (isSignUp && !firstName) {
      Alert.alert("Error", "First name is required");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await auth.register(email, password, firstName);
      } else {
        await auth.login(email, password);
      }
      router.replace("/tabs");
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ||
        err.message ||
        "Something went wrong";
      Alert.alert(isSignUp ? "Sign Up Failed" : "Sign In Failed", message);
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

      await auth.signInWithApple({
        identityToken: credential.identityToken,
        email: credential.email,
        firstName: credential.fullName?.givenName,
        lastName: credential.fullName?.familyName,
      });
      router.replace("/tabs");
    } catch (err: any) {
      // User cancelled → don't show an alert
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
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={s.card}>
        <Text style={s.logo}>Charlie</Text>
        <Text style={s.subtitle}>Your money, moving.</Text>

        {isSignUp && (
          <TextInput
            style={s.input}
            placeholder="First name"
            placeholderTextColor={colors.textMuted}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
        )}
        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnYellow} />
          ) : (
            <Text style={s.buttonText}>
              {isSignUp ? "Create Account" : "Sign In"}
            </Text>
          )}
        </TouchableOpacity>

        {appleAvailable && (
          <>
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>OR</Text>
              <View style={s.dividerLine} />
            </View>

            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                isSignUp
                  ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                  : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              }
              cornerRadius={radii.md}
              style={s.appleButton}
              onPress={handleAppleSignIn}
            />
          </>
        )}

        <TouchableOpacity
          style={s.switchButton}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={s.switchText}>
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface0,
    padding: spacing.xxl,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  logo: {
    fontSize: 40,
    fontStyle: "italic",
    color: colors.cream,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xxxl,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderMid,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    marginBottom: spacing.md,
    color: colors.cream,
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: colors.yellow,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.textOnYellow,
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: spacing.xl,
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
    height: 50,
  },
  switchButton: {
    marginTop: spacing.xl,
    padding: spacing.sm,
  },
  switchText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

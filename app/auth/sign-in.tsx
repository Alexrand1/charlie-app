import { useState } from "react";
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
import { useRouter } from "expo-router";
import { auth } from "@/services/auth";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>Charlie</Text>
        <Text style={styles.subtitle}>Your AI financial assistant</Text>

        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="First name"
            placeholderTextColor="#999"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? "Create Account" : "Sign In"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.switchText}>
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  logo: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#1B2A4A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#1B2A4A",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#1B2A4A",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  switchButton: {
    marginTop: 20,
    padding: 8,
  },
  switchText: {
    color: "#1B2A4A",
    fontSize: 14,
  },
});

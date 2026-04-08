import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { exchangePublicToken } from "@/services/plaid";

/**
 * Deep link handler for charlie://plaid-callback
 * Called after user completes Plaid Link in the system browser.
 */
export default function PlaidCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    public_token?: string;
    institution?: string;
    exit?: string;
    error?: string;
  }>();

  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    async function handleCallback() {
      // User cancelled or errored out of Link
      if (params.exit === "true") {
        router.replace("/tabs");
        return;
      }

      if (!params.public_token) {
        setStatus("Missing public token. Returning home...");
        setTimeout(() => router.replace("/tabs"), 1500);
        return;
      }

      try {
        setStatus("Connecting your bank...");
        const result = await exchangePublicToken(params.public_token);
        setStatus(
          `Connected! ${result.accounts} account(s) linked.`
        );
        // Brief pause so user sees success, then go home
        setTimeout(() => router.replace("/tabs"), 1500);
      } catch (err: any) {
        setStatus("Failed to connect: " + (err.message || "Unknown error"));
        setTimeout(() => router.replace("/tabs"), 2500);
      }
    }

    handleCallback();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#fff" style={styles.spinner} />
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1B2A4A",
    padding: 24,
  },
  spinner: { marginBottom: 16 },
  text: { fontSize: 18, color: "#fff", textAlign: "center" },
});

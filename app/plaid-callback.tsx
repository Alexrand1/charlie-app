import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { exchangePublicToken } from "@/services/plaid";
import { colors } from "@/constants/theme";

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
        setStatus(`Connected! ${result.accounts} account(s) linked.`);
        setTimeout(() => router.replace("/tabs"), 1500);
      } catch (err: any) {
        setStatus("Failed to connect: " + (err.message || "Unknown error"));
        setTimeout(() => router.replace("/tabs"), 2500);
      }
    }
    handleCallback();
  }, []);

  return (
    <View style={s.container}>
      <ActivityIndicator size="large" color={colors.yellow} style={s.spinner} />
      <Text style={s.text}>{status}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface0,
    padding: 24,
  },
  spinner: { marginBottom: 16 },
  text: { fontSize: 18, color: colors.cream, textAlign: "center" },
});

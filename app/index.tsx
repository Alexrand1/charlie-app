import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { auth } from "@/services/auth";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    auth.isAuthenticated().then((authenticated) => {
      if (authenticated) {
        router.replace("/tabs");
      } else {
        router.replace("/auth/sign-in");
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1B2A4A" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1B2A4A" },
});

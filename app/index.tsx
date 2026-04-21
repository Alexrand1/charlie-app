import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { auth } from "@/services/auth";
import { hasCompletedOnboarding } from "@/components/onboarding/OnboardingContext";
import { registerForPushNotifications } from "@/services/notifications";
import { colors } from "@/constants/theme";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    async function route() {
      const authenticated = await auth.isAuthenticated();
      const onboarded = await hasCompletedOnboarding();

      if (authenticated && onboarded) {
        // Returning user — go straight to dashboard
        registerForPushNotifications().catch(() => {});
        router.replace("/tabs");
      } else if (authenticated && !onboarded) {
        // Authenticated but hasn't finished onboarding (e.g. app killed mid-flow)
        // Send them to connect step since they already have an account
        router.replace("/onboarding/connect");
      } else {
        // New user — start onboarding
        router.replace("/onboarding/splash");
      }
    }
    route();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.blue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.surface0 },
});

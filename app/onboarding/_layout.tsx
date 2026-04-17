import { Stack } from "expo-router";
import { OnboardingProvider } from "@/components/onboarding/OnboardingContext";
import { colors } from "@/constants/theme";

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface0 },
          animation: "slide_from_right",
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="splash" />
        <Stack.Screen
          name="signup"
          options={{ gestureEnabled: true }}
        />
        <Stack.Screen
          name="connect"
          options={{ gestureEnabled: true }}
        />
        <Stack.Screen name="results" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="complete" />
      </Stack>
    </OnboardingProvider>
  );
}

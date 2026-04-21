import { useEffect } from "react";
import { Slot, useRouter } from "expo-router";
import { onNotificationTapped } from "@/services/notifications";

export default function RootLayout() {
  const router = useRouter();

  // Handle push notification deep links
  useEffect(() => {
    const unsubscribe = onNotificationTapped((response: any) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.screen) {
        // Navigate to the screen specified in the push payload
        // e.g. { screen: "home" } → /tabs, { screen: "ask" } → /tabs/ask
        const screenMap: Record<string, string> = {
          home: "/tabs",
          ask: "/tabs/ask",
          goals: "/tabs/goals",
          settings: "/tabs/settings",
        };
        const route = screenMap[data.screen] || "/tabs";
        // Use setTimeout to ensure navigation is ready
        setTimeout(() => router.push(route as any), 100);
      }
    });

    return unsubscribe;
  }, [router]);

  return <Slot />;
}

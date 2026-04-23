import { useEffect } from "react";
import { Slot, useRouter } from "expo-router";
import { onNotificationTapped } from "@/services/notifications";

/**
 * Map a backend insight `actionType` to the action screen route.
 * Mirrors tabs/index.tsx → handleActionPress so push taps land in the
 * same place a home-screen card tap would.
 */
const ACTION_ROUTES: Record<string, string> = {
  MOVE_MONEY: "/actions/move-money",
  STOP_LEAK: "/actions/cancel-subscription",
  PATTERN: "/actions/fix-habit",
};

/** Generic tab destinations for screen-only payloads. */
const TAB_ROUTES: Record<string, string> = {
  home: "/tabs",
  ask: "/tabs/ask",
  goals: "/tabs/goals",
  settings: "/tabs/settings",
  insights: "/tabs",
  refer: "/tabs/refer",
};

export default function RootLayout() {
  const router = useRouter();

  // Handle push notification deep links
  useEffect(() => {
    const unsubscribe = onNotificationTapped((response: any) => {
      const data = response?.notification?.request?.content?.data;
      if (!data?.screen) return;

      // Rich insight payload → route to the specific action screen.
      // The backend (notifications/push.service.ts → buildInsightPushPayload)
      // sends: { screen: "insight", actionType, insightId, createdAt,
      //         insightText, actionLabel, actionDetail, actionValue(JSON) }
      if (data.screen === "insight") {
        const route = ACTION_ROUTES[data.actionType];
        if (route) {
          setTimeout(
            () =>
              router.push({
                pathname: route as any,
                params: {
                  insightId: data.insightId,
                  createdAt: data.createdAt,
                  insightText: data.insightText,
                  actionLabel: data.actionLabel || "",
                  actionDetail: data.actionDetail || "",
                  // actionValue is JSON-serialized on the backend because
                  // Expo/APNs requires Record<string, string>. Pass through
                  // as-is — action screens already parse it.
                  actionValue: data.actionValue || "{}",
                },
              }),
            100
          );
          return;
        }
        // Unknown actionType — fall back to home so the user at least sees
        // the insight on the accordion.
        setTimeout(() => router.push("/tabs" as any), 100);
        return;
      }

      // Plain tab payload: { screen: "home" | "ask" | "goals" | "settings" }
      const route = TAB_ROUTES[data.screen] || "/tabs";
      setTimeout(() => router.push(route as any), 100);
    });

    return unsubscribe;
  }, [router]);

  return <Slot />;
}

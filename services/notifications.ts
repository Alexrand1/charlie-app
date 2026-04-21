import { Platform } from "react-native";
import Constants from "expo-constants";
import { api } from "./api";

let Notifications: any = null;

// Try to load expo-notifications — it may not be installed yet
try {
  Notifications = require("expo-notifications");
} catch {
  console.log("expo-notifications not installed �� push notifications disabled");
}

// Expo project ID from app.json → extra.eas.projectId
const EXPO_PROJECT_ID =
  Constants.expoConfig?.extra?.eas?.projectId ||
  (Constants as any).easConfig?.projectId ||
  "f10b929b-f223-4b1b-9d2a-dc62b141a027";

/**
 * Request push notification permissions and register the token with the backend.
 * Call this after the user logs in.
 *
 * Requires: npx expo install expo-notifications
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications) {
    console.log("Push notifications not available (expo-notifications not installed)");
    return null;
  }

  try {
    // Check/request permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted");
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    });
    const pushToken = tokenData.data;

    // Register with backend
    await api.post("/users/push-token", { pushToken });

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Set up Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Charlie Notifications",
        importance: Notifications.AndroidImportance?.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1B2A4A",
      });
    }

    console.log("Push token registered:", pushToken);
    return pushToken;
  } catch (err) {
    console.error("Failed to register for push notifications:", err);
    return null;
  }
}

/**
 * Add a listener for incoming notifications (while app is foregrounded).
 * Returns an unsubscribe function.
 */
export function onNotificationReceived(
  callback: (notification: any) => void
): () => void {
  if (!Notifications) return () => {};

  const subscription =
    Notifications.addNotificationReceivedListener(callback);
  return () => subscription.remove();
}

/**
 * Add a listener for when user taps a notification.
 * Returns an unsubscribe function.
 */
export function onNotificationTapped(
  callback: (response: any) => void
): () => void {
  if (!Notifications) return () => {};

  const subscription =
    Notifications.addNotificationResponseReceivedListener(callback);
  return () => subscription.remove();
}

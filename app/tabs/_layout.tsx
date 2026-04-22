import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: "rgba(250, 247, 240, 0.85)",
          borderTopColor: "rgba(0, 0, 0, 0.06)",
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 6,
          height: Platform.OS === "ios" ? 88 : 70,
          ...(Platform.OS === "ios" && {
            // Frosted glass effect on iOS
            position: "absolute" as const,
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 2,
        },
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: "600" },
        headerShadowVisible: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="refer"
        options={{
          title: "Get $10",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: "Ask Charlie",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Goals hidden from tab bar — accessible under Activity */}
      <Tabs.Screen
        name="goals"
        options={{
          href: null,
        }}
      />
      {/* Settings accessed via profile avatar */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

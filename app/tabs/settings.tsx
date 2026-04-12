import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { auth, AuthUser } from "@/services/auth";
import { colors, spacing, radii } from "@/constants/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    auth.getUser().then(setUser);
  }, []);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await auth.logout();
          router.replace("/auth/sign-in");
        },
      },
    ]);
  };

  return (
    <View style={s.container}>
      <View style={s.profileSection}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {user?.firstName?.[0]?.toUpperCase() || "?"}
          </Text>
        </View>
        <Text style={s.name}>{user?.firstName || "User"}</Text>
        <Text style={s.email}>{user?.email || ""}</Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionLabel}>ACCOUNT</Text>
        <View style={s.card}>
          <Text style={s.cardItem}>Linked Banks: 0</Text>
          <View style={s.divider} />
          <Text style={s.cardItem}>Notifications: Off</Text>
        </View>
      </View>

      <TouchableOpacity style={s.signOutButton} onPress={handleSignOut}>
        <Text style={s.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={s.version}>Charlie v0.1.0 — MVP</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0, padding: spacing.xxl },
  profileSection: { alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.xxxl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.yellow,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarText: { color: colors.textOnYellow, fontSize: 28, fontWeight: "bold" },
  name: { fontSize: 20, fontWeight: "600", color: colors.cream },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  section: { marginBottom: spacing.xxl },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "400",
    color: colors.sage,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface1,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
  },
  cardItem: { fontSize: 15, color: colors.cream, paddingVertical: spacing.sm },
  divider: { height: 1, backgroundColor: colors.borderSubtle },
  signOutButton: {
    backgroundColor: colors.surface1,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.negative,
  },
  signOutText: { color: colors.negative, fontSize: 16, fontWeight: "600" },
  version: { textAlign: "center", color: colors.textMuted, fontSize: 11, marginTop: spacing.xxl, letterSpacing: 0.5 },
});

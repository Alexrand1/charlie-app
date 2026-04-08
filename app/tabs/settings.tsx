import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { auth, AuthUser } from "@/services/auth";

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
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]?.toUpperCase() || "?"}
          </Text>
        </View>
        <Text style={styles.name}>{user?.firstName || "User"}</Text>
        <Text style={styles.email}>{user?.email || ""}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Text style={styles.cardItem}>Linked Banks: 0</Text>
          <Text style={styles.cardItem}>Notifications: Off</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Charlie v0.1.0 — MVP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA", padding: 24 },
  profileSection: { alignItems: "center", marginTop: 20, marginBottom: 32 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#1B2A4A", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  name: { fontSize: 20, fontWeight: "600", color: "#1B2A4A" },
  email: { fontSize: 14, color: "#666", marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#999", textTransform: "uppercase", marginBottom: 8 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  cardItem: { fontSize: 16, color: "#1B2A4A", paddingVertical: 8 },
  signOutButton: { backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#E53E3E" },
  signOutText: { color: "#E53E3E", fontSize: 16, fontWeight: "600" },
  version: { textAlign: "center", color: "#999", fontSize: 12, marginTop: 24 },
});

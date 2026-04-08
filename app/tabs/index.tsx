import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { api } from "@/services/api";
import { auth, AuthUser } from "@/services/auth";

export default function HomeScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        // First try the backend
        const response = await api.get("/users/me");
        setUser(response.data.user);
      } catch {
        // Fall back to cached user
        const cached = await auth.getUser();
        if (cached) setUser(cached);
        else setError("Could not load profile. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1B2A4A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Text style={styles.greeting}>Hey, {user.firstName || "there"}</Text>
          <Text style={styles.subtitle}>Welcome to Charlie</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Connected</Text>
            <Text style={styles.cardBody}>{user.email}</Text>
          </View>
          <Text style={styles.hint}>Next up: connect your bank account</Text>
        </>
      ) : (
        <>
          <Text style={styles.greeting}>Welcome to Charlie</Text>
          <Text style={styles.subtitle}>
            {error || "Your AI financial assistant"}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F7FA", padding: 24 },
  greeting: { fontSize: 28, fontWeight: "bold", color: "#1B2A4A", marginBottom: 4 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 24 },
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1B2A4A", marginBottom: 8 },
  cardBody: { fontSize: 14, color: "#666", marginBottom: 4 },
  hint: { fontSize: 14, color: "#999", fontStyle: "italic" },
});

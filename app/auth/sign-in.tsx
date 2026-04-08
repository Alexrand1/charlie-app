import { View, Text, StyleSheet } from "react-native";

export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.subtitle}>Auth screens — Milestone 1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", color: "#1B2A4A" },
  subtitle: { fontSize: 16, color: "#666", marginTop: 8 },
});

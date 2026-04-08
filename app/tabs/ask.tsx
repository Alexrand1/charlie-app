import { View, Text, StyleSheet } from "react-native";

export default function AskCharlieScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ask Charlie</Text>
      <Text style={styles.subtitle}>Chat coming in Milestone 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", color: "#1B2A4A" },
  subtitle: { fontSize: 16, color: "#666", marginTop: 8 },
});

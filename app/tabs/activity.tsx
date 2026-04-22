import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

export default function ActivityScreen() {
  return (
    <View style={s.root}>
      <Text style={s.title}>Activity</Text>
      <Text style={s.sub}>Your transaction history will appear here.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface0,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "400",
    fontStyle: "italic",
    color: colors.ink,
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

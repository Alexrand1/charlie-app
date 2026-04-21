import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";

export function BackPill({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={s.pill}
      onPress={onPress ?? (() => router.back())}
      activeOpacity={0.7}
    >
      <Text style={s.text}>← Back</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface2,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.ink,
  },
});

import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "@/constants/theme";

type CTAStyle = "blue" | "green" | "sand" | "ghost";

interface CTAButtonProps {
  title: string;
  variant?: CTAStyle;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function CTAButton({
  title,
  variant = "blue",
  onPress,
  disabled,
  style,
}: CTAButtonProps) {
  const bg = {
    blue: colors.blue,
    green: "#2D6A4F",
    sand: colors.surface2,
    ghost: "transparent",
  }[variant];

  const fg = {
    blue: colors.textOnBlue,
    green: "#fff",
    sand: colors.ink,
    ghost: colors.muted,
  }[variant];

  return (
    <TouchableOpacity
      style={[s.btn, { backgroundColor: bg }, variant === "ghost" && s.ghost, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[s.text, { color: fg }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
  },
});

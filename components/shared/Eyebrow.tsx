import { Text, StyleSheet, TextStyle } from "react-native";
import { colors } from "@/constants/theme";

interface EyebrowProps {
  text: string;
  color?: string;
  size?: number;
  style?: TextStyle;
}

export function Eyebrow({ text, color, size = 9, style }: EyebrowProps) {
  return (
    <Text
      style={[
        s.eyebrow,
        { fontSize: size, color: color ?? colors.textSecondary },
        style,
      ]}
    >
      {text.toUpperCase()}
    </Text>
  );
}

const s = StyleSheet.create({
  eyebrow: {
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});

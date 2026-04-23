import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "@/constants/theme";

interface SectionHeaderProps {
  title: string;
  trailing?: React.ReactNode;
  style?: ViewStyle;
  /** Use "eyebrow" for uppercase small labels, "heading" for large section
   *  titles like "Savings" / "Credit Cards". */
  variant?: "eyebrow" | "heading";
}

export function SectionHeader({
  title,
  trailing,
  style,
  variant = "eyebrow",
}: SectionHeaderProps) {
  return (
    <View style={[s.row, style]}>
      <Text style={variant === "eyebrow" ? s.eyebrow : s.heading}>{title}</Text>
      {trailing}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  heading: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
});

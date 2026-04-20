import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors } from "@/constants/theme";

interface CharlieCardProps {
  children: React.ReactNode;
  background?: string;
  border?: string;
  cornerRadius?: number;
  padding?: number;
  style?: ViewStyle;
}

export function CharlieCard({
  children,
  background = colors.surface1,
  border = colors.borderSubtle,
  cornerRadius = 14,
  padding = 14,
  style,
}: CharlieCardProps) {
  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: background,
          borderColor: border,
          borderRadius: cornerRadius,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});

import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

interface ProgressDotsProps {
  total: number;
  current: number; // 0-indexed
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <View style={s.container}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            i === current ? s.dotActive : s.dotInactive,
            i < current && s.dotCompleted,
          ]}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.blue,
    borderRadius: 4,
  },
  dotInactive: {
    backgroundColor: colors.sand3,
  },
  dotCompleted: {
    backgroundColor: colors.blue,
    opacity: 0.5,
  },
});

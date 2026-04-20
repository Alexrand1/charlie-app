import React from "react";
import { View, StyleSheet } from "react-native";

interface WinBackgroundProps {
  color: string;
  children: React.ReactNode;
}

/**
 * Full-screen colored background for celebration / "win" screens.
 */
export function WinBackground({ color, children }: WinBackgroundProps) {
  return <View style={[s.container, { backgroundColor: color }]}>{children}</View>;
}

const s = StyleSheet.create({
  container: { flex: 1 },
});

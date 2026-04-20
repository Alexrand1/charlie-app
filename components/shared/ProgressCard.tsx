import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";
import { CharlieCard } from "./CharlieCard";

interface ProgressCardProps {
  tag: string;
  label: string;
  current: string;
  target: string;
  percent: number;
  context?: string;
}

export function ProgressCard({
  tag,
  label,
  current,
  target,
  percent,
  context,
}: ProgressCardProps) {
  return (
    <CharlieCard cornerRadius={14} padding={14}>
      <Text style={s.tag}>{tag.toUpperCase()}</Text>
      <Text style={s.label}>{label}</Text>
      <View style={s.row}>
        <Text style={s.current}>{current}</Text>
        <Text style={s.target}>of {target}</Text>
      </View>
      <View style={s.barBg}>
        <View style={[s.barFill, { width: `${Math.min(percent * 100, 100)}%` }]} />
      </View>
      {context && <Text style={s.context}>{context}</Text>}
    </CharlieCard>
  );
}

const s = StyleSheet.create({
  tag: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cream,
    marginBottom: 8,
  },
  row: { flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 8 },
  current: { fontSize: 20, fontWeight: "600", color: colors.cream },
  target: { fontSize: 12, color: colors.textSecondary },
  barBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  barFill: {
    height: 6,
    backgroundColor: colors.yellow,
    borderRadius: 3,
  },
  context: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});

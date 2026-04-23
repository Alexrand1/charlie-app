import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { colors } from "@/constants/theme";
import { formatRelativeTime } from "@/utils/format";
import type { Insight } from "@/services/insights";

interface ActionRowProps {
  insight: Insight;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Row for an acted-on insight in the Activity feed.
 * Looks like: ⚡  {label} · {relative time}
 *             {short description of the action taken}
 */
export function ActionRow({ insight, onPress, style }: ActionRowProps) {
  const actedAt = insight.actedAt || insight.createdAt;
  const label = insight.actionLabel || "Charlie action";
  const detail = insight.actionDetail || insight.insight;

  const body = (
    <View style={[s.row, style]}>
      <View style={s.badge}>
        <Text style={s.badgeText}>⚡</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={1}>
          {label}
        </Text>
        <Text style={s.sub} numberOfLines={2}>
          {detail}
        </Text>
      </View>
      <Text style={s.time}>{formatRelativeTime(actedAt)}</Text>
    </View>
  );

  if (!onPress) return body;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {body}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.textOnBlue, fontSize: 15 },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  sub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 6,
  },
});

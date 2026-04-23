import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { colors } from "@/constants/theme";

export interface FilterTab<T extends string> {
  key: T;
  label: string;
}

interface FilterTabsProps<T extends string> {
  tabs: FilterTab<T>[];
  active: T;
  onChange: (key: T) => void;
  style?: ViewStyle;
}

/**
 * Pill-style segmented control used on the Activity screen
 * (All / Actions / Spending) and elsewhere.
 */
export function FilterTabs<T extends string>({
  tabs,
  active,
  onChange,
  style,
}: FilterTabsProps<T>) {
  return (
    <View style={[s.track, style]}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onChange(t.key)}
            activeOpacity={0.8}
            style={[s.pill, isActive && s.pillActive]}
          >
            <Text style={[s.label, isActive && s.labelActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: colors.surface2,
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pillActive: {
    backgroundColor: colors.blue,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.textOnBlue,
  },
});

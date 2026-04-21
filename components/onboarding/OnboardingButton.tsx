import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import { colors, radii, spacing } from "@/constants/theme";

interface OnboardingButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function OnboardingButton({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: OnboardingButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        s.base,
        variant === "primary" && s.primary,
        variant === "secondary" && s.secondary,
        variant === "ghost" && s.ghost,
        isDisabled && s.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.textOnBlue : colors.ink}
        />
      ) : (
        <Text
          style={[
            s.text,
            variant === "primary" && s.textPrimary,
            variant === "secondary" && s.textSecondary,
            variant === "ghost" && s.textGhost,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  base: {
    width: "100%",
    height: 54,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  primary: {
    backgroundColor: colors.blue,
  },
  secondary: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderMid,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 17,
    fontWeight: "600",
  },
  textPrimary: {
    color: colors.textOnBlue,
  },
  textSecondary: {
    color: colors.ink,
  },
  textGhost: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "400",
  },
});

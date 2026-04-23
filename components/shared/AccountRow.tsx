import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { colors } from "@/constants/theme";
import { formatCurrency } from "@/utils/format";
import {
  AppAccount,
  getAccountColor,
  getAccountInitial,
  getAccountMask,
  getAccountSubtitle,
} from "@/utils/accounts";

interface AccountRowProps {
  account: AppAccount;
  onPress?: () => void;
  style?: ViewStyle;
  /** When true, the balance is rendered in red (used for debt sections). */
  debt?: boolean;
}

export function AccountRow({ account, onPress, style, debt }: AccountRowProps) {
  const mask = getAccountMask(account);
  const subtitle = getAccountSubtitle(account);
  const bal = account.currentBalance ?? 0;
  const displayBal = debt ? Math.abs(bal) : bal;

  const content = (
    <View style={[s.row, style]}>
      <View style={[s.badge, { backgroundColor: getAccountColor(account) }]}>
        <Text style={s.badgeText}>{getAccountInitial(account)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>
            {account.name}
          </Text>
          {mask ? <Text style={s.mask}>{mask}</Text> : null}
        </View>
        <Text style={s.sub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Text style={[s.balance, debt && { color: colors.negative }]}>
        {debt ? `-${formatCurrency(displayBal)}` : formatCurrency(displayBal)}
      </Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
      {content}
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.textOnBlue,
    fontSize: 14,
    fontWeight: "700",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
    flexShrink: 1,
  },
  mask: {
    fontSize: 11,
    color: colors.textMuted,
  },
  sub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  balance: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
});

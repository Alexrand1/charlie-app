import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { CTAButton } from "./CTAButton";
import { colors } from "@/constants/theme";

interface PlaidConnectSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Called when the user taps "Continue with Plaid". The parent should
   *  close the sheet and then kick off the Plaid Link flow. */
  onContinue: () => void;
  /** Optional loading flag — disables the continue button (e.g. while the
   *  parent is fetching a link token). */
  loading?: boolean;
}

/**
 * Charlie-branded intro sheet shown before handing off to the Plaid Link
 * SDK. Gives the user a moment to see our trust framing ("Secure ·
 * Read-only · Instant") and the popular-bank shortcuts without us owning
 * the bank list — Plaid's own UI still handles search + auth afterwards.
 *
 * The bank chips are purely decorative — tapping them is the same as
 * tapping "Continue with Plaid". Plaid's search screen shows immediately
 * after, so there's no benefit (and some risk) in trying to pre-filter.
 */
export function PlaidConnectSheet({
  visible,
  onClose,
  onContinue,
  loading = false,
}: PlaidConnectSheetProps) {
  const popularBanks = ["Chase", "Bank of America", "Wells Fargo", "Fidelity"];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop — tapping outside the sheet dismisses. */}
      <Pressable style={s.backdrop} onPress={onClose} />

      <View style={s.sheet}>
        {/* Drag handle (visual cue only) */}
        <View style={s.handle} />

        {/* Header: P logo + close */}
        <View style={s.headerRow}>
          <View style={s.plaidBadge}>
            <Text style={s.plaidBadgeText}>P</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={s.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.title}>Connect with Plaid</Text>
        <Text style={s.tagline}>Secure · Read-only · Instant</Text>

        <Text style={s.body}>
          Charlie uses Plaid to connect to your bank. Your credentials are
          never shared with us — and we can only read transactions, never
          move money.
        </Text>

        {/* Popular banks — decorative shortcuts */}
        <Text style={s.popularLabel}>POPULAR</Text>
        <View style={s.bankChips}>
          {popularBanks.map((name) => (
            <TouchableOpacity
              key={name}
              style={s.bankChip}
              onPress={onContinue}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={s.bankChipText} numberOfLines={1}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />

        <CTAButton
          title={loading ? "Starting Plaid..." : "Continue with Plaid"}
          variant="blue"
          onPress={onContinue}
          disabled={loading}
        />

        <Text style={s.footnote}>
          256-bit encryption · Used by 11,000+ banks
        </Text>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,20,16,0.45)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 28,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.sand3,
    alignSelf: "center",
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  plaidBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  plaidBadgeText: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textOnBlue,
    fontStyle: "italic",
  },
  closeBtn: {
    fontSize: 18,
    fontWeight: "400",
    color: colors.textMuted,
  },
  title: {
    fontSize: 22,
    fontWeight: "400",
    fontStyle: "italic",
    color: colors.ink,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.blue,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  body: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 18,
  },
  popularLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  bankChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bankChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  bankChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.ink,
  },
  footnote: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 12,
  },
});

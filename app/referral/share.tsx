import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";

const SHARE_OPTIONS = [
  { icon: "💬", label: "Messages" },
  { icon: "✉️", label: "Mail" },
  { icon: "📋", label: "Copy link" },
  { icon: "⋯", label: "More" },
];

export default function ShareSheetScreen() {
  const router = useRouter();

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          "Join Charlie — the money app that actually does the work. Use my code CHARLIE10 to get $10. https://charlie.app/invite/CHARLIE10",
      });
    } catch {
      // cancelled
    }
  };

  const handleCopy = () => {
    Alert.alert("Copied!", "Referral code copied to clipboard.");
  };

  return (
    <View style={s.container}>
      {/* Dimmed overlay */}
      <TouchableOpacity
        style={s.overlay}
        onPress={() => router.back()}
        activeOpacity={1}
      />

      {/* Bottom sheet */}
      <View style={s.sheet}>
        <View style={s.handle} />
        <Text style={s.title}>Share your invite</Text>

        <View style={s.iconGrid}>
          {SHARE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={s.iconBtn}
              onPress={opt.label === "Copy link" ? handleCopy : handleShare}
              activeOpacity={0.7}
            >
              <View style={s.iconCircle}>
                <Text style={{ fontSize: 18 }}>{opt.icon}</Text>
              </View>
              <Text style={s.iconLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.divider} />

        <View style={s.codeRow}>
          <Text style={s.codeText}>CHARLIE10</Text>
          <TouchableOpacity onPress={handleCopy}>
            <Text style={s.copyBtn}>Copy</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Text style={s.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
    textAlign: "center",
    marginBottom: 16,
  },
  iconGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    marginBottom: 18,
  },
  iconBtn: { alignItems: "center", gap: 6 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  iconLabel: { fontSize: 10, color: colors.ink },
  divider: { height: 1, backgroundColor: colors.borderSubtle, marginHorizontal: 24 },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  codeText: { fontSize: 13, fontWeight: "700", color: colors.ink },
  copyBtn: { fontSize: 12, fontWeight: "700", color: colors.blue },
  closeBtn: { alignItems: "center", paddingVertical: 12 },
  closeText: { fontSize: 15, fontWeight: "600", color: colors.textSecondary },
});

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { copyToClipboard } from "@/utils/clipboard";
import {
  getMyReferral,
  buildInviteLink,
  buildInviteLinkDisplay,
  Referral,
} from "@/services/referral";

type ShareTarget = {
  icon: string;
  label: string;
  handler: (ctx: { link: string; message: string; code: string }) => Promise<void> | void;
};

// Social targets. iOS-specific URL schemes are best-effort — if the app
// isn't installed, we fall through to the native share sheet.
const SHARE_TARGETS: ShareTarget[] = [
  {
    icon: "💬",
    label: "Messages",
    handler: async ({ message }) => {
      const url = `sms:&body=${encodeURIComponent(message)}`;
      const ok = await Linking.canOpenURL(url).catch(() => false);
      if (ok) Linking.openURL(url);
      else await Share.share({ message });
    },
  },
  {
    icon: "✉️",
    label: "Email",
    handler: async ({ message }) => {
      const url = `mailto:?subject=${encodeURIComponent(
        "Try Charlie — we both get $10"
      )}&body=${encodeURIComponent(message)}`;
      const ok = await Linking.canOpenURL(url).catch(() => false);
      if (ok) Linking.openURL(url);
      else await Share.share({ message });
    },
  },
  {
    icon: "📸",
    label: "Instagram",
    handler: async ({ code }) => {
      // Instagram doesn't support prefilled DMs from a URL scheme — the
      // cleanest flow is to copy the code and open the app.
      copyToClipboard(code, "Code copied — paste into Instagram");
      const url = "instagram://";
      const ok = await Linking.canOpenURL(url).catch(() => false);
      if (ok) Linking.openURL(url);
    },
  },
  {
    icon: "𝕏",
    label: "X",
    handler: async ({ message }) => {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        message
      )}`;
      await Linking.openURL(url).catch(() => undefined);
    },
  },
  {
    icon: "⋯",
    label: "More",
    handler: async ({ message }) => {
      await Share.share({ message });
    },
  },
];

export default function ShareSheetScreen() {
  const router = useRouter();
  const [referral, setReferral] = useState<Referral | null>(null);

  useEffect(() => {
    getMyReferral()
      .then(setReferral)
      .catch((err) => console.warn("[Share] getMyReferral failed", err));
  }, []);

  const code = referral?.code ?? "";
  const link = referral ? buildInviteLink(referral.code) : "";
  const linkDisplay = referral ? buildInviteLinkDisplay(referral.code) : "";
  const message = referral
    ? `Join me on Charlie — the money app that actually does the work. Use my code ${code} and we both get $10. ${link}`
    : "";

  const handleCopyLink = () => {
    if (!link) return;
    copyToClipboard(link, "Link copied!");
  };

  const handleShareLink = async () => {
    if (!message) return;
    try {
      await Share.share({ message });
    } catch {
      // cancelled
    }
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
        <Text style={s.title}>Invite a friend to Charlie</Text>
        <Text style={s.subtitle}>They save money. You both get $10.</Text>

        {/* Invite link row */}
        <View style={s.linkRow}>
          <Text style={s.linkText} numberOfLines={1}>
            {linkDisplay || "Loading your link…"}
          </Text>
          <TouchableOpacity
            onPress={handleCopyLink}
            disabled={!link}
            activeOpacity={0.7}
            style={s.copyBtn}
          >
            <Text
              style={[
                s.copyBtnText,
                { opacity: link ? 1 : 0.4 },
              ]}
            >
              Copy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Social share targets */}
        <View style={s.iconGrid}>
          {SHARE_TARGETS.map((target) => (
            <TouchableOpacity
              key={target.label}
              style={s.iconBtn}
              onPress={() =>
                referral
                  ? target.handler({ link, message, code })
                  : undefined
              }
              disabled={!referral}
              activeOpacity={0.7}
            >
              <View style={[s.iconCircle, { opacity: referral ? 1 : 0.4 }]}>
                <Text style={{ fontSize: 18 }}>{target.icon}</Text>
              </View>
              <Text style={s.iconLabel}>{target.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Primary — opens the native share sheet with every installed app */}
        <TouchableOpacity
          onPress={handleShareLink}
          disabled={!referral}
          activeOpacity={0.85}
          style={[s.primaryBtn, !referral && { opacity: 0.5 }]}
        >
          {referral ? (
            <Text style={s.primaryBtnText}>Share invite link</Text>
          ) : (
            <ActivityIndicator color={colors.textOnBlue} />
          )}
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
    paddingBottom: 28,
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
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 18,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface2,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 18,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
    fontWeight: "500",
  },
  copyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.blue,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textOnBlue,
    letterSpacing: 0.3,
  },
  iconGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  iconBtn: { alignItems: "center", gap: 6 },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  iconLabel: { fontSize: 10, color: colors.ink },
  primaryBtn: {
    marginHorizontal: 20,
    height: 52,
    backgroundColor: colors.blue,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textOnBlue,
  },
});

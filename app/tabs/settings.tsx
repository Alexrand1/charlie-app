import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/services/api";
import { auth, AuthUser } from "@/services/auth";
import { getAccounts, PlaidAccount } from "@/services/plaid";
import { getActedInsights, Insight } from "@/services/insights";
import { registerForPushNotifications } from "@/services/notifications";
import { colors, spacing } from "@/constants/theme";
import { FLOATING_TAB_BAR_CLEARANCE } from "./_layout";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [actedInsights, setActedInsights] = useState<Insight[]>([]);
  const [notifications, setNotifications] = useState(true);
  const [faceId, setFaceId] = useState(false);

  useEffect(() => {
    // Always fetch a fresh profile — the cached copy may predate the
    // createdAt field we now rely on for "Member since {year}".
    api
      .get("/users/me")
      .then((r) => setUser(r.data.user))
      .catch(() => auth.getUser().then(setUser));
    getAccounts().then(setAccounts).catch(() => {});
    getActedInsights().then(setActedInsights).catch(() => {});
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    setNotifications(value);
    if (value) {
      const token = await registerForPushNotifications();
      if (!token) {
        Alert.alert(
          "Notifications",
          "Please enable notifications in your device settings.",
          [
            { text: "Open Settings", onPress: () => Linking.openSettings() },
            { text: "Cancel", style: "cancel" },
          ]
        );
        setNotifications(false);
      }
    }
  };

  const handleFaceIdToggle = async (value: boolean) => {
    try {
      const LocalAuth = require("expo-local-authentication");
      const compatible = await LocalAuth.hasHardwareAsync();
      if (!compatible) {
        Alert.alert(
          "Not Available",
          "Biometric authentication is not available on this device."
        );
        return;
      }
      const enrolled = await LocalAuth.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert(
          "Not Set Up",
          "Please set up Face ID or Touch ID in your device settings."
        );
        return;
      }
      if (value) {
        const result = await LocalAuth.authenticateAsync({
          promptMessage: "Enable biometric unlock",
        });
        if (result.success) setFaceId(true);
      } else {
        setFaceId(false);
      }
    } catch {
      Alert.alert(
        "Coming Soon",
        "Biometric unlock will be available in a future update."
      );
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await auth.logout();
          router.replace("/auth/sign-in");
        },
      },
    ]);
  };

  const firstName = user?.firstName || "User";
  const fullName = firstName;

  // "Member since {year}" — use createdAt if we have it, otherwise the current
  // year (i.e. assume they just joined) so the copy never breaks.
  const memberSinceYear = (() => {
    if (!user?.createdAt) return new Date().getFullYear();
    const d = new Date(user.createdAt);
    return Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  })();

  // Stats card (blue pill) ── computed from real data
  const DEBT_TYPES = ["credit", "loan"];
  const totalSaved = accounts.reduce((sum, a) => {
    const bal = a.currentBalance ?? 0;
    return sum + (DEBT_TYPES.includes(a.type) ? -bal : bal);
  }, 0);
  // "Actions taken" = insights the user has acted on. "Leaks stopped" is the
  // subset of acted-on insights that were STOP_LEAK.
  const actionsTakenCount = actedInsights.length;
  const leaksStoppedCount = actedInsights.filter(
    (i) => i.actionType === "STOP_LEAK"
  ).length;

  // Row subtitles
  const connectedBanksSub =
    accounts.length > 0
      ? `${accounts.length} account${accounts.length === 1 ? "" : "s"}`
      : "None connected";

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      {/* ─── Name Header ─────────────────────────────── */}
      <Text style={s.name}>{fullName}</Text>
      <Text style={s.proLine}>Charlie Pro · Member since {memberSinceYear}</Text>

      {/* ─── Stats Card (blue pill) ───────────────────── */}
      <View style={s.statsCard}>
        <View style={s.statCell}>
          <Text style={s.statNumber}>
            $
            {totalSaved > 0
              ? totalSaved.toLocaleString("en-US", { maximumFractionDigits: 0 })
              : "0"}
          </Text>
          <Text style={s.statLabel}>Saved by Charlie</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCell}>
          <Text style={s.statNumber}>{actionsTakenCount}</Text>
          <Text style={s.statLabel}>Actions taken</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCell}>
          <Text style={s.statNumber}>{leaksStoppedCount}</Text>
          <Text style={s.statLabel}>Leaks stopped</Text>
        </View>
      </View>

      {/* ─── Main Settings Card ───────────────────────── */}
      <View style={s.card}>
        <SettingsRow
          icon="🔔"
          label="Notifications"
          sub="Only when there's money to act on"
          trailing={
            <Switch
              value={notifications}
              onValueChange={handleNotificationToggle}
              trackColor={{ true: colors.blue, false: colors.surface2 }}
              thumbColor="#fff"
            />
          }
        />
        <View style={s.divider} />
        <TouchableOpacity
          onPress={() => router.push("/link-accounts" as any)}
          activeOpacity={0.7}
        >
          <SettingsRow
            icon="🏦"
            label="Connected Banks"
            sub={connectedBanksSub}
            showChevron
          />
        </TouchableOpacity>
        <View style={s.divider} />
        <SettingsRow
          icon="🔐"
          label="Face ID"
          sub={faceId ? "Enabled" : "Disabled"}
          trailing={
            <Switch
              value={faceId}
              onValueChange={handleFaceIdToggle}
              trackColor={{ true: colors.blue, false: colors.surface2 }}
              thumbColor="#fff"
            />
          }
        />
        <View style={s.divider} />
        <TouchableOpacity
          onPress={() => router.push("/onboarding/paywall" as any)}
          activeOpacity={0.7}
        >
          <SettingsRow
            icon="⭐"
            label="Charlie Pro"
            // Placeholder until real billing state wires in. Renew year is
            // rendered relative to the user's join year so it reads naturally
            // ("member since 2026 · renews 2027").
            sub={`$1/yr · renews ${memberSinceYear + 1}`}
            showChevron
          />
        </TouchableOpacity>
      </View>

      {/* ─── Support Card (kept as its own card per prior layout) ── */}
      <View style={s.card}>
        <TouchableOpacity
          onPress={() => Linking.openURL("mailto:support@charlie.app")}
          activeOpacity={0.7}
        >
          <SettingsRow icon="❓" label="Help & Support" showChevron />
        </TouchableOpacity>
        <View style={s.divider} />
        <TouchableOpacity
          onPress={() => Linking.openURL("https://charlie.app/privacy")}
          activeOpacity={0.7}
        >
          <SettingsRow icon="🔒" label="Privacy Policy" showChevron />
        </TouchableOpacity>
        <View style={s.divider} />
        <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
          <SettingsRow icon="🚪" label="Sign out" destructive />
        </TouchableOpacity>
      </View>

      <Text style={s.version}>Charlie v0.1.0</Text>
    </ScrollView>
  );
}

// ─── Settings Row Component ──────────────────────────────────
function SettingsRow({
  icon,
  label,
  sub,
  trailing,
  destructive,
  showChevron,
}: {
  icon: string;
  label: string;
  sub?: string;
  trailing?: React.ReactNode;
  destructive?: boolean;
  showChevron?: boolean;
}) {
  return (
    <View style={s.settingsRow}>
      <View style={s.settingsIcon}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.settingsLabel, destructive && s.destructiveText]}>
          {label}
        </Text>
        {sub ? <Text style={s.settingsSub}>{sub}</Text> : null}
      </View>
      {trailing ? (
        trailing
      ) : showChevron ? (
        <Text style={s.chevron}>›</Text>
      ) : null}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface0 },
  content: {
    padding: 24,
    paddingTop: 54,
    paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 8,
  },

  // Name header
  name: { fontSize: 20, fontWeight: "700", color: colors.ink },
  proLine: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },

  // Stats
  statsCard: {
    flexDirection: "row",
    backgroundColor: colors.blue,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
  },
  statCell: { flex: 1, alignItems: "center" },
  statNumber: {
    fontSize: 22,
    fontStyle: "italic",
    fontWeight: "400",
    color: colors.textOnBlue,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 9,
    color: "rgba(245,240,232,0.7)",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(245,240,232,0.18)",
    marginVertical: 4,
  },

  // Cards
  card: {
    backgroundColor: colors.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 4,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginLeft: 56,
  },

  // Settings Row
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 11,
  },
  settingsIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsLabel: { fontSize: 13, fontWeight: "600", color: colors.ink },
  settingsSub: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  destructiveText: { color: colors.negative },
  chevron: {
    fontSize: 20,
    fontWeight: "300",
    color: colors.textMuted,
    marginLeft: 4,
  },

  version: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.xxl,
    letterSpacing: 0.5,
  },

});

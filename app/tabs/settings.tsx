import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, AuthUser } from "@/services/auth";
import { getAccounts, PlaidAccount } from "@/services/plaid";
import { colors, spacing, radii } from "@/constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [notifications, setNotifications] = useState(true);
  const [faceId, setFaceId] = useState(true);

  useEffect(() => {
    auth.getUser().then(setUser);
    getAccounts().then(setAccounts).catch(() => {});
  }, []);

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
  const initial = firstName[0]?.toUpperCase() || "?";
  const bankNames = accounts.length > 0
    ? [...new Set(accounts.map((a) => a.name.split(" ")[0]))].join(" · ")
    : "None connected";

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      {/* ─── Avatar Header ─────────────────────────────── */}
      <View style={s.headerRow}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{fullName}</Text>
          <Text style={s.email}>{user?.email || ""}</Text>
        </View>
      </View>

      {/* ─── Stats Card ────────────────────────────────── */}
      <View style={s.statsCard}>
        <View style={s.statCell}>
          <Text style={s.statNumber}>$0</Text>
          <Text style={s.statLabel}>saved</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCell}>
          <Text style={s.statNumber}>0</Text>
          <Text style={s.statLabel}>actions</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCell}>
          <Text style={s.statNumber}>0</Text>
          <Text style={s.statLabel}>leaks</Text>
        </View>
      </View>

      {/* ─── Settings Card ─────────────────────────────── */}
      <View style={s.card}>
        <SettingsRow
          icon="🔔"
          label="Notifications"
          sub="Push + email"
          trailing={
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ true: colors.blue, false: colors.surface2 }}
              thumbColor="#fff"
            />
          }
        />
        <View style={s.divider} />
        <SettingsRow
          icon="🏦"
          label="Connected banks"
          sub={bankNames}
        />
        <View style={s.divider} />
        <SettingsRow
          icon="🔐"
          label="Face ID"
          sub="Unlock with biometrics"
          trailing={
            <Switch
              value={faceId}
              onValueChange={setFaceId}
              trackColor={{ true: colors.blue, false: colors.surface2 }}
              thumbColor="#fff"
            />
          }
        />
        <View style={s.divider} />
        <SettingsRow icon="✨" label="Charlie Pro" sub="Manage subscription" />
      </View>

      {/* ─── Support Card ──────────────────────────────── */}
      <View style={s.card}>
        <SettingsRow icon="❓" label="Help & Support" />
        <View style={s.divider} />
        <SettingsRow icon="🔒" label="Privacy Policy" />
        <View style={s.divider} />
        <TouchableOpacity onPress={handleSignOut}>
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
}: {
  icon: string;
  label: string;
  sub?: string;
  trailing?: React.ReactNode;
  destructive?: boolean;
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
        {sub && <Text style={s.settingsSub}>{sub}</Text>}
      </View>
      {trailing}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 24, paddingTop: 54, paddingBottom: 40 },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 22,
    fontStyle: "italic",
    color: colors.textOnBlue,
  },
  name: { fontSize: 17, fontWeight: "700", color: colors.ink },
  email: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // Stats
  statsCard: {
    flexDirection: "row",
    backgroundColor: colors.blue,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  statCell: { flex: 1, alignItems: "center" },
  statNumber: {
    fontSize: 22,
    fontStyle: "italic",
    color: colors.textOnBlue,
  },
  statLabel: { fontSize: 10, color: "rgba(245,240,232,0.7)", marginTop: 2 },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: "rgba(245,240,232,0.2)",
  },

  // Card
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

  version: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.xxl,
    letterSpacing: 0.5,
  },
});

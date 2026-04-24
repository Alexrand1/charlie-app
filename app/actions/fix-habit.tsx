import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  BackPill,
  Eyebrow,
  CharlieHeadline,
  CharlieSub,
  CTAButton,
  CharlieCard,
} from "@/components/shared";
import { approveInsight } from "@/services/insights";
import { colors } from "@/constants/theme";

// expo-notifications is loaded lazily so the screen still renders cleanly in
// environments where the native module isn't available (Expo Go web preview,
// or older dev clients).
let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
} catch {
  // No-op — the reminder CTA will fall back to an in-memory confirmation.
}

const CATEGORY_LABEL: Record<string, string> = {
  dining: "lunch",
  groceries: "groceries",
  transport: "transport",
  shopping: "shopping",
  subscriptions: "subscriptions",
  bills: "bills",
  other: "spending",
};

export default function FixHabitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [scheduling, setScheduling] = useState(false);

  // Parse insight data from route params (stringified JSON over nav params).
  const actionValue = params.actionValue
    ? (() => {
        try {
          return JSON.parse(params.actionValue as string);
        } catch {
          return {};
        }
      })()
    : {};

  const category: string = actionValue.category || "dining";
  const categoryLabel = CATEGORY_LABEL[category] || category;

  // New weekly fields (backend writes these). Fall back to the legacy monthly
  // fields when an older insight is still live, so we always render something.
  const last4WeeksRaw: number[] = Array.isArray(actionValue.last_4_weeks)
    ? actionValue.last_4_weeks
    : [];
  const last4Weeks: number[] = [0, 1, 2, 3].map((i) =>
    Number(last4WeeksRaw[i]) || 0
  );
  const lastWeek: number =
    Number(actionValue.last_week) || last4Weeks[3] || 0;
  const usualWeekly: number =
    Number(actionValue.usual_weekly) ||
    (last4Weeks[0] + last4Weeks[1] + last4Weeks[2]) / 3 ||
    0;
  const suggestedLimitWeekly: number =
    Number(actionValue.suggested_limit_weekly) ||
    Math.max(5, Math.round(usualWeekly / 5) * 5);

  // Demo-friendly fallback numbers if the insight is completely empty (e.g.
  // deep-linked without data) — matches the design mock.
  const demo = !actionValue.last_4_weeks && !actionValue.last_week;
  const weeks = demo ? [38, 44, 41, 67] : last4Weeks;
  const shownLastWeek = demo ? 67 : lastWeek;
  const shownUsual = demo ? 40 : usualWeekly;
  const shownLimit = demo ? 40 : suggestedLimitWeekly;

  const insightText =
    (params.insightText as string) ||
    `You spent $${fmt(shownLastWeek)} on ${categoryLabel} last week. Your usual is $${fmt(
      shownUsual
    )}. One small change gets you back.`;

  // Bar chart geometry. All bars share a common max so the highlighted bar
  // visually dominates when spending spikes.
  const chartMax = Math.max(...weeks, shownUsual, 1);
  const BAR_MAX_HEIGHT = 80;

  const handleRemindMe = async () => {
    setScheduling(true);
    try {
      // Mark the insight as acted on — non-blocking.
      if (params.insightId && params.createdAt) {
        await approveInsight(
          params.insightId as string,
          params.createdAt as string
        ).catch(() => undefined);
      }

      // Schedule a local reminder for the upcoming Sunday at 7pm local time.
      // If we're already past Sunday 7pm, push to next Sunday.
      const scheduledFor = nextSunday7pm();
      let actuallyScheduled = false;
      if (Notifications?.scheduleNotificationAsync) {
        try {
          // Ask for permission if we don't already have it. This is cheap
          // if already granted.
          const settings =
            await Notifications.getPermissionsAsync?.().catch(() => null);
          let granted = settings?.status === "granted";
          if (!granted && Notifications.requestPermissionsAsync) {
            const req = await Notifications.requestPermissionsAsync();
            granted = req?.status === "granted";
          }
          if (granted) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "How's your week looking?",
                body: `Charlie here — staying under $${fmt(shownLimit)} on ${categoryLabel} this week gets you back on track.`,
                data: { kind: "habit_reminder", category },
              },
              trigger: { date: scheduledFor } as any,
            });
            actuallyScheduled = true;
          }
        } catch {
          // Silently fall through — we still want to confirm to the user.
        }
      }

      Alert.alert(
        "Reminder set",
        actuallyScheduled
          ? `Charlie will check in on Sunday evening to see how your ${categoryLabel} week went.`
          : `We couldn't schedule a device reminder, but Charlie will still nudge you in-app about your ${categoryLabel} spending.`,
        [{ text: "Got it", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not set a reminder.");
    } finally {
      setScheduling(false);
    }
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <BackPill />
      <View style={{ height: 14 }} />

      <Eyebrow text="Fix a Habit" />
      <View style={{ height: 4 }} />
      <CharlieHeadline
        plainPrefix="Back on "
        italicEmphasis="track"
        plainSuffix=" this week?"
      />
      <View style={{ height: 6 }} />
      <CharlieSub text={insightText} />
      <View style={{ height: 16 }} />

      {/* ── Weekly bar chart card ────────────────────────── */}
      <CharlieCard cornerRadius={14} padding={14}>
        <Text style={s.cardTitle}>
          {capitalize(categoryLabel)} spending · Last 4 weeks
        </Text>
        <View style={s.chartRow}>
          {weeks.map((value, i) => {
            const isLast = i === weeks.length - 1;
            const h = Math.max(4, (value / chartMax) * BAR_MAX_HEIGHT);
            return (
              <View key={i} style={s.barCol}>
                <View style={s.barTrack}>
                  <View
                    style={[
                      s.bar,
                      {
                        height: h,
                        backgroundColor: isLast
                          ? colors.negative
                          : colors.surface2,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    s.barLabel,
                    isLast && { color: colors.negative, fontWeight: "700" },
                  ]}
                >
                  ${fmt(value)}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={s.divider} />
        <View style={s.usualRow}>
          <Text style={s.usualLabel}>Your usual</Text>
          <Text style={s.usualValue}>~${fmt(shownUsual)}/wk</Text>
        </View>
      </CharlieCard>
      <View style={{ height: 14 }} />

      {/* ── Suggestion callout ───────────────────────────── */}
      <View style={s.callout}>
        <Text style={s.calloutLabel}>CHARLIE'S SUGGESTION</Text>
        <Text style={s.calloutText}>
          "Stay under ${fmt(shownLimit)} on {categoryLabel} this week to get
          back on track. Want a reminder?"
        </Text>
      </View>

      <View style={{ flex: 1, minHeight: 40 }} />

      <CTAButton
        title={scheduling ? "Setting reminder..." : "Yes, remind me"}
        variant="blue"
        onPress={handleRemindMe}
        disabled={scheduling}
      />
      <View style={{ height: 8 }} />
      <CTAButton title="No thanks" variant="sand" onPress={() => router.back()} />
    </ScrollView>
  );
}

/** Format a dollar amount with no cents unless it's non-integer and small. */
function fmt(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n) >= 10 || n === Math.round(n)) {
    return Math.round(n).toString();
  }
  return n.toFixed(2);
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Next upcoming Sunday at 7pm in the user's local timezone. If today is
 *  Sunday and it's already past 7pm, we push to the following Sunday. */
function nextSunday7pm(): Date {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  let daysUntilSunday = (7 - day) % 7;
  const candidate = new Date(d);
  candidate.setDate(d.getDate() + daysUntilSunday);
  candidate.setHours(19, 0, 0, 0);
  if (candidate.getTime() <= d.getTime()) {
    candidate.setDate(candidate.getDate() + 7);
  }
  return candidate;
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 24, paddingTop: 54, paddingBottom: 24, minHeight: "100%" },
  cardTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.blue,
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 12,
    height: 100,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  barTrack: {
    width: "100%",
    height: 80,
    justifyContent: "flex-end",
  },
  bar: { width: "100%", borderRadius: 4 },
  barLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.borderSubtle, marginBottom: 8 },
  usualRow: { flexDirection: "row", justifyContent: "space-between" },
  usualLabel: { fontSize: 11, color: colors.textSecondary },
  usualValue: { fontSize: 11, fontWeight: "700", color: colors.ink },
  callout: {
    padding: 14,
    backgroundColor: colors.sand2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(26,20,16,0.12)",
  },
  calloutLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.blue,
    marginBottom: 6,
  },
  calloutText: {
    fontSize: 12,
    color: colors.ink,
    lineHeight: 18,
  },
});

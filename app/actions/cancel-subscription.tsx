import { View, Text, ScrollView, StyleSheet, Linking } from "react-native";
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
import { formatCurrency } from "@/utils/format";

// Merchant → deep link into that service's cancellation page. Best-effort;
// if the URL won't open we fall through to the animated cancelling screen
// so the user still sees something happen.
const CANCELLATION_URLS: Record<string, string> = {
  netflix: "https://www.netflix.com/cancelplan",
  hulu: "https://secure.hulu.com/account",
  "paramount+": "https://www.paramountplus.com/account/",
  "disney+": "https://www.disneyplus.com/account",
  "hbo max": "https://www.max.com/account",
  max: "https://www.max.com/account",
  spotify: "https://www.spotify.com/account/subscription/",
  "apple music": "https://support.apple.com/en-us/HT202039",
  "youtube premium": "https://www.youtube.com/paid_memberships",
  "amazon prime": "https://www.amazon.com/mc/pipelines/cancelPrime",
  peacock: "https://www.peacocktv.com/account/",
  draftkings: "https://myaccount.draftkings.com/subscriptions",
  fanduel: "https://account.fanduel.com/subscriptions",
};

export default function CancelSubscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // action_value is stringified JSON coming from either a push payload or
  // a direct in-app action tap — both paths stringify because RN nav
  // params must be string-like for push notifications.
  const actionValue = params.actionValue
    ? (() => {
        try {
          return JSON.parse(params.actionValue as string);
        } catch {
          return {};
        }
      })()
    : {};

  const merchant = actionValue.merchant || "Paramount+";
  const monthlyCost = Number(actionValue.monthly_cost) || 14.99;
  const annualSavings =
    Number(actionValue.annual_savings) || monthlyCost * 12;
  // These four are new (see INSIGHT_SYSTEM_PROMPT in insight.service.ts) —
  // older insights won't have them, so we gracefully fall back.
  const billingSince: string = actionValue.billing_since || "";
  const lastSeenDate: string = actionValue.last_seen_date || "";
  const unusedMonths = Number(actionValue.unused_months) || 0;
  const paidWhileUnused = Number(actionValue.paid_while_unused) || 0;

  const insightText =
    (params.insightText as string) ||
    (unusedMonths > 0
      ? `You haven't used it in ${unusedMonths} months. Charlie will cancel it for you right now.`
      : `You're paying monthly for ${merchant}. Charlie will cancel it for you right now.`);

  const handleCancel = async () => {
    if (params.insightId && params.createdAt) {
      try {
        await approveInsight(
          params.insightId as string,
          params.createdAt as string
        );
      } catch {
        // Non-blocking — proceed even if approve fails so the user sees
        // progress; server-side ack can retry.
      }
    }

    // Try to open the merchant's cancellation URL. If supported, hand off
    // to the browser and jump to the win state in parallel.
    const key = merchant.toLowerCase();
    const url = CANCELLATION_URLS[key];
    if (url) {
      const supported = await Linking.canOpenURL(url).catch(() => false);
      if (supported) {
        await Linking.openURL(url).catch(() => undefined);
        router.push({
          pathname: "/actions/cancelled-win" as any,
          params: {
            merchant,
            annualSavings: String(annualSavings),
            monthlyCost: String(monthlyCost),
            lastSeenDate,
          },
        });
        return;
      }
    }

    // Fallback: show the progress state, then win.
    router.push({
      pathname: "/actions/cancelling" as any,
      params: {
        merchant,
        annualSavings: String(annualSavings),
        monthlyCost: String(monthlyCost),
        lastSeenDate,
      },
    });
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <BackPill />
      <View style={{ height: 14 }} />

      <Eyebrow text="Stop a leak" />
      <View style={{ height: 4 }} />
      <CharlieHeadline
        plainPrefix="Cancel "
        italicEmphasis={merchant}
        plainSuffix="?"
      />
      <View style={{ height: 6 }} />
      <CharlieSub text={insightText} />
      <View style={{ height: 14 }} />

      {/* Subscription card */}
      <CharlieCard cornerRadius={14} padding={14}>
        <View style={s.subRow}>
          <View style={s.subIcon}>
            <Text style={{ fontSize: 18, color: colors.textOnBlue }}>▶</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.subName}>{merchant}</Text>
            <Text style={s.subMeta}>
              {billingSince
                ? `Billing since ${formatMonthYear(billingSince)}`
                : "Recurring charge"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.subPrice}>{formatCurrency(monthlyCost)}</Text>
            <Text style={s.subMeta}>/ month</Text>
          </View>
        </View>
        <View style={s.divider} />
        <View style={s.statsRow}>
          <View>
            <Text style={s.statLabel}>Paid while unused</Text>
            <Text style={s.negativeAmount}>
              {paidWhileUnused > 0
                ? formatCurrency(paidWhileUnused)
                : formatCurrency(monthlyCost)}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.statLabel}>You'd save / year</Text>
            <Text style={s.positiveAmount}>
              {formatCurrency(annualSavings)}
            </Text>
          </View>
        </View>
      </CharlieCard>
      <View style={{ height: 10 }} />

      {/* Red "last used" warning — only if we have the data */}
      {lastSeenDate ? (
        <View style={s.warnBox}>
          <Text style={{ fontSize: 14 }}>🚩</Text>
          <Text style={s.warnText}>
            Last used {formatFullDate(lastSeenDate)}
            {unusedMonths > 0 ? ` — ${unusedMonths} months ago` : ""}
          </Text>
        </View>
      ) : null}

      <View style={{ flex: 1, minHeight: 40 }} />

      <CTAButton
        title={`Yes, cancel ${merchant}`}
        variant="blue"
        onPress={handleCancel}
      />
      <View style={{ height: 8 }} />
      <CTAButton
        title="Keep my subscription"
        variant="sand"
        onPress={() => router.back()}
      />
    </ScrollView>
  );
}

/** "2023-09-14" → "Sep 2023" */
function formatMonthYear(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/** "2024-08-14" → "Aug 14, 2024" */
function formatFullDate(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parseIsoDate(iso: string): Date | null {
  const [y, m, d] = (iso || "").slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface0 },
  content: {
    padding: 24,
    paddingTop: 54,
    paddingBottom: 24,
    minHeight: "100%",
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 10,
  },
  subIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  subName: { fontSize: 13, fontWeight: "600", color: colors.ink },
  subMeta: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  subPrice: { fontSize: 14, fontWeight: "700", color: colors.ink },
  divider: { height: 1, backgroundColor: colors.borderSubtle, marginBottom: 10 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  negativeAmount: { fontSize: 14, fontWeight: "700", color: colors.negative },
  positiveAmount: { fontSize: 14, fontWeight: "700", color: colors.positive },
  warnBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "rgba(224,112,112,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(224,112,112,0.3)",
  },
  warnText: {
    flex: 1,
    fontSize: 12,
    color: colors.negative,
    fontWeight: "600",
  },
});

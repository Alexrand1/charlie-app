import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { WinBackground } from "@/components/shared";
import { colors } from "@/constants/theme";
import { formatCurrency } from "@/utils/format";
import { getInsights } from "@/services/insights";

const BG = colors.blue;

/**
 * Final success state for Stop-a-Leak.
 *
 * Params (all optional — we fall back gracefully for deep-linked use):
 *   merchant       — "Paramount+"
 *   annualSavings  — numeric string, e.g. "179.88"
 *   monthlyCost    — numeric string; used to estimate the next-bill date
 *   lastSeenDate   — YYYY-MM-DD of most recent charge; next-bill date is
 *                    derived by adding ~1 month, falling back to today + 30d
 */
export default function CancelledWinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    merchant?: string;
    annualSavings?: string;
    monthlyCost?: string;
    lastSeenDate?: string;
  }>();

  const merchant = params.merchant || "Paramount+";
  const annualSavings =
    Number(params.annualSavings) ||
    (Number(params.monthlyCost) || 14.99) * 12;
  const nextBillDate = computeNextBillDate(params.lastSeenDate);

  // Live count of remaining active insights for the footer ("N more
  // actions waiting"). Defaults to 0 — we just hide the footer in that case.
  const [remainingActions, setRemainingActions] = useState<number | null>(null);
  useEffect(() => {
    getInsights()
      .then((list) => setRemainingActions(list.length))
      .catch(() => setRemainingActions(0));
  }, []);

  return (
    <WinBackground color={BG}>
      <View style={s.container}>
        <View style={{ flex: 1 }} />

        <Text style={s.emoji}>🎉</Text>
        <Text style={s.eyebrow}>CANCELLED</Text>
        <Text style={s.amount}>{formatCurrency(annualSavings)}</Text>
        <Text style={s.sub}>saved this year</Text>

        {/* What just happened card */}
        <View style={s.detailCard}>
          <Text style={s.detailLabel}>WHAT JUST HAPPENED</Text>
          <View style={s.checkRow}>
            <Text style={s.checkIcon}>✓</Text>
            <Text style={s.checkText}>
              {merchant} subscription cancelled effective today
            </Text>
          </View>
          <View style={s.checkRow}>
            <Text style={s.checkIcon}>✓</Text>
            <Text style={s.checkText}>
              No more charges after {nextBillDate}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={s.btn}
          onPress={() => router.replace("/tabs" as any)}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>Back to home</Text>
        </TouchableOpacity>
        {remainingActions !== null && remainingActions > 0 ? (
          <Text style={s.actionsWaiting}>
            {remainingActions} more action{remainingActions === 1 ? "" : "s"}{" "}
            waiting
          </Text>
        ) : (
          <View style={{ height: 10 }} />
        )}
      </View>
    </WinBackground>
  );
}

/**
 * Compute the "no more charges after" date.
 *
 * If we know when the last charge landed, add roughly one month. Otherwise
 * estimate ~30 days from today. Returns a human label like "Apr 16, 2026".
 */
function computeNextBillDate(lastSeenDate?: string): string {
  const base = (() => {
    const parsed = parseIsoDate(lastSeenDate);
    if (parsed) {
      const next = new Date(parsed);
      next.setMonth(next.getMonth() + 1);
      return next;
    }
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  })();
  return base.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parseIsoDate(iso?: string): Date | null {
  const [y, m, d] = (iso || "").slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 76,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  emoji: { fontSize: 52, marginBottom: 12 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 4,
  },
  amount: { fontSize: 52, fontStyle: "italic", color: "#fff" },
  sub: { fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 24 },
  detailCard: {
    width: "100%",
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 10,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  checkIcon: {
    fontSize: 12,
    color: colors.positive,
    marginTop: 2,
  },
  checkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 18,
  },
  btn: {
    width: "100%",
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { fontSize: 15, fontWeight: "600", color: colors.blue },
  actionsWaiting: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    marginTop: 10,
  },
});

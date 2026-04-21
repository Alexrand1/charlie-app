import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  BackPill,
  Eyebrow,
  CharlieHeadline,
  CharlieSub,
  CTAButton,
  CharlieCard,
} from "@/components/shared";
import { colors } from "@/constants/theme";

export default function CancelSubscriptionScreen() {
  const router = useRouter();

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <BackPill />
      <View style={{ height: 14 }} />

      <Eyebrow text="Stop a leak" />
      <View style={{ height: 4 }} />
      <CharlieHeadline
        plainPrefix="Cancel "
        italicEmphasis="Paramount+"
        plainSuffix="?"
      />
      <View style={{ height: 6 }} />
      <CharlieSub text="You haven't watched in 7 months. Charlie will handle it." />
      <View style={{ height: 14 }} />

      {/* Subscription card */}
      <CharlieCard cornerRadius={14} padding={14}>
        <View style={s.subRow}>
          <View style={s.subIcon}>
            <Text style={{ fontSize: 18, color: colors.textOnBlue }}>▶</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.subName}>Paramount+</Text>
            <Text style={s.subMeta}>Next bill: Apr 24</Text>
          </View>
          <Text style={s.subPrice}>$14.99/mo</Text>
        </View>
        <View style={s.divider} />
        <View style={s.statsRow}>
          <View>
            <Text style={s.subMeta}>Paid while unused</Text>
            <Text style={s.negativeAmount}>−$104.93</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.subMeta}>Saves / year</Text>
            <Text style={s.positiveAmount}>+$179.88</Text>
          </View>
        </View>
      </CharlieCard>
      <View style={{ height: 10 }} />

      {/* Alert box */}
      <View style={s.alertBox}>
        <Text style={{ fontSize: 16 }}>⚠️</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.alertTitle}>Last used Aug 14, 2024</Text>
          <Text style={s.alertSub}>7 months ago</Text>
        </View>
      </View>

      <View style={{ flex: 1, minHeight: 40 }} />

      <CTAButton
        title="Cancel Paramount+"
        variant="blue"
        onPress={() => router.push("/actions/cancelling")}
      />
      <View style={{ height: 8 }} />
      <CTAButton title="Keep it for now" variant="sand" onPress={() => router.back()} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 24, paddingTop: 54, paddingBottom: 24, minHeight: "100%" },
  subRow: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 10 },
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
  subPrice: { fontSize: 12, fontWeight: "700", color: colors.ink },
  divider: { height: 1, backgroundColor: colors.borderSubtle, marginBottom: 10 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  negativeAmount: { fontSize: 13, fontWeight: "700", color: colors.negative, marginTop: 2 },
  positiveAmount: { fontSize: 13, fontWeight: "700", color: colors.positive, marginTop: 2 },
  alertBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    backgroundColor: "rgba(224,112,112,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(224,112,112,0.25)",
  },
  alertTitle: { fontSize: 12, fontWeight: "600", color: colors.ink },
  alertSub: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
});

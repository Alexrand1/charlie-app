import { Redirect } from "expo-router";

// The referral hub now lives inside the "Get $10" tab so the bottom
// tab bar stays visible. This index redirect catches any legacy entry
// points (e.g. router.replace("/referral") from reward-earned) and
// lands the user inside the tab navigator.
export default function ReferralIndexRedirect() {
  return <Redirect href={"/tabs/refer" as any} />;
}

import { Redirect } from "expo-router";

// The "Get $10" tab redirects to the referral flow
export default function ReferTab() {
  return <Redirect href={"/referral" as any} />;
}

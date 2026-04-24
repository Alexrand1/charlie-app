import { api } from "./api";

export interface Referral {
  userId: string;
  code: string;
  friendsJoined: number;
  pendingCount: number;
  totalEarnedCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralInvite {
  referrerUserId: string;
  refereeUserId: string;
  refereeFirstName: string;
  status: "pending" | "completed";
  attributedAt: string;
  completedAt?: string;
  rewardAmountCents: number;
}

export interface ReferralLookup {
  valid: boolean;
  code?: string;
  referrerFirstName?: string;
}

/** Canonical invite link format. Mirror on the backend when you add a
 *  landing page — for now this is just the deep-link template. */
const INVITE_BASE = "https://getcharlie.co/invite";

export function buildInviteLink(code: string): string {
  return `${INVITE_BASE}/${code.toUpperCase()}`;
}

/** Short form of the invite link for display (no scheme). */
export function buildInviteLinkDisplay(code: string): string {
  return `getcharlie.co/invite/${code.toUpperCase()}`;
}

export async function getMyReferral(): Promise<Referral> {
  const res = await api.get<{ referral: Referral }>("/referral/me");
  return res.data.referral;
}

export async function getInvites(): Promise<ReferralInvite[]> {
  const res = await api.get<{ invites: ReferralInvite[] }>("/referral/invites");
  return res.data.invites;
}

/** Public lookup — no auth required. Returns `valid: false` if the code
 *  doesn't resolve, otherwise includes the referrer's first name for a
 *  "Invited by Alex" banner on signup. */
export async function lookupReferralCode(code: string): Promise<ReferralLookup> {
  const res = await api.get<ReferralLookup>("/referral/lookup", {
    params: { code: code.toUpperCase() },
  });
  return res.data;
}

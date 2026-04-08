// Shared with backend — keep in sync with charlie-api/src/common/types.ts

export type ActionType = "MOVE_MONEY" | "STOP_LEAK" | "PATTERN" | "NONE";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export interface InsightResponse {
  insightId: string;
  actionType: ActionType;
  insight: string;
  actionLabel?: string;
  actionValue?: unknown;
  actionDetail?: string;
  confidence: Confidence;
  createdAt: string;
}

export interface AccountSummary {
  accountId: string;
  name: string;
  type: string;
  currentBalance: number;
  availableBalance?: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

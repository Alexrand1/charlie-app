import { api } from "./api";

export interface Insight {
  insightId: string;
  actionType: "MOVE_MONEY" | "STOP_LEAK" | "PATTERN" | "NONE";
  insight: string;
  actionLabel?: string;
  actionDetail?: string;
  actionValue?: {
    // MOVE_MONEY
    amount?: number;
    from_account?: string;
    to_account?: string;
    // STOP_LEAK
    merchant?: string;
    monthly_cost?: number;
    annual_savings?: number;
    billing_since?: string; // YYYY-MM-DD
    last_seen_date?: string; // YYYY-MM-DD
    unused_months?: number;
    paid_while_unused?: number;
    // PATTERN
    category?: string;
    last_week?: number;
    last_4_weeks?: number[];
    usual_weekly?: number;
    suggested_limit_weekly?: number;
    current_mtd?: number;
    avg_3mo?: number;
    suggested_limit?: number; // deprecated; kept for older insights
  };
  confidence: "HIGH" | "MEDIUM" | "LOW";
  actedOn?: boolean;
  actedAt?: string;
  createdAt: string;
}

/**
 * Get active insights for the user.
 */
export async function getInsights(): Promise<Insight[]> {
  const response = await api.get("/insights");
  return response.data.insights;
}

/**
 * Get the acted-on "Charlie actions" feed. Used by the Activity screen.
 */
export async function getActedInsights(): Promise<Insight[]> {
  const response = await api.get("/insights", { params: { acted: "true" } });
  return response.data.insights;
}

/**
 * Trigger on-demand insight generation.
 */
export async function generateInsights(): Promise<{
  generated: number;
  insights: Insight[];
}> {
  const response = await api.post("/insights/generate");
  return response.data;
}

/**
 * Approve (act on) an insight. Returns the insight with action_value.
 */
export async function approveInsight(
  insightId: string,
  createdAt: string
): Promise<Insight> {
  const response = await api.post(`/insights/${insightId}/approve`, { createdAt });
  return response.data.insight;
}

/**
 * Dismiss an insight.
 */
export async function dismissInsight(
  insightId: string,
  createdAt: string
): Promise<void> {
  await api.post(`/insights/${insightId}/dismiss`, { createdAt });
}

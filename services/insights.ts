import { api } from "./api";

export interface Insight {
  insightId: string;
  actionType: "MOVE_MONEY" | "STOP_LEAK" | "PATTERN" | "NONE";
  insight: string;
  actionLabel?: string;
  actionDetail?: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
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
 * Dismiss an insight.
 */
export async function dismissInsight(
  insightId: string,
  createdAt: string
): Promise<void> {
  await api.post(`/insights/${insightId}/dismiss`, { createdAt });
}

import { api } from "./api";

export interface Goal {
  goalId: string;
  userId: string;
  type: "save" | "spend_limit" | "pay_off";
  label: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getGoals(): Promise<Goal[]> {
  const response = await api.get("/goals");
  return response.data.goals;
}

export async function createGoal(data: {
  type: string;
  label: string;
  targetAmount: number;
  deadline?: string;
}): Promise<Goal> {
  const response = await api.post("/goals", data);
  return response.data.goal;
}

export async function updateGoal(
  goalId: string,
  data: Partial<Pick<Goal, "label" | "targetAmount" | "currentAmount" | "deadline">>
): Promise<Goal> {
  const response = await api.put(`/goals/${goalId}`, data);
  return response.data.goal;
}

export async function deleteGoal(goalId: string): Promise<void> {
  await api.delete(`/goals/${goalId}`);
}

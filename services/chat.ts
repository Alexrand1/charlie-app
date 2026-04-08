import { api } from "./api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  sessionId: string;
  updatedAt: string;
  preview: string;
}

/**
 * Send a message to Charlie and get a response.
 */
export async function sendMessage(
  message: string,
  sessionId?: string
): Promise<{ reply: string; sessionId: string }> {
  const response = await api.post("/insights/chat", { message, sessionId });
  return response.data;
}

/**
 * Get chat history for a session.
 */
export async function getChatHistory(
  sessionId: string
): Promise<ChatMessage[]> {
  const response = await api.get(`/insights/chat/${sessionId}`);
  return response.data.messages;
}

/**
 * List recent chat sessions.
 */
export async function listChatSessions(): Promise<ChatSession[]> {
  const response = await api.get("/insights/chat/sessions");
  return response.data.sessions;
}

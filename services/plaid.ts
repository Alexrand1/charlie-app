import { api } from "./api";

export interface PlaidAccount {
  accountId: string;
  name: string;
  officialName?: string;
  type: string;
  subtype?: string;
  currentBalance: number | null;
  availableBalance: number | null;
  isoCurrencyCode: string;
}

export interface PlaidTransaction {
  transactionId: string;
  accountId: string;
  date: string;
  amount: number;
  merchantName?: string;
  category: string;
  pending: boolean;
}

/**
 * Get a Plaid Link token for the browser-based Link flow.
 */
export async function getLinkToken(): Promise<string> {
  const response = await api.post("/plaid/link-token");
  return response.data.link_token;
}

/**
 * Exchange a public_token (from Plaid Link callback) for stored access_token.
 */
export async function exchangePublicToken(publicToken: string) {
  const response = await api.post("/plaid/exchange", {
    public_token: publicToken,
  });
  return response.data;
}

/**
 * Sandbox shortcut: connect a test bank without going through Link UI.
 */
export async function sandboxConnect() {
  const response = await api.post("/plaid/sandbox-connect");
  return response.data;
}

/**
 * Get the user's linked accounts.
 */
export async function getAccounts(): Promise<PlaidAccount[]> {
  const response = await api.get("/plaid/accounts");
  return response.data.accounts;
}

/**
 * Remove a linked account and its transactions.
 */
export async function removeAccount(accountId: string): Promise<void> {
  await api.delete(`/plaid/accounts/${accountId}`);
}

/**
 * Remove ALL linked items, accounts, and transactions.
 * Nuclear option for cleaning up sandbox data.
 */
export async function removeAllItems(): Promise<{ itemsRemoved: number; accountsRemoved: number }> {
  const response = await api.delete("/plaid/items");
  return response.data;
}

/**
 * Trigger manual transaction sync for all linked items.
 */
export async function syncTransactions() {
  const response = await api.post("/plaid/sync");
  return response.data;
}

/**
 * Get the user's transactions.
 */
export async function getTransactions(params?: {
  accountId?: string;
  category?: string;
  limit?: number;
}): Promise<PlaidTransaction[]> {
  const response = await api.get("/plaid/transactions", { params });
  return response.data.transactions;
}

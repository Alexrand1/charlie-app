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
 * Get the user's Plaid items (for per-item sync).
 */
export async function getPlaidItems(): Promise<{ itemId: string; institutionName?: string }[]> {
  const response = await api.get("/plaid/items");
  return response.data.items;
}

/**
 * Sync transactions for a single Plaid item.
 */
export async function syncItem(itemId: string): Promise<{ synced: number }> {
  const response = await api.post(`/plaid/sync/${itemId}`);
  return response.data;
}

/**
 * Sync all items sequentially (one at a time to avoid timeouts).
 */
export async function syncAllItems(): Promise<{ totalSynced: number; errors: string[] }> {
  const items = await getPlaidItems();
  let totalSynced = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      const result = await syncItem(item.itemId);
      totalSynced += result.synced;
    } catch (err: any) {
      errors.push(`${item.institutionName || item.itemId}: ${err.message}`);
    }
  }

  return { totalSynced, errors };
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

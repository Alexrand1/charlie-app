import { useState, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { getLinkToken, exchangePublicToken, getAccounts, PlaidAccount } from "@/services/plaid";

/**
 * Wraps react-native-plaid-link-sdk with graceful fallback.
 *
 * Usage:
 *   const { openLink, loading, accounts, linked } = usePlaidLink({ onSuccess });
 *
 * Install the native SDK on your machine:
 *   npx expo install react-native-plaid-link-sdk
 */

let PlaidSDK: any = null;
try {
  PlaidSDK = require("react-native-plaid-link-sdk");
} catch {
  // SDK not installed — openLink will show an alert
}

interface UsePlaidLinkOptions {
  /** Called after accounts are successfully linked & exchanged */
  onSuccess?: (accounts: PlaidAccount[], institutionName: string) => void;
  /** Called if user exits Link without connecting */
  onExit?: () => void;
}

export function usePlaidLink(options: UsePlaidLinkOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [linked, setLinked] = useState(false);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const openLink = useCallback(async () => {
    if (!PlaidSDK) {
      Alert.alert(
        "Setup Required",
        "Plaid Link SDK is not installed. Run:\nnpx expo install react-native-plaid-link-sdk"
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Get a fresh link token from our API
      const linkToken = await getLinkToken();

      // 2. create() configures the token, open() launches the modal with callbacks
      PlaidSDK.create({ token: linkToken });

      const result = await new Promise<{
        success: boolean;
        publicToken?: string;
        institutionName?: string;
      }>((resolve) => {
        PlaidSDK.open({
          onSuccess: (success: any) => {
            resolve({
              success: true,
              publicToken: success.publicToken,
              institutionName:
                success.metadata?.institution?.name || "Your bank",
            });
          },
          onExit: (exit: any) => {
            if (exit?.error) {
              console.warn("[Plaid Exit Error]", exit.error);
            }
            resolve({ success: false });
          },
          iOSPresentationStyle: "FULL_SCREEN",
        });
      });

      if (!result.success || !result.publicToken) {
        optionsRef.current.onExit?.();
        return;
      }

      // 3. Exchange public token for access token on our backend
      await exchangePublicToken(result.publicToken);

      // 4. Fetch updated accounts
      const freshAccounts = await getAccounts();
      setAccounts(freshAccounts);
      setLinked(true);

      optionsRef.current.onSuccess?.(freshAccounts, result.institutionName || "Your bank");
    } catch (err: any) {
      console.error("[Plaid Link Error]", err);
      Alert.alert(
        "Connection Failed",
        err.response?.data?.message || err.message || "Could not connect your bank. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { openLink, loading, linked, accounts };
}

import React, { createContext, useContext, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_COMPLETE_KEY = "charlie_onboarding_complete";

export interface OnboardingState {
  /** User info collected during signup */
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Whether bank was linked in step 3 */
  bankConnected: boolean;
  /** Number of accounts linked */
  accountCount: number;
  /** Analysis results from step 4 */
  opportunities: OpportunityItem[];
  /** Whether the user subscribed (stubbed) */
  userPlan: "free" | "pro";
}

export interface OpportunityItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  amount?: string;
}

interface OnboardingContextType {
  state: OnboardingState;
  update: (partial: Partial<OnboardingState>) => void;
  completeOnboarding: () => Promise<void>;
}

const defaultState: OnboardingState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  bankConnected: false,
  accountCount: 0,
  opportunities: [],
  userPlan: "free",
};

const OnboardingContext = createContext<OnboardingContextType>({
  state: defaultState,
  update: () => {},
  completeOnboarding: async () => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultState);

  const update = useCallback((partial: Partial<OnboardingState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
  }, []);

  return (
    <OnboardingContext.Provider value={{ state, update, completeOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}

/** Check if user has completed onboarding before */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  return value === "true";
}

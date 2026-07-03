// PAYMENT DISABLED: Trial logic removed — full free access for all users
export function useTrialStatus() {
  return {
    isTrialActive: true,
    daysRemaining: 999,
    trialEndDate: null,
    loading: false
  };
}
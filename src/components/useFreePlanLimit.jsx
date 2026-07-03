// PAYMENT DISABLED: All limits removed — full free access for all users
export function useFreePlanLimit(category) {
  return {
    workspace: null,
    count: 0,
    limit: Infinity,
    remaining: Infinity,
    canCreate: true,
    atLimit: false,
    plan: 'business',
    loading: false,
    refresh: () => {}
  };
}
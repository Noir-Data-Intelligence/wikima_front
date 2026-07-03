// ALL LIMITS DISABLED — Full unlimited access for all users (dev/testing mode)

export const PLAN_LIMITS = {};

export const getRecommendedPlanForUpgrade = () => 'business';

export const checkLimit = () => ({ canCreate: true, remaining: Infinity, limit: Infinity, atLimit: false });

export const hasFeatureAccess = () => true;
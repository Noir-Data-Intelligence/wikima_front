import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/api/client';
import { getRecommendedModules } from '@/lib/sectorModules';

const UserTypeContext = createContext();

export const useUserType = () => {
  const ctx = useContext(UserTypeContext);
  if (!ctx) throw new Error('useUserType must be used within UserTypeProvider');
  return ctx;
};

// Modules visible per profile — used only for NEW users during onboarding guidance.
// Existing/legacy users always get full access regardless of this map.
export const PROFILE_MODULES = {
  personal: [
    'Dashboard', 'Financials', 'Receipts', 'CashRegister', 'Reports', 'Agenda',
    'CustomerSupport', 'WorkspaceSettings', 'Profile'
  ],
  professional: [
    'Dashboard', 'Clients', 'Projects', 'Team', 'Assignments', 'Tasks', 'Agenda',
    'Services', 'Documents', 'Invoices', 'Receipts', 'CashRegister', 'Financials',
    'CustomerSupport', 'WorkspaceSettings', 'Profile'
  ],
  company: null // null = all modules visible
};

// ─── Legacy user detection ────────────────────────────────────────────────────
// A user is considered "legacy" (existing before profile system) when:
//   - They completed onboarding BUT never explicitly set user_profile, OR
//   - They have a workspace that was created without the new onboarding flow.
// Legacy users always get full access (canAccess returns true for everything).
const detectIsLegacyUser = (user) => {
  // Explicitly marked as legacy by migration
  if (user.is_legacy_user === true) return true;
  // Has completed onboarding but profile was inferred (not explicitly chosen)
  if (user.onboarding_completed === true && !user.profile_explicitly_set) return true;
  // Never went through new onboarding at all (no onboarding_completed field)
  if (user.onboarding_completed == null && !user.user_profile) return true;
  return false;
};

export const UserTypeProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null); // 'personal' | 'professional' | 'company'
  const [activityType, setActivityType] = useState(null);
  const [isLegacyUser, setIsLegacyUser] = useState(false);
  const [recommendedModules, setRecommendedModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUserProfile(); }, []);

  const loadUserProfile = async () => {
    try {
      const user = await api.auth.me();
      if (!user) { setLoading(false); return; }

      const legacy = detectIsLegacyUser(user);
      setIsLegacyUser(legacy);

      const workspaceId = user.current_workspace_id || user.default_workspace_id;

      if (user.user_profile) {
        setUserProfile(user.user_profile);
        setActivityType(user.activity_type || null);
      } else if (legacy) {
        // Legacy users: infer profile for sidebar grouping but grant full access
        // Default to 'company' so they see all menu groups
        if (workspaceId) {
          try {
            // Backend workspace types are 'personal' | 'business'.
            const ws = await api.entities.Workspace.get(workspaceId);
            setUserProfile(ws?.type === 'business' ? 'company' : 'professional');
          } catch {
            setUserProfile('company');
          }
        } else {
          setUserProfile('company'); // safe default: show everything
        }
      }

      // Load recommended modules from workspace sector config
      // (company_info lives inside the workspace's jsonb settings on the backend).
      if (workspaceId) {
        try {
          const ws = await api.entities.Workspace.get(workspaceId);
          const companyInfo = ws?.settings?.company_info || ws?.company_info;
          const sector = companyInfo?.business_sector;
          const stored = companyInfo?.recommended_modules;
          if (stored?.length) {
            setRecommendedModules(stored);
          } else if (sector) {
            setRecommendedModules(getRecommendedModules(sector));
          }
        } catch { /* ignore */ }
      }
    } catch (e) {
      console.error('UserTypeContext error:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    setLoading(true);
    await loadUserProfile();
  };

  // Golden rule: legacy users always have full access.
  // Profile-based restrictions only apply to new users who explicitly set a profile.
  const canAccess = (pageName) => {
    if (isLegacyUser) return true;       // existing users → full access
    if (!userProfile) return true;        // still loading → show all
    const allowed = PROFILE_MODULES[userProfile];
    if (allowed === null) return true;    // company → all
    return allowed.includes(pageName);
  };

  // Legacy helpers for backwards compatibility
  const isIndividual = userProfile === 'personal';
  const isCompany = userProfile === 'company';
  const isProfessional = userProfile === 'professional';
  const userType = userProfile === 'company' ? 'company' : 'individual';

  return (
    <UserTypeContext.Provider value={{
      userProfile,
      activityType,
      userType,
      isIndividual,
      isCompany,
      isProfessional,
      isLegacyUser,
      recommendedModules,
      canAccess,
      loading,
      refreshProfile
    }}>
      {children}
    </UserTypeContext.Provider>
  );
};
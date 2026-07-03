/**
 * FeatureAdapter - Dynamically adapts app features based on workspace configuration
 * Controls what features/sections are visible and enabled based on:
 * - Selected plan (free, starter, growth, business)
 * - Workspace type (individual, freelancer, company, association)
 * - Business size (micro, small, medium)
 * - Selected goals
 */

export const FeatureAdapter = {
  // Check if feature is available for user's plan
  isFeatureAvailable: (plan, feature) => {
    const featuresByPlan = {
      free: ['tasks', 'documents', 'basic_clients'],
      starter: ['tasks', 'documents', 'clients', 'invoicing', 'calendar', 'basic_integrations'],
      growth: ['tasks', 'documents', 'clients', 'invoicing', 'calendar', 'team', 'integrations', 'ai_features', 'advanced_reports'],
      business: ['all'] // All features
    };

    if (featuresByPlan[plan]?.includes('all')) return true;
    return featuresByPlan[plan]?.includes(feature) || false;
  },

  // Get limits based on plan
  getLimits: (plan) => {
    const limits = {
      free: { tasks: 5, documents: 10, clients: 3, invoices: 0, users: 1 },
      starter: { tasks: 100, documents: 100, clients: 50, invoices: 25, users: 1 },
      growth: { tasks: -1, documents: -1, clients: -1, invoices: -1, users: 5 },
      business: { tasks: -1, documents: -1, clients: -1, invoices: -1, users: -1 }
    };
    return limits[plan] || limits.free;
  },

  // Get visible sidebar items based on goals & plan
  getSidebarItems: (goals, plan, workspaceType) => {
    const baseItems = ['dashboard'];

    // Always show these for non-free plans
    if (plan !== 'free') {
      baseItems.push('tasks');
    }

    // Based on selected goals
    if (goals.includes('documents')) baseItems.push('documents');
    if (goals.includes('clients')) baseItems.push('clients');
    if (goals.includes('invoicing') && plan !== 'free') baseItems.push('invoices');
    if (goals.includes('calendar') && plan !== 'free') baseItems.push('agenda');
    
    // Team features only for companies and growth/business plans
    if (goals.includes('team') && (workspaceType === 'company' || workspaceType === 'association') && ['growth', 'business'].includes(plan)) {
      baseItems.push('workspace_settings');
    }

    // Advanced features for growth/business
    if (['growth', 'business'].includes(plan)) {
      baseItems.push('reports');
    }

    return baseItems;
  },

  // Get recommended integrations based on goals
  getRecommendedIntegrations: (goals, plan) => {
    const integrations = [];

    if (goals.includes('calendar') && ['starter', 'growth', 'business'].includes(plan)) {
      integrations.push('google_calendar');
    }

    if (goals.includes('invoicing') && ['growth', 'business'].includes(plan)) {
      integrations.push('google_sheets');
      integrations.push('email');
    }

    if (['growth', 'business'].includes(plan)) {
      integrations.push('ai_features');
    }

    return integrations;
  },

  // Get feature recommendations for user
  getRecommendations: (workspaceType, businessSize, goals, plan) => {
    const recommendations = [];

    // Freelancer recommendations
    if (workspaceType === 'freelancer' && plan === 'free') {
      recommendations.push({
        type: 'upgrade',
        title: 'Upgrade to Starter',
        message: 'Unlock invoicing and calendar integrations to manage your clients better.',
        targetPlan: 'starter'
      });
    }

    // Company/team recommendations
    if (workspaceType === 'company' && goals.includes('team') && plan === 'starter') {
      recommendations.push({
        type: 'upgrade',
        title: 'Upgrade to Growth',
        message: 'Add team members and enable advanced integrations for better collaboration.',
        targetPlan: 'growth'
      });
    }

    // Invoicing recommendations
    if (goals.includes('invoicing') && plan === 'free') {
      recommendations.push({
        type: 'upgrade',
        title: 'Enable Invoicing',
        message: 'Upgrade to Starter to generate and manage invoices for your clients.',
        targetPlan: 'starter'
      });
    }

    // AI features for growth users
    if (plan === 'growth') {
      recommendations.push({
        type: 'feature',
        title: 'Use WIWI AI',
        message: 'Let WIWI help you with smart insights and task recommendations.'
      });
    }

    return recommendations;
  },

  // Check if user needs upgrade
  needsUpgrade: (plan, requiredPlan) => {
    const planHierarchy = { free: 0, starter: 1, growth: 2, business: 3 };
    return planHierarchy[plan] < planHierarchy[requiredPlan];
  },

  // Permissions based on workspace type and role
  getPermissions: (workspaceType, role, plan) => {
    const basePermissions = {
      can_manage_tasks: true,
      can_manage_documents: true,
      can_view_dashboard: true
    };

    if (workspaceType === 'company' || workspaceType === 'association') {
      basePermissions.can_manage_clients = true;
    }

    if (plan !== 'free') {
      basePermissions.can_manage_invoices = true;
      basePermissions.can_use_calendar = true;
    }

    if (['growth', 'business'].includes(plan)) {
      basePermissions.can_manage_team = role === 'owner' || role === 'admin';
      basePermissions.can_use_integrations = true;
      basePermissions.can_use_ai = true;
    }

    return basePermissions;
  }
};

export default FeatureAdapter;
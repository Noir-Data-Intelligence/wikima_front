// Shared navigation config for the new AppShell sidebar.
//
// Mirrors the module/profile logic of the legacy DashboardSidebar but uses the
// new REST routes and i18n keys (with sensible fallbacks until keys are added).
// Profiles: 'personal' | 'professional' | 'company'.

import {
  LayoutDashboard, Users, UserCircle2, FolderKanban, MessageSquare,
  CheckSquare, Calendar, Briefcase, FileText, Package, Receipt, FileCheck,
  DollarSign, Building2, TrendingUp, Wallet, MessageSquarePlus, MessageCircle,
  Settings, BarChart2, CreditCard, Zap, ClipboardList, Activity,
} from 'lucide-react';

const P = ['personal', 'professional', 'company'];

// item: { to, tKey, fallback, icon, profiles? }
export function buildNavGroups(profile = 'company') {
  const inProfile = (item) => !item.profiles || item.profiles.includes(profile);

  const groups = [
    {
      id: 'workspace',
      tKey: 'nav_group_workspace', fallback: 'Workspace', profiles: P,
      items: [
        { to: '/dashboard', tKey: 'nav_dashboard', fallback: 'Today', icon: LayoutDashboard },
      ],
    },
    {
      id: 'clients',
      tKey: 'nav_group_clients', fallback: 'Clients & Team', profiles: ['professional', 'company'],
      items: [
        { to: '/clients', tKey: 'nav_clients', fallback: 'Clients', icon: Users },
        { to: '/team', tKey: 'nav_team', fallback: 'Team', icon: UserCircle2, profiles: ['professional', 'company'] },
        { to: '/projects', tKey: 'nav_projects', fallback: 'Projects', icon: FolderKanban, profiles: ['professional', 'company'] },
        { to: '/messages', tKey: 'nav_messages', fallback: 'Messages', icon: MessageSquare, profiles: ['company'] },
      ],
    },
    {
      id: 'work',
      tKey: 'nav_group_work', fallback: 'Work', profiles: ['professional', 'company'],
      items: [
        { to: '/tasks', tKey: 'nav_tasks', fallback: 'Tasks', icon: CheckSquare },
        { to: '/assignments', tKey: 'nav_assignments', fallback: 'Assignments', icon: ClipboardList, profiles: ['professional', 'company'] },
        { to: '/agenda', tKey: 'nav_agenda', fallback: 'Agenda', icon: Calendar },
        { to: '/services', tKey: 'nav_services', fallback: 'Services', icon: Briefcase },
        { to: '/documents', tKey: 'nav_documents', fallback: 'Documents', icon: FileText },
        { to: '/stock', tKey: 'nav_stock', fallback: 'Stock', icon: Package, profiles: ['company'] },
      ],
    },
    {
      id: 'personal_agenda',
      tKey: 'nav_group_agenda', fallback: 'Agenda', profiles: ['personal'],
      items: [
        { to: '/agenda', tKey: 'nav_agenda', fallback: 'Agenda', icon: Calendar },
      ],
    },
    {
      id: 'finance',
      tKey: 'nav_group_finance', fallback: 'Finance', profiles: ['professional', 'company'],
      items: [
        { to: '/invoices', tKey: 'nav_invoices', fallback: 'Invoices', icon: Receipt },
        { to: '/receipts', tKey: 'nav_receipts', fallback: 'Receipts', icon: FileCheck },
        { to: '/cash-register', tKey: 'nav_cash_register', fallback: 'Cash Control', icon: DollarSign },
        { to: '/banks', tKey: 'nav_banks', fallback: 'Banking', icon: Building2, profiles: ['company'] },
        { to: '/reports', tKey: 'nav_reports', fallback: 'Reports', icon: TrendingUp, profiles: ['company'] },
      ],
    },
    {
      id: 'personal_finance',
      tKey: 'nav_group_personal_finance', fallback: 'Personal Finance', profiles: ['personal'],
      items: [
        { to: '/financials', tKey: 'nav_financials', fallback: 'My Wallet', icon: Wallet },
        { to: '/reports', tKey: 'nav_reports', fallback: 'Reports', icon: TrendingUp },
        { to: '/receipts', tKey: 'nav_receipts', fallback: 'Receipts', icon: FileCheck },
      ],
    },
    {
      id: 'administration',
      tKey: 'nav_group_admin', fallback: 'Administration', profiles: P,
      items: [
        { to: '/feedback', tKey: 'nav_feedback', fallback: 'Feedback', icon: MessageSquarePlus },
        { to: '/support', tKey: 'nav_customer_support', fallback: 'Support', icon: MessageCircle },
        { to: '/settings', tKey: 'nav_settings', fallback: 'Settings', icon: Settings },
      ],
    },
  ];

  return groups
    .filter((g) => !g.profiles || g.profiles.includes(profile))
    .map((g) => ({ ...g, items: g.items.filter(inProfile) }))
    .filter((g) => g.items.length > 0);
}

// Platform admin (role === 'admin') — routes under /admin.
export const ADMIN_NAV = {
  id: 'wikima_admin',
  tKey: 'nav_group_wikima_admin', fallback: 'WiKima Admin',
  items: [
    { to: '/admin/analytics', tKey: 'nav_admin_analytics', fallback: 'Product Analytics', icon: BarChart2 },
    { to: '/admin/users', tKey: 'nav_admin_users', fallback: 'Users', icon: Users },
    { to: '/admin/feedback', tKey: 'nav_admin_feedback', fallback: 'Feedback', icon: MessageSquarePlus },
    { to: '/admin/subscriptions', tKey: 'nav_admin_subscriptions', fallback: 'Subscriptions', icon: CreditCard },
    { to: '/admin/settings', tKey: 'nav_admin_settings', fallback: 'Platform Settings', icon: Settings },
    { to: '/admin/features', tKey: 'nav_admin_features', fallback: 'Features', icon: Zap },
    { to: '/admin/audit-logs', tKey: 'nav_admin_audit', fallback: 'Audit Logs', icon: ClipboardList },
    { to: '/admin/monitoring', tKey: 'nav_admin_monitoring', fallback: 'Monitoring', icon: Activity },
  ],
};

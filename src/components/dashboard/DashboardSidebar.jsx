import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useLanguage } from '../LanguageContext';
import { useUserType } from '../UserTypeContext';
import {
  LayoutDashboard, CheckSquare, Users, FileText, Receipt,
  MessageSquare, MessageCircle, Settings, Wallet, X,
  Briefcase, Building2, FileCheck, Calendar, Package, DollarSign,
  ChevronDown, UserCircle2, TrendingUp, MessageSquarePlus,
  BarChart2, CreditCard, Zap, ClipboardList, Activity, Shield, Star, FolderKanban
} from 'lucide-react';

// ─── Configurable modules ─────────────────────────────────────────────────────
// To enable/disable a module per profile, edit the arrays below.
// Profiles: 'personal' | 'professional' | 'company'
export const MODULE_CONFIG = {
  stock:   { enabled: true, profiles: ['company'] },
  banking: { enabled: true, profiles: ['company'] },
  team:    { enabled: true, profiles: ['company'] },
};

// ─── Menu config per profile ─────────────────────────────────────────────────
const buildMenuGroups = (lang, profile) => {
  const pt = lang === 'pt';

  // Helper: is a configurable module visible for the current profile?
  const moduleOn = (key) =>
    MODULE_CONFIG[key]?.enabled && MODULE_CONFIG[key]?.profiles.includes(profile);

  const ALL_GROUPS = [
    {
      id: 'workspace',
      label: 'Workspace',
      profiles: ['personal', 'professional', 'company'],
      items: [
        { name: 'Dashboard', label: pt ? 'Hoje' : 'Today', icon: LayoutDashboard }
      ]
    },
    {
      id: 'clients',
      label: pt ? 'Clientes & Equipa' : 'Clients & Team',
      profiles: ['professional', 'company'],
      items: [
        { name: 'Clients',  label: pt ? 'Clientes' : 'Clients',   icon: Users,         profiles: ['professional', 'company'] },
        { name: 'Team',     label: pt ? 'Equipa' : 'Team',         icon: UserCircle2,    profiles: ['company'] },
        { name: 'Projects', label: pt ? 'Projetos' : 'Projects',  icon: FolderKanban,   profiles: ['company'] },
        { name: 'Messages', label: pt ? 'Mensagens' : 'Messages', icon: MessageSquare,  profiles: ['company'] },
        // Team shown inline above for company; keep configurable for professional
        ...(profile === 'professional' && moduleOn('team') ? [{ name: 'Team', label: pt ? 'Equipa' : 'Team', icon: UserCircle2 }] : [])
      ]
    },
    {
      id: 'work',
      label: pt ? 'Trabalho' : 'Work',
      profiles: ['professional', 'company'],
      items: [
        { name: 'Tasks',     label: pt ? 'Tarefas' : 'Tasks',       icon: CheckSquare },
        { name: 'Agenda',    label: pt ? 'Agenda' : 'Agenda',        icon: Calendar },
        { name: 'Services',  label: pt ? 'Serviços' : 'Services',    icon: Briefcase },
        { name: 'Documents', label: pt ? 'Documentos' : 'Documents', icon: FileText },
        // Stock is a configurable module
        ...(moduleOn('stock') ? [{ name: 'Stock', label: pt ? 'Stock' : 'Stock', icon: Package }] : [])
      ]
    },
    {
      id: 'personal_agenda',
      label: pt ? 'Agenda' : 'Agenda',
      profiles: ['personal'],
      items: [
        { name: 'Agenda', label: pt ? 'Agenda' : 'Agenda', icon: Calendar }
      ]
    },
    {
      id: 'business_finance',
      label: pt ? 'Finanças Empresa' : 'Business Finance',
      profiles: ['professional', 'company'],
      items: [
        { name: 'Invoices',     label: pt ? 'Faturas' : 'Invoices',             icon: Receipt },
        { name: 'Receipts',     label: pt ? 'Recibos' : 'Receipts',             icon: FileCheck },
        { name: 'CashRegister', label: pt ? 'Controlo de Caixa' : 'Cash Control', icon: DollarSign },
        // Banking is a configurable module
        ...(moduleOn('banking') ? [{ name: 'Banks', label: pt ? 'Banca' : 'Banking', icon: Building2 }] : []),
        { name: 'Reports',      label: pt ? 'Relatórios' : 'Reports',           icon: TrendingUp, profiles: ['company'] }
      ]
    },
    {
      id: 'personal_finance',
      label: pt ? 'Finanças Pessoais' : 'Personal Finance',
      profiles: ['personal'],
      items: [
        { name: 'Financials', label: pt ? 'A Minha Carteira' : 'My Wallet', icon: Wallet }
      ]
    },
    {
      id: 'personal_reports',
      label: pt ? 'Relatórios' : 'Reports',
      profiles: ['personal'],
      items: [
        { name: 'Reports',      label: pt ? 'Relatórios' : 'Reports',           icon: TrendingUp },
        { name: 'Receipts',     label: pt ? 'Recibos' : 'Receipts',             icon: FileCheck },
        { name: 'CashRegister', label: pt ? 'Controlo de Caixa' : 'Cash Control', icon: DollarSign }
      ]
    },
    {
      id: 'administration',
      label: pt ? 'Administração' : 'Administration',
      profiles: ['personal', 'professional', 'company'],
      items: [
        { name: 'FeedbackCenter',    label: pt ? 'Feedback' : 'Feedback',      icon: MessageSquarePlus },
        { name: 'CustomerSupport',   label: pt ? 'Suporte' : 'Support',        icon: MessageCircle },
        { name: 'WorkspaceSettings', label: pt ? 'Configurações' : 'Settings', icon: Settings }
      ]
    }
  ];

  return ALL_GROUPS
    .filter(g => !profile || g.profiles.includes(profile))
    .map(g => ({
      ...g,
      items: g.items.filter(item => !item.profiles || item.profiles.includes(profile))
    }))
    .filter(g => g.items.length > 0);
};

// ─── Admin navigation items ───────────────────────────────────────────────────
const ADMIN_ITEMS = [
  { name: 'ProductAnalytics',      label_pt: 'Product Analytics',       label_en: 'Product Analytics',       icon: BarChart2 },
  { name: 'UserManagement',        label_pt: 'Utilizadores',            label_en: 'User Management',          icon: Users },
  { name: 'AdminFeedback',         label_pt: 'Feedback',                label_en: 'Feedback',                 icon: MessageSquarePlus },
  { name: 'SubscriptionManagement',label_pt: 'Subscrições',             label_en: 'Subscriptions',            icon: CreditCard },
  { name: 'PlatformSettings',      label_pt: 'Configurações',           label_en: 'Platform Settings',        icon: Settings },
  { name: 'FeatureManagement',     label_pt: 'Funcionalidades',         label_en: 'Features',                 icon: Zap },
  { name: 'AuditLogs',             label_pt: 'Registos de Auditoria',   label_en: 'Audit Logs',               icon: ClipboardList },
  { name: 'SystemMonitoring',      label_pt: 'Monitorização',           label_en: 'System Monitoring',        icon: Activity },
];

function AdminSection({ currentPage, language }) {
  const pt = language === 'pt';
  return (
    <div className="mb-1">
      {/* Section header */}
      <div className="flex items-center gap-2 px-2 py-2">
        <Shield className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(168,85,247,0.7)' }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(168,85,247,0.7)' }}>
          WiKima Admin
        </span>
      </div>

      {/* Admin items */}
      <div className="pb-1 space-y-0.5">
        {ADMIN_ITEMS.map(item => {
          const isActive = currentPage === item.name;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={`/${item.name}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
              style={{
                backgroundColor: isActive ? 'rgba(168,85,247,0.12)' : 'transparent',
                color: isActive ? '#a855f7' : 'rgba(255,255,255,0.65)'
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.07)'; e.currentTarget.style.color = 'rgba(168,85,247,0.9)'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; } }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{pt ? item.label_pt : item.label_en}</span>
            </Link>
          );
        })}
      </div>

      {/* Separator */}
      <div className="mx-2 my-2" style={{ borderTop: '1px solid rgba(168,85,247,0.15)' }} />
    </div>
  );
}

export default function DashboardSidebar({ currentPage, isOpen, onToggle, user }) {
  const { language } = useLanguage();
  const { userProfile, isLegacyUser, recommendedModules } = useUserType();
  const isAdmin = user?.role === 'admin';
  const hasRecommendations = recommendedModules?.length > 0;

  // Legacy users (existing before profile system) always get the 'company' menu
  // so they see every module — this is the Golden Rule for backwards compatibility.
  const effectiveProfile = isLegacyUser ? 'company' : (userProfile || 'company');

  // Sort groups: within each group, recommended items come first
  const sortGroupItems = (items) => {
    if (!hasRecommendations) return items;
    const rec = items.filter(i => recommendedModules.includes(i.name));
    const rest = items.filter(i => !recommendedModules.includes(i.name));
    return [...rec, ...rest];
  };

  const rawGroups = buildMenuGroups(language, effectiveProfile);
  const menuGroups = rawGroups.map(g => ({ ...g, items: sortGroupItems(g.items) }));

  const defaultExpanded = menuGroups.reduce((acc, g) => {
    acc[g.id] = true;
    return acc;
  }, {});
  const [expandedGroups, setExpandedGroups] = useState(defaultExpanded);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ backgroundColor: 'hsl(var(--sidebar-background))', borderColor: 'rgba(255,255,255,0.08)', boxShadow: isOpen ? '4px 0 32px rgba(0,0,0,0.4)' : 'none' }}
        className={`fixed top-0 left-0 h-full w-64 border-r z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <img
            src="/wikima-logo.png"
            alt="WiKima"
            className="h-14 w-auto"
          />
          <button
            onClick={onToggle}
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Nav */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-4 sidebar-scroll"
          style={{ scrollbarWidth: 'none' }}
        >
          <style>{`
            .sidebar-scroll::-webkit-scrollbar { width: 3px; }
            .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
            .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
            .sidebar-scroll:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.22); }
            .sidebar-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
            .sidebar-scroll:hover { scrollbar-color: rgba(255,255,255,0.18) transparent; }
          `}</style>

          <div className="space-y-1">
            {/* ── WiKima Admin Section (admin-only) ── */}
            {isAdmin && <AdminSection currentPage={currentPage} language={language} />}

            {menuGroups.map((group) => {
              const isExpanded = expandedGroups[group.id] !== false;

              return (
                <div key={group.id}>
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2 py-2 rounded-md transition-colors group"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-widest">
                      {group.label}
                    </span>
                    <ChevronDown
                      className="w-3 h-3 transition-transform duration-200 ease-in-out"
                      style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                    />
                  </button>

                  {/* Group items */}
                  <div
                    className="overflow-hidden transition-all duration-200 ease-in-out"
                    style={{
                      maxHeight: isExpanded ? `${group.items.length * 48}px` : '0px',
                      opacity: isExpanded ? 1 : 0
                    }}
                  >
                    <div className="pb-2 space-y-0.5">
                      {group.items.map((item) => {
                        const isActive = currentPage === item.name;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            to={createPageUrl(item.name)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group"
                            style={{
                              backgroundColor: isActive ? 'rgba(233,124,63,0.12)' : 'transparent',
                              color: isActive ? '#e97c3f' : 'rgba(255,255,255,0.72)'
                            }}
                            onMouseEnter={e => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = 'rgba(255,255,255,0.95)';
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'rgba(255,255,255,0.72)';
                              }
                            }}
                          >
                            {isActive && (
                              <span
                                className="absolute left-0 w-0.5 h-6 rounded-r-full"
                                style={{ backgroundColor: '#e97c3f', marginLeft: '-12px' }}
                              />
                            )}
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium flex-1">{item.label}</span>
                            {hasRecommendations && recommendedModules.includes(item.name) && (
                              <Star className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#e97c3f', fill: '#e97c3f', opacity: 0.7 }} />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subtle separator */}
                  <div className="mx-2 my-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                </div>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
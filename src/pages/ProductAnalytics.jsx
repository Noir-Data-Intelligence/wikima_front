import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '../components/LanguageContext';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import ProductAnalyticsCards from '../components/analytics/ProductAnalyticsCards';
import ProductAnalyticsCharts from '../components/analytics/ProductAnalyticsCharts';
import { Download, BarChart3, Loader2, RefreshCw } from 'lucide-react';

const T = {
  pt: {
    title: 'Product Analytics',
    subtitle: 'Métricas de adoção, onboarding e engagement dos utilizadores',
    adminOnly: 'Acesso restrito a administradores.',
    loading: 'A carregar dados…',
    export: 'Exportar CSV',
    refresh: 'Atualizar',
    dateRange: 'Período',
    ranges: { '7d': '7 dias', '30d': '30 dias', '90d': '90 dias', 'all': 'Todos' }
  },
  en: {
    title: 'Product Analytics',
    subtitle: 'User adoption, onboarding and engagement metrics',
    adminOnly: 'Restricted to admin users only.',
    loading: 'Loading data…',
    export: 'Export CSV',
    refresh: 'Refresh',
    dateRange: 'Period',
    ranges: { '7d': '7 days', '30d': '30 days', '90d': '90 days', 'all': 'All time' }
  }
};

export default function ProductAnalytics() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = T[language] || T.en;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState('30d');

  const rangeStart = useMemo(() => {
    const now = new Date();
    if (dateRange === '7d')  return new Date(now - 7  * 86400000).toISOString();
    if (dateRange === '30d') return new Date(now - 30 * 86400000).toISOString();
    if (dateRange === '90d') return new Date(now - 90 * 86400000).toISOString();
    return null;
  }, [dateRange]);

  // ── Data fetches ──
  const { data: allUsers = [], isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['analytics-users'],
    queryFn: () => api.entities.User.list('-created_date', 500)
  });

  const { data: allOnboarding = [], isLoading: loadingOnboarding } = useQuery({
    queryKey: ['analytics-onboarding'],
    queryFn: () => api.entities.OnboardingData.list('-created_date', 500)
  });

  const { data: allClients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['analytics-clients'],
    queryFn: () => api.entities.Client.list('-created_date', 500)
  });

  const { data: allTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['analytics-tasks'],
    queryFn: () => api.entities.Task.list('-created_date', 500)
  });

  const { data: allInvoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['analytics-invoices'],
    queryFn: () => api.entities.Invoice.list('-created_date', 500)
  });

  const { data: allDocuments = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['analytics-docs'],
    queryFn: () => api.entities.Document.list('-created_date', 500)
  });

  const { data: allFeedback = [], isLoading: loadingFeedback } = useQuery({
    queryKey: ['analytics-feedback'],
    queryFn: () => api.entities.Feedback.list('-created_date', 500)
  });

  const isLoading = loadingUsers || loadingOnboarding || loadingClients || loadingTasks || loadingInvoices || loadingDocs || loadingFeedback;

  // ── Filter by date range ──
  const filterByDate = (items) => {
    if (!rangeStart) return items;
    return items.filter(i => i.created_date && i.created_date >= rangeStart);
  };

  const now = new Date();
  const weekAgo  = new Date(now - 7  * 86400000);
  const monthAgo = new Date(now - 30 * 86400000);

  const rangedUsers     = filterByDate(allUsers);
  const rangedOnboarding = filterByDate(allOnboarding);
  const rangedFeedback  = filterByDate(allFeedback);

  // ── Computed metrics ──
  const metrics = useMemo(() => {
    // User metrics
    const totalUsers       = allUsers.length;
    const newThisWeek      = allUsers.filter(u => new Date(u.created_date) >= weekAgo).length;
    const newThisMonth     = allUsers.filter(u => new Date(u.created_date) >= monthAgo).length;

    // Onboarding
    const startedOnboarding   = allOnboarding.length;
    const completedOnboarding = allOnboarding.filter(o => o.completed).length;
    const abandonedOnboarding = startedOnboarding - completedOnboarding;
    const completionRate      = startedOnboarding > 0
      ? Math.round((completedOnboarding / startedOnboarding) * 100) : 0;

    // Profile distribution
    const profileDist = {
      personal:     allUsers.filter(u => u.user_profile === 'personal').length,
      professional: allUsers.filter(u => u.user_profile === 'professional').length,
      company:      allUsers.filter(u => u.user_profile === 'company').length,
      unknown:      allUsers.filter(u => !u.user_profile).length
    };

    // Activation (unique workspace_ids that have at least one record)
    const wsWithClients  = new Set(filterByDate(allClients).map(c => c.workspace_id)).size;
    const wsWithTasks    = new Set(filterByDate(allTasks).map(t => t.workspace_id)).size;
    const wsWithInvoices = new Set(filterByDate(allInvoices).map(i => i.workspace_id)).size;
    const wsWithDocs     = new Set(filterByDate(allDocuments).map(d => d.workspace_id)).size;

    // Feedback
    const totalFeedback = allFeedback.length;
    const ratingsOnly   = allFeedback.filter(f => f.rating);
    const avgRating     = ratingsOnly.length > 0
      ? (ratingsOnly.reduce((s, f) => s + f.rating, 0) / ratingsOnly.length).toFixed(1) : '—';
    const feedbackByCat = {
      bug:         allFeedback.filter(f => f.category === 'bug').length,
      feature:     allFeedback.filter(f => f.category === 'feature').length,
      general:     allFeedback.filter(f => f.category === 'general').length,
      improvement: allFeedback.filter(f => f.category === 'improvement').length
    };
    const openFeedback     = allFeedback.filter(f => f.status === 'new' || f.status === 'in_progress').length;
    const resolvedFeedback = allFeedback.filter(f => f.status === 'done' || f.status === 'reviewed').length;

    // User growth over last 8 weeks (for chart)
    const weeklyGrowth = Array.from({ length: 8 }, (_, i) => {
      const end   = new Date(now - i       * 7 * 86400000);
      const start = new Date(now - (i + 1) * 7 * 86400000);
      return {
        week: `W-${i === 0 ? '0' : i}`,
        users: allUsers.filter(u => {
          const d = new Date(u.created_date);
          return d >= start && d < end;
        }).length
      };
    }).reverse();

    // Profile chart data
    const profileChartData = [
      { name: language === 'pt' ? 'Pessoal' : 'Personal', value: profileDist.personal, fill: '#6366f1' },
      { name: language === 'pt' ? 'Profissional' : 'Professional', value: profileDist.professional, fill: '#e97c3f' },
      { name: language === 'pt' ? 'Empresa' : 'Company', value: profileDist.company, fill: '#22c55e' },
    ].filter(d => d.value > 0);

    // Feedback category chart data
    const feedbackChartData = [
      { name: language === 'pt' ? 'Bugs' : 'Bugs',              value: feedbackByCat.bug,         fill: '#ef4444' },
      { name: language === 'pt' ? 'Funcionalidades' : 'Features', value: feedbackByCat.feature,    fill: '#f59e0b' },
      { name: language === 'pt' ? 'Geral' : 'General',           value: feedbackByCat.general,     fill: '#3b82f6' },
      { name: language === 'pt' ? 'Melhorias' : 'Improvements',  value: feedbackByCat.improvement, fill: '#10b981' },
    ].filter(d => d.value > 0);

    return {
      totalUsers, newThisWeek, newThisMonth,
      startedOnboarding, completedOnboarding, abandonedOnboarding, completionRate,
      profileDist,
      wsWithClients, wsWithTasks, wsWithInvoices, wsWithDocs,
      totalFeedback, avgRating, feedbackByCat, openFeedback, resolvedFeedback,
      weeklyGrowth, profileChartData, feedbackChartData
    };
  }, [allUsers, allOnboarding, allClients, allTasks, allInvoices, allDocuments, allFeedback, dateRange, language]);

  const handleExport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Users', metrics.totalUsers],
      ['New This Week', metrics.newThisWeek],
      ['New This Month', metrics.newThisMonth],
      ['Started Onboarding', metrics.startedOnboarding],
      ['Completed Onboarding', metrics.completedOnboarding],
      ['Onboarding Completion Rate', `${metrics.completionRate}%`],
      ['Workspaces with Clients', metrics.wsWithClients],
      ['Workspaces with Tasks', metrics.wsWithTasks],
      ['Workspaces with Invoices', metrics.wsWithInvoices],
      ['Workspaces with Documents', metrics.wsWithDocs],
      ['Total Feedback', metrics.totalFeedback],
      ['Avg Rating', metrics.avgRating],
      ['Open Feedback', metrics.openFeedback],
      ['Resolved Feedback', metrics.resolvedFeedback],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'product-analytics.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    refetchUsers();
  };

  // Admin guard — after all hooks
  if (user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      
      

      <main className="p-5 lg:pt-8 md:p-8">
        <div className="max-w-[1600px] mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
                <p className="text-sm text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Date range */}
              <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-xl p-1">
                {Object.entries(t.ranges).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setDateRange(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      dateRange === key
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-muted-foreground hover:text-muted-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white/4 text-muted-foreground hover:text-foreground hover:bg-white/8 text-sm transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t.refresh}
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white/4 text-muted-foreground hover:text-foreground hover:bg-white/8 text-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                {t.export}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">{t.loading}</p>
              </div>
            </div>
          ) : (
            <>
              <ProductAnalyticsCards metrics={metrics} language={language} />
              <ProductAnalyticsCharts metrics={metrics} language={language} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
import { Users, UserPlus, TrendingUp, CheckCircle2, XCircle, Star, MessageSquarePlus, FileText, Receipt } from 'lucide-react';

const LABELS = {
  pt: {
    users: 'Utilizadores',
    totalUsers: 'Total de Utilizadores',
    newWeek: 'Novos Esta Semana',
    newMonth: 'Novos Este Mês',
    onboarding: 'Onboarding',
    started: 'Iniciaram Onboarding',
    completed: 'Completaram Onboarding',
    abandoned: 'Abandonaram Onboarding',
    completionRate: 'Taxa de Conclusão',
    profiles: 'Distribuição de Perfis',
    personal: 'Finanças Pessoais',
    professional: 'Profissional Independente',
    company: 'Empresa',
    activation: 'Ativação',
    wsClients: 'Criaram 1.º Cliente',
    wsTasks: 'Criaram 1.ª Tarefa',
    wsInvoices: 'Criaram 1.ª Fatura',
    wsDocs: 'Carregaram 1.º Documento',
    feedback: 'Feedback',
    totalFeedback: 'Total de Feedback',
    avgRating: 'Avaliação Média',
    openFeedback: 'Feedback Aberto',
    resolvedFeedback: 'Feedback Resolvido',
    bugs: 'Bugs',
    features: 'Funcionalidades',
    general: 'Geral',
    improvements: 'Melhorias',
  },
  en: {
    users: 'Users',
    totalUsers: 'Total Users',
    newWeek: 'New This Week',
    newMonth: 'New This Month',
    onboarding: 'Onboarding',
    started: 'Started Onboarding',
    completed: 'Completed Onboarding',
    abandoned: 'Abandoned Onboarding',
    completionRate: 'Completion Rate',
    profiles: 'Profile Distribution',
    personal: 'Personal Finance',
    professional: 'Independent Professional',
    company: 'Company',
    activation: 'Activation',
    wsClients: 'Created 1st Client',
    wsTasks: 'Created 1st Task',
    wsInvoices: 'Created 1st Invoice',
    wsDocs: 'Uploaded 1st Document',
    feedback: 'Feedback',
    totalFeedback: 'Total Feedback',
    avgRating: 'Avg Rating',
    openFeedback: 'Open Feedback',
    resolvedFeedback: 'Resolved Feedback',
    bugs: 'Bugs',
    features: 'Features',
    general: 'General',
    improvements: 'Improvements',
  }
};

function StatCard({ icon: Icon, iconColor, iconBg, label, value, sub, subColor }) {
  return (
    <div className="rounded-xl border border-white/6 bg-background px-4 py-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <p className="text-xs text-muted-foreground font-medium leading-snug">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className={`text-xs mt-1 ${subColor || 'text-muted-foreground'}`}>{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 mt-6">{children}</h2>
  );
}

export default function ProductAnalyticsCards({ metrics, language }) {
  const t = LABELS[language] || LABELS.en;
  const m = metrics;

  return (
    <div>
      {/* User Metrics */}
      <SectionTitle>{t.users}</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard icon={Users}    iconColor="text-blue-400"    iconBg="bg-blue-500/10"    label={t.totalUsers}  value={m.totalUsers} />
        <StatCard icon={UserPlus} iconColor="text-primary"    iconBg="bg-primary/10"    label={t.newWeek}     value={m.newThisWeek} />
        <StatCard icon={UserPlus} iconColor="text-indigo-400"  iconBg="bg-indigo-500/10"  label={t.newMonth}    value={m.newThisMonth} />
      </div>

      {/* Onboarding */}
      <SectionTitle>{t.onboarding}</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users}         iconColor="text-purple-400"  iconBg="bg-purple-500/10"  label={t.started}        value={m.startedOnboarding} />
        <StatCard icon={CheckCircle2}  iconColor="text-emerald-400" iconBg="bg-emerald-500/10" label={t.completed}      value={m.completedOnboarding} />
        <StatCard icon={XCircle}       iconColor="text-red-400"     iconBg="bg-red-500/10"     label={t.abandoned}      value={m.abandonedOnboarding} />
        <StatCard icon={TrendingUp}    iconColor="text-orange-400"  iconBg="bg-orange-500/10"  label={t.completionRate} value={`${m.completionRate}%`} />
      </div>

      {/* Profile Distribution */}
      <SectionTitle>{t.profiles}</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={Users} iconColor="text-indigo-400"  iconBg="bg-indigo-500/10"  label={t.personal}      value={m.profileDist.personal} />
        <StatCard icon={Users} iconColor="text-orange-400"  iconBg="bg-orange-500/10"  label={t.professional}  value={m.profileDist.professional} />
        <StatCard icon={Users} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" label={t.company}       value={m.profileDist.company} />
      </div>

      {/* Activation */}
      <SectionTitle>{t.activation}</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users}         iconColor="text-primary"    iconBg="bg-primary/10"    label={t.wsClients}   value={m.wsWithClients} />
        <StatCard icon={CheckCircle2}  iconColor="text-blue-400"    iconBg="bg-blue-500/10"    label={t.wsTasks}     value={m.wsWithTasks} />
        <StatCard icon={Receipt}       iconColor="text-amber-400"   iconBg="bg-amber-500/10"   label={t.wsInvoices}  value={m.wsWithInvoices} />
        <StatCard icon={FileText}      iconColor="text-purple-400"  iconBg="bg-purple-500/10"  label={t.wsDocs}      value={m.wsWithDocs} />
      </div>

      {/* Feedback */}
      <SectionTitle>{t.feedback}</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={MessageSquarePlus} iconColor="text-blue-400"    iconBg="bg-blue-500/10"    label={t.totalFeedback}    value={m.totalFeedback} />
        <StatCard icon={Star}              iconColor="text-amber-400"   iconBg="bg-amber-500/10"   label={t.avgRating}        value={m.avgRating} />
        <StatCard icon={XCircle}           iconColor="text-red-400"     iconBg="bg-red-500/10"     label={t.openFeedback}     value={m.openFeedback} />
        <StatCard icon={CheckCircle2}      iconColor="text-emerald-400" iconBg="bg-emerald-500/10" label={t.resolvedFeedback} value={m.resolvedFeedback} />
      </div>
    </div>
  );
}
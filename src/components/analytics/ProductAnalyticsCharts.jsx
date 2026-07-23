import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const LABELS = {
  pt: {
    weeklyGrowth: 'Crescimento Semanal de Utilizadores',
    profiles: 'Distribuição por Perfil',
    feedback: 'Feedback por Categoria',
    activation: 'Ativação por Módulo',
    newUsers: 'Novos Utilizadores',
    workspaces: 'Workspaces',
    clients: 'Clientes',
    tasks: 'Tarefas',
    invoices: 'Faturas',
    documents: 'Documentos',
    onboarding: 'Onboarding',
    completed: 'Completo',
    abandoned: 'Abandonado',
  },
  en: {
    weeklyGrowth: 'Weekly User Growth',
    profiles: 'Profile Distribution',
    feedback: 'Feedback by Category',
    activation: 'Activation by Module',
    newUsers: 'New Users',
    workspaces: 'Workspaces',
    clients: 'Clients',
    tasks: 'Tasks',
    invoices: 'Invoices',
    documents: 'Documents',
    onboarding: 'Onboarding',
    completed: 'Completed',
    abandoned: 'Abandoned',
  }
};

const CHART_TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: 12 },
  labelStyle: { color: 'rgba(255,255,255,0.5)' }
};

function ChartCard({ title, children }) {
  return (
    <div className="rounded-xl border border-white/6 bg-background p-5">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function ProductAnalyticsCharts({ metrics, language }) {
  const t = LABELS[language] || LABELS.en;
  const m = metrics;

  const activationData = [
    { name: t.clients,   value: m.wsWithClients,  fill: '#6366f1' },
    { name: t.tasks,     value: m.wsWithTasks,    fill: '#e97c3f' },
    { name: t.invoices,  value: m.wsWithInvoices, fill: '#f59e0b' },
    { name: t.documents, value: m.wsWithDocs,     fill: '#22c55e' },
  ];

  const onboardingData = [
    { name: t.completed, value: m.completedOnboarding, fill: '#22c55e' },
    { name: t.abandoned, value: m.abandonedOnboarding, fill: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* Weekly Growth */}
      <ChartCard title={t.weeklyGrowth}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={m.weeklyGrowth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...CHART_TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} name={t.newUsers} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Profile Distribution */}
      <ChartCard title={t.profiles}>
        {m.profileChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={m.profileChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {m.profileChartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
        )}
      </ChartCard>

      {/* Activation by Module */}
      <ChartCard title={t.activation}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={activationData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...CHART_TOOLTIP_STYLE} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} name={t.workspaces}>
              {activationData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Feedback by Category */}
      <ChartCard title={t.feedback}>
        {m.feedbackChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={m.feedbackChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {m.feedbackChartData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No feedback yet</div>
        )}
      </ChartCard>

      {/* Onboarding funnel */}
      {onboardingData.length > 0 && (
        <ChartCard title={t.onboarding}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={onboardingData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {onboardingData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
              </Pie>
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

    </div>
  );
}
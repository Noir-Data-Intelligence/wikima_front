import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '../../components/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { ClipboardList, Loader2, Search } from 'lucide-react';

export default function AuditLogs() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const pt = language === 'pt';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: feedback = [], isLoading: loadFeedback } = useQuery({
    queryKey: ['audit-feedback'],
    queryFn: () => api.entities.Feedback.list('-created_date', 200)
  });

  const { data: tickets = [], isLoading: loadTickets } = useQuery({
    queryKey: ['audit-tickets'],
    queryFn: () => api.entities.SupportTicket.list('-created_date', 200)
  });

  if (user && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const isLoading = loadFeedback || loadTickets;

  const logs = [
    ...feedback.map(f => ({
      id: f.id,
      type: 'feedback',
      actor: f.user_email || f.user_name || '—',
      action: `Feedback: ${f.category}`,
      detail: f.message?.slice(0, 60),
      date: f.created_date
    })),
    ...tickets.map(t => ({
      id: t.id,
      type: 'ticket',
      actor: t.customer_email,
      action: `Support ticket: ${t.subject}`,
      detail: `Status: ${t.status}`,
      date: t.created_date
    }))
  ]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .filter(l => !search || l.actor?.includes(search) || l.action?.includes(search));

  const typeColors = { feedback: 'bg-blue-500/15 text-blue-300', ticket: 'bg-orange-500/15 text-orange-300' };

  return (
    <div className="min-h-screen bg-background">
      
      

      <main className="p-5 lg:pt-8 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{pt ? 'Registos de Auditoria' : 'Audit Logs'}</h1>
              <p className="text-sm text-muted-foreground">{pt ? `${logs.length} eventos registados` : `${logs.length} logged events`}</p>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={pt ? 'Pesquisar eventos…' : 'Search events…'}
              className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
          ) : (
            <div className="bg-muted/50 border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Data' : 'Date'}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Tipo' : 'Type'}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Ator' : 'Actor'}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Ação' : 'Action'}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Detalhe' : 'Detail'}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr key={l.id + l.type} style={{ borderBottom: i < logs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{l.date ? new Date(l.date).toLocaleString() : '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[l.type]}`}>{l.type}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{l.actor}</td>
                      <td className="px-5 py-3 text-sm text-foreground">{l.action}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{l.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">{pt ? 'Nenhum evento encontrado.' : 'No events found.'}</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
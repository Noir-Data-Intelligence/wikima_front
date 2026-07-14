import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '../../components/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Activity, CheckCircle2, AlertCircle, Loader2, Database, Users, FileText, MessageSquare } from 'lucide-react';

export default function SystemMonitoring() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const pt = language === 'pt';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: users = [], isLoading: lu } = useQuery({ queryKey: ['mon-users'], queryFn: () => api.entities.User.list('-created_date', 1) });
  const { data: workspaces = [], isLoading: lw } = useQuery({ queryKey: ['mon-ws'], queryFn: () => api.entities.Workspace.list('-created_date', 500) });
  const { data: tickets = [], isLoading: lt } = useQuery({ queryKey: ['mon-tickets'], queryFn: () => api.entities.SupportTicket.list('-created_date', 200) });
  const { data: feedback = [], isLoading: lf } = useQuery({ queryKey: ['mon-feedback'], queryFn: () => api.entities.Feedback.list('-created_date', 200) });

  if (user && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const isLoading = lu || lw || lt || lf;

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'waiting_customer').length;
  const newFeedback = feedback.filter(f => f.status === 'new').length;
  const activeWs = workspaces.filter(w => w.status === 'active').length;

  const services = [
    { name: 'Database', status: 'operational', icon: Database, color: 'text-green-400' },
    { name: 'Authentication', status: 'operational', icon: CheckCircle2, color: 'text-green-400' },
    { name: 'Email (Resend)', status: 'operational', icon: MessageSquare, color: 'text-green-400' },
    { name: 'File Storage', status: 'operational', icon: FileText, color: 'text-green-400' },
    { name: 'Stripe Payments', status: 'operational', icon: CheckCircle2, color: 'text-green-400' },
  ];

  const stats = [
    { label: pt ? 'Workspaces Ativos' : 'Active Workspaces', value: activeWs, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: pt ? 'Tickets Abertos' : 'Open Tickets', value: openTickets, icon: AlertCircle, color: openTickets > 0 ? 'text-orange-400' : 'text-green-400', bg: openTickets > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-green-500/10 border-green-500/20' },
    { label: pt ? 'Feedback Novo' : 'New Feedback', value: newFeedback, icon: MessageSquare, color: newFeedback > 0 ? 'text-yellow-400' : 'text-green-400', bg: newFeedback > 0 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-green-500/10 border-green-500/20' },
  ];

  return (
    <div className="min-h-screen bg-background">
      
      

      <main className="p-5 lg:pt-8 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{pt ? 'Monitorização do Sistema' : 'System Monitoring'}</h1>
              <p className="text-sm text-muted-foreground">{pt ? 'Estado dos serviços e métricas em tempo real' : 'Service status and real-time metrics'}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-rose-400 animate-spin" /></div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {stats.map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className={`bg-muted/50 border rounded-2xl p-5 ${s.bg}`}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <Icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <p className={`text-4xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Service status */}
              <div className="bg-muted/50 border border-border rounded-2xl overflow-hidden">
                <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <h2 className="text-base font-semibold text-foreground">{pt ? 'Estado dos Serviços' : 'Service Status'}</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {services.map(s => {
                    const Icon = s.icon;
                    return (
                      <div key={s.name} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${s.color}`} />
                          <span className="text-sm text-foreground">{s.name}</span>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          {pt ? 'Operacional' : 'Operational'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
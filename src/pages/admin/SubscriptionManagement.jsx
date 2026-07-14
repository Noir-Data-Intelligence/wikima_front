import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '../../components/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { CreditCard, Loader2 } from 'lucide-react';

export default function SubscriptionManagement() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const pt = language === 'pt';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['admin-subs'],
    queryFn: () => api.entities.Workspace.list('-created_date', 500)
  });

  if (user && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const planCounts = workspaces.reduce((acc, w) => {
    acc[w.plan || 'free'] = (acc[w.plan || 'free'] || 0) + 1;
    return acc;
  }, {});

  const plans = ['free', 'starter', 'growth', 'business'];
  const planColors = { free: 'text-muted-foreground', starter: 'text-blue-300', growth: 'text-orange-300', business: 'text-purple-300' };
  const planBg = { free: 'bg-white/8', starter: 'bg-blue-500/15', growth: 'bg-orange-500/15', business: 'bg-purple-500/15' };

  return (
    <div className="min-h-screen bg-background">
      
      

      <main className="p-5 lg:pt-8 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{pt ? 'Gestão de Subscrições' : 'Subscription Management'}</h1>
              <p className="text-sm text-muted-foreground">{pt ? `${workspaces.length} workspaces ativos` : `${workspaces.length} active workspaces`}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-green-400 animate-spin" /></div>
          ) : (
            <>
              {/* Plan summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {plans.map(plan => (
                  <div key={plan} className="bg-muted/50 border border-border rounded-2xl p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{plan}</p>
                    <p className={`text-3xl font-bold ${planColors[plan]}`}>{planCounts[plan] || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{pt ? 'workspaces' : 'workspaces'}</p>
                  </div>
                ))}
              </div>

              {/* Workspace list */}
              <div className="bg-muted/50 border border-border rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Workspace' : 'Workspace'}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Plano' : 'Plan'}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Tipo' : 'Type'}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Proprietário' : 'Owner'}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Estado' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workspaces.map((ws, i) => (
                      <tr key={ws.id} style={{ borderBottom: i < workspaces.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <td className="px-5 py-3.5 text-sm font-medium text-foreground">{ws.name}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planBg[ws.plan || 'free']} ${planColors[ws.plan || 'free']}`}>
                            {ws.plan || 'free'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{ws.type}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{ws.owner_email}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            ws.status === 'active' ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'
                          }`}>{ws.status || 'active'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
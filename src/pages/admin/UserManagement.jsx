import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '../../components/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Users, Search, Loader2, Shield, User } from 'lucide-react';

export default function UserManagement() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const pt = language === 'pt';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.entities.User.list('-created_date', 500)
  });

  const { data: workspaces = [] } = useQuery({
    queryKey: ['admin-workspaces'],
    queryFn: () => api.entities.Workspace.list('-created_date', 500)
  });

  if (user && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const wsMap = Object.fromEntries(workspaces.map(w => [w.owner_email, w]));

  return (
    <div className="min-h-screen bg-background">
      
      

      <main className="p-5 lg:pt-8 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{pt ? 'Gestão de Utilizadores' : 'User Management'}</h1>
              <p className="text-sm text-muted-foreground">{pt ? `${users.length} utilizadores registados` : `${users.length} registered users`}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={pt ? 'Pesquisar utilizadores…' : 'Search users…'}
              className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-white/30 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="bg-muted/50 border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Utilizador' : 'User'}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Perfil' : 'Profile'}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Workspace' : 'Workspace'}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Função' : 'Role'}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Registado' : 'Registered'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => {
                    const ws = wsMap[u.email];
                    return (
                      <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-300">
                              {u.full_name?.[0] || u.email?.[0] || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{u.full_name || '—'}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{u.user_profile || '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{ws?.name || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.role === 'admin' ? 'bg-purple-500/15 text-purple-300' : 'bg-white/8 text-muted-foreground'
                          }`}>
                            {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">
                          {u.created_date ? new Date(u.created_date).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">{pt ? 'Nenhum utilizador encontrado.' : 'No users found.'}</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
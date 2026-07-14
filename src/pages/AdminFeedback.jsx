import { useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquarePlus, Bug, Lightbulb, TrendingUp, Star,
  Filter, Download, Eye, X, Check, Loader2
} from 'lucide-react';

const CATEGORY_META = {
  bug:         { label: { pt: 'Bug', en: 'Bug' },             icon: Bug,               color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/25' },
  feature:     { label: { pt: 'Funcionalidade', en: 'Feature' }, icon: Lightbulb,        color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/25' },
  general:     { label: { pt: 'Geral', en: 'General' },        icon: MessageSquarePlus, color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/25' },
  improvement: { label: { pt: 'Melhoria', en: 'Improvement' }, icon: TrendingUp,        color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25' }
};

const STATUS_META = {
  new:        { label: { pt: 'Novo', en: 'New' },               color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  reviewed:   { label: { pt: 'Revisto', en: 'Reviewed' },       color: 'text-purple-400',  bg: 'bg-purple-500/10' },
  in_progress:{ label: { pt: 'Em análise', en: 'In Progress' }, color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  done:       { label: { pt: 'Concluído', en: 'Done' },         color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
};

function StarDisplay({ n }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= n ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
      ))}
    </div>
  );
}

export default function AdminFeedback() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const pt = language === 'pt';
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['admin-feedbacks'],
    queryFn: () => api.entities.Feedback.list('-created_date', 200)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Feedback.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-feedbacks'] })
  });

  const filtered = feedbacks.filter(f => {
    if (filterCat !== 'all' && f.category !== filterCat) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    return true;
  });

  // Summary stats
  const total = feedbacks.length;
  const avgRating = feedbacks.filter(f => f.rating).length > 0
    ? (feedbacks.filter(f => f.rating).reduce((s, f) => s + f.rating, 0) / feedbacks.filter(f => f.rating).length).toFixed(1)
    : '—';
  const byCategory = Object.fromEntries(
    Object.keys(CATEGORY_META).map(k => [k, feedbacks.filter(f => f.category === k).length])
  );

  const handleExport = () => {
    const headers = ['Date', 'Name', 'Email', 'Profile', 'Category', 'Rating', 'Status', 'Message'];
    const rows = filtered.map(f => [
      new Date(f.created_date).toLocaleDateString(),
      f.user_name || '', f.user_email || '', f.user_profile || '',
      f.category || '', f.rating || '', f.status || '',
      `"${(f.message || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'feedback.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const openDetail = (f) => { setSelected(f); setAdminNotes(f.admin_notes || ''); };

  const saveNotes = () => {
    updateMutation.mutate({ id: selected.id, data: { admin_notes: adminNotes } });
    setSelected(prev => ({ ...prev, admin_notes: adminNotes }));
  };

  const setStatus = (id, status) => {
    updateMutation.mutate({ id, data: { status } });
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
  };

  return (
    <div className="min-h-screen bg-background">
      
      

      <main className="p-5 lg:pt-8 md:p-8">
        <div className="max-w-[1600px] mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{pt ? 'Painel de Feedback' : 'Feedback Dashboard'}</h1>
              <p className="text-sm text-muted-foreground">{pt ? 'Gerir e analisar o feedback dos utilizadores' : 'Manage and analyse user feedback'}</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white/4 text-muted-foreground hover:text-foreground hover:bg-white/8 text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              {pt ? 'Exportar CSV' : 'Export CSV'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-foreground">{total}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{pt ? 'Total' : 'Total'}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{avgRating}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{pt ? 'Avaliação Média' : 'Avg Rating'}</p>
            </div>
            {Object.entries(byCategory).slice(0,2).map(([k, v]) => {
              const m = CATEGORY_META[k];
              return (
                <div key={k} className={`rounded-xl border ${m.bg} px-4 py-3 text-center`}>
                  <p className={`text-2xl font-bold ${m.color}`}>{v}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.label[pt ? 'pt' : 'en']}</p>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="bg-muted/50 border border-border text-muted-foreground text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-orange-400/40"
            >
              <option value="all">{pt ? 'Todas as categorias' : 'All categories'}</option>
              {Object.entries(CATEGORY_META).map(([k,m]) => (
                <option key={k} value={k}>{m.label[pt ? 'pt' : 'en']}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-muted/50 border border-border text-muted-foreground text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-orange-400/40"
            >
              <option value="all">{pt ? 'Todos os estados' : 'All statuses'}</option>
              {Object.entries(STATUS_META).map(([k,m]) => (
                <option key={k} value={k}>{m.label[pt ? 'pt' : 'en']}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground ml-2">{filtered.length} {pt ? 'resultados' : 'results'}</span>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquarePlus className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>{pt ? 'Nenhum feedback encontrado.' : 'No feedback found.'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(f => {
                const cat = CATEGORY_META[f.category] || CATEGORY_META.general;
                const st = STATUS_META[f.status] || STATUS_META.new;
                const CatIcon = cat.icon;
                return (
                  <div
                    key={f.id}
                    className="rounded-xl border border-white/6 bg-background px-4 py-3.5 flex items-start gap-3 hover:border-white/12 transition-colors cursor-pointer group"
                    onClick={() => openDetail(f)}
                  >
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${cat.bg}`}>
                      <CatIcon className={`w-4 h-4 ${cat.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>
                          {cat.label[pt ? 'pt' : 'en']}
                        </span>
                        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                          {st.label[pt ? 'pt' : 'en']}
                        </span>
                        {f.rating && <StarDisplay n={f.rating} />}
                      </div>
                      <p className="text-sm text-foreground/85 mt-1.5 line-clamp-2 leading-relaxed">{f.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {f.user_name || f.user_email || 'Anonymous'} · {new Date(f.created_date).toLocaleDateString(pt ? 'pt-PT' : 'en-GB')}
                      </p>
                    </div>
                    <Eye className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground flex-shrink-0 mt-1 transition-colors" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Detail Drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-white/8 z-50 flex flex-col overflow-hidden">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
              <h2 className="text-base font-semibold text-foreground">{pt ? 'Detalhe do Feedback' : 'Feedback Detail'}</h2>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {/* Meta */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{pt ? 'Utilizador' : 'User'}</span>
                  <span className="text-foreground/85 font-medium">{selected.user_name || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-muted-foreground">{selected.user_email || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{pt ? 'Perfil' : 'Profile'}</span>
                  <span className="text-muted-foreground capitalize">{selected.user_profile || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{pt ? 'Data' : 'Date'}</span>
                  <span className="text-muted-foreground">{new Date(selected.created_date).toLocaleDateString(pt ? 'pt-PT' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                {selected.rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{pt ? 'Avaliação' : 'Rating'}</span>
                    <StarDisplay n={selected.rating} />
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{pt ? 'Mensagem' : 'Message'}</p>
                <div className="bg-white/4 border border-white/8 rounded-xl px-4 py-3">
                  <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{pt ? 'Estado' : 'Status'}</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_META).map(([k, m]) => (
                    <button
                      key={k}
                      onClick={() => setStatus(selected.id, k)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        selected.status === k ? `${m.bg} ${m.color} border-current` : 'bg-white/3 border-white/8 text-muted-foreground hover:bg-white/6'
                      }`}
                    >
                      {selected.status === k && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      {m.label[pt ? 'pt' : 'en']}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{pt ? 'Notas Internas' : 'Internal Notes'}</p>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={4}
                  placeholder={pt ? 'Adicionar notas internas…' : 'Add internal notes…'}
                  className="w-full rounded-xl border border-border bg-white/4 text-foreground placeholder-white/25 text-sm px-4 py-3 resize-none focus:outline-none focus:border-orange-400/40 transition-all"
                />
                <button
                  onClick={saveNotes}
                  disabled={updateMutation.isPending}
                  className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-orange-500/80 hover:bg-orange-500 transition-colors disabled:opacity-60"
                >
                  {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {pt ? 'Guardar' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
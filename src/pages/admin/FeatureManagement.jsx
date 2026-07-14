import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '../../components/LanguageContext';
import { Zap, ToggleLeft, ToggleRight } from 'lucide-react';

const FEATURES = [
  { key: 'ai_assistant',       label_pt: 'Assistente IA (WiWi)',      label_en: 'AI Assistant (WiWi)',       enabled: true,  plans: ['growth', 'business'] },
  { key: 'google_calendar',    label_pt: 'Google Calendar Sync',      label_en: 'Google Calendar Sync',      enabled: true,  plans: ['starter', 'growth', 'business'] },
  { key: 'google_sheets',      label_pt: 'Google Sheets Export',      label_en: 'Google Sheets Export',      enabled: true,  plans: ['growth', 'business'] },
  { key: 'pdf_generation',     label_pt: 'Geração de PDF',            label_en: 'PDF Generation',            enabled: true,  plans: ['starter', 'growth', 'business'] },
  { key: 'team_management',    label_pt: 'Gestão de Equipa',          label_en: 'Team Management',           enabled: true,  plans: ['business'] },
  { key: 'cash_register',      label_pt: 'Controlo de Caixa',         label_en: 'Cash Register',             enabled: true,  plans: ['growth', 'business'] },
  { key: 'bank_statements',    label_pt: 'Extratos Bancários',        label_en: 'Bank Statements',           enabled: true,  plans: ['business'] },
  { key: 'customer_support',   label_pt: 'Suporte ao Cliente',        label_en: 'Customer Support Chat',     enabled: true,  plans: ['starter', 'growth', 'business'] },
  { key: 'recurring_payments', label_pt: 'Pagamentos Recorrentes',    label_en: 'Recurring Payments',        enabled: true,  plans: ['growth', 'business'] },
  { key: 'savings_goals',      label_pt: 'Objetivos de Poupança',     label_en: 'Savings Goals',             enabled: true,  plans: ['growth', 'business'] },
];

export default function FeatureManagement() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const pt = language === 'pt';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [features, setFeatures] = useState(FEATURES);

  if (user && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const toggle = (key) => {
    setFeatures(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
  };

  const planColors = { free: 'bg-white/8 text-muted-foreground', starter: 'bg-blue-500/15 text-blue-300', growth: 'bg-orange-500/15 text-orange-300', business: 'bg-purple-500/15 text-purple-300' };

  return (
    <div className="min-h-screen bg-background">
      
      

      <main className="p-5 lg:pt-8 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{pt ? 'Gestão de Funcionalidades' : 'Feature Management'}</h1>
              <p className="text-sm text-muted-foreground">{pt ? 'Ative ou desative funcionalidades por plano' : 'Enable or disable features per plan'}</p>
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] gap-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Funcionalidade' : 'Feature'}</div>
              <div className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pt ? 'Planos' : 'Plans'}</div>
              <div className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">{pt ? 'Ativo' : 'Active'}</div>
            </div>
            {features.map((f, i) => (
              <div
                key={f.key}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-0"
                style={{ borderBottom: i < features.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
              >
                <div className="px-6 py-4 text-sm text-foreground font-medium">{pt ? f.label_pt : f.label_en}</div>
                <div className="px-6 py-4 flex gap-1 flex-wrap">
                  {f.plans.map(p => (
                    <span key={p} className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColors[p]}`}>{p}</span>
                  ))}
                </div>
                <div className="px-6 py-4 flex justify-center">
                  <button onClick={() => toggle(f.key)} className="transition-colors">
                    {f.enabled
                      ? <ToggleRight className="w-7 h-7 text-green-400" />
                      : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">{pt ? 'Alterações em tempo real em breve.' : 'Real-time changes coming soon.'}</p>
        </div>
      </main>
    </div>
  );
}
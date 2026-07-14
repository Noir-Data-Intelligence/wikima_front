import { useState } from 'react';
import { api } from '@/api/client';
import { useUserType } from '../UserTypeContext';
import { User, Briefcase, Building2, CheckCircle2, Info } from 'lucide-react';

const PROFILES = [
  {
    key: 'personal',
    icon: User,
    label_pt: 'Finanças Pessoais',
    label_en: 'Personal Finance',
    desc_pt: 'Gira o seu dinheiro pessoal, despesas, poupanças e objetivos financeiros.',
    desc_en: 'Manage your personal money, expenses, savings and financial goals.',
    color: '#6366f1'
  },
  {
    key: 'professional',
    icon: Briefcase,
    label_pt: 'Pequeno Negócio',
    label_en: 'Small Business',
    desc_pt: 'Para empreendedores e empresários que trabalham de forma independente e querem organizar clientes, tarefas, faturas e finanças.',
    desc_en: 'For entrepreneurs and business owners who work independently and want to organise clients, tasks, invoices and finances.',
    color: '#e97c3f'
  },
  {
    key: 'company',
    icon: Building2,
    label_pt: 'Empresa / Organização',
    label_en: 'Company / Organisation',
    desc_pt: 'Para empresas, organizações e equipas com vários colaboradores.',
    desc_en: 'For businesses, organizations and teams with multiple collaborators.',
    color: '#22c55e'
  }
];

export default function ProfileSettingsCard({ language = 'pt', onSaved }) {
  const pt = language === 'pt';
  const { userProfile, isLegacyUser, refreshProfile } = useUserType();
  const [selected, setSelected] = useState(userProfile || 'company');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.auth.updateMe({
        user_profile: selected,
        profile_explicitly_set: true,
        is_legacy_user: false // once they explicitly choose, they're no longer legacy
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (onSaved) onSaved(selected);
    } catch (e) {
      console.error('Profile save error:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-muted/50 border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 className="text-base font-semibold text-foreground">
          {pt ? 'Perfil de Utilização' : 'Usage Profile'}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {pt
            ? 'Personaliza os menus e recomendações. Não remove funcionalidades existentes.'
            : 'Personalises menus and recommendations. Does not remove existing features.'}
        </p>
      </div>

      {/* Legacy user notice */}
      {isLegacyUser && (
        <div className="mx-6 mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pt
              ? 'A sua conta existia antes do sistema de perfis. Continua a ter acesso a todas as funcionalidades. Selecione um perfil apenas se desejar personalizar a navegação.'
              : 'Your account existed before the profile system. You retain full access to all features. Select a profile only if you wish to personalise the navigation.'}
          </p>
        </div>
      )}

      {/* Profile options */}
      <div className="p-6 space-y-3">
        {PROFILES.map(p => {
          const Icon = p.icon;
          const isActive = selected === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setSelected(p.key)}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all text-left"
              style={{
                backgroundColor: isActive ? `${p.color}15` : 'rgba(255,255,255,0.03)',
                borderColor: isActive ? `${p.color}40` : 'rgba(255,255,255,0.08)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${p.color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: p.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{pt ? p.label_pt : p.label_en}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pt ? p.desc_pt : p.desc_en}</p>
              </div>
              {isActive && <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: p.color }} />}
            </button>
          );
        })}
      </div>

      {/* Save button */}
      <div className="px-6 pb-6">
        <button
          onClick={handleSave}
          disabled={saving || selected === userProfile}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
          style={{ backgroundColor: '#e97c3f', color: '#fff' }}
        >
          {saving
            ? (pt ? 'A guardar…' : 'Saving…')
            : saved
              ? (pt ? '✓ Guardado' : '✓ Saved')
              : (pt ? 'Guardar Perfil' : 'Save Profile')}
        </button>
      </div>
    </div>
  );
}
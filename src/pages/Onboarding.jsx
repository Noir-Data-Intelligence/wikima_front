import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../components/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { api } from '@/api/client';
import { getRecommendedModules } from '@/lib/sectorModules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle, ArrowRight, Building2, Wallet, Briefcase, ArrowLeft, Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/brand/Logo';
import { FullPageSpinner } from '@/components/brand/BrandSpinner';
import CountryCurrencySelector from '../components/CountryCurrencySelector';

// ─── Translation strings ────────────────────────────────────────────────────
const T = {
  welcome_title:    { pt: 'Bem-vindo ao WiKima', en: 'Welcome to WiKima' },
  welcome_sub:      { pt: 'Vamos configurar o seu espaço em menos de 1 minuto.', en: "Let's set up your workspace in under 1 minute." },
  get_started:      { pt: 'Começar', en: 'Get started' },
  choose_profile:   { pt: 'Como vai usar o WiKima?', en: 'How will you use WiKima?' },
  choose_activity:  { pt: 'Qual destas opções melhor descreve a sua atividade?', en: 'What best describes your activity?' },
  org_details:      { pt: 'Detalhes da organização', en: 'Organization details' },
  org_sub:          { pt: 'Pode alterar estes dados mais tarde nas definições.', en: 'You can update this later in settings.' },
  company_name:     { pt: 'Nome da empresa / organização', en: 'Company / organization name' },
  company_name_ph:  { pt: 'ex: WiKima Lda', en: 'e.g. Acme Corp' },
  business_type:    { pt: 'Tipo de negócio', en: 'Business Type' },
  business_sector:  { pt: 'Setor de atividade', en: 'Business Sector' },
  your_role:        { pt: 'O seu papel na organização', en: 'Your role in the organisation' },
  team_size:        { pt: 'Dimensão da equipa', en: 'Team Size' },
  logo_label:       { pt: 'Logótipo da empresa (opcional)', en: 'Company Logo (optional)' },
  logo_hint:        { pt: 'Carregue o logótipo da sua empresa. Pode alterar mais tarde.', en: 'Upload your company logo. You can change it later.' },
  logo_upload:      { pt: 'Clique para carregar imagem', en: 'Click to upload image' },
  select:           { pt: 'Selecionar...', en: 'Select...' },
  location:         { pt: 'Localização e moeda', en: 'Location & currency' },
  location_sub:     { pt: 'Usado para faturas e relatórios financeiros.', en: 'Used for invoices and financial reports.' },
  all_set:          { pt: 'Tudo pronto!', en: 'All set!' },
  all_set_sub:      { pt: 'O seu espaço de trabalho está configurado. Pronto para começar.', en: 'Your workspace is configured. Ready to go.' },
  go_dashboard:     { pt: 'Ir para o Dashboard', en: 'Go to Dashboard' },
  setting_up:       { pt: 'A configurar...', en: 'Setting up...' },
  back:             { pt: 'Voltar', en: 'Back' },
  continue:         { pt: 'Continuar', en: 'Continue' },
};

const t = (key, lang) => T[key]?.[lang] ?? T[key]?.en ?? key;

// ─── Profile options ─────────────────────────────────────────────────────────
const PROFILES = [
  {
    id: 'personal',
    icon: Wallet,
    label:   { pt: 'Finanças Pessoais', en: 'Personal Finance' },
    desc:    { pt: 'Gira o seu dinheiro pessoal, despesas, poupanças e objetivos financeiros.', en: 'Manage your personal money, expenses, savings and financial goals.' }
  },
  {
    id: 'professional',
    icon: Briefcase,
    label:   { pt: 'Pequeno Negócio', en: 'Small Business' },
    desc:    { pt: 'Para empreendedores e empresários que trabalham de forma independente e querem organizar clientes, tarefas, faturas e finanças.', en: 'For entrepreneurs and business owners who work independently and want to organise clients, tasks, invoices and finances.' }
  },
  {
    id: 'company',
    icon: Building2,
    label:   { pt: 'Empresa / Organização', en: 'Company / Organisation' },
    desc:    { pt: 'Para empresas, organizações e equipas com vários colaboradores.', en: 'For businesses, organizations and teams with multiple collaborators.' }
  }
];

const ACTIVITY_TYPES = [
  { id: 'consultant',       pt: 'Consultor',               en: 'Consultant' },
  { id: 'coach',            pt: 'Coach',                   en: 'Coach' },
  { id: 'therapist',        pt: 'Terapeuta',               en: 'Therapist' },
  { id: 'trainer',          pt: 'Formador',                en: 'Trainer' },
  { id: 'virtual_assistant',pt: 'Assistente Virtual',      en: 'Virtual Assistant' },
  { id: 'freelancer',       pt: 'Freelancer',              en: 'Freelancer' },
  { id: 'small_business',   pt: 'Pequeno Empresário',      en: 'Small Business Owner' },
  { id: 'other',            pt: 'Outro',                   en: 'Other' }
];

// ─── Steps per profile ───────────────────────────────────────────────────────
// personal:      0(welcome) → 1(profile) → 2(location) → 3(done)
// professional:  0(welcome) → 1(profile) → 2(activity) → 3(location) → 4(done)
// company:       0(welcome) → 1(profile) → 2(org-details) → 3(location) → 4(done)

const selectableCls = (selected) =>
  cn(
    'w-full rounded-xl border-2 text-left transition-all',
    selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40',
  );

export default function Onboarding() {
  const lang = useLanguage().language;
  const pt = lang === 'pt';
  const { setOnboardingCompleted } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    profile: '', activityType: '', companyName: '', companyType: '', businessSector: '',
    userRole: '', teamSize: '', logoUrl: '', country: '', currency: 'EUR',
  });
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    api.auth.me().then(user => {
      if (user?.onboarding_completed) {
        navigate('/dashboard', { replace: true });
      } else {
        setLoading(false);
      }
    }).catch(() => {
      api.auth.redirectToLogin('/onboarding');
    });
  }, []);

  const getLastStep = () => (formData.profile === 'personal' ? 3 : 4);

  const getProgress = () => {
    if (step === 0 || step === getLastStep()) return null;
    const max = getLastStep() - 1;
    return Math.round(((step - 1) / max) * 100);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setFormData(f => ({ ...f, logoUrl: file_url }));
    } catch (err) {
      console.error('Logo upload error:', err);
    } finally {
      setLogoUploading(false);
    }
  };

  const canAdvance = () => {
    if (step === 1) return !!formData.profile;
    if (step === 2 && formData.profile === 'professional') return !!formData.activityType;
    if (step === 2 && formData.profile === 'company') return !!formData.companyName && !!formData.companyType && !!formData.businessSector && !!formData.userRole && !!formData.teamSize;
    return true;
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleFinish = async () => {
    setSaving(true);
    try {
      const user = await api.auth.me();
      const isCompany = formData.profile === 'company';

      const workspaceName = isCompany
        ? (formData.companyName || (pt ? 'A minha empresa' : 'My Company'))
        : (user.full_name ? `${user.full_name}'s Workspace` : (pt ? 'O meu espaço' : 'My Workspace'));

      // Backend contract (POST /workspace): { name, type: 'personal' | 'business',
      // logo_url, settings }. The owner membership is created automatically by the
      // backend — creating it here would be rejected (owner rows are immutable).
      // Everything base44 kept as loose workspace fields now lives inside `settings`.
      const workspace = await api.entities.Workspace.create({
        name: workspaceName,
        type: isCompany ? 'business' : 'personal',
        logo_url: formData.logoUrl || undefined,
        settings: {
          currency: formData.currency,
          timezone: 'Europe/Lisbon',
          language: lang,
          country: formData.country || null,
          company_info: isCompany ? {
            company_name: formData.companyName,
            entity_type: formData.companyType,
            business_sector: formData.businessSector,
            team_size: formData.teamSize,
            logo_url: formData.logoUrl,
            recommended_modules: getRecommendedModules(formData.businessSector),
          } : null,
          onboarding: {
            profile: formData.profile,
            activity_type: formData.activityType || null,
            user_role: formData.userRole || null,
            team_size: formData.teamSize || null,
            business_sector: formData.businessSector || null,
          },
        },
      });

      // OnboardingData is an M3 backend resource — best-effort until it exists.
      try {
        await api.entities.OnboardingData.create({
          workspace_id: workspace.id,
          user_type: formData.profile,
          completed: true,
        });
      } catch {
        /* resource not available yet */
      }

      // Only fields the backend persists on PUT /auth/me (unknown fields are dropped).
      await api.auth.updateMe({
        current_workspace_id: workspace.id,
        default_workspace_id: workspace.id,
        onboarding_completed: true,
        currency: formData.currency,
        user_profile: formData.profile,
      });

      setOnboardingCompleted(true);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Onboarding error:', error);
      setSaving(false);
    }
  };

  if (loading) return <FullPageSpinner />;

  const progress = getProgress();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Brand backdrop */}
      <img src="/media/auth-bg.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(150deg, hsl(233 45% 9% / 0.94), hsl(236 55% 15% / 0.9))' }} />

      <Card className="relative z-10 w-full max-w-lg border-border/60 bg-card/95 p-8 shadow-2xl backdrop-blur">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Logo className="h-9" />
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step + formData.profile}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            {/* STEP 0: WELCOME */}
            {step === 0 && (
              <div className="space-y-6 text-center">
                <h1 className="font-display text-3xl font-bold text-foreground">{t('welcome_title', lang)}</h1>
                <p className="text-muted-foreground">{t('welcome_sub', lang)}</p>
                <Button onClick={() => setStep(1)} size="lg">
                  {t('get_started', lang)} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* STEP 1: CHOOSE PROFILE */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-center font-display text-2xl font-bold text-foreground">{t('choose_profile', lang)}</h2>
                <div className="space-y-3">
                  {PROFILES.map(profile => {
                    const Icon = profile.icon;
                    const selected = formData.profile === profile.id;
                    return (
                      <button key={profile.id} onClick={() => setFormData(f => ({ ...f, profile: profile.id }))} className={cn(selectableCls(selected), 'p-5')}>
                        <div className="flex items-start gap-4">
                          <Icon className={cn('mt-0.5 h-6 w-6 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">{profile.label[pt ? 'pt' : 'en']}</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{profile.desc[pt ? 'pt' : 'en']}</p>
                          </div>
                          {selected && <CheckCircle className="h-5 w-5 shrink-0 text-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2 (professional): ACTIVITY TYPE */}
            {step === 2 && formData.profile === 'professional' && (
              <div className="space-y-5">
                <h2 className="text-center font-display text-2xl font-bold text-foreground">{t('choose_activity', lang)}</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {ACTIVITY_TYPES.map(act => {
                    const selected = formData.activityType === act.id;
                    return (
                      <button key={act.id} onClick={() => setFormData(f => ({ ...f, activityType: act.id }))} className={cn(selectableCls(selected), 'p-3 text-center')}>
                        <span className={cn('text-sm font-medium', selected ? 'text-primary' : 'text-foreground')}>{pt ? act.pt : act.en}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2 (company): ORG DETAILS */}
            {step === 2 && formData.profile === 'company' && (
              <div className="space-y-5">
                <div className="space-y-1 text-center">
                  <h2 className="font-display text-2xl font-bold text-foreground">{t('org_details', lang)}</h2>
                  <p className="text-sm text-muted-foreground">{t('org_sub', lang)}</p>
                </div>
                <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t('company_name', lang)}</label>
                    <Input value={formData.companyName} onChange={e => setFormData(f => ({ ...f, companyName: e.target.value }))} placeholder={t('company_name_ph', lang)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t('business_type', lang)}</label>
                    <Select value={formData.companyType} onValueChange={v => setFormData(f => ({ ...f, companyType: v }))}>
                      <SelectTrigger><SelectValue placeholder={t('select', lang)} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="micro_business">{pt ? 'Micro Empresa' : 'Micro Business'}</SelectItem>
                        <SelectItem value="small_business">{pt ? 'Pequena Empresa' : 'Small Business'}</SelectItem>
                        <SelectItem value="company">{pt ? 'Empresa' : 'Company'}</SelectItem>
                        <SelectItem value="association">{pt ? 'Associação / ONG' : 'Association / NGO'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t('business_sector', lang)}</label>
                    <Select value={formData.businessSector} onValueChange={v => setFormData(f => ({ ...f, businessSector: v }))}>
                      <SelectTrigger><SelectValue placeholder={t('select', lang)} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="construction">{pt ? 'Construção' : 'Construction'}</SelectItem>
                        <SelectItem value="retail">{pt ? 'Comércio / Retalho' : 'Retail'}</SelectItem>
                        <SelectItem value="beauty">{pt ? 'Beleza & Bem-estar' : 'Beauty & Wellness'}</SelectItem>
                        <SelectItem value="restaurant">{pt ? 'Restauração & Hotelaria' : 'Restaurant & Hospitality'}</SelectItem>
                        <SelectItem value="healthcare">{pt ? 'Saúde' : 'Healthcare'}</SelectItem>
                        <SelectItem value="consulting">{pt ? 'Consultoria' : 'Consulting'}</SelectItem>
                        <SelectItem value="education">{pt ? 'Educação & Formação' : 'Education'}</SelectItem>
                        <SelectItem value="real_estate">{pt ? 'Imobiliário' : 'Real Estate'}</SelectItem>
                        <SelectItem value="logistics">{pt ? 'Logística & Transportes' : 'Logistics'}</SelectItem>
                        <SelectItem value="marketing">{pt ? 'Marketing & Comunicação' : 'Marketing'}</SelectItem>
                        <SelectItem value="accounting">{pt ? 'Contabilidade & Finanças' : 'Accounting'}</SelectItem>
                        <SelectItem value="legal">{pt ? 'Serviços Jurídicos' : 'Legal Services'}</SelectItem>
                        <SelectItem value="technology">{pt ? 'Tecnologia' : 'Technology'}</SelectItem>
                        <SelectItem value="other">{pt ? 'Outro' : 'Other'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t('your_role', lang)}</label>
                    <Select value={formData.userRole} onValueChange={v => setFormData(f => ({ ...f, userRole: v }))}>
                      <SelectTrigger><SelectValue placeholder={t('select', lang)} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="founder">{pt ? 'Fundador / Proprietário' : 'Founder / Owner'}</SelectItem>
                        <SelectItem value="director">{pt ? 'Diretor / Gestor' : 'Director / Manager'}</SelectItem>
                        <SelectItem value="team_leader">{pt ? 'Líder de Equipa' : 'Team Leader'}</SelectItem>
                        <SelectItem value="employee">{pt ? 'Colaborador' : 'Employee'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t('team_size', lang)}</label>
                    <Select value={formData.teamSize} onValueChange={v => setFormData(f => ({ ...f, teamSize: v }))}>
                      <SelectTrigger><SelectValue placeholder={t('select', lang)} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="just_me">{pt ? 'Só eu' : 'Just me'}</SelectItem>
                        <SelectItem value="2_5">{pt ? '2 a 5 colaboradores' : '2–5 employees'}</SelectItem>
                        <SelectItem value="6_10">{pt ? '6 a 10 colaboradores' : '6–10 employees'}</SelectItem>
                        <SelectItem value="11_25">{pt ? '11 a 25 colaboradores' : '11–25 employees'}</SelectItem>
                        <SelectItem value="26_50">{pt ? '26 a 50 colaboradores' : '26–50 employees'}</SelectItem>
                        <SelectItem value="50_plus">{pt ? 'Mais de 50' : '50+'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">{t('logo_label', lang)}</label>
                    <p className="mb-2 text-xs text-muted-foreground">{t('logo_hint', lang)}</p>
                    <label className={cn('flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-3 transition-colors', formData.logoUrl ? 'border-primary' : 'border-border')}>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                      {formData.logoUrl ? (
                        <>
                          <img src={formData.logoUrl} alt="logo" className="h-10 w-10 rounded object-contain" />
                          <span className="text-sm text-success">{pt ? 'Logótipo carregado ✓' : 'Logo uploaded ✓'}</span>
                        </>
                      ) : (
                        <>
                          {logoUploading
                            ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                            : <Upload className="h-5 w-5 text-muted-foreground" />}
                          <span className="text-sm text-muted-foreground">{logoUploading ? (pt ? 'A carregar...' : 'Uploading...') : t('logo_upload', lang)}</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* LOCATION */}
            {((step === 2 && formData.profile === 'personal') || step === 3) && (
              <div className="space-y-5">
                <div className="space-y-1 text-center">
                  <h2 className="font-display text-2xl font-bold text-foreground">{t('location', lang)}</h2>
                  <p className="text-sm text-muted-foreground">{t('location_sub', lang)}</p>
                </div>
                <CountryCurrencySelector
                  country={formData.country}
                  currency={formData.currency}
                  onCountryChange={country => setFormData(f => ({ ...f, country }))}
                  onCurrencyChange={currency => setFormData(f => ({ ...f, currency }))}
                  showCurrencyOverride={true}
                />
              </div>
            )}

            {/* LAST STEP: ALL SET */}
            {step === getLastStep() && (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">{t('all_set', lang)}</h2>
                <p className="text-muted-foreground">{t('all_set_sub', lang)}</p>
                <Button onClick={handleFinish} disabled={saving} className="w-full" size="lg">
                  {saving ? t('setting_up', lang) : t('go_dashboard', lang)}
                  {!saving && <ArrowRight className="h-5 w-5" />}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step > 0 && step < getLastStep() && (
          <div className="mt-8 flex justify-between border-t border-border pt-6">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" /> {t('back', lang)}
            </Button>
            <Button onClick={handleNext} disabled={!canAdvance()}>
              {t('continue', lang)} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

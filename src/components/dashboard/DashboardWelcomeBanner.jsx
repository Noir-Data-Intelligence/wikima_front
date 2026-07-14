import { Wallet, Briefcase, Building2 } from 'lucide-react';

const PROFILE_CONFIG = {
  personal: {
    icon: Wallet,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    message: {
      pt: 'Bem-vindo ao seu espaço de finanças pessoais.',
      en: 'Welcome to your personal finance space.'
    },
    accent: '#10b981'
  },
  professional: {
    icon: Briefcase,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10 border-orange-500/20',
    message: {
      pt: 'Bem-vindo ao seu espaço de trabalho.',
      en: 'Welcome to your business workspace.'
    },
    accent: '#e97c3f'
  },
  company: {
    icon: Building2,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    message: {
      pt: 'Bem-vindo ao espaço de gestão da sua empresa.',
      en: 'Welcome to your company management workspace.'
    },
    accent: '#60a5fa'
  }
};

export default function DashboardWelcomeBanner({ userProfile, language, userName }) {
  const config = PROFILE_CONFIG[userProfile] || PROFILE_CONFIG.professional;
  const Icon = config.icon;
  const pt = language === 'pt';
  const firstName = userName?.split(' ')[0] || '';

  return (
    <div
      className="rounded-xl border px-4 py-3 mb-5 flex items-center gap-3"
      style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
      </div>
      <p className="text-sm text-muted-foreground">
        {config.message[pt ? 'pt' : 'en']}
        {firstName && (
          <span className="text-foreground/90 font-medium"> {firstName}!</span>
        )}
      </p>
    </div>
  );
}
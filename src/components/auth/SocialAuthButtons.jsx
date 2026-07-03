import { useTranslation } from 'react-i18next';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import GoogleIcon from '@/components/GoogleIcon';

function MicrosoftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

/** Google + Microsoft OAuth buttons. `next` = where to land after login. */
export default function SocialAuthButtons({ next = '/dashboard' }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" className="h-11 w-full" onClick={() => api.auth.loginWithProvider('google', next)}>
        <GoogleIcon className="h-5 w-5" />
        {t('auth_continue_google', 'Continue with Google')}
      </Button>
      <Button type="button" variant="outline" className="h-11 w-full" onClick={() => api.auth.loginWithProvider('microsoft', next)}>
        <MicrosoftIcon className="h-5 w-5" />
        {t('auth_continue_microsoft', 'Continue with Microsoft')}
      </Button>
    </div>
  );
}

/** "or" divider. */
export function OrDivider() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase text-muted-foreground">{t('common_or', 'or')}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

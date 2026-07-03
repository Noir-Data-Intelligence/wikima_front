import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '@/components/brand/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

/**
 * Split-screen auth layout.
 *  - Left: brand panel — full-bleed photo with a navy gradient overlay, logo and
 *    tagline (hidden on mobile).
 *  - Right: card with optional icon, title, subtitle, content and footer.
 * API kept compatible (icon/title/subtitle/footer/children).
 */
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  const { t } = useTranslation();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden lg:block">
        {/* Background photo */}
        <img
          src="/media/auth-bg.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Navy brand overlay for legibility */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(150deg, hsl(233 45% 9% / 0.92) 0%, hsl(236 55% 16% / 0.86) 55%, hsl(233 45% 10% / 0.94) 100%)' }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link to="/">
            <Logo variant="horizontal" className="h-9" />
          </Link>

          <div className="max-w-md">
            <h2 className="font-display text-4xl font-bold leading-tight text-white">
              {t('auth_brand_title', 'Your business, simplified.')}
            </h2>
            <p className="mt-4 text-lg text-white/70">
              {t('auth_brand_subtitle', 'Tasks, clients, documents and finances — clear and organized, in one place.')}
            </p>
          </div>

          <p className="text-sm text-white/60">© {new Date().getFullYear()} WiKima</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col items-center justify-center bg-background px-4 py-10 sm:px-6">
        <div className="absolute right-4 top-4 flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo variant="horizontal" className="h-9" />
          </div>

          <div className="mb-8 text-center">
            {Icon && (
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-7 w-7" aria-hidden="true" />
              </div>
            )}
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          </div>

          {children}

          {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
        </div>
      </div>
    </div>
  );
}

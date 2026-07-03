import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';

const NAV = [
  { to: '/', tKey: 'public_nav_home', fallback: 'Home', end: true },
  { to: '/about', tKey: 'public_nav_about', fallback: 'About' },
  { to: '/features', tKey: 'public_nav_features', fallback: 'Features' },
  { to: '/plans', tKey: 'public_nav_plans', fallback: 'Plans' },
];

export default function PublicLayout({ children }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="WiKima home">
            <Logo className="h-8" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                {t(item.tKey, item.fallback)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/login">{t('auth_login_cta', 'Log in')}</Link>
            </Button>
            <Button asChild>
              <Link to="/register">{t('public_cta', 'Get started')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo className="h-7" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} WiKima — {t('public_footer_tagline', 'Your business, simplified.')}
          </p>
        </div>
      </footer>
    </div>
  );
}

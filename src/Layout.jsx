import React, { useEffect } from 'react';
import { createPageUrl } from './utils';
import { useLanguage, LanguageProvider } from './components/LanguageContext';
import { DemoModeProvider, useDemoMode } from './components/DemoModeContext';
import { WorkspaceProvider } from './components/WorkspaceContext';
import { UserTypeProvider } from './components/UserTypeContext';
import { TierProvider } from './components/TierContext';
import DemoModeBanner from './components/DemoModeBanner';
import { api } from '@/api/client';




// --- Global greeting function (evita ReferenceError) ---
window.getGreeting = function(name = '') {
  try {
    const hour = new Date().getHours();
    const part = hour < 12
      ? 'Good morning'
      : hour < 18
        ? 'Good afternoon'
        : 'Good evening';
    return name ? `${part}, ${name}` : part;
  } catch (e) {
    return name ? `Hello, ${name}` : 'Hello';
  }
};
function LayoutContent({ children, currentPageName }) {
  const { t, language } = useLanguage();
  const { isDemoMode } = useDemoMode();
  const [authChecked, setAuthChecked] = React.useState(false);

  // Define public pages that should not show app navigation
  const publicPages = ['Landing', 'About', 'Register', 'Onboarding', 'Home', 'Features', 'Plans'];
  const isPublicPage = publicPages.includes(currentPageName);

  // CRITICAL: If currentPageName is empty or undefined, this is the root route
  // Redirect to Home page for proper routing
  useEffect(() => {
    if (!currentPageName || currentPageName === '') {
      window.location.href = createPageUrl('Home');
    }
  }, [currentPageName]);

  // Authentication guard for protected pages
  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for public pages
      if (isPublicPage) {
        setAuthChecked(true);
        return;
      }

      // For protected pages, check authentication
      try {
        const user = await api.auth.me();
        if (!user) {
          // Not authenticated - redirect to Landing
          window.location.href = createPageUrl('Landing');
          return;
        }
        setAuthChecked(true);
      } catch (error) {
        // Auth error - redirect to Landing
        window.location.href = createPageUrl('Landing');
      }
    };

    checkAuth();
  }, [currentPageName, isPublicPage]);

  // If it's a public page, just render children without any app layout
  if (isPublicPage) {
    return <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}>
      {children}
    </div>;
  }

  // Show loading state while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#e97c3f' }}></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Authenticated app pages - show with sidebar and demo mode features
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}>
      {/* Demo Mode Banner - Only show in authenticated app */}
      {isDemoMode && <DemoModeBanner />}

      {/* Main Content - Authenticated pages handle their own sidebar */}
      <main>
        {children}
      </main>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <DemoModeProvider>
        <TierProvider>
          <WorkspaceProvider>
            <UserTypeProvider>
              <LayoutContent children={children} currentPageName={currentPageName} />
            </UserTypeProvider>
          </WorkspaceProvider>
        </TierProvider>
      </DemoModeProvider>
    </LanguageProvider>
  );
}
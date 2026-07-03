import React from 'react';
import { useUserType } from './UserTypeContext';
import { useLanguage } from './LanguageContext';
import { Button } from '@/components/ui/button';
import { ShieldOff } from 'lucide-react';
import { createPageUrl } from '../utils';

/**
 * Wrap any page with this component to enforce user-type access control.
 * Usage: <AccessGuard page="Clients"> ... </AccessGuard>
 */
export default function AccessGuard({ page, children }) {
  const { canAccess, loading } = useUserType();
  const { language } = useLanguage();

  if (loading) return null;

  if (!canAccess(page)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(233,124,63,0.15)' }}>
            <ShieldOff className="w-8 h-8" style={{ color: '#e97c3f' }} />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {language === 'pt' ? 'Acesso restrito' : 'Access restricted'}
          </h2>
          <p className="text-blue-300 text-sm mb-6">
            {language === 'pt'
              ? 'Esta funcionalidade está disponível apenas para contas de Empresa ou Organização.'
              : 'This feature is only available for Company or Organization accounts.'}
          </p>
          <Button
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            style={{ backgroundColor: '#e97c3f' }}
            className="text-foreground"
          >
            {language === 'pt' ? 'Voltar ao Dashboard' : 'Back to Dashboard'}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
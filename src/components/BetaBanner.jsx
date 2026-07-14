import { AlertCircle, Lock, Info, Calendar, Zap, Link2, Users, Bot } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function BetaNotice({ message, type = 'info' }) {
  const styles = {
    info: 'bg-amber-50 border-amber-200 text-amber-800',
    locked: 'bg-gray-100 border-gray-300 text-gray-700',
    demo: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const Icon = type === 'locked' ? Lock : type === 'demo' ? Info : AlertCircle;

  return (
    <div className={`rounded-lg border p-4 mb-6 flex items-start gap-3 ${styles[type]}`}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function LockedFeatureCard({ title, icon: Icon, language }) {
  return (
    <div className="bg-gray-100 border border-gray-200 rounded-xl p-6 text-center opacity-75">
      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3 relative">
        <Icon className="w-6 h-6 text-gray-500" />
        <Lock className="w-4 h-4 text-muted-foreground absolute -bottom-1 -right-1" />
      </div>
      <h3 className="font-medium text-muted-foreground mb-2">{title}</h3>
      <p className="text-sm text-gray-500">
        {language === 'pt' 
          ? 'Esta funcionalidade estará disponível na versão completa da WiKima.'
          : 'This feature will be available in the full version of WiKima.'}
      </p>
    </div>
  );
}

export function LockedFeatureModal({ open, onClose, feature, language }) {
  const featureMessages = {
    calendar: {
      pt: 'Esta funcionalidade está bloqueada na versão Beta. Estará disponível em breve como parte da experiência completa WiKima.',
      en: 'This feature is locked in the Beta version. It will be available soon as part of the full WiKima experience.'
    },
    automations: {
      pt: 'As Automatizações estarão disponíveis na versão completa da WiKima. Esta funcionalidade está atualmente desativada na versão Beta.',
      en: 'Automations will be available in the full version of WiKima. This feature is currently disabled in the Beta version.'
    },
    integrations: {
      pt: 'As Integrações fazem parte do lançamento completo da WiKima. Estão atualmente desativadas na versão Beta.',
      en: 'Integrations are part of the full WiKima release. They are currently disabled in the Beta version.'
    },
    team: {
      pt: 'A Gestão de Equipa não está disponível na versão Beta. Esta funcionalidade será lançada na plataforma WiKima completa.',
      en: 'Team Management is not available in the Beta version. This feature will be released in the full WiKima platform.'
    },
    wiwi: {
      pt: 'Wiwi — O Seu Assistente IA estará disponível na versão completa da WiKima. Esta funcionalidade está atualmente desativada na versão Beta.',
      en: 'Wiwi — Your AI Assistant will be available in the full version of WiKima. This feature is currently disabled in the Beta version.'
    }
  };

  const featureIcons = {
    calendar: Calendar,
    automations: Zap,
    integrations: Link2,
    team: Users,
    wiwi: Bot
  };

  const Icon = featureIcons[feature] || Lock;
  const message = featureMessages[feature]?.[language] || featureMessages[feature]?.en || 'This feature will be available in the full version.';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Icon className="w-6 h-6 text-gray-500" />
            </div>
            <DialogTitle>
              {language === 'pt' ? 'Funcionalidade Bloqueada' : 'Feature Locked'}
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">{message}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
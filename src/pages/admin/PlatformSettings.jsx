import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '../../components/LanguageContext';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import MobileMenuButton from '../../components/dashboard/MobileMenuButton';
import { Settings, Globe, Bell, Shield, Zap } from 'lucide-react';

export default function PlatformSettings() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const pt = language === 'pt';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (user && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const sections = [
    {
      icon: Globe,
      color: 'blue',
      title: pt ? 'Configurações Gerais' : 'General Settings',
      items: [
        { label: pt ? 'Nome da plataforma' : 'Platform name', value: 'WiKima', type: 'text' },
        { label: pt ? 'Idioma padrão' : 'Default language', value: 'pt', type: 'select', options: ['pt', 'en'] },
        { label: pt ? 'Fuso horário' : 'Timezone', value: 'Europe/Lisbon', type: 'text' },
      ]
    },
    {
      icon: Bell,
      color: 'orange',
      title: pt ? 'Notificações' : 'Notifications',
      items: [
        { label: pt ? 'Email de suporte' : 'Support email', value: 'support@wikima.io', type: 'text' },
        { label: pt ? 'Notificações de erro' : 'Error notifications', value: true, type: 'toggle' },
        { label: pt ? 'Alertas de novo utilizador' : 'New user alerts', value: true, type: 'toggle' },
      ]
    },
    {
      icon: Shield,
      color: 'purple',
      title: pt ? 'Segurança' : 'Security',
      items: [
        { label: pt ? 'Autenticação 2FA' : '2FA Authentication', value: false, type: 'toggle' },
        { label: pt ? 'Sessão máxima (horas)' : 'Max session (hours)', value: '24', type: 'text' },
      ]
    },
  ];

  const colorMap = { blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20', orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20', purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };

  return (
    <div className="min-h-screen bg-background">
      
      

      <main className="p-5 lg:pt-8 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{pt ? 'Configurações da Plataforma' : 'Platform Settings'}</h1>
              <p className="text-sm text-muted-foreground">{pt ? 'Configurações globais do WiKima' : 'Global WiKima platform settings'}</p>
            </div>
          </div>

          <div className="space-y-6">
            {sections.map(section => {
              const Icon = section.icon;
              const cls = colorMap[section.color];
              return (
                <div key={section.title} className="bg-muted/50 border border-border rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${cls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
                  </div>
                  <div className="divide-y divide-white/5">
                    {section.items.map(item => (
                      <div key={item.label} className="flex items-center justify-between px-6 py-4">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        {item.type === 'toggle' ? (
                          <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${item.value ? 'bg-green-500' : 'bg-white/15'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white m-0.5 transition-transform ${item.value ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground bg-muted/50 border border-border rounded-lg px-3 py-1">{item.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <p className="text-center text-xs text-muted-foreground pb-4">{pt ? 'Edição de configurações em breve.' : 'Settings editing coming soon.'}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export default function DemoModeBanner() {
  const { language } = useLanguage();

  return (
    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-3 text-center">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-100 font-medium">
            {language === 'pt' 
              ? '🚀 Modo de Pré-visualização - Versão de demonstração com funcionalidades limitadas'
              : '🚀 Preview Mode - Demo version with limited features'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
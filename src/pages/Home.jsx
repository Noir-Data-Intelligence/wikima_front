import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { api } from '@/api/client';
import { useLanguage } from '../components/LanguageContext';

export default function Home() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const user = await api.auth.me();
      
      if (user) {
        // User is authenticated - check if they have a workspace
        const memberRecords = await api.entities.WorkspaceMember.filter({ 
          user_email: user.email 
        });
        
        if (memberRecords.length === 0) {
          // Has account but no workspace - go to onboarding
          navigate(createPageUrl('Onboarding'));
        } else {
          // Has account and workspace - go to dashboard
          navigate(createPageUrl('Dashboard'));
        }
      } else {
        // Not authenticated - go to landing page
        navigate(createPageUrl('Landing'));
      }
    } catch (error) {
      // Not authenticated or error - go to landing page
      navigate(createPageUrl('Landing'));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">{language === 'pt' ? 'A carregar...' : 'Loading...'}</p>
      </div>
    </div>
  );
}
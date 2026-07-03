import React from 'react';
import { useLanguage } from '../LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Building2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function BankStatementsAlert() {
  const { language } = useLanguage();

  const { data: accounts = [] } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: async () => {
      const currentUser = await api.auth.me();
      const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;
      if (!workspaceId) return [];
      return await api.entities.BankAccount.filter({ 
        workspace_id: workspaceId,
        status: 'active'
      });
    }
  });

  const { data: statements = [] } = useQuery({
    queryKey: ['bankStatements'],
    queryFn: async () => {
      const currentUser = await api.auth.me();
      const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;
      if (!workspaceId) return [];
      return await api.entities.BankStatement.filter({ workspace_id: workspaceId });
    }
  });

  const getMissingStatements = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const missing = [];
    
    accounts.forEach(account => {
      // Check only for current month
      const exists = statements.some(s => 
        s.bank_account_id === account.id && 
        s.year === currentYear && 
        s.month === currentMonth
      );
      
      if (!exists) {
        missing.push({
          account_id: account.id,
          bank_name: account.bank_name,
          account_name: account.account_name,
          month: currentMonth,
          year: currentYear
        });
      }
    });
    
    return missing;
  };

  const missingStatements = getMissingStatements();

  if (missingStatements.length === 0) return null;

  const currentMonthName = new Date().toLocaleDateString(
    language === 'pt' ? 'pt-PT' : 'en-US', 
    { month: 'long', year: 'numeric' }
  );

  return (
    <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {language === 'pt' 
                    ? 'Extractos Bancários em Falta'
                    : 'Missing Bank Statements'}
                </h3>
                <p className="text-sm text-yellow-200">
                  {missingStatements.length} {language === 'pt' ? 'extracto(s) pendente(s) para' : 'statement(s) pending for'} {currentMonthName}
                </p>
              </div>
              
              <Link to={createPageUrl('Banks')}>
                <Button 
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-foreground"
                >
                  {language === 'pt' ? 'Ver Bancos' : 'View Banks'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="space-y-2">
              {missingStatements.slice(0, 3).map((missing, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-yellow-500/20"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-yellow-400" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{missing.bank_name}</p>
                      <p className="text-xs text-yellow-300">{missing.account_name}</p>
                    </div>
                  </div>
                  <span className="text-xs text-yellow-400 font-medium">
                    {missing.month}/{missing.year}
                  </span>
                </div>
              ))}
            </div>

            {missingStatements.length > 3 && (
              <p className="text-xs text-yellow-300 mt-3">
                +{missingStatements.length - 3} {language === 'pt' ? 'mais' : 'more'}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
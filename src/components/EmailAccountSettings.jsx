import { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, RefreshCw, Trash2 } from 'lucide-react';

export default function EmailAccountSettings() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(null);

  const { data: accounts = [] } = useQuery({
    queryKey: ['emailAccounts'],
    queryFn: () => api.entities.EmailAccount.list('-created_date', 50),
    initialData: []
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.EmailAccount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['emailAccounts']);
    }
  });

  const handleConnectGmail = async () => {
    try {
      const response = await api.functions.gmailOAuth({ action: 'getAuthUrl' });
      window.open(response.authUrl, '_blank', 'width=600,height=700');
      
      // Listen for OAuth callback
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'gmail_oauth_success') {
          const result = await api.functions.gmailOAuth({
            action: 'exchangeCode',
            code: event.data.code
          });

          await api.entities.EmailAccount.create({
            provider: 'gmail',
            email_address: result.email,
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
            token_expires_at: result.expiresAt,
            sync_enabled: true,
            status: 'active'
          });

          queryClient.invalidateQueries(['emailAccounts']);
        }
      });
    } catch (error) {
      console.error('Gmail connection error:', error);
    }
  };

  const handleConnectOutlook = async () => {
    try {
      const response = await api.functions.outlookOAuth({ action: 'getAuthUrl' });
      window.open(response.authUrl, '_blank', 'width=600,height=700');
      
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'outlook_oauth_success') {
          const result = await api.functions.outlookOAuth({
            action: 'exchangeCode',
            code: event.data.code
          });

          await api.entities.EmailAccount.create({
            provider: 'outlook',
            email_address: result.email,
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
            token_expires_at: result.expiresAt,
            sync_enabled: true,
            status: 'active'
          });

          queryClient.invalidateQueries(['emailAccounts']);
        }
      });
    } catch (error) {
      console.error('Outlook connection error:', error);
    }
  };

  const handleSync = async (account) => {
    setSyncing(account.id);
    try {
      if (account.provider === 'gmail') {
        await api.functions.syncGmail({ accountId: account.id });
      } else {
        await api.functions.syncOutlook({ accountId: account.id });
      }
      queryClient.invalidateQueries(['emailAccounts']);
    } catch (error) {
      console.error('Sync error:', error);
    }
    setSyncing(null);
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    expired: 'bg-orange-100 text-orange-700',
    error: 'bg-red-100 text-red-700'
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {language === 'pt' ? 'Contas de Email' : 'Email Accounts'}
        </h3>
        <div className="flex gap-3">
          <Button onClick={handleConnectGmail} className="gap-2">
            <Mail className="w-4 h-4" />
            {language === 'pt' ? 'Conectar Gmail' : 'Connect Gmail'}
          </Button>
          <Button onClick={handleConnectOutlook} variant="outline" className="gap-2">
            <Mail className="w-4 h-4" />
            {language === 'pt' ? 'Conectar Outlook' : 'Connect Outlook'}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {accounts.map(account => (
          <Card key={account.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-gray-900">{account.email_address}</p>
                    <p className="text-xs text-gray-500 capitalize">{account.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[account.status]}>
                    {account.status}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSync(account)}
                    disabled={syncing === account.id}
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing === account.id ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(account.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
              {account.last_sync_date && (
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'pt' ? 'Última sincronização' : 'Last synced'}: {new Date(account.last_sync_date).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US')}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Mail className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>{language === 'pt' ? 'Nenhuma conta conectada' : 'No accounts connected'}</p>
        </div>
      )}
    </div>
  );
}
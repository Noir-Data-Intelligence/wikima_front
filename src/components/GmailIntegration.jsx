import { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GmailIntegration() {
  const { language } = useLanguage();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    try {
      const user = await api.auth.me();
      const accounts = await api.entities.EmailAccount.filter({
        provider: 'gmail',
        created_by: user.email
      });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Error loading Gmail account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    console.log('handleConnect called');
    setConnecting(true);
    
    try {
      console.log('Checking backend functions...', { 
        hasFunctions: !!api.functions,
        hasGmailOAuth: !!(api.functions && api.functions.gmailOAuth)
      });

      // Check if backend functions are available
      if (!api.functions || !api.functions.gmailOAuth) {
        alert('Backend functions are not enabled. Please enable them in app settings first.');
        throw new Error('Backend functions not enabled. Please enable backend functions in your app settings.');
      }

      console.log('Calling gmailOAuth function...');
      // Call backend function to get OAuth URL
      const response = await api.functions.gmailOAuth({ action: 'getAuthUrl' });
      console.log('OAuth response:', response);
      
      if (!response || response.error) {
        throw new Error(response?.error || 'Failed to get authorization URL. Please check OAuth configuration.');
      }
      
      if (!response.authUrl) {
        throw new Error('OAuth URL not received. Gmail OAuth may not be properly configured.');
      }
      
      // Open OAuth window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        response.authUrl,
        'Gmail Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow || authWindow.closed) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      // Listen for OAuth callback
      const messageHandler = async (event) => {
        // Security: Verify message origin
        if (event.origin !== window.location.origin) {
          return;
        }
        
        if (event.data.type === 'gmail-auth-callback') {
          window.removeEventListener('message', messageHandler);
          
          if (authWindow && !authWindow.closed) {
            authWindow.close();
          }
          
          if (event.data.error) {
            const errorMsg = event.data.error === 'access_denied' 
              ? 'You cancelled the Gmail authorization.' 
              : `Authorization error: ${event.data.error}`;
            throw new Error(errorMsg);
          }
          
          if (!event.data.code) {
            throw new Error('No authorization code received from Google.');
          }
          
          // Exchange code for tokens
          const tokenData = await api.functions.gmailOAuth({ 
            action: 'exchangeCode', 
            code: event.data.code 
          });
          
          if (tokenData.error) {
            throw new Error(tokenData.error);
          }
          
          if (!tokenData.email) {
            throw new Error('Failed to retrieve user email from Gmail.');
          }
          
          // Save account
          const newAccount = await api.entities.EmailAccount.create({
            provider: 'gmail',
            email_address: tokenData.email,
            access_token: tokenData.accessToken,
            refresh_token: tokenData.refreshToken,
            token_expires_at: tokenData.expiresAt,
            sync_enabled: true,
            status: 'active'
          });
          
          setAccount(newAccount);
          setConnecting(false);
          toast.success(language === 'pt' ? 'Gmail conectado! A sincronizar emails...' : 'Gmail connected! Syncing emails...');
          
          // Initial sync with delay to allow account to be saved
          setTimeout(() => handleSync(newAccount.id), 1000);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Check if popup was closed without completing auth
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          setConnecting(false);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Gmail connection error:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      toast.error(
        language === 'pt' 
          ? `Erro ao conectar Gmail: ${errorMessage}` 
          : `Error connecting Gmail: ${errorMessage}`
      );
      setConnecting(false);
    }
  };

  const handleSync = async (accountId) => {
    setSyncing(true);
    try {
      const data = await api.functions.syncGmail({ 
        accountId: accountId || account.id 
      });
      
      if (data.synced !== undefined) {
        toast.success(
          language === 'pt' 
            ? `${data.synced} emails sincronizados com clientes` 
            : `${data.synced} emails synced with clients`
        );
        loadAccount();
        
        // Refresh page to show new emails in conversations
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(
        language === 'pt' 
          ? `Erro ao sincronizar: ${error.message}` 
          : `Sync error: ${error.message}`
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(
      language === 'pt' 
        ? 'Tem certeza que deseja desconectar o Gmail?' 
        : 'Are you sure you want to disconnect Gmail?'
    )) return;

    try {
      await api.entities.EmailAccount.delete(account.id);
      setAccount(null);
      toast.success(language === 'pt' ? 'Gmail desconectado' : 'Gmail disconnected');
    } catch (error) {
      toast.error(language === 'pt' ? 'Erro ao desconectar' : 'Error disconnecting');
    }
  };

  const handleToggleSync = async () => {
    try {
      await api.entities.EmailAccount.update(account.id, {
        sync_enabled: !account.sync_enabled
      });
      setAccount({ ...account, sync_enabled: !account.sync_enabled });
      toast.success(
        language === 'pt' 
          ? (account.sync_enabled ? 'Sincronização desativada' : 'Sincronização ativada')
          : (account.sync_enabled ? 'Sync disabled' : 'Sync enabled')
      );
    } catch (error) {
      toast.error(language === 'pt' ? 'Erro' : 'Error');
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <p className="text-muted-foreground">{language === 'pt' ? 'A carregar...' : 'Loading...'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">Gmail Sync</h3>
                <Badge variant="secondary" className="text-xs">
                  {language === 'pt' ? 'Desconectado' : 'Disconnected'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {language === 'pt'
                  ? 'Conecte o Gmail para ver emails com clientes dentro das conversas da WiKima.'
                  : 'Connect Gmail to see client emails inside WiKima conversations.'}
              </p>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Connect Gmail button clicked');
                  handleConnect();
                }}
                disabled={connecting}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'pt' ? 'A conectar...' : 'Connecting...'}
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    {language === 'pt' ? 'Conectar Gmail' : 'Connect Gmail'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Mail className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">Gmail</h3>
              <Badge className="bg-green-500/20 text-green-400 text-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {language === 'pt' ? 'Conectado' : 'Connected'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{account.email_address}</p>
            {account.last_sync_date && (
              <p className="text-xs text-blue-300/70 mb-4">
                {language === 'pt' ? 'Última sincronização: ' : 'Last synced: '}
                {new Date(account.last_sync_date).toLocaleString(
                  language === 'pt' ? 'pt-PT' : 'en-US'
                )}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                onClick={() => handleSync()}
                disabled={syncing || !account.sync_enabled}
                size="sm"
                variant="outline"
                className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'pt' ? 'A sincronizar...' : 'Syncing...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {language === 'pt' ? 'Sincronizar agora' : 'Sync now'}
                  </>
                )}
              </Button>

              <Button
                onClick={handleToggleSync}
                size="sm"
                variant="outline"
                className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
              >
                {account.sync_enabled 
                  ? (language === 'pt' ? 'Pausar sync' : 'Pause sync')
                  : (language === 'pt' ? 'Ativar sync' : 'Enable sync')
                }
              </Button>

              <Button
                onClick={handleDisconnect}
                size="sm"
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                {language === 'pt' ? 'Desconectar' : 'Disconnect'}
              </Button>
            </div>

            <p className="text-xs text-blue-300/60 mt-4 leading-relaxed">
              {language === 'pt'
                ? 'Os emails aparecem automaticamente nas conversas com clientes quando o endereço de email corresponde.'
                : 'Emails appear automatically in client conversations when the email address matches.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
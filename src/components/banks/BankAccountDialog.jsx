import { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { api } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function BankAccountDialog({ open, onClose, account, onSuccess }) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    currency: 'AOA',
    branch_name: '',
    branch_address: '',
    account_manager_name: '',
    account_manager_phone: '',
    account_manager_email: '',
    reminder_enabled: true,
    reminder_day: 5,
    reminder_channels: ['in_app', 'email'],
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    if (account) {
      setFormData({
        bank_name: account.bank_name || '',
        account_name: account.account_name || '',
        account_number: account.account_number || '',
        currency: account.currency || 'AOA',
        branch_name: account.branch_name || '',
        branch_address: account.branch_address || '',
        account_manager_name: account.account_manager_name || '',
        account_manager_phone: account.account_manager_phone || '',
        account_manager_email: account.account_manager_email || '',
        reminder_enabled: account.reminder_enabled !== false,
        reminder_day: account.reminder_day || 5,
        reminder_channels: account.reminder_channels || ['in_app', 'email'],
        status: account.status || 'active',
        notes: account.notes || ''
      });
    }
  }, [account]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const currentUser = await api.auth.me();
      const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;

      const data = { ...formData, workspace_id: workspaceId };

      if (account) {
        await api.entities.BankAccount.update(account.id, data);
        toast.success(language === 'pt' ? 'Conta atualizada!' : 'Account updated!');
      } else {
        await api.entities.BankAccount.create(data);
        toast.success(language === 'pt' ? 'Conta criada!' : 'Account created!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(language === 'pt' ? 'Erro ao guardar' : 'Error saving');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">
            {account 
              ? (language === 'pt' ? 'Editar Conta Bancária' : 'Edit Bank Account')
              : (language === 'pt' ? 'Nova Conta Bancária' : 'New Bank Account')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{language === 'pt' ? 'Informações Básicas' : 'Basic Information'}</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">{language === 'pt' ? 'Banco *' : 'Bank *'}</Label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                  placeholder={language === 'pt' ? 'Ex: Banco BIC' : 'e.g. BIC Bank'}
                  required
                  className="mt-1.5 bg-background border-border text-foreground"
                />
              </div>

              <div>
                <Label className="text-muted-foreground">{language === 'pt' ? 'Nome da Conta *' : 'Account Name *'}</Label>
                <Input
                  value={formData.account_name}
                  onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                  placeholder={language === 'pt' ? 'Ex: Conta Corrente Principal' : 'e.g. Main Current Account'}
                  required
                  className="mt-1.5 bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">{language === 'pt' ? 'Número da Conta / IBAN *' : 'Account Number / IBAN *'}</Label>
                <Input
                  value={formData.account_number}
                  onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                  placeholder="AO06..."
                  required
                  className="mt-1.5 bg-background border-border text-foreground font-mono"
                />
              </div>

              <div>
                <Label className="text-muted-foreground">{language === 'pt' ? 'Moeda *' : 'Currency *'}</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                  <SelectTrigger className="mt-1.5 bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AOA">🇦🇴 Kwanza (Kz)</SelectItem>
                    <SelectItem value="EUR">🇪🇺 Euro (€)</SelectItem>
                    <SelectItem value="USD">🇺🇸 Dollar ($)</SelectItem>
                    <SelectItem value="BRL">🇧🇷 Real (R$)</SelectItem>
                    <SelectItem value="GBP">🇬🇧 Pound (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Branch Info */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground">{language === 'pt' ? 'Agência/Balcão' : 'Branch'}</h3>
            
            <div>
              <Label className="text-muted-foreground">{language === 'pt' ? 'Nome da Agência' : 'Branch Name'}</Label>
              <Input
                value={formData.branch_name}
                onChange={(e) => setFormData({...formData, branch_name: e.target.value})}
                placeholder={language === 'pt' ? 'Ex: Agência Central' : 'e.g. Central Branch'}
                className="mt-1.5 bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label className="text-muted-foreground">{language === 'pt' ? 'Morada da Agência' : 'Branch Address'}</Label>
              <Textarea
                value={formData.branch_address}
                onChange={(e) => setFormData({...formData, branch_address: e.target.value})}
                placeholder={language === 'pt' ? 'Morada completa...' : 'Full address...'}
                rows={2}
                className="mt-1.5 bg-background border-border text-foreground"
              />
            </div>
          </div>

          {/* Account Manager */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground">{language === 'pt' ? 'Gestor de Conta' : 'Account Manager'}</h3>
            
            <div>
              <Label className="text-muted-foreground">{language === 'pt' ? 'Nome' : 'Name'}</Label>
              <Input
                value={formData.account_manager_name}
                onChange={(e) => setFormData({...formData, account_manager_name: e.target.value})}
                placeholder={language === 'pt' ? 'Nome completo' : 'Full name'}
                className="mt-1.5 bg-background border-border text-foreground"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">{language === 'pt' ? 'Telefone' : 'Phone'}</Label>
                <Input
                  value={formData.account_manager_phone}
                  onChange={(e) => setFormData({...formData, account_manager_phone: e.target.value})}
                  placeholder="+244..."
                  className="mt-1.5 bg-background border-border text-foreground"
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={formData.account_manager_email}
                  onChange={(e) => setFormData({...formData, account_manager_email: e.target.value})}
                  placeholder="email@bank.com"
                  className="mt-1.5 bg-background border-border text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Reminders */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground">{language === 'pt' ? 'Lembretes Mensais' : 'Monthly Reminders'}</h3>
            
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.reminder_enabled}
                onCheckedChange={(checked) => setFormData({...formData, reminder_enabled: checked})}
              />
              <Label className="text-muted-foreground cursor-pointer">
                {language === 'pt' ? 'Ativar lembretes para carregar extracto mensal' : 'Enable reminders to upload monthly statement'}
              </Label>
            </div>

            {formData.reminder_enabled && (
              <>
                <div>
                  <Label className="text-muted-foreground">{language === 'pt' ? 'Dia do lembrete (1-28)' : 'Reminder day (1-28)'}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="28"
                    value={formData.reminder_day}
                    onChange={(e) => setFormData({...formData, reminder_day: parseInt(e.target.value) || 5})}
                    className="mt-1.5 bg-background border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">{language === 'pt' ? 'Canais de notificação' : 'Notification channels'}</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.reminder_channels.includes('in_app')}
                        onCheckedChange={(checked) => {
                          const channels = checked 
                            ? [...formData.reminder_channels, 'in_app']
                            : formData.reminder_channels.filter(c => c !== 'in_app');
                          setFormData({...formData, reminder_channels: channels});
                        }}
                      />
                      <Label className="text-muted-foreground">{language === 'pt' ? 'Na App' : 'In-App'}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.reminder_channels.includes('email')}
                        onCheckedChange={(checked) => {
                          const channels = checked 
                            ? [...formData.reminder_channels, 'email']
                            : formData.reminder_channels.filter(c => c !== 'email');
                          setFormData({...formData, reminder_channels: channels});
                        }}
                      />
                      <Label className="text-muted-foreground">Email</Label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Status & Notes */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div>
              <Label className="text-muted-foreground">{language === 'pt' ? 'Estado' : 'Status'}</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger className="mt-1.5 bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{language === 'pt' ? 'Activa' : 'Active'}</SelectItem>
                  <SelectItem value="inactive">{language === 'pt' ? 'Inactiva' : 'Inactive'}</SelectItem>
                  <SelectItem value="closed">{language === 'pt' ? 'Fechada' : 'Closed'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-muted-foreground">{language === 'pt' ? 'Notas' : 'Notes'}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder={language === 'pt' ? 'Notas adicionais...' : 'Additional notes...'}
                rows={2}
                className="mt-1.5 bg-background border-border text-foreground"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-border text-muted-foreground">
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-primary hover:bg-cyan-700"
            >
              {loading ? (language === 'pt' ? 'A guardar...' : 'Saving...') : (language === 'pt' ? 'Guardar' : 'Save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
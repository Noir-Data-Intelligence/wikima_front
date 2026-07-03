import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { api } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function StatementUploadDialog({ open, onClose, account, onSuccess }) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    opening_balance: '',
    closing_balance: '',
    notes: ''
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error(language === 'pt' ? 'Ficheiro muito grande (máx 10MB)' : 'File too large (max 10MB)');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error(language === 'pt' ? 'Selecione um ficheiro' : 'Select a file');
      return;
    }

    setLoading(true);

    try {
      const currentUser = await api.auth.me();
      const workspaceId = currentUser.current_workspace_id || currentUser.default_workspace_id;

      // Check for duplicate statement
      const existingStatements = await api.entities.BankStatement.filter({
        workspace_id: workspaceId,
        bank_account_id: account.id,
        month: parseInt(formData.month),
        year: parseInt(formData.year)
      });

      if (existingStatements.length > 0) {
        toast.error(language === 'pt' 
          ? 'Extracto já existe para este mês/ano' 
          : 'Statement already exists for this month/year');
        setLoading(false);
        return;
      }

      // Upload file
      const { file_url } = await api.integrations.Core.UploadFile({ file });

      // Create statement record
      const statementData = {
        workspace_id: workspaceId,
        bank_account_id: account.id,
        bank_name: account.bank_name,
        account_name: account.account_name,
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        status: 'received',
        file_url,
        file_name: file.name,
        file_size: file.size,
        currency: account.currency,
        opening_balance: formData.opening_balance ? parseFloat(formData.opening_balance) : null,
        closing_balance: formData.closing_balance ? parseFloat(formData.closing_balance) : null,
        notes: formData.notes,
        upload_date: new Date().toISOString()
      };

      await api.entities.BankStatement.create(statementData);

      // Also create a document record for cross-reference
      await api.entities.Document.create({
        workspace_id: workspaceId,
        title: `Extracto ${account.bank_name} - ${formData.month}/${formData.year}`,
        file_url,
        category: 'other',
        file_type: file.type,
        file_size: file.size,
        tags: ['bank_statement', account.bank_name, `${formData.month}/${formData.year}`],
        notes: `Extracto bancário: ${account.account_name}`
      });

      toast.success(language === 'pt' ? 'Extracto carregado!' : 'Statement uploaded!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(language === 'pt' ? 'Erro ao carregar' : 'Error uploading');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">
            {language === 'pt' ? 'Carregar Extracto Bancário' : 'Upload Bank Statement'}
          </DialogTitle>
          <p className="text-sm text-blue-300 mt-2">
            {account.bank_name} - {account.account_name}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{language === 'pt' ? 'Mês *' : 'Month *'}</Label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({...formData, month: e.target.value})}
                required
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-background border border-border text-foreground"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {new Date(2000, month - 1).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-muted-foreground">{language === 'pt' ? 'Ano *' : 'Year *'}</Label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
                required
                className="mt-1.5 bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">{language === 'pt' ? 'Ficheiro do Extracto *' : 'Statement File *'}</Label>
            <div className="mt-1.5">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors bg-background">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <>
                      <FileText className="w-10 h-10 text-primary mb-2" />
                      <p className="text-sm text-foreground font-medium">{file.name}</p>
                      <p className="text-xs text-blue-300">{(file.size / 1024).toFixed(2)} KB</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-blue-400 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {language === 'pt' ? 'Clique para escolher ficheiro' : 'Click to choose file'}
                      </p>
                      <p className="text-xs text-blue-400">PDF, PNG, JPG (máx 10MB)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{language === 'pt' ? 'Saldo Inicial' : 'Opening Balance'}</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.opening_balance}
                onChange={(e) => setFormData({...formData, opening_balance: e.target.value})}
                placeholder="0.00"
                className="mt-1.5 bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label className="text-muted-foreground">{language === 'pt' ? 'Saldo Final' : 'Closing Balance'}</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.closing_balance}
                onChange={(e) => setFormData({...formData, closing_balance: e.target.value})}
                placeholder="0.00"
                className="mt-1.5 bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">{language === 'pt' ? 'Notas' : 'Notes'}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder={language === 'pt' ? 'Observações adicionais...' : 'Additional observations...'}
              rows={2}
              className="mt-1.5 bg-background border-border text-foreground"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-border text-muted-foreground">
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !file}
              className="bg-primary hover:bg-cyan-700"
            >
              {loading ? (language === 'pt' ? 'A carregar...' : 'Uploading...') : (language === 'pt' ? 'Carregar' : 'Upload')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
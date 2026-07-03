import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '../LanguageContext';
import { api } from '@/api/client';
import { Upload, TrendingDown, TrendingUp } from 'lucide-react';

export default function AddTransactionDialog({ open, onClose, onSave }) {
  const { language } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [transactionType, setTransactionType] = useState('expense');
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Other',
    type: 'expense',
    transaction_type: 'personal',
    date: new Date().toISOString().split('T')[0],
    note: '',
    receipt_url: ''
  });

  const expenseCategories = ['Food', 'Transport', 'Home', 'Business', 'Services', 'Software', 'Personal', 'Other'];
  const incomeCategories = ['Salary', 'Sales', 'Services Income', 'Commission', 'Rent Income', 'Other Income'];

  const expenseCategoryLabels = {
    Food: language === 'pt' ? 'Alimentação' : 'Food',
    Transport: language === 'pt' ? 'Transporte' : 'Transport',
    Home: language === 'pt' ? 'Casa' : 'Home',
    Business: language === 'pt' ? 'Negócio' : 'Business',
    Services: language === 'pt' ? 'Serviços' : 'Services',
    Software: language === 'pt' ? 'Software' : 'Software',
    Personal: language === 'pt' ? 'Pessoal' : 'Personal',
    Other: language === 'pt' ? 'Outro' : 'Other'
  };

  const incomeCategoryLabels = {
    'Salary': language === 'pt' ? 'Salário' : 'Salary',
    'Sales': language === 'pt' ? 'Vendas' : 'Sales',
    'Services Income': language === 'pt' ? 'Receita de Serviços' : 'Services Income',
    'Commission': language === 'pt' ? 'Comissão' : 'Commission',
    'Rent Income': language === 'pt' ? 'Receita de Arrendamento' : 'Rent Income',
    'Other Income': language === 'pt' ? 'Outra Receita' : 'Other Income'
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploading(true);
      try {
        const { file_url } = await api.integrations.Core.UploadFile({ file });
        setFormData({ ...formData, receipt_url: file_url });
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleTypeChange = (type) => {
    setTransactionType(type);
    setFormData({ 
      ...formData, 
      type, 
      category: type === 'expense' ? 'Other' : 'Other Income' 
    });
  };

  const handleSubmit = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) return;
    onSave({ ...formData, amount: parseFloat(formData.amount) });
    setFormData({ 
      amount: '', 
      category: transactionType === 'expense' ? 'Other' : 'Other Income', 
      type: transactionType, 
      transaction_type: 'personal', 
      date: new Date().toISOString().split('T')[0], 
      note: '', 
      receipt_url: '' 
    });
    setSelectedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {language === 'pt' ? 'Adicionar Transação' : 'Add Transaction'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={transactionType} onValueChange={handleTypeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense" className="gap-2">
              <TrendingDown className="w-4 h-4" />
              {language === 'pt' ? 'Despesa' : 'Expense'}
            </TabsTrigger>
            <TabsTrigger value="income" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              {language === 'pt' ? 'Receita' : 'Income'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expense" className="space-y-4 mt-4">
            <div>
              <Label>{language === 'pt' ? 'Valor (€)' : 'Amount (€)'}</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{language === 'pt' ? 'Categoria' : 'Category'}</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{expenseCategoryLabels[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{language === 'pt' ? 'Tipo' : 'Type'}</Label>
                <Select value={formData.transaction_type} onValueChange={(value) => setFormData({ ...formData, transaction_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">{language === 'pt' ? 'Pessoal' : 'Personal'}</SelectItem>
                    <SelectItem value="business">{language === 'pt' ? 'Negócio' : 'Business'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>{language === 'pt' ? 'Data' : 'Date'}</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <Label>{language === 'pt' ? 'Nota (opcional)' : 'Note (optional)'}</Label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder={language === 'pt' ? 'Detalhes da despesa...' : 'Expense details...'}
                rows={2}
              />
            </div>

            <div>
              <Label>{language === 'pt' ? 'Anexar Recibo (opcional)' : 'Attach Receipt (optional)'}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf"
                  className="flex-1"
                />
                {selectedFile && (
                  <span className="text-xs text-green-600">✓ {selectedFile.name}</span>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="income" className="space-y-4 mt-4">
            <div>
              <Label>{language === 'pt' ? 'Valor (€)' : 'Amount (€)'}</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>{language === 'pt' ? 'Categoria de Receita' : 'Income Category'}</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{incomeCategoryLabels[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{language === 'pt' ? 'Tipo' : 'Type'}</Label>
                <Select value={formData.transaction_type} onValueChange={(value) => setFormData({ ...formData, transaction_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">{language === 'pt' ? 'Pessoal' : 'Personal'}</SelectItem>
                    <SelectItem value="business">{language === 'pt' ? 'Negócio' : 'Business'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>{language === 'pt' ? 'Data' : 'Date'}</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <Label>{language === 'pt' ? 'Nota (opcional)' : 'Note (optional)'}</Label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder={language === 'pt' ? 'Detalhes da receita...' : 'Income details...'}
                rows={2}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {language === 'pt' ? 'Cancelar' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.amount || parseFloat(formData.amount) <= 0 || uploading}>
            {uploading ? (language === 'pt' ? 'A carregar...' : 'Uploading...') : (language === 'pt' ? 'Adicionar' : 'Add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
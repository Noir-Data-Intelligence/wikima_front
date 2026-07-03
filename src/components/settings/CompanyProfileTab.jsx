import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Phone, CreditCard, CheckCircle, Loader2, Upload, Image } from 'lucide-react';

const SECTORS = [
  { value: 'construction', pt: 'Construção', en: 'Construction' },
  { value: 'consulting', pt: 'Consultoria', en: 'Consulting' },
  { value: 'retail', pt: 'Retalho', en: 'Retail' },
  { value: 'beauty', pt: 'Beleza & Bem-estar', en: 'Beauty & Wellness' },
  { value: 'restaurant', pt: 'Restauração', en: 'Restaurant' },
  { value: 'real_estate', pt: 'Imobiliário', en: 'Real Estate' },
  { value: 'healthcare', pt: 'Saúde', en: 'Healthcare' },
  { value: 'logistics', pt: 'Logística', en: 'Logistics' },
  { value: 'marketing', pt: 'Marketing', en: 'Marketing' },
  { value: 'accounting', pt: 'Contabilidade', en: 'Accounting' },
  { value: 'legal', pt: 'Jurídico', en: 'Legal' },
  { value: 'technology', pt: 'Tecnologia', en: 'Technology' },
  { value: 'education', pt: 'Educação', en: 'Education' },
  { value: 'other', pt: 'Outro', en: 'Other' },
];

const CURRENCIES = ['EUR', 'USD', 'GBP', 'AOA', 'BRL'];
const TIMEZONES = ['Europe/Lisbon', 'Europe/London', 'Europe/Paris', 'America/Sao_Paulo', 'Africa/Luanda', 'America/New_York'];

const inputCls = "bg-background border-border text-foreground";
const selectCls = "w-full px-3 py-2 rounded-md text-sm text-foreground bg-background border border-border focus:outline-none focus:border-primary";
const labelCls = "block text-sm font-medium text-muted-foreground mb-2";

function FieldRow({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

export default function CompanyProfileTab({ workspace, language }) {
  const pt = language === 'pt';
  const [info, setInfo] = useState(workspace?.company_info || {});
  const [settings, setSettings] = useState(workspace?.settings || {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [invoicePrefix, setInvoicePrefix] = useState(workspace?.invoice_prefix || 'INV');
  const [receiptPrefix, setReceiptPrefix] = useState(workspace?.receipt_prefix || 'REC');

  useEffect(() => {
    setInfo(workspace?.company_info || {});
    setSettings(workspace?.settings || {});
  }, [workspace?.id]);

  const setField = (field, val) => setInfo(prev => ({ ...prev, [field]: val }));
  const setSetting = (field, val) => setSettings(prev => ({ ...prev, [field]: val }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setField('logo_url', file_url);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.entities.Workspace.update(workspace.id, {
        company_info: info,
        settings,
        invoice_prefix: invoicePrefix,
        receipt_prefix: receiptPrefix,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Save error:', err);
      alert(pt ? 'Erro ao guardar' : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* General Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {pt ? 'Informação Geral' : 'General Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldRow>
            <div>
              <label className={labelCls}>
                {pt ? 'NIF / VAT / Tax ID' : 'VAT / Tax ID'}
              </label>
              <Input
                value={info.tax_number || ''}
                onChange={(e) => setField('tax_number', e.target.value)}
                className={inputCls}
                placeholder={pt ? '123456789' : '123456789'}
              />
            </div>
            <div>
              <label className={labelCls}>
                {pt ? 'Prefixo da Fatura' : 'Invoice Prefix'}
              </label>
              <Input
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                className={inputCls}
                placeholder="INV"
                maxLength={5}
              />
            </div>
          </FieldRow>
          <div>
            <label className={labelCls}>
              {pt ? 'Prefixo do Recibo' : 'Receipt Prefix'}
            </label>
            <Input
              value={receiptPrefix}
              onChange={(e) => setReceiptPrefix(e.target.value.toUpperCase())}
              className={inputCls}
              placeholder="REC"
              maxLength={5}
            />
          </div>
          {/* Logo */}
          <div>
            <label className={labelCls}>{pt ? 'Logótipo da Empresa' : 'Company Logo'}</label>
            <div className="flex items-center gap-4">
              {info.logo_url ? (
                <img src={info.logo_url} alt="Logo" className="h-16 w-auto rounded-lg object-contain bg-background p-1 border border-border" />
              ) : (
                <div className="h-16 w-24 rounded-lg bg-background border border-border flex items-center justify-center">
                  <Image className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-blue-300 hover:border-primary hover:text-primary transition-colors">
                  {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {pt ? 'Carregar Logótipo' : 'Upload Logo'}
                </div>
              </label>
            </div>
          </div>

          <FieldRow>
            <div>
              <label className={labelCls}>{pt ? 'Nome Comercial' : 'Company Name'}</label>
              <Input className={inputCls} value={info.company_name || ''} onChange={e => setField('company_name', e.target.value)} placeholder="WiKima Lda" />
            </div>
            <div>
              <label className={labelCls}>{pt ? 'Nome Legal / Razão Social' : 'Legal Name'}</label>
              <Input className={inputCls} value={info.legal_name || ''} onChange={e => setField('legal_name', e.target.value)} placeholder="WiKima Unipessoal Lda" />
            </div>
            <div>
              <label className={labelCls}>{pt ? 'NIF / NIPC' : 'Tax Number'}</label>
              <Input className={inputCls} value={info.tax_number || ''} onChange={e => setField('tax_number', e.target.value)} placeholder="PT123456789" />
            </div>
            <div>
              <label className={labelCls}>{pt ? 'Setor de Atividade' : 'Business Sector'}</label>
              <select className={selectCls} value={info.business_sector || ''} onChange={e => setField('business_sector', e.target.value)}>
                <option value="">{pt ? 'Selecionar...' : 'Select...'}</option>
                {SECTORS.map(s => <option key={s.value} value={s.value}>{pt ? s.pt : s.en}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{pt ? 'Dimensão da Empresa' : 'Company Size'}</label>
              <select className={selectCls} value={info.team_size || ''} onChange={e => setField('team_size', e.target.value)}>
                <option value="">{pt ? 'Selecionar...' : 'Select...'}</option>
                <option value="1">Solo / 1</option>
                <option value="2-5">2–5</option>
                <option value="6-20">6–20</option>
                <option value="21-50">21–50</option>
                <option value="50+">50+</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{pt ? 'País' : 'Country'}</label>
              <Input className={inputCls} value={info.country || ''} onChange={e => setField('country', e.target.value)} placeholder="Portugal" />
            </div>
            <div>
              <label className={labelCls}>{pt ? 'Moeda' : 'Currency'}</label>
              <select className={selectCls} value={settings.currency || 'EUR'} onChange={e => setSetting('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{pt ? 'Idioma' : 'Language'}</label>
              <select className={selectCls} value={settings.language || 'pt'} onChange={e => setSetting('language', e.target.value)}>
                <option value="pt">Português</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{pt ? 'Fuso Horário' : 'Time Zone'}</label>
              <select className={selectCls} value={settings.timezone || 'Europe/Lisbon'} onChange={e => setSetting('timezone', e.target.value)}>
                {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </FieldRow>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            {pt ? 'Informação de Contacto' : 'Contact Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className={labelCls}>{pt ? 'Morada' : 'Address'}</label>
            <Input className={inputCls} value={info.address || ''} onChange={e => setField('address', e.target.value)} placeholder={pt ? 'Rua Example, 123, Lisboa' : '123 Example St, Lisbon'} />
          </div>
          <FieldRow>
            <div>
              <label className={labelCls}>{pt ? 'Telefone' : 'Phone'}</label>
              <Input className={inputCls} value={info.phone || ''} onChange={e => setField('phone', e.target.value)} placeholder="+351 900 000 000" />
            </div>
            <div>
              <label className={labelCls}>{pt ? 'Email da Empresa' : 'Company Email'}</label>
              <Input className={inputCls} type="email" value={info.email || ''} onChange={e => setField('email', e.target.value)} placeholder="geral@empresa.pt" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Website</label>
              <Input className={inputCls} value={info.website || ''} onChange={e => setField('website', e.target.value)} placeholder="https://empresa.pt" />
            </div>
          </FieldRow>
        </CardContent>
      </Card>

      {/* Banking */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {pt ? 'Dados Bancários' : 'Banking Details'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldRow>
            <div className="md:col-span-2">
              <label className={labelCls}>{pt ? 'Titular da Conta' : 'Account Holder'}</label>
              <Input className={inputCls} value={info.account_holder || ''} onChange={e => setField('account_holder', e.target.value)} placeholder={pt ? 'Nome do titular da conta' : 'Account holder name'} />
            </div>
            <div>
              <label className={labelCls}>{pt ? 'Nome do Banco' : 'Bank Name'}</label>
              <Input className={inputCls} value={info.bank_name || ''} onChange={e => setField('bank_name', e.target.value)} placeholder="Caixa Geral de Depósitos" />
            </div>
            <div>
              <label className={labelCls}>IBAN</label>
              <Input className={inputCls} value={info.iban || ''} onChange={e => setField('iban', e.target.value)} placeholder="PT50 0000 0000 0000 0000 0000 0" />
            </div>
            <div>
              <label className={labelCls}>SWIFT / BIC</label>
              <Input className={inputCls} value={info.swift_bic || ''} onChange={e => setField('swift_bic', e.target.value)} placeholder="CGDIPTPL" />
            </div>
          </FieldRow>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
          {saved ? (pt ? 'Guardado!' : 'Saved!') : saving ? (pt ? 'A guardar...' : 'Saving...') : (pt ? 'Guardar Perfil' : 'Save Profile')}
        </Button>
      </div>
    </div>
  );
}
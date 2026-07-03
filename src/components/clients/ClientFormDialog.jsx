import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CheckSquare, Calendar, FileText, Receipt, User, Building2 } from 'lucide-react';

const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;

function LightOverlay() {
  return <DialogPrimitive.Overlay style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.6)' }} />;
}

function LightContent({ children, style, ...props }) {
  return (
    <DialogPortal>
      <LightOverlay />
      <DialogPrimitive.Content
        style={{
          position: 'fixed', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 51,
          backgroundColor: '#ffffff', color: '#111111',
          borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          width: '95vw', outline: 'none', ...style,
        }}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

// ── Static data ───────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { value: 'consulting',  label_pt: 'Consultoria',   label_en: 'Consulting' },
  { value: 'coaching',    label_pt: 'Coaching',      label_en: 'Coaching' },
  { value: 'therapy',     label_pt: 'Terapia',       label_en: 'Therapy' },
  { value: 'design',      label_pt: 'Design',        label_en: 'Design' },
  { value: 'immigration', label_pt: 'Imigração',     label_en: 'Immigration' },
  { value: 'legal',       label_pt: 'Jurídico',      label_en: 'Legal' },
  { value: 'accounting',  label_pt: 'Contabilidade', label_en: 'Accounting' },
  { value: 'marketing',   label_pt: 'Marketing',     label_en: 'Marketing' },
  { value: 'technology',  label_pt: 'Tecnologia',    label_en: 'Technology' },
  { value: 'health',      label_pt: 'Saúde',         label_en: 'Health' },
  { value: 'education',   label_pt: 'Educação',      label_en: 'Education' },
  { value: 'retail',      label_pt: 'Comércio',      label_en: 'Retail' },
  { value: 'other',       label_pt: 'Outro',         label_en: 'Other' },
];

const PIPELINE_STAGES = [
  { value: 'lead',          label_pt: 'Lead',                label_en: 'Lead' },
  { value: 'contacted',     label_pt: 'Contactado',          label_en: 'Contacted' },
  { value: 'proposal_sent', label_pt: 'Proposta Enviada',    label_en: 'Proposal Sent' },
  { value: 'negotiation',   label_pt: 'Em Negociação',       label_en: 'Negotiation' },
  { value: 'won',           label_pt: 'Cliente Ganho',       label_en: 'Won' },
  { value: 'lost',          label_pt: 'Perdido',             label_en: 'Lost' },
];

const RELATIONSHIP_TYPES = [
  { value: 'client',   label_pt: 'Cliente',    label_en: 'Client' },
  { value: 'lead',     label_pt: 'Lead',       label_en: 'Lead' },
  { value: 'supplier', label_pt: 'Fornecedor', label_en: 'Supplier' },
  { value: 'partner',  label_pt: 'Parceiro',   label_en: 'Partner' },
];

const POST_SAVE_ACTIONS = [
  { key: 'task',      icon: CheckSquare, label_pt: 'Criar tarefa',       label_en: 'Create task' },
  { key: 'follow_up', icon: Calendar,    label_pt: 'Agendar follow-up',  label_en: 'Schedule follow-up' },
  { key: 'document',  icon: FileText,    label_pt: 'Carregar documento', label_en: 'Upload document' },
  { key: 'invoice',   icon: Receipt,     label_pt: 'Criar fatura',       label_en: 'Create invoice' },
];

// ── Style constants ───────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', height: 38, padding: '0 12px', fontSize: 14,
  color: '#111111', backgroundColor: '#ffffff',
  border: '1px solid #d1d5db', borderRadius: 8,
  outline: 'none', boxSizing: 'border-box',
};
const selectStyle = {
  ...inputStyle, appearance: 'none', WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32,
};
const textareaStyle = {
  width: '100%', padding: '10px 12px', fontSize: 14, color: '#111111',
  backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: 8,
  outline: 'none', resize: 'vertical', minHeight: 90, boxSizing: 'border-box', fontFamily: 'inherit',
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#111111', marginBottom: 6 };
const requiredDot = { color: '#e5372a', marginLeft: 2 };

function SectionTitle({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ height: 1, width: 16, backgroundColor: '#E88134', flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#E88134', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {title}
      </span>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={requiredDot}>*</span>}</label>
      {children}
    </div>
  );
}

function TwoCol({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>{children}</div>;
}

function Section({ title, children }) {
  return (
    <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 22px' }}>
      <SectionTitle title={title} />
      {children}
    </div>
  );
}

// ── Type toggle button ────────────────────────────────────────────────────────
function TypeToggle({ value, onChange, pt }) {
  const opts = [
    { key: 'individual', label: pt ? 'Pessoa Singular' : 'Individual', icon: User },
    { key: 'company',    label: pt ? 'Empresa' : 'Company',            icon: Building2 },
  ];
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {opts.map(({ key, label, icon: Icon }) => {
        const active = value === key;
        return (
          <button key={key} type="button" onClick={() => onChange(key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 0', borderRadius: 10, border: active ? '2px solid #E88134' : '1px solid #d1d5db',
              backgroundColor: active ? '#FDF2E8' : '#ffffff', color: active ? '#E88134' : '#6b7280',
              fontWeight: active ? 700 : 500, fontSize: 14, cursor: 'pointer',
            }}>
            <Icon style={{ width: 16, height: 16 }} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ClientFormDialog({
  open, onOpenChange, editingClient,
  formData, setFormData,
  nifError, formError,
  onSubmit, onDelete,
  isSaving, language, onPostAction,
}) {
  const pt = language === 'pt';
  const [savedClient, setSavedClient] = useState(null);

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    const result = await onSubmit();
    if (result && !editingClient) setSavedClient(result);
  };

  const handleClose = () => { setSavedClient(null); onOpenChange(false); };

  const isCompany = formData.type === 'company';

  // ── Post-save screen ──────────────────────────────────────────────────────
  if (savedClient) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <LightContent style={{ maxWidth: 440, padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckSquare style={{ width: 28, height: 28, color: '#059669' }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111111', margin: '0 0 8px' }}>
              {pt ? 'Cliente criado com sucesso!' : 'Client created successfully!'}
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              <strong style={{ color: '#111111' }}>{savedClient.name}</strong>{' '}
              {pt ? 'foi adicionado ao seu CRM.' : 'has been added to your CRM.'}
            </p>
          </div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            {pt ? 'O que fazer a seguir?' : "What's next?"}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {POST_SAVE_ACTIONS.map(({ key, icon: Icon, label_pt, label_en }) => (
              <button key={key}
                onClick={() => { handleClose(); onPostAction?.(key, savedClient); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', cursor: 'pointer', textAlign: 'left' }}>
                <Icon style={{ width: 16, height: 16, color: '#E88134', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{pt ? label_pt : label_en}</span>
              </button>
            ))}
          </div>
          <button onClick={handleClose}
            style={{ width: '100%', marginTop: 20, padding: '8px 0', fontSize: 13, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
            {pt ? 'Fechar' : 'Close'}
          </button>
        </LightContent>
      </Dialog>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isSaving) onOpenChange(v); }}>
      <LightContent style={{ maxWidth: 960, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

        {/* HEADER */}
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff', flexShrink: 0 }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: '#111111', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            {editingClient ? (pt ? 'EDITAR CLIENTE' : 'EDIT CLIENT') : (pt ? 'CRIAR CLIENTE' : 'CREATE CLIENT')}
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            {editingClient
              ? (pt ? 'Atualize os dados deste contacto.' : "Update this contact's details.")
              : (pt ? 'Adicione um novo cliente ou lead ao CRM.' : 'Add a new client or lead to your CRM.')}
          </p>
        </div>

        {/* SCROLLABLE BODY */}
        <div style={{ overflowY: 'auto', flex: '1 1 auto', padding: '18px 26px', display: 'flex', flexDirection: 'column', gap: 14, backgroundColor: '#f3f4f6' }}>

          {/* ── SECTION 1: CLIENT TYPE ── */}
          <Section title={pt ? 'Tipo de Cliente' : 'Client Type'}>
            <TypeToggle value={formData.type || 'individual'} onChange={v => set('type', v)} pt={pt} />
          </Section>

          {/* ── SECTION 2: IDENTIFICATION ── */}
          <Section title={pt ? 'Identificação' : 'Identification'}>
            {!isCompany ? (
              // Individual fields
              <TwoCol>
                <Field label={pt ? 'Nome Próprio' : 'First Name'} required>
                  <input type="text" value={formData.first_name || ''} autoFocus
                    onChange={e => {
                      const full = `${e.target.value} ${formData.last_name || ''}`.trim();
                      setFormData(prev => ({ ...prev, first_name: e.target.value, name: full }));
                    }}
                    placeholder={pt ? 'ex. Maria' : 'e.g. John'} style={inputStyle} />
                </Field>
                <Field label={pt ? 'Apelido' : 'Last Name'}>
                  <input type="text" value={formData.last_name || ''}
                    onChange={e => {
                      const full = `${formData.first_name || ''} ${e.target.value}`.trim();
                      setFormData(prev => ({ ...prev, last_name: e.target.value, name: full }));
                    }}
                    placeholder={pt ? 'ex. Silva' : 'e.g. Smith'} style={inputStyle} />
                </Field>
              </TwoCol>
            ) : (
              // Company fields
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label={pt ? 'Nome da Empresa' : 'Company Name'} required>
                  <input type="text" value={formData.company || ''} autoFocus
                    onChange={e => {
                      setFormData(prev => ({ ...prev, company: e.target.value, name: e.target.value }));
                    }}
                    placeholder={pt ? 'ex. Acme, Lda.' : 'e.g. Acme Corp'} style={inputStyle} />
                </Field>
                <TwoCol>
                  <Field label={pt ? 'NIF / Tax ID' : 'Tax Number'}>
                    <input type="text" value={formData.tax_number || ''}
                      onChange={e => set('tax_number', e.target.value)}
                      placeholder="PT123456789" style={inputStyle} />
                    {nifError && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{nifError}</p>}
                  </Field>
                  <Field label={pt ? 'Pessoa de Contacto' : 'Main Contact Name'}>
                    <input type="text" value={formData.main_contact_name || ''}
                      onChange={e => set('main_contact_name', e.target.value)}
                      placeholder={pt ? 'ex. João Ferreira' : 'e.g. John Smith'} style={inputStyle} />
                  </Field>
                  <Field label={pt ? 'Cargo / Função' : 'Job Title / Position'}>
                    <input type="text" value={formData.job_title || ''}
                      onChange={e => set('job_title', e.target.value)}
                      placeholder="CEO, Founder, Manager..." style={inputStyle} />
                  </Field>
                </TwoCol>
              </div>
            )}
          </Section>

          {/* ── SECTION 3: CONTACT INFORMATION ── */}
          <Section title={pt ? 'Informação de Contacto' : 'Contact Information'}>
            <TwoCol>
              <Field label="Email">
                <input type="email" value={formData.email || ''}
                  onChange={e => set('email', e.target.value)}
                  placeholder="email@exemplo.com" style={inputStyle} />
              </Field>
              <Field label={pt ? 'Telemóvel' : 'Mobile Phone'}>
                <input type="tel" value={formData.phone || ''}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+351 9XX XXX XXX" style={inputStyle} />
              </Field>
              <Field label="WhatsApp">
                <input type="tel" value={formData.whatsapp || ''}
                  onChange={e => set('whatsapp', e.target.value)}
                  placeholder="+351 9XX XXX XXX" style={inputStyle} />
              </Field>
              <Field label="Website">
                <input type="url" value={formData.website || ''}
                  onChange={e => set('website', e.target.value)}
                  placeholder="https://exemplo.com" style={inputStyle} />
              </Field>
            </TwoCol>
          </Section>

          {/* ── SECTION 4: CLIENT DETAILS ── */}
          <Section title={pt ? 'Detalhes do Cliente' : 'Client Details'}>
            <TwoCol>
              <Field label={pt ? 'Estado no CRM' : 'Pipeline Stage'}>
                <select value={formData.pipeline_stage || 'lead'} onChange={e => set('pipeline_stage', e.target.value)} style={selectStyle}>
                  {PIPELINE_STAGES.map(s => <option key={s.value} value={s.value}>{pt ? s.label_pt : s.label_en}</option>)}
                </select>
              </Field>
              <Field label={pt ? 'Tipo de Relação' : 'Relationship Type'}>
                <select value={formData.relationship_type || 'client'} onChange={e => set('relationship_type', e.target.value)} style={selectStyle}>
                  {RELATIONSHIP_TYPES.map(s => <option key={s.value} value={s.value}>{pt ? s.label_pt : s.label_en}</option>)}
                </select>
              </Field>
              <Field label={pt ? 'Indústria / Setor' : 'Industry / Sector'}>
                <select value={formData.service_category || ''} onChange={e => set('service_category', e.target.value)} style={selectStyle}>
                  <option value="">{pt ? 'Selecionar...' : 'Select...'}</option>
                  {INDUSTRIES.map(s => <option key={s.value} value={s.value}>{pt ? s.label_pt : s.label_en}</option>)}
                </select>
              </Field>
              <Field label={pt ? 'Cliente Desde' : 'Customer Since'}>
                <input type="date" value={formData.customer_since || ''}
                  onChange={e => set('customer_since', e.target.value)} style={inputStyle} />
              </Field>
            </TwoCol>
          </Section>

          {/* ── SECTION 5: ADDRESS ── */}
          <Section title={pt ? 'Morada' : 'Address'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label={pt ? 'Rua / Morada' : 'Street Address'}>
                <input type="text" value={formData.address || ''}
                  onChange={e => set('address', e.target.value)}
                  placeholder={pt ? 'Rua, número, andar' : 'Street, number, floor'} style={inputStyle} />
              </Field>
              <TwoCol>
                <Field label={pt ? 'Cidade' : 'City'}>
                  <input type="text" value={formData.city || ''}
                    onChange={e => set('city', e.target.value)}
                    placeholder={pt ? 'ex. Lisboa' : 'e.g. Lisbon'} style={inputStyle} />
                </Field>
                <Field label={pt ? 'Código Postal' : 'Postal Code'}>
                  <input type="text" value={formData.postal_code || ''}
                    onChange={e => set('postal_code', e.target.value)}
                    placeholder="1000-001" style={inputStyle} />
                </Field>
                <Field label={pt ? 'País' : 'Country'}>
                  <input type="text" value={formData.country || ''}
                    onChange={e => set('country', e.target.value)}
                    placeholder={pt ? 'ex. Portugal' : 'e.g. Portugal'} style={inputStyle} />
                </Field>
              </TwoCol>
            </div>
          </Section>

          {/* ── SECTION 6: NOTES ── */}
          <Section title={pt ? 'Notas Internas' : 'Internal Notes'}>
            <textarea value={formData.notes || ''}
              onChange={e => set('notes', e.target.value)}
              placeholder={pt ? 'Contexto, histórico, observações importantes...' : 'Context, history, important observations...'}
              style={textareaStyle} rows={3} />
          </Section>

          {/* Validation errors */}
          {formError && (
            <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#dc2626' }}>
              {formError}
            </div>
          )}
        </div>

        {/* STICKY FOOTER */}
        <div style={{ padding: '14px 26px', borderTop: '1px solid #e5e7eb', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            {editingClient && (
              <button onClick={onDelete}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#dc2626', backgroundColor: 'transparent', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer' }}>
                {pt ? 'Eliminar' : 'Delete'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleClose}
              style={{ padding: '9px 22px', fontSize: 14, fontWeight: 600, color: '#374151', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' }}>
              {pt ? 'Cancelar' : 'Cancel'}
            </button>
            <button onClick={handleSave} disabled={isSaving}
              style={{ padding: '9px 28px', fontSize: 14, fontWeight: 700, color: '#ffffff', backgroundColor: isSaving ? '#F1C08A' : '#E88134', border: 'none', borderRadius: 8, cursor: isSaving ? 'not-allowed' : 'pointer', minWidth: 140 }}>
              {isSaving
                ? (pt ? 'A guardar...' : 'Saving...')
                : editingClient ? (pt ? 'Guardar Alterações' : 'Save Changes') : (pt ? 'Criar Cliente' : 'Create Client')}
            </button>
          </div>
        </div>
      </LightContent>
    </Dialog>
  );
}
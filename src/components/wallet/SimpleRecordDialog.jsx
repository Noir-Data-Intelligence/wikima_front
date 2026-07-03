import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, ChevronLeft, Home, Utensils, Car, Heart, Briefcase, GraduationCap, PiggyBank, TrendingUp, Banknote, ShoppingBag, Phone, Tv, Zap, Gift, DollarSign, ArrowDownLeft, ArrowUpRight, Users, BookOpen, Baby, Stethoscope, Coffee, Plane, Shirt, Fuel } from 'lucide-react';
import { KAKEBO_CATEGORIES, INCOME_CATEGORIES, FEELINGS } from './KakeboCategories';

// Category groups for organized display
const EXPENSE_GROUPS = [
  {
    key: 'daily',
    pt: 'Dia a dia',
    en: 'Daily Life',
    keys: ['Food', 'Transport', 'Housing', 'Home Services'],
  },
  {
    key: 'personal',
    pt: 'Pessoal',
    en: 'Personal',
    keys: ['Health', 'Leisure & Personal', 'Children & Education'],
  },
  {
    key: 'financial',
    pt: 'Financeiro',
    en: 'Financial',
    keys: ['Savings', 'Investments', 'Banks & Other'],
  },
  {
    key: 'work',
    pt: 'Trabalho',
    en: 'Work',
    keys: ['Business & Work'],
  },
];

// Icon mapping for categories (Lucide outline icons)
const CATEGORY_ICONS = {
  Housing: Home,
  Food: Utensils,
  Transport: Car,
  'Home Services': Zap,
  Health: Heart,
  'Leisure & Personal': Coffee,
  'Children & Education': Users,
  Savings: PiggyBank,
  Investments: TrendingUp,
  'Banks & Other': Banknote,
  'Business & Work': Briefcase,
};

// Short labels for modal display
const SHORT_LABELS = {
  en: {
    Housing: 'Home',
    'Home Services': 'Services',
    'Children & Education': 'Kids',
    'Leisure & Personal': 'Leisure',
    'Business & Work': 'Work',
    'Banks & Other': 'Banks',
  },
  pt: {
    Housing: 'Casa',
    'Home Services': 'Serviços',
    'Children & Education': 'Crianças',
    'Leisure & Personal': 'Lazer',
    'Business & Work': 'Trabalho',
    'Banks & Other': 'Bancos',
  },
};

// Income icons
const INCOME_ICONS = {
  Salary: DollarSign,
  Freelance: Briefcase,
  Sales: ShoppingBag,
  Gift: Gift,
  'Other Income': DollarSign,
};

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { enUS } from 'date-fns/locale/en-US';

export default function SimpleRecordDialog({ open, onClose, onSave, language, editData = null, selectedMonth = null }) {
  const [type, setType] = useState(editData?.type || 'expense');
  const [amount, setAmount] = useState(editData?.amount?.toString() || '');
  const [category, setCategory] = useState(editData?.category || '');
  const [subcategory, setSubcategory] = useState(editData?.subcategory || '');
  const [feeling, setFeeling] = useState(editData?.feeling || '');
  const [note, setNote] = useState(editData?.note || '');
  const [step, setStep] = useState(editData ? 'detail' : 'category');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const selectedCat = KAKEBO_CATEGORIES.find(c => c.key === category);
  const subcats = selectedCat?.subcategories?.[language] || selectedCat?.subcategories?.en || [];
  const isSavings = category === 'Savings' || category === 'Investments';
  
  // Format the target month for display
  const locale = language === 'pt' ? ptBR : enUS;
  const targetMonthDisplay = selectedMonth ? format(selectedMonth, 'MMMM yyyy', { locale }) : '';

  const reset = () => {
    setAmount(editData?.amount?.toString() || ''); 
    setCategory(editData?.category || ''); 
    setSubcategory(editData?.subcategory || '');
    setFeeling(editData?.feeling || ''); 
    setNote(editData?.note || ''); 
    setType(editData?.type || 'expense'); 
    setStep(editData ? 'detail' : 'category');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleCategorySelect = (key) => {
    setIsTransitioning(true);
    setCategory(key);
    setSubcategory('');
    setTimeout(() => {
      setStep('detail');
      setIsTransitioning(false);
    }, 150);
  };

  const handleSave = () => {
    if (!amount || !category) return;
    
    // Use selected month context if available, otherwise use system date
    let transactionDate;
    if (editData?.date) {
      transactionDate = editData.date;
    } else if (selectedMonth) {
      // Use the selected month, but preserve the current day if possible
      const now = new Date();
      const selectedDate = new Date(selectedMonth);
      const dayToUse = Math.min(now.getDate(), new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate());
      selectedDate.setDate(dayToUse);
      transactionDate = selectedDate.toISOString().split('T')[0];
    } else {
      transactionDate = new Date().toISOString().split('T')[0];
    }
    
    onSave({
      ...(editData || {}),
      type: (category === 'Savings' || category === 'Investments') ? category.toLowerCase() : type,
      amount: parseFloat(amount),
      category,
      subcategory: subcategory || undefined,
      feeling: feeling || undefined,
      note: note || undefined,
      date: transactionDate,
    });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="max-w-md bg-card/95 backdrop-blur-2xl border border-border text-foreground p-0 gap-0 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50">
        {/* Custom scrollbar styles - Ultra minimal */}
        <style>{`
          .modal-scroll::-webkit-scrollbar {
            width: 3px;
          }
          .modal-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .modal-scroll::-webkit-scrollbar-thumb {
            background: rgba(120,120,120,0.2);
            border-radius: 6px;
            transition: background 0.2s ease;
          }
          .modal-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(120,120,120,0.3);
          }
        `}</style>

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          {/* Single close button - top right */}
          <button 
            onClick={handleClose}
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-110 transition-all duration-200 group">
            <X className="w-4 h-4" />
          </button>

          {/* Progress indicator */}
          {step === 'category' && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/70" />
              <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            </div>
          )}

          {/* Title */}
          <div className="text-center">
            {step === 'category' ? (
              <>
                <p className="text-lg font-semibold text-foreground tracking-tight">
                  {language === 'pt' ? 'Novo registo' : 'New Record'}
                </p>
                {selectedMonth && !editData && (
                  <p className="text-xs text-emerald-400/80 mt-1.5 font-medium flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60"></span>
                    {language === 'pt' ? `Para ${targetMonthDisplay}` : `For ${targetMonthDisplay}`}
                  </p>
                )}
                {!selectedMonth && (
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {language === 'pt' ? 'O que aconteceu hoje?' : 'What happened today?'}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2">
                  {selectedCat?.emoji && <span className="text-xl">{selectedCat.emoji}</span>}
                  <p className="text-lg font-semibold text-foreground tracking-tight">
                    {language === 'pt' ? (selectedCat?.pt || category) : (selectedCat?.en || category)}
                  </p>
                </div>
                {selectedMonth && !editData && (
                  <p className="text-xs text-emerald-400/80 mt-1.5 font-medium flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60"></span>
                    {targetMonthDisplay}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {language === 'pt' ? 'Insere o valor' : 'Enter amount'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className={`px-6 pb-6 max-h-[65vh] overflow-y-auto modal-scroll transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          
          {/* STEP 1: Type selection (only on first step) */}
          {step === 'category' && (
            <div className="mb-6">
              <div className="flex gap-1.5 p-1.5 bg-muted/40 rounded-2xl backdrop-blur-sm">
                {[
                  { key: 'expense', pt: 'Despesa', en: 'Expense', icon: ArrowDownLeft },
                  { key: 'income', pt: 'Receita', en: 'Income', icon: ArrowUpRight },
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button 
                      key={t.key} 
                      onClick={() => { setType(t.key); setCategory(''); }}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                        type === t.key
                          ? t.key === 'income'
                            ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/15 text-emerald-300 shadow-lg shadow-emerald-500/10'
                            : 'bg-gradient-to-r from-accent to-accent text-foreground shadow-lg shadow-black/20'
                          : 'text-muted-foreground hover:text-muted-foreground hover:bg-accent/50'
                      }`}>
                      <Icon className="w-3.5 h-3.5" />
                      {language === 'pt' ? t.pt : t.en}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 1: Category selection */}
          {step === 'category' && (
            <div className="space-y-5">
              {type === 'expense' ? (
                <>
                  {EXPENSE_GROUPS.map(group => {
                    const cats = KAKEBO_CATEGORIES.filter(c => group.keys.includes(c.key));
                    if (!cats.length) return null;
                    return (
                      <div key={group.key}>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-3 font-semibold">
                          {language === 'pt' ? group.pt : group.en}
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {cats.map(c => {
                            const IconComponent = CATEGORY_ICONS[c.key];
                            return (
                              <button 
                                key={c.key} 
                                onClick={() => handleCategorySelect(c.key)}
                                className="group flex flex-col items-center gap-2 py-3 px-2 rounded-2xl transition-all duration-300 hover:scale-[1.06] active:scale-[0.96] hover:shadow-lg hover:shadow-black/20"
                                style={{ background: c.colorSoft }}>
                                {IconComponent ? (
                                  <IconComponent className="w-5 h-5 text-foreground/80 group-hover:text-foreground group-hover:scale-110 transition-all duration-300" />
                                ) : (
                                  <span className="text-xl leading-none group-hover:scale-110 transition-all duration-300">{c.emoji}</span>
                                )}
                                <span className="text-[9px] text-muted-foreground group-hover:text-foreground font-medium leading-tight text-center px-0.5 line-clamp-2">
                                  {(language === 'pt' ? SHORT_LABELS.pt[c.key] : SHORT_LABELS.en[c.key]) || (language === 'pt' ? c.pt : c.en)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-3 font-semibold">
                    {language === 'pt' ? 'Tipo de receita' : 'Income type'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {INCOME_CATEGORIES.map(c => {
                      const IconComponent = INCOME_ICONS[c.key] || DollarSign;
                      return (
                        <button 
                          key={c.key} 
                          onClick={() => handleCategorySelect(c.key)}
                          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-muted/40 hover:bg-emerald-500/15 border border-border hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.04]">
                          <IconComponent className="w-4 h-4 text-muted-foreground group-hover:text-emerald-300 transition-all" />
                          <span className="text-xs font-medium text-muted-foreground group-hover:text-emerald-200 transition-all">
                            {language === 'pt' ? c.pt : c.en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Amount and details */}
          {step === 'detail' && (
            <div className="space-y-6">
              
              {/* Amount input - Clean & Premium */}
              <div className="text-center py-4">
                <div className="relative inline-flex items-center justify-center">
                  <span className="text-2xl text-muted-foreground font-light absolute left-8">€</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    autoFocus
                    className="text-5xl font-light text-foreground bg-transparent border-none outline-none w-64 text-center tabular-nums placeholder:text-muted-foreground leading-none tracking-tight [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    inputMode="decimal"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 font-medium tracking-wide">
                  {language === 'pt' ? 'Quanto foi?' : 'How much was it?'}
                </p>
              </div>

              {/* Subcategory chips - Softer pills */}
              {subcats.length > 0 && (
                <div className="pt-2">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-3 font-medium">
                    {language === 'pt' ? 'Detalhe' : 'Detail'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {subcats.map(s => (
                      <button 
                        key={s} 
                        onClick={() => setSubcategory(subcategory === s ? '' : s)}
                        className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-300 hover:scale-[1.03] ${
                          subcategory === s
                            ? 'bg-gradient-to-r from-accent to-accent text-foreground shadow-lg shadow-black/5'
                            : 'bg-muted/40 text-muted-foreground hover:bg-accent hover:text-muted-foreground'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Emotional feeling - Enhanced & Mindful */}
              {type === 'expense' && !isSavings && (
                <div className="pt-3">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-3.5 font-medium">
                    {language === 'pt' ? 'Como te sentiste?' : 'How did it feel?'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FEELINGS.map(f => (
                      <button 
                        key={f.key} 
                        onClick={() => setFeeling(feeling === f.key ? '' : f.key)}
                        className={`group flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-300 hover:scale-[1.04] ${
                          feeling === f.key
                            ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-500/10 border border-indigo-400/30 text-indigo-200 shadow-lg shadow-indigo-500/15'
                            : 'bg-muted/40 border border-border text-muted-foreground hover:text-muted-foreground hover:bg-accent hover:border-border'
                        }`}>
                        <span className="text-base group-hover:scale-110 transition-transform duration-300">{f.emoji}</span>
                        <span>{language === 'pt' ? f.pt : f.en}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Savings/Investment message - Softer */}
              {isSavings && (
                <div className="rounded-2xl bg-gradient-to-br from-emerald-500/8 to-emerald-500/3 border border-emerald-500/10 px-4 py-3.5">
                  <p className="text-xs text-emerald-300/75 leading-relaxed font-medium">
                    {category === 'Savings'
                      ? (language === 'pt' ? '🪴 Estás a construir o teu futuro financeiro. Cada valor conta.' : '🪴 You\'re building your financial future. Every amount counts.')
                      : (language === 'pt' ? '📈 Investir é plantar sementes para o amanhã.' : '📈 Investing is planting seeds for tomorrow.')}
                  </p>
                </div>
              )}

              {/* Note - Refined */}
              <div className="pt-2">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2.5 font-medium">
                  {language === 'pt' ? 'Nota' : 'Note'}
                </p>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={language === 'pt' ? 'Adiciona uma nota...' : 'Add a small note...'}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-xs text-muted-foreground placeholder:text-muted-foreground outline-none focus:border-border focus:bg-muted/50 transition-all duration-200"
                />
              </div>

              {/* Save button - Premium CTA */}
              <button
                onClick={handleSave}
                disabled={!amount || !category}
                className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 disabled:opacity-25 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] ${
                  isSavings
                    ? 'bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 text-foreground shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30'
                    : type === 'income'
                      ? 'bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 text-foreground shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-accent to-accent text-foreground border border-border shadow-xl hover:shadow-2xl'
                }`}>
                {language === 'pt' ? 'Guardar registo' : 'Save record'}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/client';
import { createPageUrl } from '../utils';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import MobileMenuButton from '../components/dashboard/MobileMenuButton';
import {
  MessageSquarePlus, Bug, Lightbulb, Star, Send, CheckCircle2,
  ChevronDown, TrendingUp, Smile
} from 'lucide-react';

const CATEGORIES = {
  bug:         { icon: Bug,                color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',       hover: 'hover:border-red-500/50' },
  feature:     { icon: Lightbulb,          color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20',   hover: 'hover:border-amber-500/50' },
  general:     { icon: MessageSquarePlus,  color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',     hover: 'hover:border-blue-500/50' },
  improvement: { icon: TrendingUp,         color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20',hover: 'hover:border-emerald-500/50' }
};

const LABELS = {
  pt: {
    title: 'Centro de Feedback',
    subtitle: 'A sua opinião ajuda-nos a construir um produto melhor.',
    category: 'Categoria',
    categories: { bug: 'Relatório de Bug', feature: 'Sugestão de Funcionalidade', general: 'Feedback Geral', improvement: 'Sugestão de Melhoria' },
    rating: 'Como avalia a sua experiência?',
    ratingLabels: ['', 'Muito Mau', 'Mau', 'Razoável', 'Bom', 'Excelente'],
    message: 'Mensagem',
    messagePlaceholder: 'Descreva o seu feedback com o máximo de detalhe possível…',
    submit: 'Enviar Feedback',
    submitting: 'A enviar…',
    thankYou: 'Obrigado pelo seu feedback!',
    thankYouSub: 'A sua opinião é muito valiosa para nós. Vamos analisá-la com atenção.',
    sendMore: 'Enviar mais feedback',
    required: 'Selecione uma categoria e escreva uma mensagem.'
  },
  en: {
    title: 'Feedback Center',
    subtitle: 'Your opinion helps us build a better product.',
    category: 'Category',
    categories: { bug: 'Bug Report', feature: 'Feature Request', general: 'General Feedback', improvement: 'Improvement Suggestion' },
    rating: 'How do you rate your experience?',
    ratingLabels: ['', 'Very Bad', 'Bad', 'OK', 'Good', 'Excellent'],
    message: 'Message',
    messagePlaceholder: 'Describe your feedback in as much detail as possible…',
    submit: 'Submit Feedback',
    submitting: 'Submitting…',
    thankYou: 'Thank you for your feedback!',
    thankYouSub: 'Your opinion is very valuable to us. We will review it carefully.',
    sendMore: 'Send more feedback',
    required: 'Please select a category and write a message.'
  }
};

export default function FeedbackCenter() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = LABELS[language] || LABELS.en;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !message.trim()) { setError(t.required); return; }
    setError('');
    setSubmitting(true);
    try {
      const user = await api.auth.me();
      await api.entities.Feedback.create({
        workspace_id: user?.current_workspace_id || user?.default_workspace_id || '',
        user_id: user?.id || '',
        user_email: user?.email || '',
        user_name: user?.full_name || '',
        user_profile: user?.user_profile || 'professional',
        category,
        rating: rating || null,
        message: message.trim(),
        status: 'new'
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setCategory(''); setRating(0); setMessage(''); setSubmitted(false); setError('');
  };

  return (
    <div className="min-h-screen bg-background">
      
      

      <main className="p-5 lg:pt-8 md:p-8">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <MessageSquarePlus className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
                <p className="text-sm text-foreground/45">{t.subtitle}</p>
              </div>
            </div>
          </div>

          {submitted ? (
            /* ── Thank You ── */
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-8 py-14 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{t.thankYou}</h2>
              <p className="text-foreground/55 mb-6 text-sm">{t.thankYouSub}</p>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground border border-border hover:bg-white/8 transition-colors"
              >
                {t.sendMore}
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t.category}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(CATEGORIES).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const active = category === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCategory(key)}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${cfg.bg} ${cfg.hover} ${active ? 'ring-2 ring-offset-0' : ''}`}
                        style={active ? { ringColor: 'rgba(233,124,63,0.6)', borderColor: 'rgba(233,124,63,0.5)' } : {}}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
                        <span className={`text-sm font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {t.categories[key]}
                        </span>
                        {active && <div className="ml-auto w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t.rating}
                </label>
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          n <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                  {(hoverRating || rating) > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">{t.ratingLabels[hoverRating || rating]}</span>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t.message}
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t.messagePlaceholder}
                  rows={5}
                  className="w-full rounded-xl border border-border bg-white/4 text-foreground placeholder-white/25 text-sm px-4 py-3 resize-none focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/30 transition-all"
                />
                <div className="flex justify-between mt-1.5">
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <span className="text-xs text-muted-foreground ml-auto">{message.length} chars</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-foreground transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #e97c3f, #d4682a)' }}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitting ? t.submitting : t.submit}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
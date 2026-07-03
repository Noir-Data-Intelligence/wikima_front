import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../LanguageContext';
import { Sparkles, Send, X, CheckCircle2, Users, CheckSquare, Receipt, Wallet, Calendar, Zap, AlertTriangle, TrendingUp, Package, Clock } from 'lucide-react';
import { api } from '@/api/client';
import { usePersonalPayments } from '../../hooks/usePersonalPayments';
import { differenceInDays } from 'date-fns';

// ─── Company-specific insight generator ───────────────────────────────────────
function getCompanyInsights({ tasks, clients, invoices, projects, agendaEvents, products, teamMembers, language, todayStr }) {
  const pt = language === 'pt';
  const insights = [];

  const activeTasks = tasks.filter(t => !['completed', 'cancelled'].includes(t.status));
  const overdueTasks = activeTasks.filter(t => t.deadline && t.deadline.split('T')[0] < todayStr);
  const todayTasks = activeTasks.filter(t => t.deadline && t.deadline.split('T')[0] === todayStr);
  
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const pendingInvoices = invoices.filter(i => i.status === 'sent');
  const totalOutstanding = [...overdueInvoices, ...pendingInvoices].reduce((s, i) => s + (i.total || 0), 0);
  
  const activeProjects = projects.filter(p => ['planning', 'active', 'on_hold'].includes(p.status));
  const delayedProjects = activeProjects.filter(p => p.due_date && new Date(p.due_date) < new Date() && p.status !== 'completed');
  
  const followUps = clients.filter(c => c.next_action_date && c.next_action_date <= todayStr && c.status !== 'inactive');
  const inactiveClients = clients.filter(c => c.status === 'inactive' || (c.last_interaction_date && differenceInDays(new Date(todayStr), new Date(c.last_interaction_date)) > 60));
  
  const todayEvents = agendaEvents.filter(e => e.date === todayStr && e.status !== 'cancelled');
  const upcomingEvents = agendaEvents.filter(e => e.date > todayStr && e.date <= new Date(new Date(todayStr).setDate(new Date(todayStr).getDate() + 7)).toISOString().split('T')[0] && e.status !== 'cancelled');
  
  const lowStockProducts = products && products.filter(p => p.stock_quantity !== undefined && p.stock_quantity <= (p.min_stock_level || 5));

  // Critical alerts first
  if (overdueInvoices.length > 0) {
    const total = overdueInvoices.reduce((s, i) => s + (i.total || 0), 0);
    insights.push({
      priority: 0,
      type: 'critical',
      icon: Receipt,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      title: pt ? 'Faturas em Atraso' : 'Overdue Invoices',
      message: pt 
        ? `${overdueInvoices.length} fatura(s) totalizando €${total.toFixed(0)} estão vencidas.`
        : `${overdueInvoices.length} invoice(s) totaling €${total.toFixed(0)} are overdue.`,
      action: pt ? 'Cobrar agora' : 'Collect now',
      link: '/Invoices'
    });
  }

  if (delayedProjects.length > 0) {
    insights.push({
      priority: 1,
      type: 'warning',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      title: pt ? 'Projetos Atrasados' : 'Delayed Projects',
      message: pt
        ? `${delayedProjects.length} projeto(s) ultrapassaram o prazo: ${delayedProjects.slice(0, 2).map(p => p.name).join(', ')}${delayedProjects.length > 2 ? ` +${delayedProjects.length - 2}` : ''}.`
        : `${delayedProjects.length} project(s) past deadline: ${delayedProjects.slice(0, 2).map(p => p.name).join(', ')}${delayedProjects.length > 2 ? ` +${delayedProjects.length - 2}` : ''}.`,
      action: pt ? 'Rever prazos' : 'Review deadlines',
      link: '/Projects'
    });
  }

  if (overdueTasks.length > 0) {
    insights.push({
      priority: 2,
      type: 'warning',
      icon: CheckSquare,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      title: pt ? 'Tarefas em Atraso' : 'Overdue Tasks',
      message: pt
        ? `${overdueTasks.length} tarefa(s) estão atrasadas, incluindo "${overdueTasks[0].title}".`
        : `${overdueTasks.length} task(s) overdue, including "${overdueTasks[0].title}".`,
      action: pt ? 'Ver tarefas' : 'View tasks',
      link: '/Tasks'
    });
  }

  if (followUps.length > 0) {
    insights.push({
      priority: 3,
      type: 'info',
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      title: pt ? 'Follow-ups Pendentes' : 'Pending Follow-ups',
      message: pt
        ? `${followUps.length} cliente(s) precisam de atenção: ${followUps.slice(0, 2).map(c => c.name).join(', ')}${followUps.length > 2 ? ` +${followUps.length - 2}` : ''}.`
        : `${followUps.length} client(s) need attention: ${followUps.slice(0, 2).map(c => c.name).join(', ')}${followUps.length > 2 ? ` +${followUps.length - 2}` : ''}.`,
      action: pt ? 'Contactar' : 'Contact',
      link: '/Clients'
    });
  }

  if (todayEvents.length > 0) {
    insights.push({
      priority: 4,
      type: 'info',
      icon: Calendar,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      title: pt ? 'Eventos Hoje' : "Today's Events",
      message: pt
        ? `${todayEvents.length} evento(s): ${todayEvents.map(e => `"${e.title}" ${e.start_time}`).join(', ')}.`
        : `${todayEvents.length} event(s): ${todayEvents.map(e => `"${e.title}" ${e.start_time}`).join(', ')}.`,
      action: pt ? 'Ver agenda' : 'View agenda',
      link: '/Agenda'
    });
  }

  if (lowStockProducts && lowStockProducts.length > 0) {
    insights.push({
      priority: 5,
      type: 'warning',
      icon: Package,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      title: pt ? 'Stock Baixo' : 'Low Stock',
      message: pt
        ? `${lowStockProducts.length} produto(s) com stock crítico: ${lowStockProducts.slice(0, 2).map(p => p.name).join(', ')}${lowStockProducts.length > 2 ? ` +${lowStockProducts.length - 2}` : ''}.`
        : `${lowStockProducts.length} product(s) low on stock: ${lowStockProducts.slice(0, 2).map(p => p.name).join(', ')}${lowStockProducts.length > 2 ? ` +${lowStockProducts.length - 2}` : ''}.`,
      action: pt ? 'Repor stock' : 'Restock',
      link: '/Stock'
    });
  }

  if (pendingInvoices.length > 0 && overdueInvoices.length === 0) {
    insights.push({
      priority: 6,
      type: 'info',
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      title: pt ? 'Faturas Pendentes' : 'Pending Invoices',
      message: pt
        ? `${pendingInvoices.length} fatura(s) de €${totalOutstanding.toFixed(0)} aguardam pagamento.`
        : `${pendingInvoices.length} invoice(s) totaling €${totalOutstanding.toFixed(0)} awaiting payment.`,
      action: pt ? 'Ver faturas' : 'View invoices',
      link: '/Invoices'
    });
  }

  if (todayTasks.length > 0 && overdueTasks.length === 0) {
    insights.push({
      priority: 7,
      type: 'success',
      icon: Zap,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      title: pt ? 'Para Hoje' : 'Due Today',
      message: pt
        ? `${todayTasks.length} tarefa(s) para concluir hoje.`
        : `${todayTasks.length} task(s) to complete today.`,
      action: pt ? 'Ver tarefas' : 'View tasks',
      link: '/Tasks'
    });
  }

  if (inactiveClients.length > 0 && inactiveClients.length < clients.length) {
    insights.push({
      priority: 8,
      type: 'info',
      icon: Users,
      color: 'text-muted-foreground',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
      title: pt ? 'Clientes Inativos' : 'Inactive Clients',
      message: pt
        ? `${inactiveClients.length} cliente(s) sem interação há >60 dias.`
        : `${inactiveClients.length} client(s) with no interaction in >60 days.`,
      action: pt ? 'Reativar' : 'Re-engage',
      link: '/Clients'
    });
  }

  // Sort by priority and return top insights
  return insights.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

// ─── Onboarding suggestions for empty states ───────────────────────────────────
function getOnboardingSuggestions({ hasClients, hasInvoices, hasProjects, hasTasks, hasProducts, language }) {
  const pt = language === 'pt';
  const suggestions = [];

  if (!hasClients) {
    suggestions.push({
      icon: Users,
      color: 'text-blue-400',
      title: pt ? 'Adicionar Primeiro Cliente' : 'Add Your First Client',
      message: pt 
        ? 'Comece por registar os seus clientes para gerir relacionamentos e faturação.'
        : 'Start by registering your clients to manage relationships and billing.',
      action: pt ? 'Adicionar Cliente' : 'Add Client',
      link: '/Clients'
    });
  }

  if (!hasInvoices && hasClients) {
    suggestions.push({
      icon: Receipt,
      color: 'text-green-400',
      title: pt ? 'Criar Primeira Fatura' : 'Create Your First Invoice',
      message: pt
        ? 'Emita faturas profissionais para os seus serviços ou produtos.'
        : 'Issue professional invoices for your services or products.',
      action: pt ? 'Criar Fatura' : 'Create Invoice',
      link: '/Invoices'
    });
  }

  if (!hasProjects) {
    suggestions.push({
      icon: CheckSquare,
      color: 'text-purple-400',
      title: pt ? 'Criar Primeiro Projeto' : 'Create Your First Project',
      message: pt
        ? 'Organize o seu trabalho em projetos para melhor acompanhamento.'
        : 'Organize your work into projects for better tracking.',
      action: pt ? 'Criar Projeto' : 'Create Project',
      link: '/Projects'
    });
  }

  if (!hasTasks && hasProjects) {
    suggestions.push({
      icon: CheckSquare,
      color: 'text-primary',
      title: pt ? 'Adicionar Tarefas' : 'Add Tasks',
      message: pt
        ? 'Divida projetos em tarefas para acompanhar o progresso da equipa.'
        : 'Break down projects into tasks to track team progress.',
      action: pt ? 'Adicionar Tarefa' : 'Add Task',
      link: '/Tasks'
    });
  }

  if (!hasProducts) {
    suggestions.push({
      icon: Package,
      color: 'text-orange-400',
      title: pt ? 'Gerir Stock' : 'Manage Stock',
      message: pt
        ? 'Registe os seus produtos e controline os níveis de stock.'
        : 'Register your products and track stock levels.',
      action: pt ? 'Adicionar Produto' : 'Add Product',
      link: '/Stock'
    });
  }

  return suggestions.slice(0, 3);
}

// ─── LLM context builder for Company ──────────────────────────────────────────
function buildCompanyContext({ tasks, clients, invoices, documents, agendaEvents, projects, products, teamMembers, userName, language }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const activeTasks = tasks.filter(t => !['completed', 'cancelled'].includes(t.status));
  const overdueTasks = activeTasks.filter(t => t.deadline && t.deadline.split('T')[0] < todayStr);
  const activeProjects = projects.filter(p => ['planning', 'active', 'on_hold'].includes(p.status));
  const delayedProjects = activeProjects.filter(p => p.due_date && new Date(p.due_date) < new Date());
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const pendingInvoices = invoices.filter(i => i.status === 'sent');
  const totalOutstanding = [...overdueInvoices, ...pendingInvoices].reduce((s, i) => s + (i.total || 0), 0);
  const lowStock = products && products.filter(p => p.stock_quantity !== undefined && p.stock_quantity <= (p.min_stock_level || 5));
  const inactiveClients = clients.filter(c => c.status === 'inactive' || (c.last_interaction_date && differenceInDays(new Date(todayStr), new Date(c.last_interaction_date)) > 60));

  return `COMPANY CONTEXT | TODAY: ${todayStr} | USER: ${userName} | LANG: ${language === 'pt' ? 'PT' : 'EN'}
TASKS — Active:${activeTasks.length} Overdue:${overdueTasks.length} In Progress:${activeTasks.filter(t=>t.status==='in_progress').length}
Overdue tasks: ${overdueTasks.slice(0,5).map(t=>`"${t.title}"(${t.priority||'normal'})`).join(', ')||'none'}
PROJECTS — Active:${activeProjects.length} Delayed:${delayedProjects.length}
Delayed: ${delayedProjects.slice(0,3).map(p=>`"${p.name}" due:${p.due_date}`).join(', ')||'none'}
CLIENTS — Total:${clients.length} Inactive:${inactiveClients.length}
Inactive(>60d): ${inactiveClients.slice(0,5).map(c=>`"${c.name}"`).join(', ')||'none'}
INVOICES — Overdue:${overdueInvoices.length} Pending:${pendingInvoices.length} Outstanding:€${totalOutstanding.toFixed(0)}
Overdue: ${overdueInvoices.slice(0,5).map(i=>`"${i.client_name}"€${i.total}`).join(', ')||'none'}
STOCK — Low:${lowStock?lowStock.length:0}
Low stock: ${lowStock?lowStock.slice(0,5).map(p=>`"${p.name}" qty:${p.stock_quantity}`).join(', '):'none'}
TEAM: ${teamMembers?teamMembers.length:0} members
DOCS: ${documents.length}
CALENDAR — Today:${agendaEvents.filter(e=>e.date===todayStr).length} Week:${agendaEvents.filter(e=>e.date>todayStr&&e.date<=weekEndStr).length}`;
}

const SYSTEM_PT = `És o WiKima Assistant — assistente de operações empresariais para empresas. Tens acesso a dados reais: tarefas, projetos, clientes, faturas, stock, equipa, agenda. Responde SEMPRE em Português de Portugal. Sê direto, prático, focado em negócios — máximo 3-4 linhas. Não uses markdown pesado. Não inventes dados. Age como um consultor de operações experiente.`;
const SYSTEM_EN = `You are the WiKima Assistant — a business operations assistant for companies. You have access to live data: tasks, projects, clients, invoices, stock, team, calendar. Always respond in English. Be direct, practical, business-focused — max 3-4 lines. No heavy markdown. Never invent data. Act like an experienced operations consultant.`;

// ─── Quick action chips for Company ───────────────────────────────────────────
const CHIPS_PT = [
  { label: '📊 Visão Geral', msg: 'Qual é o estado geral do meu negócio?' },
  { label: '🧾 Faturas', msg: 'Qual o estado das minhas faturas?' },
  { label: '📁 Projetos', msg: 'Algum projeto está atrasado?' },
  { label: '👥 Clientes', msg: 'Que clientes precisam de atenção?' },
  { label: '📦 Stock', msg: 'Preciso de repor algum produto?' },
];
const CHIPS_EN = [
  { label: '📊 Overview', msg: 'What is the overall state of my business?' },
  { label: '🧾 Invoices', msg: 'What is the status of my invoices?' },
  { label: '📁 Projects', msg: 'Are any projects delayed?' },
  { label: '👥 Clients', msg: 'Which clients need attention?' },
  { label: '📦 Stock', msg: 'Do I need to restock any products?' },
];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function WikimaAI({
  tasks = [], clients = [], invoices = [], documents = [],
  agendaEvents = [], userName = '', isCompany = false,
  projects = [], products = [], teamMembers = []
}) {
  const { language } = useLanguage();
  const { payments: personalPayments } = usePersonalPayments();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const inputRef = useRef(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const pt = language === 'pt';

  // For Company: use business insights; for others: use personal/simple logic
  const insights = isCompany 
    ? getCompanyInsights({ tasks, clients, invoices, projects, agendaEvents, products, teamMembers, language, todayStr })
    : [];

  // Onboarding suggestions when no data exists
  const hasData = isCompany && (clients.length > 0 || invoices.length > 0 || projects.length > 0);
  const onboardingSuggestions = !hasData && isCompany
    ? getOnboardingSuggestions({
        hasClients: clients.length > 0,
        hasInvoices: invoices.length > 0,
        hasProjects: projects.length > 0,
        hasTasks: tasks.length > 0,
        hasProducts: products && products.length > 0,
        language
      })
    : [];

  const primaryInsight = insights.length > 0 ? insights[0] : null;
  const InsightIcon = primaryInsight?.icon || CheckCircle2;

  const chips = pt ? CHIPS_PT : CHIPS_EN;

  useEffect(() => {
    if (!response) return;
    const t = setTimeout(() => setResponse(null), 12000);
    return () => clearTimeout(t);
  }, [response]);

  const ask = async (text) => {
    const q = (text || input).trim();
    if (!q || isLoading) return;
    setInput('');
    setIsLoading(true);
    setResponse(null);

    try {
      const context = isCompany
        ? buildCompanyContext({ tasks, clients, invoices, documents, agendaEvents, projects, products, teamMembers, userName, language })
        : `Simple context for non-company workspace`;
      
      const sys = pt ? SYSTEM_PT : SYSTEM_EN;
      const result = await api.integrations.Core.InvokeLLM({
        prompt: `${sys}\n\n=== LIVE DATA ===\n${context}\n\n=== USER ===\n${q}`,
      });
      const reply = typeof result === 'string' ? result : result?.text || String(result);
      setResponse({ query: q, reply });
    } catch {
      setResponse({ query: q, reply: pt ? 'Ocorreu um erro. Tenta novamente.' : 'Something went wrong. Try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* ── Header row ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-shrink-0">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-foreground" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary ring-2 ring-[#131f36] animate-pulse" />
        </div>
        <span className="text-xs font-semibold text-foreground/80 tracking-wide">
          {isCompany ? (pt ? 'WiKima Business' : 'WiKima Business') : 'WiKima Assistant'}
        </span>

        {primaryInsight && (
          <div className={`flex items-center gap-1.5 ml-auto px-2 py-1 rounded-full border ${primaryInsight.bg} ${primaryInsight.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${primaryInsight.color}`} />
            <span className={`text-[10px] font-medium ${primaryInsight.color}`}>{primaryInsight.title}</span>
          </div>
        )}
      </div>

      {/* ── Proactive insights cards (Company only) ──────────────── */}
      {isCompany && insights.length > 0 && !response && !isLoading && (
        <div className="space-y-2">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <a
                key={idx}
                href={insight.link}
                className={`block p-3 rounded-xl border transition-all hover:scale-[1.01] ${insight.bg} ${insight.border} hover:bg-opacity-15`}
              >
                <div className="flex items-start gap-2.5">
                  <Icon className={`w-4 h-4 ${insight.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-semibold ${insight.color} mb-0.5`}>{insight.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{insight.message}</p>
                    {insight.action && (
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        {insight.action} →
                      </p>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* ── Onboarding suggestions (no data) ───────────────────── */}
      {isCompany && !hasData && !response && !isLoading && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground mb-1">
            {pt ? 'Comece por configurar o seu negócio:' : 'Start setting up your business:'}
          </p>
          {onboardingSuggestions.map((suggestion, idx) => {
            const Icon = suggestion.icon;
            return (
              <a
                key={idx}
                href={suggestion.link}
                className={`block p-3 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-all`}
              >
                <div className="flex items-start gap-2.5">
                  <Icon className={`w-4 h-4 ${suggestion.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-semibold ${suggestion.color} mb-0.5`}>{suggestion.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      {suggestion.action} →
                    </p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* ── Response card ──────────────────────────────────────── */}
      {(isLoading || response) && (
        <div className="rounded-xl border border-white/8 bg-[#0f1e38] px-3 py-2.5 relative">
          {response && !isLoading && (
            <button onClick={() => setResponse(null)} className="absolute top-2 right-2 text-muted-foreground hover:text-muted-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
          {response && (
            <p className="text-[10px] text-muted-foreground mb-1.5 pr-4">
              {pt ? 'Pediste:' : 'You asked:'} <span className="text-muted-foreground">{response.query}</span>
            </p>
          )}
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-blue-300/60">
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '120ms' }} />
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '240ms' }} />
              </span>
              <span>{pt ? 'A analisar dados…' : 'Analysing your data…'}</span>
            </div>
          ) : (
            <p className="text-sm text-blue-100/90 leading-relaxed whitespace-pre-wrap">{response?.reply}</p>
          )}
        </div>
      )}

      {/* ── Quick chips ───────────────────────────────────────── */}
      {!isLoading && !response && (
        <div className="flex flex-wrap gap-1">
          {chips.map(({ label, msg }) => (
            <button
              key={msg}
              onClick={() => ask(msg)}
              className="text-[10px] px-2 py-0.5 rounded-full border border-primary/20 text-primary/70 hover:bg-primary/90/10 hover:text-primary hover:border-primary/40 transition-all whitespace-nowrap"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Input row ─────────────────────────────────────────── */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && ask(input)}
          placeholder={pt ? 'Pergunte sobre o seu negócio…' : 'Ask about your business…'}
          disabled={isLoading}
          className="flex-1 h-8 px-3 rounded-lg bg-background border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
        />
        <button
          onClick={() => ask(input)}
          disabled={!input.trim() || isLoading}
          className="h-8 w-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 flex items-center justify-center disabled:opacity-40 transition-all"
        >
          <Send className="w-3 h-3 text-foreground" />
        </button>
      </div>
    </div>
  );
}
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowRight, Sparkles, CheckSquare, Users,
  FileText, Wallet, Calendar, Receipt, Check, Star, Zap, LayoutDashboard,
  TrendingUp, Quote,
} from 'lucide-react';

import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.5, ease: 'easeOut' } }),
};

function Reveal({ children, i = 0, className }) {
  return (
    <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} custom={i} variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

// Alternating image + text feature row
function FeatureRow({ reverse, badge, title, desc, points, image, icon: Icon }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal className={cn('order-2', reverse ? 'lg:order-2' : 'lg:order-1')}>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          {Icon && <Icon className="h-3.5 w-3.5" />} {badge}
        </span>
        <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h3>
        <p className="mt-3 text-lg text-muted-foreground">{desc}</p>
        <ul className="mt-6 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="h-3 w-3" />
              </span>
              <span className="text-foreground">{p}</span>
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal i={1} className={cn('order-1', reverse ? 'lg:order-1' : 'lg:order-2')}>
        <div className="relative overflow-hidden rounded-2xl border border-border shadow-xl">
          <img src={image} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5" />
        </div>
      </Reveal>
    </div>
  );
}

export default function Landing() {
  const { i18n } = useTranslation();
  const pt = (i18n.language || 'en').startsWith('pt');

  const stats = [
    { value: '5h+', label: pt ? 'poupadas por semana' : 'saved per week' },
    { value: '1', label: pt ? 'espaço para tudo' : 'workspace for everything' },
    { value: '6+', label: pt ? 'módulos integrados' : 'integrated modules' },
    { value: '100%', label: pt ? 'foco no que importa' : 'focus on what matters' },
  ];

  const features = [
    {
      badge: pt ? 'Tarefas' : 'Tasks', icon: CheckSquare, image: '/media/feature-tasks.jpg',
      title: pt ? 'Nunca mais perca uma tarefa' : 'Never lose track of a task',
      desc: pt ? 'Listas, kanban e calendário com prioridades e prazos claros — sempre sabe o que fazer a seguir.' : 'Lists, kanban and calendar with clear priorities and deadlines — always know what to do next.',
      points: pt ? ['Vistas Lista, Kanban e Calendário', 'Prioridades e prazos automáticos', 'Atribua e acompanhe a equipa'] : ['List, Kanban and Calendar views', 'Automatic priorities and deadlines', 'Assign and track your team'],
    },
    {
      badge: pt ? 'Clientes' : 'Clients', icon: Users, image: '/media/feature-clients.jpg', reverse: true,
      title: pt ? 'Todos os seus clientes, organizados' : 'All your clients, organized',
      desc: pt ? 'Pipeline, perfis e histórico completo — do primeiro contacto à fatura paga.' : 'Pipeline, profiles and full history — from first contact to paid invoice.',
      points: pt ? ['Pipeline visual de clientes', 'Histórico e documentos por cliente', 'Comunicação num só lugar'] : ['Visual client pipeline', 'History and documents per client', 'Communication in one place'],
    },
    {
      badge: pt ? 'Finanças' : 'Finances', icon: Wallet, image: '/media/feature-finance.jpg',
      title: pt ? 'Controlo financeiro sem folhas de cálculo' : 'Financial control without spreadsheets',
      desc: pt ? 'Faturas, recibos, caixa e despesas — com uma visão clara da saúde do seu negócio.' : 'Invoices, receipts, cash and expenses — with a clear view of your business health.',
      points: pt ? ['Faturas e recibos profissionais', 'Controlo de caixa e despesas', 'Relatórios financeiros claros'] : ['Professional invoices and receipts', 'Cash and expense control', 'Clear financial reports'],
    },
    {
      badge: pt ? 'Documentos' : 'Documents', icon: FileText, image: '/media/feature-docs.jpg', reverse: true,
      title: pt ? 'Documentos sempre à mão' : 'Documents always at hand',
      desc: pt ? 'Guarde, organize e encontre qualquer documento em segundos.' : 'Store, organize and find any document in seconds.',
      points: pt ? ['Organização por categorias', 'Pesquisa instantânea', 'Anexos ligados a clientes e tarefas'] : ['Category organization', 'Instant search', 'Attachments linked to clients and tasks'],
    },
  ];

  const steps = [
    { icon: Zap, title: pt ? 'Crie a sua conta' : 'Create your account', desc: pt ? 'Comece grátis em menos de um minuto — sem cartão de crédito.' : 'Start free in under a minute — no credit card.' },
    { icon: LayoutDashboard, title: pt ? 'Configure o seu espaço' : 'Set up your workspace', desc: pt ? 'Escolha o seu perfil e a WiKima adapta-se à forma como trabalha.' : 'Choose your profile and WiKima adapts to how you work.' },
    { icon: TrendingUp, title: pt ? 'Ganhe clareza' : 'Gain clarity', desc: pt ? 'Tarefas, clientes e finanças organizados — e horas de volta na sua semana.' : 'Tasks, clients and finances organized — and hours back in your week.' },
  ];

  const testimonials = [
    { avatar: '/media/avatar-1.jpg', name: 'Miguel Sousa', role: pt ? 'Consultor' : 'Consultant', quote: pt ? 'Deixei de andar entre cinco apps. Agora tenho tudo num sítio e poupo horas todas as semanas.' : 'I stopped juggling five apps. Now everything is in one place and I save hours every week.' },
    { avatar: '/media/avatar-2.jpg', name: 'Sofia Almeida', role: pt ? 'Gestora de PME' : 'SMB Manager', quote: pt ? 'A WiKima trouxe clareza ao caos. A equipa sabe sempre o que é prioritário.' : 'WiKima brought clarity to the chaos. The team always knows what matters most.' },
    { avatar: '/media/avatar-3.jpg', name: 'João Pereira', role: pt ? 'Freelancer' : 'Freelancer', quote: pt ? 'Faturas, clientes e tarefas finalmente num só lugar. Simples e profissional.' : 'Invoices, clients and tasks finally in one place. Simple and professional.' },
  ];

  return (
    <PublicLayout>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent" />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {pt ? 'O seu negócio, simplificado.' : 'Your business, simplified.'}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {pt ? 'Poupe 5 horas por semana em tarefas administrativas' : 'Save 5 hours a week on admin work'}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              {pt
                ? 'A WiKima reúne tarefas, clientes, documentos e finanças num sistema claro — para que se foque no que realmente faz crescer o seu negócio.'
                : 'WiKima brings tasks, clients, documents and finances into one clear system — so you can focus on what actually grows your business.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to="/register">{pt ? 'Começar grátis' : 'Start free'} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link to="/features">{pt ? 'Ver funcionalidades' : 'See features'}</Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> {pt ? 'Sem cartão de crédito' : 'No credit card'}</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> {pt ? 'Grátis para começar' : 'Free to start'}</span>
            </div>
          </Reveal>

          <Reveal i={1}>
            <Card className="border-border/70 shadow-2xl">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium"><CheckSquare className="h-5 w-5 text-primary" /> {pt ? 'Agenda de Hoje' : "Today's agenda"}</div>
                  <span className="text-xs text-muted-foreground">1/3</span>
                </div>
                <div className="space-y-2">
                  {[pt ? 'Preparar fatura do cliente' : 'Prepare client invoice', pt ? 'Rever documentos' : 'Review documents', pt ? 'Agendar reunião' : 'Schedule meeting'].map((label, idx) => (
                    <div key={idx} className={cn('flex items-center gap-3 rounded-lg border border-border px-3 py-3', idx === 0 && 'bg-primary/5')}>
                      <span className={cn('flex h-5 w-5 items-center justify-center rounded border', idx === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40')}>
                        {idx === 0 && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className={idx === 0 ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[{ i: Users, l: pt ? 'Clientes' : 'Clients' }, { i: Receipt, l: pt ? 'Faturas' : 'Invoices' }, { i: Calendar, l: pt ? 'Agenda' : 'Agenda' }].map((x, k) => (
                    <div key={k} className="flex flex-col items-center gap-1 rounded-lg border border-border py-3 text-xs text-muted-foreground">
                      <x.i className="h-4 w-4 text-primary" />{x.l}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ── STATS / TRUST BAR ── */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} i={i} className="text-center">
              <p className="font-display text-3xl font-bold tabular-nums text-primary sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── PROBLEM → SOLUTION ── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border border-border shadow-xl">
              <img src="/media/about-problem.jpg" alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
            </div>
          </Reveal>
          <Reveal i={1}>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {pt ? 'Cansado de andar entre mil ferramentas?' : 'Tired of juggling a dozen tools?'}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {pt
                ? 'Folhas de cálculo, e-mails, notas soltas e apps que não falam entre si. O trabalho torna-se caótico e o importante fica esquecido.'
                : 'Spreadsheets, emails, scattered notes and apps that don\'t talk to each other. Work becomes chaotic and the important things slip.'}
            </p>
            <p className="mt-4 text-lg font-medium text-foreground">
              {pt ? 'A WiKima substitui tudo isso por um sistema único, claro e intuitivo.' : 'WiKima replaces all of that with one clear, intuitive system.'}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FEATURE ROWS ── */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto w-full max-w-7xl space-y-20 px-4 py-20 sm:px-6 lg:space-y-28 lg:py-28">
          {features.map((f) => (
            <FeatureRow key={f.badge} {...f} />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{pt ? 'Comece em 3 passos' : 'Get started in 3 steps'}</h2>
          <p className="mt-3 text-muted-foreground">{pt ? 'Do registo à clareza total, em minutos.' : 'From sign-up to total clarity, in minutes.'}</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} i={i}>
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><s.icon className="h-5 w-5" /></span>
                    <span className="font-display text-4xl font-bold tabular-nums text-border">{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center gap-1 text-primary">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {pt ? 'Quem usa, recomenda' : 'Loved by the people who use it'}
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} i={i}>
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col p-6">
                    <Quote className="h-7 w-7 text-primary/30" />
                    <p className="mt-3 flex-1 text-foreground">"{t.quote}"</p>
                    <div className="mt-5 flex items-center gap-3">
                      <img src={t.avatar} alt={t.name} className="h-11 w-11 rounded-full object-cover" loading="lazy" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── KIMA ELEMENTS ── */}
      <section className="mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {pt ? 'Feito com propósito' : 'Crafted with purpose'}
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {pt ? 'A WiKima é um produto da Kima Elements' : 'WiKima is a product of Kima Elements'}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {pt
              ? 'Construímos ferramentas digitais que tornam o trabalho mais simples, claro e humano.'
              : 'We build digital tools that make work simpler, clearer and more human.'}
          </p>
          <Button asChild variant="outline" className="mt-6">
            <a href="https://kimaelements.com/" target="_blank" rel="noopener noreferrer">
              kimaelements.com <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </Reveal>
      </section>

      {/* ── FINAL CTA (video only) ── */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-3xl px-6 py-24 text-center sm:px-8">
          <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline preload="metadata" poster="/media/cta-bg.jpg">
            <source src="/media/bg-video-1.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, hsl(233 45% 9% / 0.9), hsl(236 55% 16% / 0.84))' }} />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold text-white sm:text-5xl">{pt ? 'Pronto para simplificar o seu negócio?' : 'Ready to simplify your business?'}</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">{pt ? 'Junte-se a quem já trabalha com mais clareza. Comece grátis hoje.' : 'Join those already working with more clarity. Start free today.'}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link to="/register">{pt ? 'Começar grátis' : 'Start free'} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 border-white/30 bg-white/5 px-8 text-base text-white hover:bg-white/15 hover:text-white">
                <Link to="/features">{pt ? 'Ver funcionalidades' : 'See features'}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

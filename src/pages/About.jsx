import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AlertCircle, CheckCircle, Heart, Target, Sparkles, Compass, ArrowRight,
  Building2,
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

// Alternating image + text row (reverse => image on the right)
function SplitRow({ reverse, eyebrow, icon: Icon, title, image, children }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal className={cn('order-2', reverse ? 'lg:order-2' : 'lg:order-1')}>
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {Icon && <Icon className="h-3.5 w-3.5" />} {eyebrow}
          </span>
        )}
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h2>
        <div className="mt-5 space-y-4 text-lg leading-relaxed text-muted-foreground">{children}</div>
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

export default function About() {
  const { i18n } = useTranslation();
  const pt = (i18n.language || 'en').startsWith('pt');

  const drivers = [
    { icon: Sparkles, t: pt ? 'Simplicidade sobre complexidade' : 'Simplicity over complexity', d: pt ? 'Cada funcionalidade existe para remover trabalho, não para o adicionar.' : 'Every feature exists to remove work, not add it.' },
    { icon: Target, t: pt ? 'Estrutura sem rigidez' : 'Structure without rigidity', d: pt ? 'Organização que se adapta à sua forma de trabalhar — não o contrário.' : 'Organization that adapts to how you work — not the other way around.' },
    { icon: Heart, t: pt ? 'Tecnologia ao serviço das pessoas' : 'Technology serving people', d: pt ? 'Ferramentas que apoiam as pessoas, em vez de as substituir.' : 'Tools that support people, instead of replacing them.' },
  ];

  const stats = [
    { value: '6+', label: pt ? 'módulos integrados' : 'integrated modules' },
    { value: '5h+', label: pt ? 'poupadas por semana' : 'saved per week' },
    { value: '1', label: pt ? 'sistema para tudo' : 'system for everything' },
    { value: 'PT · EN', label: pt ? 'multilíngue de raiz' : 'multilingual by design' },
  ];

  return (
    <PublicLayout>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-border">
        <img src="/media/hero.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(115deg, hsl(233 45% 8% / 0.94) 30%, hsl(236 55% 16% / 0.72))' }} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
          <motion.div initial="hidden" animate="show" custom={0} variants={fadeUp} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {pt ? 'Sobre a WiKima' : 'About WiKima'}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
              {pt ? 'Damos estrutura ao trabalho e clareza à sua vida' : 'We bring structure to work and clarity to your life'}
            </h1>
            <p className="mt-6 max-w-xl text-xl text-white/75">
              {pt
                ? 'A WiKima ajuda equipas e empresas a organizar o dia-a-dia com propósito. Sem confusão. Sem sobrecarga. Apenas progresso.'
                : 'WiKima helps teams and companies organize their day with purpose. No confusion. No overwhelm. Just progress.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
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

      {/* ── OUR STORY (text left / image right) ── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <SplitRow
          eyebrow={pt ? 'A nossa história' : 'Our story'}
          icon={Compass}
          title={pt ? 'Nascemos de uma frustração comum' : 'Born from a common frustration'}
          image="/media/team.jpg"
        >
          <p>{pt
            ? 'Vimos equipas talentosas a perder horas todos os dias entre folhas de cálculo, e-mails e apps que não comunicam. O trabalho importante ficava perdido no ruído.'
            : 'We watched talented teams lose hours every day between spreadsheets, emails and apps that never talk to each other. The important work got lost in the noise.'}</p>
          <p>{pt
            ? 'Decidimos construir o oposto: um único sistema, calmo e claro, onde tudo o que importa vive num só lugar — e cada pessoa sabe sempre qual é o próximo passo.'
            : 'We set out to build the opposite: one calm, clear system where everything that matters lives in one place — and every person always knows their next step.'}</p>
        </SplitRow>
      </section>

      {/* ── THE PROBLEM (image left / text right) ── */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <SplitRow
            reverse
            eyebrow={pt ? 'O problema' : 'The problem'}
            icon={AlertCircle}
            title={pt ? 'A produtividade tornou-se complicada' : 'Productivity got complicated'}
            image="/media/about-problem.jpg"
          >
            <p>{pt
              ? 'Muitas equipas sentem-se sobrecarregadas por ferramentas dispersas, tarefas infinitas e prioridades pouco claras. O trabalho torna-se caótico e o progresso parece lento — ou invisível.'
              : 'Too many teams feel overwhelmed by scattered tools, endless tasks and unclear priorities. Work becomes chaotic and progress feels slow — or invisible.'}</p>
            <p>{pt
              ? 'A maioria das ferramentas adiciona complexidade em vez de a reduzir. O que as organizações precisam é de clareza, estrutura e fluxo.'
              : 'Most tools add complexity instead of reducing it. What organizations need is clarity, structure and flow.'}</p>
          </SplitRow>
        </div>
      </section>

      {/* ── OUR SOLUTION (text left / image right + checklist) ── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <SplitRow
          eyebrow={pt ? 'A nossa solução' : 'Our solution'}
          icon={CheckCircle}
          title={pt ? 'Tudo num único sistema claro' : 'Everything in one clear system'}
          image="/media/about-solution.jpg"
        >
          <p>{pt
            ? 'A WiKima reúne tarefas, clientes, documentos, finanças e comunicação — organizados de uma forma que parece natural e intuitiva.'
            : 'WiKima brings together tasks, clients, documents, finances and communication — organized in a way that feels natural and intuitive.'}</p>
          <ul className="space-y-3">
            {[
              pt ? 'Sabe sempre o que precisa de ser feito' : 'Always know what needs to be done',
              pt ? 'Vê claramente o que é mais importante' : 'Clearly see what matters most',
              pt ? 'Tem sempre o próximo passo definido' : 'Always have your next step defined',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <CheckCircle className="h-4 w-4" />
                </span>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <p className="font-medium text-foreground">{pt ? 'Menos ruído. Mais foco. Melhores decisões.' : 'Less noise. More focus. Better decisions.'}</p>
        </SplitRow>
      </section>

      {/* ── WHAT DRIVES US (3 value cards) ── */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <Heart className="h-3.5 w-3.5" /> {pt ? 'O que nos move' : 'What drives us'}
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {pt ? 'Princípios que guiam cada decisão' : 'Principles behind every decision'}
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {drivers.map((d, i) => (
              <Reveal key={d.t} i={i}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <d.icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{d.t}</h3>
                    <p className="mt-2 text-muted-foreground">{d.d}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── KIMA ELEMENTS (centered) ── */}
      <section className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Building2 className="h-3.5 w-3.5" /> {pt ? 'Feito com propósito' : 'Crafted with purpose'}
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {pt ? 'A WiKima é um produto da Kima Elements' : 'WiKima is a product of Kima Elements'}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {pt
              ? 'A Kima Elements constrói ferramentas digitais que tornam o trabalho mais simples, claro e humano. A WiKima é a nossa resposta ao caos administrativo do dia-a-dia — desenhada com o mesmo cuidado que colocamos em tudo o que fazemos.'
              : 'Kima Elements builds digital tools that make work simpler, clearer and more human. WiKima is our answer to everyday administrative chaos — designed with the same care we put into everything we build.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <a href="https://kimaelements.com/" target="_blank" rel="noopener noreferrer">
                {pt ? 'Conheça a Kima Elements' : 'Discover Kima Elements'} <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* ── VISION (full-bleed band) ── */}
      <section className="relative overflow-hidden">
        <img src="/media/about-vision.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, hsl(233 45% 9% / 0.92), hsl(236 55% 15% / 0.86))' }} />
        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-24 text-center sm:px-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Compass className="h-8 w-8" />
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{pt ? 'A nossa visão' : 'Our vision'}</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/75">{pt
            ? 'Imaginamos um futuro onde organizar o trabalho parece calmo, intencional e capacitador. A WiKima aspira tornar-se uma referência global em organização administrativa moderna.'
            : 'We envision a future where organizing work feels calm, intentional and empowering. WiKima aims to become a global reference for modern administrative organization.'}</p>
          <div className="mt-8 space-y-1.5 text-xl font-medium text-white">
            <p>{pt ? 'Um sistema.' : 'One system.'}</p>
            <p>{pt ? 'Um caminho claro para a frente.' : 'One clear way forward.'}</p>
            <p>{pt ? 'Construído para escalar. Construído para pessoas.' : 'Built to scale. Built for people.'}</p>
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="px-4 py-24 text-center sm:px-6">
        <Reveal>
          <p className="mx-auto max-w-3xl font-display text-2xl font-semibold text-foreground sm:text-3xl">
            {pt ? 'A WiKima é mais do que software de produtividade.' : 'WiKima is more than productivity software.'}
          </p>
          <p className="mt-3 font-display text-2xl font-semibold text-primary sm:text-3xl">
            {pt ? 'É uma forma de trabalhar — e viver — com intenção.' : "It's a way to work — and live — with intention."}
          </p>
          <Button asChild size="lg" className="mt-8 h-12 px-8 text-base">
            <Link to="/register">{pt ? 'Experimentar a WiKima' : 'Try WiKima'} <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </Reveal>
      </section>
    </PublicLayout>
  );
}

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  CheckSquare, Users, FileText, Receipt, MessageSquare, BarChart3,
  Wallet, Calendar, ArrowRight,
} from 'lucide-react';

import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.45, ease: 'easeOut' } }),
};

export default function Features() {
  const { i18n } = useTranslation();
  const pt = (i18n.language || 'en').startsWith('pt');

  const features = [
    { icon: CheckSquare, title: pt ? 'Gestão de Tarefas' : 'Task Management', desc: pt ? 'Listas, kanban e calendário com prioridades e prazos claros.' : 'Lists, kanban and calendar with clear priorities and deadlines.' },
    { icon: Users, title: pt ? 'Gestão de Clientes' : 'Client Management', desc: pt ? 'Pipeline, perfis e histórico completo de cada cliente.' : 'Pipeline, profiles and full history for every client.' },
    { icon: FileText, title: pt ? 'Documentos' : 'Documents', desc: pt ? 'Guarde, organize e encontre documentos por categoria.' : 'Store, organize and find documents by category.' },
    { icon: Receipt, title: pt ? 'Faturação & Recibos' : 'Invoicing & Receipts', desc: pt ? 'Emita faturas e recibos e acompanhe pagamentos.' : 'Issue invoices and receipts and track payments.' },
    { icon: Wallet, title: pt ? 'Finanças' : 'Finances', desc: pt ? 'Controlo de caixa, despesas e visão financeira num relance.' : 'Cash control, expenses and a financial overview at a glance.' },
    { icon: Calendar, title: pt ? 'Agenda' : 'Agenda', desc: pt ? 'Eventos e compromissos sincronizados com o seu trabalho.' : 'Events and appointments synced with your work.' },
    { icon: MessageSquare, title: pt ? 'Mensagens' : 'Messages', desc: pt ? 'Comunique com clientes e equipa sem sair da app.' : 'Communicate with clients and team without leaving the app.' },
    { icon: BarChart3, title: pt ? 'Relatórios & Análises' : 'Reports & Analytics', desc: pt ? 'Métricas claras para decidir com confiança.' : 'Clear metrics to decide with confidence.' },
  ];

  return (
    <PublicLayout>
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6">
          <motion.h1 initial="hidden" animate="show" variants={fadeUp}
            className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {pt ? 'Tudo o que precisa para gerir o seu negócio' : 'Everything you need to run your business'}
          </motion.h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {pt ? 'Um só espaço para tarefas, clientes, documentos e finanças.' : 'One workspace for tasks, clients, documents and finances.'}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div key={f.title} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i} variants={fadeUp}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="p-6">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link to="/register">{pt ? 'Começar grátis' : 'Start free'} <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}

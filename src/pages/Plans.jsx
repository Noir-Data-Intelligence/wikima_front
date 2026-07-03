import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowRight } from 'lucide-react';

import PublicLayout from '@/components/layout/PublicLayout';
import EmptyState from '@/components/data/EmptyState';
import { Button } from '@/components/ui/button';

export default function Plans() {
  const { i18n } = useTranslation();
  const pt = (i18n.language || 'en').startsWith('pt');

  return (
    <PublicLayout>
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {pt ? 'Planos' : 'Plans'}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          {pt
            ? 'Estamos a finalizar os planos. Crie uma conta gratuita para começar já e ser dos primeiros a saber.'
            : 'We are finalizing our plans. Create a free account to get started now and be among the first to know.'}
        </p>

        <div className="mt-10 w-full">
          <EmptyState
            icon={Sparkles}
            title={pt ? 'Preços em breve' : 'Pricing coming soon'}
            description={pt
              ? 'As informações de preços estarão disponíveis em breve.'
              : 'Pricing information will be available soon.'}
            action={
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link to="/register">{pt ? 'Criar conta grátis' : 'Create free account'} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            }
          />
        </div>
      </section>
    </PublicLayout>
  );
}

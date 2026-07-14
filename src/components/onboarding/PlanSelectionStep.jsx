import { CheckCircle2 } from 'lucide-react';

export default function PlanSelectionStep({ 
  language, 
  formData, 
  selectedPlan, 
  setSelectedPlan 
}) {
  const getPlanPrice = (plan) => {
    const prices = {
      free: { AOA: '0 Kz', EUR: '0€', USD: '$0', BRL: 'R$0', GBP: '£0' },
      starter: { AOA: '4,990 Kz', EUR: '19€', USD: '$19', BRL: 'R$89', GBP: '£17' },
      growth: { AOA: '11,990 Kz', EUR: '49€', USD: '$49', BRL: 'R$249', GBP: '£45' },
      business: { AOA: '24,990 Kz', EUR: '99€', USD: '$99', BRL: 'R$499', GBP: '£89' }
    };
    return prices[plan][formData.currency] || prices[plan]['EUR'];
  };

  const recommendedPlanKey = formData.recommendedPlan || 'starter';

  return (
    <div className="text-center">
      <h3 className="text-2xl font-bold text-foreground mb-2">
        {language === 'pt' ? 'Escolha seu plano' : 'Choose your plan'}
      </h3>
      <p className="text-muted-foreground mb-8">
        {language === 'pt' 
          ? `Baseado nos seus objetivos, recomendamos o plano ${recommendedPlanKey.toUpperCase()}`
          : `Based on your goals, we recommend the ${recommendedPlanKey.toUpperCase()} plan`}
      </p>

      <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
        {/* FREE Plan */}
        <div 
          onClick={() => setSelectedPlan('free')}
          className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
            selectedPlan === 'free' 
              ? 'border-primary bg-primary/10' 
              : 'border-border bg-muted/50 hover:border-white/40'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-foreground">FREE</h4>
            {selectedPlan === 'free' && (
              <CheckCircle2 className="w-6 h-6 text-primary" />
            )}
          </div>
          <p className="text-3xl font-bold text-foreground mb-4">
            {getPlanPrice('free')}
          </p>
          <div className="mb-4 p-2 bg-orange-500/10 rounded border border-orange-500/30">
            <p className="text-xs text-orange-300 font-semibold">
              {language === 'pt' ? '⚠️ TESTE LIMITADO' : '⚠️ LIMITED TRIAL'}
            </p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>{language === 'pt' ? '5 tarefas (sem prioridades)' : '5 tasks (no priorities)'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>{language === 'pt' ? '5 documentos (sem partilha)' : '5 documents (no sharing)'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>{language === 'pt' ? '3 clientes' : '3 clients'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>{language === 'pt' ? '1 fatura total' : '1 invoice total'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>{language === 'pt' ? 'WiKima AI (3 interações)' : 'WiKima AI (3 interactions)'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 mt-0.5">✗</span>
              <span className="text-blue-300/60">{language === 'pt' ? 'Sem calendário' : 'No calendar'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 mt-0.5">✗</span>
              <span className="text-blue-300/60">{language === 'pt' ? 'Sem integrações' : 'No integrations'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 mt-0.5">✗</span>
              <span className="text-blue-300/60">{language === 'pt' ? 'Sem equipa' : 'No team features'}</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-blue-300">
              {language === 'pt' 
                ? '📧 Suporte por email (72h)' 
                : '📧 Email support (72h)'}
            </p>
          </div>
        </div>

        {/* Recommended Plan */}
        <div 
          onClick={() => setSelectedPlan(recommendedPlanKey)}
          className={`p-6 rounded-xl border-2 transition-all cursor-pointer relative ${
            selectedPlan === recommendedPlanKey 
              ? 'border-orange-500 bg-orange-500/10' 
              : 'border-border bg-muted/50 hover:border-white/40'
          }`}
        >
          <div className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold text-foreground"
               style={{ backgroundColor: '#e97c3f' }}>
            {language === 'pt' ? 'RECOMENDADO' : 'RECOMMENDED'}
          </div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-foreground">{recommendedPlanKey.toUpperCase()}</h4>
            {selectedPlan === recommendedPlanKey && (
              <CheckCircle2 className="w-6 h-6 text-orange-400" />
            )}
          </div>
          <p className="text-3xl font-bold text-foreground mb-4">
            {getPlanPrice(recommendedPlanKey)}
            <span className="text-sm text-muted-foreground ml-1">/mês</span>
          </p>
          <div className="mb-4 p-2 rounded" style={{ backgroundColor: 'rgba(233, 124, 63, 0.1)', border: '1px solid rgba(233, 124, 63, 0.3)' }}>
            <p className="text-xs font-semibold" style={{ color: '#e97c3f' }}>
              {language === 'pt' ? '⭐ ACESSO COMPLETO' : '⭐ FULL ACCESS'}
            </p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>{language === 'pt' ? 'Clientes ilimitados' : 'Unlimited clients'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>{language === 'pt' ? 'Tarefas ilimitadas' : 'Unlimited tasks'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>{language === 'pt' ? 'Faturas ilimitadas' : 'Unlimited invoices'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>{language === 'pt' ? 'Todas as integrações' : 'All integrations'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>{language === 'pt' ? 'Relatórios avançados' : 'Advanced reports'}</span>
            </li>
            {recommendedPlanKey !== 'starter' && (
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>{language === 'pt' ? 'Suporte prioritário' : 'Priority support'}</span>
              </li>
            )}
          </ul>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-blue-300">
              {language === 'pt' 
                ? 'Pode cancelar a qualquer momento' 
                : 'Cancel anytime'}
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm text-blue-300 mt-6">
        {language === 'pt' 
          ? 'Pode mudar de plano a qualquer momento nas configurações' 
          : 'You can change plans anytime in settings'}
      </p>
    </div>
  );
}
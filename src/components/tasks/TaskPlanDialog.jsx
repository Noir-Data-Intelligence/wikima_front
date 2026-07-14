import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { api } from '@/api/client';

const PRIORITY_OPTIONS = [
  { value: 'low', label_pt: 'Baixa', label_en: 'Low' },
  { value: 'medium', label_pt: 'Média', label_en: 'Medium' },
  { value: 'high', label_pt: 'Alta', label_en: 'High' },
  { value: 'urgent', label_pt: 'Urgente', label_en: 'Urgent' }
];

export default function TaskPlanDialog({ open, onClose, task, onSave, language }) {
  const pt = language === 'pt';
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const generatePlan = async () => {
    if (!task?.title) return;
    
    setLoading(true);
    try {
      const prompt = `You are a project management AI assistant. Analyze this task and generate 3 different execution plans with varying levels of detail and time estimates.

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
${task.deadline ? `Deadline: ${task.deadline}` : ''}

For each plan, provide:
1. Priority level (low, medium, high, or urgent)
2. Estimated hours to complete
3. Brief explanation of the approach

Return ONLY valid JSON in this exact format:
{
  "plans": [
    {
      "priority": "medium",
      "estimated_hours": 4,
      "approach": "Quick implementation focusing on essentials"
    },
    {
      "priority": "high", 
      "estimated_hours": 8,
      "approach": "Comprehensive approach with quality checks"
    },
    {
      "priority": "urgent",
      "estimated_hours": 2,
      "approach": "Rapid execution for immediate delivery"
    }
  ]
}`;

      const response = await api.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            plans: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                  estimated_hours: { type: "number" },
                  approach: { type: "string" }
                },
                required: ["priority", "estimated_hours", "approach"]
              }
            }
          },
          required: ["plans"]
        }
      });

      setPlan(response.data.plans);
      setSelectedPlan(response.data.plans[0]);
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (selectedPlan) {
      onSave(selectedPlan);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-border text-foreground">
        <div className="px-5 pt-4 pb-2.5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {pt ? 'Plano de Tarefa com IA' : 'AI Task Plan'}
          </h2>
        </div>

        <div className="px-5 py-3.5 space-y-4">
          {!plan && !loading && (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="text-sm font-medium text-foreground mb-1">
                {pt ? 'Gerar Plano Inteligente' : 'Generate Smart Plan'}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {pt 
                  ? 'A IA analisará a tarefa e sugerirá 3 planos com diferentes níveis de prioridade e tempo estimado.'
                  : 'AI will analyze the task and suggest 3 plans with different priority levels and time estimates.'
                }
              </p>
              <Button
                onClick={generatePlan}
                className="text-xs"
                style={{ backgroundColor: '#e97c3f' }}
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                {pt ? 'Gerar Planos' : 'Generate Plans'}
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-xs text-muted-foreground">
                {pt ? 'A gerar planos...' : 'Generating plans...'}
              </p>
            </div>
          )}

          {plan && (
            <>
              <div className="space-y-2">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {pt ? 'Planos Sugeridos' : 'Suggested Plans'}
                </Label>
                
                <div className="space-y-2">
                  {plan.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPlan(p)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPlan === p
                          ? 'bg-primary/10 border-primary/50'
                          : 'bg-background border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-foreground">
                          {pt ? 'Plano' : 'Plan'} {idx + 1}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          p.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                          p.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          p.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {p.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        ⏱️ {p.estimated_hours} {pt ? 'horas' : 'hours'}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {p.approach}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPlan && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {pt ? 'Selecionado:' : 'Selected:'}{' '}
                      <span className="text-foreground">{selectedPlan.estimated_hours}h</span> ·{' '}
                      <span className={
                        selectedPlan.priority === 'urgent' ? 'text-red-400' :
                        selectedPlan.priority === 'high' ? 'text-orange-400' :
                        selectedPlan.priority === 'medium' ? 'text-yellow-400' :
                        'text-green-400'
                      }>{selectedPlan.priority.toUpperCase()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="h-8 text-xs border-border text-muted-foreground hover:bg-accent/50"
                      >
                        {pt ? 'Cancelar' : 'Cancel'}
                      </Button>
                      <Button
                        onClick={handleSave}
                        className="h-8 text-xs"
                        style={{ backgroundColor: '#e97c3f' }}
                      >
                        {pt ? 'Aplicar Plano' : 'Apply Plan'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
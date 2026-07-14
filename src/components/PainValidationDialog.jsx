import { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { api } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { HelpCircle } from 'lucide-react';

export default function PainValidationDialog() {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    stressTask: '',
    timeTask: '',
    automationTask: ''
  });

  useEffect(() => {
    // Show dialog after 2 minutes if not already submitted
    const hasSubmitted = localStorage.getItem('wikima_pain_validation');
    if (!hasSubmitted) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 120000); // 2 minutes
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const user = await api.auth.me();
      
      // Save to Feedback collection
      await api.entities.Feedback.create({
        stressTask: formData.stressTask,
        timeTask: formData.timeTask,
        automationTask: formData.automationTask,
        userId: user.id
      });
      
      setSubmitted(true);
      localStorage.setItem('wikima_pain_validation', 'true');
      
      setTimeout(() => {
        setOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-amber-700" />
            </div>
            <DialogTitle className="text-xl">{t('pain_title')}</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {language === 'pt' 
              ? 'As suas respostas ajudam-nos a tornar a WiKima ainda mais útil para si.'
              : 'Your answers help us make WiKima even more useful for you.'}
          </p>
        </DialogHeader>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="stress_task" className="text-sm font-medium mb-2">
                {t('pain_question_1')}
              </Label>
              <Textarea
                id="stress_task"
                value={formData.stressTask}
                onChange={(e) => setFormData({...formData, stressTask: e.target.value})}
                placeholder={language === 'pt' ? 'Ex: Criar faturas manualmente...' : 'Ex: Creating invoices manually...'}
                rows={2}
                required
              />
            </div>

            <div>
              <Label htmlFor="time_task" className="text-sm font-medium mb-2">
                {t('pain_question_2')}
              </Label>
              <Textarea
                id="time_task"
                value={formData.timeTask}
                onChange={(e) => setFormData({...formData, timeTask: e.target.value})}
                placeholder={language === 'pt' ? 'Ex: Responder a emails...' : 'Ex: Responding to emails...'}
                rows={2}
                required
              />
            </div>

            <div>
              <Label htmlFor="automate_task" className="text-sm font-medium mb-2">
                {t('pain_question_3')}
              </Label>
              <Textarea
                id="automate_task"
                value={formData.automationTask}
                onChange={(e) => setFormData({...formData, automationTask: e.target.value})}
                placeholder={language === 'pt' ? 'Ex: Envio automático de propostas...' : 'Ex: Automatic proposal sending...'}
                rows={2}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {language === 'pt' ? 'Mais tarde' : 'Later'}
              </Button>
              <Button type="submit" className="bg-amber-700 hover:bg-amber-800">
                {t('pain_submit')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {t('pain_thanks')}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'pt'
                ? 'Vamos trabalhar para automatizar essas tarefas para si.'
                : 'We will work to automate those tasks for you.'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
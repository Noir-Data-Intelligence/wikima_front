import React from 'react';
import { useLanguage } from '../LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { enUS } from 'date-fns/locale/en-US';

export default function MoveToMonthDialog({ open, onClose, onMove, transaction }) {
  const { language } = useLanguage();
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  React.useEffect(() => {
    if (transaction?.date) {
      setSelectedDate(new Date(transaction.date));
    }
  }, [transaction]);

  const handleMove = () => {
    const newDate = selectedDate.toISOString().split('T')[0];
    onMove(newDate);
  };

  const locale = language === 'pt' ? ptBR : enUS;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-background border border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            {language === 'pt' ? 'Mover para outro mês' : 'Move to another month'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {language === 'pt' 
              ? `Escolhe uma nova data para esta transação (${transaction?.note || transaction?.category}).`
              : `Choose a new date for this transaction (${transaction?.note || transaction?.category}).`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={locale}
            className="rounded-xl border border-border bg-muted/50"
          />
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">{language === 'pt' ? 'Data selecionada:' : 'Selected date:'}</span>
          <span className="text-sm font-medium text-foreground">{format(selectedDate, 'dd MMMM yyyy', { locale })}</span>
        </div>

        <DialogFooter className="gap-2">
          <Button onClick={onClose} variant="outline" className="bg-transparent border-border text-foreground hover:bg-accent">
            {language === 'pt' ? 'Cancelar' : 'Cancel'}
          </Button>
          <Button onClick={handleMove} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-foreground">
            {language === 'pt' ? 'Mover' : 'Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
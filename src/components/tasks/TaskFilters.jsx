import React from 'react';
import { useLanguage } from '../../components/LanguageContext';
import { X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TaskFilters({ filterStatus, setFilterStatus, filterClient, setFilterClient, clients, language }) {
  const pt = language === 'pt';
  
  const statusLabels = {
    all: pt ? 'Todos Estados' : 'All Status',
    todo: pt ? 'Não Iniciada' : 'Not Started',
    in_progress: pt ? 'Em Progresso' : 'In Progress',
    waiting: pt ? 'Em Espera' : 'Waiting',
    completed: pt ? 'Concluída' : 'Completed'
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="h-7 text-xs w-32 bg-background border-border text-foreground">
          <SelectValue placeholder={statusLabels.all} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{statusLabels.all}</SelectItem>
          <SelectItem value="todo">{statusLabels.todo}</SelectItem>
          <SelectItem value="in_progress">{statusLabels.in_progress}</SelectItem>
          <SelectItem value="waiting">{statusLabels.waiting}</SelectItem>
          <SelectItem value="completed">{statusLabels.completed}</SelectItem>
        </SelectContent>
      </Select>

      {clients.length > 0 && (
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="h-7 text-xs w-40 bg-background border-border text-foreground">
            <SelectValue placeholder={pt ? 'Todos Clientes' : 'All Clients'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{pt ? 'Todos Clientes' : 'All Clients'}</SelectItem>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.name}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {(filterStatus !== 'all' || filterClient !== 'all') && (
        <button
          onClick={() => { setFilterStatus('all'); setFilterClient('all'); }}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent/50 transition-all"
        >
          <X className="w-3 h-3" />
          {pt ? 'Limpar' : 'Clear'}
        </button>
      )}
    </div>
  );
}
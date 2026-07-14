import { CheckSquare, Calendar } from 'lucide-react';

const PRIORITY_COLORS = {
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  urgent: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
};

export default function TaskCard({ task, onEdit, language }) {
  const pt = language === 'pt';
  
  const priorityLabels = {
    low: pt ? 'Baixa' : 'Low',
    medium: pt ? 'Média' : 'Medium',
    high: pt ? 'Alta' : 'High',
    urgent: pt ? 'Urgente' : 'Urgent'
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

  return (
    <div
      onClick={() => onEdit(task)}
      className="p-2.5 rounded border border-border bg-[#111827] hover:border-border transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <h4 className="text-[11px] font-medium text-foreground leading-tight flex-1 truncate">
            {task.title}
          </h4>
          {task.is_recurring && (
            <span className="text-[8px] flex-shrink-0">🔄</span>
          )}
        </div>
        {task.status === 'completed' && <CheckSquare className="w-3 h-3 text-green-400 flex-shrink-0" />}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-1">
        <span className={`text-[9px] px-1 py-0.5 rounded border ${PRIORITY_COLORS[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
        
        {task.client_name && (
          <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">
            {task.client_name}
          </span>
        )}
      </div>

      {task.deadline && (
        <div className={`text-[9px] flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
          <Calendar className="w-2.5 h-2.5" />
          {new Date(task.deadline).toLocaleDateString(pt ? 'pt-PT' : 'en-US', { month: 'short', day: 'numeric' })}
        </div>
      )}

      {/* Time Tracking */}
      {task.estimated_hours > 0 && (
        <div className="mt-1.5">
          <div className="flex items-center justify-between text-[8px] text-muted-foreground mb-0.5">
            <span>{task.actual_hours || 0}h / {task.estimated_hours}h</span>
            <span className={task.actual_hours > task.estimated_hours ? 'text-red-400' : 'text-foreground'}>
              {Math.round((task.actual_hours / task.estimated_hours) * 100)}%
            </span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                task.actual_hours > task.estimated_hours ? 'bg-red-500' : 
                task.actual_hours > task.estimated_hours * 0.8 ? 'bg-yellow-500' : 
                'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (task.actual_hours / task.estimated_hours) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
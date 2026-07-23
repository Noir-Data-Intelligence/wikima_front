import { AlertCircle } from 'lucide-react';

const STATUS_COLORS = {
  todo: 'bg-slate-500/20 text-muted-foreground border-slate-500/30',
  in_progress: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  waiting: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

const PRIORITY_COLORS = {
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  urgent: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
};

export default function TaskRow({ task, onEdit, onStatusChange, language, userType }) {
  const pt = language === 'pt';
  const isIndividual = userType === 'individual';
  
  const statusLabels = {
    todo: pt ? 'Não Iniciada' : 'Not Started',
    in_progress: pt ? 'Em Progresso' : 'In Progress',
    waiting: pt ? 'Em Espera' : 'Waiting',
    completed: pt ? 'Concluída' : 'Completed',
    cancelled: pt ? 'Cancelada' : 'Cancelled'
  };

  const priorityLabels = {
    low: pt ? 'Baixa' : 'Low',
    medium: pt ? 'Média' : 'Medium',
    high: pt ? 'Alta' : 'High',
    urgent: pt ? 'Urgente' : 'Urgent'
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

  // Time tracking for company
  const estimatedHours = task.estimated_hours || 0;
  const actualHours = task.actual_hours || 0;
  const timeProgress = estimatedHours > 0 ? Math.round((actualHours / estimatedHours) * 100) : 0;
  const isOverBudget = timeProgress > 100;

  return (
    <div className="group grid grid-cols-12 gap-3 px-4 py-2 hover:bg-background transition-all cursor-pointer" onClick={() => onEdit(task)}>
      {/* Task Title */}
      <div className="col-span-3 flex items-center gap-2 min-w-0">
        <div 
          className={`w-2 h-2 rounded-full flex-shrink-0 cursor-pointer ${
            task.status === 'completed' ? 'bg-green-400' :
            task.status === 'in_progress' ? 'bg-indigo-400' :
            task.status === 'waiting' ? 'bg-yellow-400' :
            'bg-slate-400'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            const nextStatus = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'waiting' : 'completed';
            onStatusChange(task, nextStatus);
          }}
        />
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={`text-xs font-medium truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </span>
          {task.is_recurring && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 flex-shrink-0">
              🔄
            </span>
          )}
        </div>
      </div>

      {/* Client */}
      {!isIndividual && (
        <div className="col-span-2 flex items-center">
          <span className="text-xs text-muted-foreground truncate">{task.client_name || '-'}</span>
        </div>
      )}

      {/* Assigned To */}
      {userType === 'company' && (
        <div className="col-span-2 flex items-center">
          <span className="text-xs text-muted-foreground truncate">{task.assigned_to_name || '-'}</span>
        </div>
      )}

      {/* Time Tracking - company only */}
      {userType === 'company' && (
        <div className="col-span-2 flex items-center gap-2">
          {estimatedHours > 0 ? (
            <div className="flex-1">
              <div className="flex items-center justify-between text-[9px] mb-0.5">
                <span className="text-muted-foreground">{actualHours.toFixed(1)}h / {estimatedHours.toFixed(1)}h</span>
                <span className={`font-medium ${isOverBudget ? 'text-red-400' : 'text-foreground'}`}>{timeProgress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${isOverBudget ? 'bg-red-500' : timeProgress > 80 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, timeProgress)}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>
      )}

      {/* Status */}
      <div className="col-span-2 flex items-center">
        <select
          value={task.status}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(task, e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          className={`text-[10px] px-2 py-1 rounded border cursor-pointer ${STATUS_COLORS[task.status]} bg-card focus:outline-none`}
        >
          <option value="todo">{statusLabels.todo}</option>
          <option value="in_progress">{statusLabels.in_progress}</option>
          <option value="waiting">{statusLabels.waiting}</option>
          <option value="completed">{statusLabels.completed}</option>
        </select>
      </div>

      {/* Due Date */}
      <div className="col-span-1 flex items-center gap-1.5">
        <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
          {task.deadline ? new Date(task.deadline).toLocaleDateString(pt ? 'pt-PT' : 'en-US') : '-'}
        </span>
        {isOverdue && <AlertCircle className="w-3 h-3 text-red-400" />}
      </div>
    </div>
  );
}
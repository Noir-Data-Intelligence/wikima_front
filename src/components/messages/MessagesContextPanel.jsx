import React from 'react';
import { CheckSquare, FileText, Calendar, AlertCircle, Building2, Mail, Phone, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MessagesContextPanel({ client, tasks, invoices, language }) {
  const pt = language === 'pt';
  const pendingInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');

  const statusColor = {
    todo: 'text-muted-foreground',
    in_progress: 'text-blue-400',
    waiting: 'text-amber-400',
    completed: 'text-emerald-400',
    cancelled: 'text-muted-foreground',
  };

  const invoiceStatusColor = {
    draft: 'text-muted-foreground',
    sent: 'text-blue-400',
    paid: 'text-emerald-400',
    overdue: 'text-red-400',
    cancelled: 'text-muted-foreground',
  };

  return (
    <div className="w-72 flex-shrink-0 border-l border-border flex flex-col overflow-y-auto bg-card">

      {/* Client Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-foreground text-lg font-bold shrink-0">
            {client.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
            {client.company && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                <Building2 className="w-3 h-3 shrink-0" />
                {client.company}
              </p>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-1.5">
          {client.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
              <span>{client.phone}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {client.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {client.tags.slice(0, 4).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-muted/50 text-muted-foreground text-[10px] rounded-full border border-border">
                {tag}
              </span>
            ))}
          </div>
        )}

        <Link
          to={`/ClientProfile?id=${client.id}`}
          className="mt-3 w-full block text-center py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/15 rounded-lg transition-colors border border-blue-500/20"
        >
          {pt ? 'Ver perfil completo' : 'View full profile'} →
        </Link>
      </div>

      {/* Active Tasks */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-muted-foreground">{pt ? 'Tarefas Ativas' : 'Active Tasks'}</span>
          </div>
          <span className="text-[10px] font-bold text-violet-400 bg-violet-500/15 px-2 py-0.5 rounded-full">
            {activeTasks.length}
          </span>
        </div>
        {activeTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground">{pt ? 'Sem tarefas ativas' : 'No active tasks'}</p>
        ) : (
          <div className="space-y-2">
            {activeTasks.slice(0, 4).map(task => (
              <div key={task.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/40 border border-border">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate font-medium">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-medium capitalize ${statusColor[task.status] || 'text-muted-foreground'}`}>
                      {task.status?.replace('_', ' ')}
                    </span>
                    {task.deadline && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(task.deadline).toLocaleDateString(pt ? 'pt-PT' : 'en-US', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invoices */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-muted-foreground">{pt ? 'Faturas Pendentes' : 'Pending Invoices'}</span>
          </div>
          {pendingInvoices.length > 0 && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
              {pendingInvoices.length}
            </span>
          )}
        </div>
        {pendingInvoices.length === 0 ? (
          <p className="text-xs text-muted-foreground">{pt ? 'Sem faturas pendentes' : 'No pending invoices'}</p>
        ) : (
          <div className="space-y-2">
            {pendingInvoices.slice(0, 3).map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium truncate">
                    {inv.invoice_number || `#${inv.id?.slice(-4)}`}
                  </p>
                  <span className={`text-[10px] font-medium capitalize ${invoiceStatusColor[inv.status] || 'text-muted-foreground'}`}>
                    {inv.status}
                  </span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs font-semibold text-foreground">
                    {inv.total?.toLocaleString()} {inv.currency}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pipeline stage */}
      {client.pipeline_stage && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">{pt ? 'Pipeline' : 'Pipeline'}</span>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 capitalize">
            {client.pipeline_stage?.replace('_', ' ')}
          </span>
        </div>
      )}
    </div>
  );
}
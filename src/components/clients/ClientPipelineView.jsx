import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useLanguage } from '../LanguageContext';
import { Plus, Building2, Calendar, Zap, AlertCircle } from 'lucide-react';
import { api } from '@/api/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '../../utils';
import { Link } from 'react-router-dom';

const STAGES = [
  { id: 'lead',          label_pt: 'Lead',              label_en: 'Lead',            headerColor: 'bg-slate-500/15 border-slate-500/25',    dot: 'bg-slate-400',   cardBorder: 'border-slate-500/20',  tagColor: 'text-muted-foreground' },
  { id: 'contacted',     label_pt: 'Contactado',        label_en: 'Contacted',       headerColor: 'bg-blue-500/15 border-blue-500/25',      dot: 'bg-blue-400',    cardBorder: 'border-blue-500/20',   tagColor: 'text-blue-300' },
  { id: 'proposal_sent', label_pt: 'Proposta Enviada',  label_en: 'Proposal Sent',   headerColor: 'bg-violet-500/15 border-violet-500/25',  dot: 'bg-violet-400',  cardBorder: 'border-violet-500/20', tagColor: 'text-violet-300' },
  { id: 'negotiation',   label_pt: 'Em Negociação',     label_en: 'Negotiation',     headerColor: 'bg-amber-500/15 border-amber-500/25',    dot: 'bg-amber-400',   cardBorder: 'border-amber-500/20',  tagColor: 'text-amber-300' },
  { id: 'won',           label_pt: 'Ganho',             label_en: 'Won',             headerColor: 'bg-emerald-500/15 border-emerald-500/25',dot: 'bg-emerald-400', cardBorder: 'border-emerald-500/20',tagColor: 'text-emerald-300' },
  { id: 'lost',          label_pt: 'Perdido',           label_en: 'Lost',            headerColor: 'bg-red-500/12 border-red-500/20',        dot: 'bg-red-400',     cardBorder: 'border-red-500/15',    tagColor: 'text-red-300' },
];

export default function ClientPipelineView({ clients, onAddClient }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const pt = language === 'pt';

  const getClientsForStage = (stageId) =>
    clients.filter(c => (c.pipeline_stage || 'lead') === stageId);

  const handleDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination || destination.droppableId === source.droppableId) return;
    try {
      await api.entities.Client.update(draggableId, { pipeline_stage: destination.droppableId });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      const stage = STAGES.find(s => s.id === destination.droppableId);
      toast.success(pt ? `Movido para "${pt ? stage.label_pt : stage.label_en}"` : `Moved to "${stage.label_en}"`);
    } catch {
      toast.error(pt ? 'Erro ao mover' : 'Error moving client');
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-6 pt-1 -mx-1 px-1">
        {STAGES.map((stage) => {
          const stageClients = getClientsForStage(stage.id);
          const label = pt ? stage.label_pt : stage.label_en;
          const totalValue = stageClients.reduce((s, c) => s + (c.total_outstanding || 0), 0);

          return (
            <div key={stage.id} className="flex-shrink-0 w-64 flex flex-col">
              {/* Column Header */}
              <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border-x border-t ${stage.headerColor}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stage.dot}`} />
                  <span className="text-xs font-semibold text-foreground">{label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {totalValue > 0 && (
                    <span className="text-[9px] text-muted-foreground">€{totalValue.toFixed(0)}</span>
                  )}
                  <span className="text-xs font-medium text-muted-foreground bg-white/8 rounded-full px-2 py-0.5">
                    {stageClients.length}
                  </span>
                </div>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 rounded-b-xl border border-t-0 p-2 space-y-2 transition-all min-h-[200px] ${
                      snapshot.isDraggingOver
                        ? `border-dashed ${stage.headerColor}`
                        : 'bg-background border-border'
                    }`}
                  >
                    {stageClients.map((client, index) => (
                      <Draggable key={client.id} draggableId={client.id} index={index}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <PipelineCard client={client} stage={stage} language={language} isDragging={snapshot.isDragging} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    <button
                      onClick={() => onAddClient(stage.id)}
                      className="w-full flex items-center gap-1.5 text-xs text-muted-foreground hover:text-muted-foreground py-2 px-2 rounded-lg transition-colors hover:bg-white/4"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {pt ? 'Adicionar' : 'Add'}
                    </button>
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

function PipelineCard({ client, stage, language, isDragging }) {
  const pt = language === 'pt';
  const today = new Date().toISOString().split('T')[0];
  const daysSince = client.last_interaction_date
    ? Math.floor((Date.now() - new Date(client.last_interaction_date)) / 86400000)
    : null;
  const isStale = daysSince !== null && daysSince > 7;
  const followUpOverdue = client.next_action_date && client.next_action_date < today;
  const followUpToday = client.next_action_date && client.next_action_date === today;

  const initials = client.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  // avatar color based on name hash
  const colors = ['bg-primary', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
  const colorIdx = (client.name?.charCodeAt(0) || 0) % colors.length;
  const avatarBg = colors[colorIdx];

  return (
    <div className={`rounded-xl border transition-all duration-150 cursor-grab active:cursor-grabbing overflow-hidden ${
      isDragging
        ? 'border-primary/60 shadow-2xl shadow-cyan-500/20 scale-105 rotate-1 bg-card'
        : `${stage.cardBorder} bg-card hover:border-border hover:shadow-lg`
    }`}>
      <div className="p-3">
        {/* Avatar + Name row */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-foreground text-xs font-bold ${avatarBg}`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-foreground leading-tight truncate">{client.name}</h4>
            {client.company && (
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5 flex-shrink-0" />{client.company}
              </p>
            )}
          </div>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${client.status === 'active' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
        </div>

        {/* Service category */}
        {client.service_category && (
          <div className="mb-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stage.headerColor} ${stage.tagColor}`}>
              {client.service_category}
            </span>
          </div>
        )}

        {/* Tags */}
        {(client.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {(client.tags || []).slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300/80 border border-purple-500/20">
                {tag}
              </span>
            ))}
            {(client.tags || []).length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">+{(client.tags || []).length - 3}</span>
            )}
          </div>
        )}

        {/* Follow-up date */}
        {client.next_action_date && (
          <div className={`flex items-center gap-1.5 text-xs mb-1.5 ${
            followUpOverdue ? 'text-red-400' : followUpToday ? 'text-amber-400' : 'text-muted-foreground'
          }`}>
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>
              {followUpOverdue
                ? (pt ? 'Follow-up em atraso' : 'Follow-up overdue')
                : followUpToday
                  ? (pt ? 'Follow-up hoje' : 'Follow-up today')
                  : client.next_action_date}
            </span>
          </div>
        )}

        {/* Next action */}
        {client.next_action && (
          <div className="flex items-center gap-1.5 text-xs text-primary/60 truncate">
            <Zap className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{client.next_action}</span>
          </div>
        )}

        {/* Stale warning */}
        {isStale && !client.next_action_date && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400/50 mt-1">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>{pt ? `${daysSince}d sem contacto` : `${daysSince}d no contact`}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 pb-2.5 pt-0 border-t border-border">
        <Link
          to={createPageUrl('ClientProfile') + `?id=${client.id}`}
          className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
          onClick={e => e.stopPropagation()}
        >
          {pt ? 'Ver perfil →' : 'View profile →'}
        </Link>
      </div>
    </div>
  );
}
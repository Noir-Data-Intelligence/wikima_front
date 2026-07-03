import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';
import { pt as ptLocale } from 'date-fns/locale/pt';
import { enUS } from 'date-fns/locale/en-US';
import {
  FolderOpen, CheckSquare, Users, FileText, Receipt,
  Calendar, DollarSign, StickyNote, User, Activity,
  UserPlus, UserMinus, Upload, Trash2, Edit, Tag
} from 'lucide-react';

const ICON_MAP = {
  project_created:       { Icon: FolderOpen,  bg: 'bg-orange-500/20', text: 'text-orange-400' },
  project_updated:       { Icon: Edit,        bg: 'bg-orange-500/15', text: 'text-orange-300' },
  project_status_changed:{ Icon: Tag,         bg: 'bg-purple-500/20', text: 'text-purple-400' },
  task_created:          { Icon: CheckSquare, bg: 'bg-blue-500/20',   text: 'text-blue-400'   },
  task_assigned:         { Icon: User,        bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  task_status_changed:   { Icon: CheckSquare, bg: 'bg-primary/20',   text: 'text-primary'   },
  task_completed:        { Icon: CheckSquare, bg: 'bg-green-500/20',  text: 'text-green-400'  },
  member_added:          { Icon: UserPlus,    bg: 'bg-emerald-500/20',text: 'text-emerald-400'},
  member_removed:        { Icon: UserMinus,   bg: 'bg-rose-500/20',   text: 'text-rose-400'   },
  document_uploaded:     { Icon: Upload,      bg: 'bg-sky-500/20',    text: 'text-sky-400'    },
  document_deleted:      { Icon: Trash2,      bg: 'bg-rose-500/15',   text: 'text-rose-300'   },
  meeting_scheduled:     { Icon: Calendar,    bg: 'bg-violet-500/20', text: 'text-violet-400' },
  meeting_completed:     { Icon: Calendar,    bg: 'bg-teal-500/20',   text: 'text-teal-400'   },
  invoice_created:       { Icon: Receipt,     bg: 'bg-purple-500/20', text: 'text-purple-400' },
  invoice_paid:          { Icon: DollarSign,  bg: 'bg-green-500/20',  text: 'text-green-400'  },
  receipt_created:       { Icon: FileText,    bg: 'bg-lime-500/20',   text: 'text-lime-400'   },
  client_updated:        { Icon: User,        bg: 'bg-amber-500/20',  text: 'text-amber-400'  },
  notes_added:           { Icon: StickyNote,  bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  default:               { Icon: Activity,    bg: 'bg-muted',      text: 'text-muted-foreground'   },
};

function getIcon(actionType) {
  return ICON_MAP[actionType] || ICON_MAP.default;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(name) {
  if (!name) return '#334155';
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `hsl(${hash % 360}, 45%, 35%)`;
}

function groupByDate(logs, pt) {
  const groups = [];
  const map = {};

  const key = (log) => {
    const d = parseISO(log.created_date);
    if (isToday(d)) return pt ? 'Hoje' : 'Today';
    if (isYesterday(d)) return pt ? 'Ontem' : 'Yesterday';
    if (isThisWeek(d, { weekStartsOn: 1 })) return pt ? 'Esta Semana' : 'This Week';
    return pt ? 'Mais Antigo' : 'Older';
  };

  const ORDER = [
    pt ? 'Hoje' : 'Today',
    pt ? 'Ontem' : 'Yesterday',
    pt ? 'Esta Semana' : 'This Week',
    pt ? 'Mais Antigo' : 'Older'
  ];

  for (const log of logs) {
    const k = key(log);
    if (!map[k]) { map[k] = []; }
    map[k].push(log);
  }

  for (const label of ORDER) {
    if (map[label]) groups.push({ label, items: map[label] });
  }

  return groups;
}

export default function ProjectActivityTab({ workspaceId, projectId, pt, project, tasks, documents, agendaEvents, invoices, receipts }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activityLogs', projectId],
    queryFn: () => api.entities.ProjectActivityLog.filter(
      { project_id: projectId },
      '-created_date',
      200
    ),
    enabled: !!projectId,
    refetchInterval: 30000, // auto-refresh every 30s
  });

  // Merge entity-derived synthetic events with stored logs
  // Stored logs take priority; we also derive events from existing data for items created before the log entity existed
  const syntheticFromEntities = useMemo(() => {
    const synth = [];

    // Project created
    if (project?.created_date) {
      synth.push({
        id: `synth_proj_created`,
        created_date: project.created_date,
        action_type: 'project_created',
        action_label_pt: 'Projeto criado',
        action_label_en: 'Project created',
        item_name: project.name,
        actor_name: project.owner_name || null,
        _synthetic: true,
      });
    }

    // Tasks
    for (const t of (tasks || [])) {
      synth.push({
        id: `synth_task_created_${t.id}`,
        created_date: t.created_date,
        action_type: 'task_created',
        action_label_pt: 'Tarefa criada',
        action_label_en: 'Task created',
        item_name: t.title,
        actor_name: t.assigned_to_name || null,
        _synthetic: true,
      });
      if (t.status === 'completed' && (t.completed_date || t.updated_date)) {
        synth.push({
          id: `synth_task_completed_${t.id}`,
          created_date: t.completed_date || t.updated_date,
          action_type: 'task_completed',
          action_label_pt: 'Tarefa concluída',
          action_label_en: 'Task completed',
          item_name: t.title,
          actor_name: t.assigned_to_name || null,
          _synthetic: true,
        });
      }
    }

    // Documents
    for (const d of (documents || [])) {
      synth.push({
        id: `synth_doc_uploaded_${d.id}`,
        created_date: d.upload_date || d.created_date,
        action_type: 'document_uploaded',
        action_label_pt: 'Documento carregado',
        action_label_en: 'Document uploaded',
        item_name: d.name || d.file_name || d.title,
        actor_name: null,
        _synthetic: true,
      });
    }

    // Agenda events
    for (const ev of (agendaEvents || [])) {
      synth.push({
        id: `synth_meeting_scheduled_${ev.id}`,
        created_date: ev.created_date,
        action_type: 'meeting_scheduled',
        action_label_pt: 'Reunião agendada',
        action_label_en: 'Meeting scheduled',
        item_name: ev.title,
        actor_name: ev.client_name || null,
        _synthetic: true,
      });
      if (ev.status === 'completed') {
        synth.push({
          id: `synth_meeting_completed_${ev.id}`,
          created_date: ev.updated_date || ev.created_date,
          action_type: 'meeting_completed',
          action_label_pt: 'Reunião concluída',
          action_label_en: 'Meeting completed',
          item_name: ev.title,
          actor_name: null,
          _synthetic: true,
        });
      }
    }

    // Invoices
    for (const inv of (invoices || [])) {
      synth.push({
        id: `synth_invoice_created_${inv.id}`,
        created_date: inv.created_date,
        action_type: 'invoice_created',
        action_label_pt: 'Fatura criada',
        action_label_en: 'Invoice created',
        item_name: inv.invoice_number || inv.client_name,
        actor_name: null,
        _synthetic: true,
      });
      if (inv.status === 'paid' && inv.paid_date) {
        synth.push({
          id: `synth_invoice_paid_${inv.id}`,
          created_date: inv.paid_date,
          action_type: 'invoice_paid',
          action_label_pt: 'Fatura paga',
          action_label_en: 'Invoice paid',
          item_name: inv.invoice_number || inv.client_name,
          actor_name: null,
          _synthetic: true,
        });
      }
    }

    // Receipts
    for (const rec of (receipts || [])) {
      synth.push({
        id: `synth_receipt_created_${rec.id}`,
        created_date: rec.created_date,
        action_type: 'receipt_created',
        action_label_pt: 'Recibo criado',
        action_label_en: 'Receipt created',
        item_name: rec.receipt_number || rec.client_name,
        actor_name: null,
        _synthetic: true,
      });
    }

    return synth.filter(s => !!s.created_date);
  }, [project, tasks, documents, agendaEvents, invoices, receipts]);

  // Merge: stored logs + synthetic, deduplicate by id, sort desc
  const storedIds = new Set(logs.map(l => l.id));
  // Remove synthetic entries that have a real stored counterpart (by action_type+item_name proximity)
  const storedKeys = new Set(logs.map(l => `${l.action_type}:${l.item_name}`));
  const filteredSynth = syntheticFromEntities.filter(s => !storedKeys.has(`${s.action_type}:${s.item_name}`));

  const allEntries = [...logs, ...filteredSynth]
    .filter(e => e.created_date)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const groups = groupByDate(allEntries, pt);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-4 border-border border-t-orange-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (allEntries.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.03] py-16 text-center">
        <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{pt ? 'Sem atividade registada.' : 'No activity recorded yet.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(group => (
        <div key={group.label}>
          {/* Group header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{group.label}</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          {/* Timeline */}
          <div className="relative pl-10">
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-white/8" />
            <div className="space-y-3">
              {group.items.map((entry) => {
                const { Icon, bg, text } = getIcon(entry.action_type);
                const label = pt ? (entry.action_label_pt || entry.action_label_en) : (entry.action_label_en || entry.action_label_pt);
                const dateStr = (() => {
                  try { return format(parseISO(entry.created_date), 'HH:mm', { locale: pt ? ptLocale : enUS }); }
                  catch { return ''; }
                })();

                return (
                  <div key={entry.id} className="flex items-start gap-3 relative">
                    {/* Icon dot */}
                    <div className={`absolute -left-[26px] w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${bg} z-10`}>
                      <Icon className={`w-3.5 h-3.5 ${text}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 rounded-xl border border-white/6 bg-white/[0.02] px-3.5 py-2.5 hover:bg-white/[0.04] transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* Avatar */}
                          {entry.actor_name ? (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-foreground flex-shrink-0"
                              style={{ backgroundColor: getAvatarColor(entry.actor_name) }}
                              title={entry.actor_name}
                            >
                              {getInitials(entry.actor_name)}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0">
                              <User className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {entry.actor_name && (
                                <span className="text-xs font-medium text-foreground/80">{entry.actor_name}</span>
                              )}
                              <span className="text-xs text-muted-foreground">{label}</span>
                              {entry.item_name && (
                                <span className="text-xs font-medium text-orange-300/80 truncate max-w-[160px]">
                                  {entry.item_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Time */}
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 tabular-nums">{dateStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
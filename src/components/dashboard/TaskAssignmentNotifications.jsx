import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Bell, CheckSquare, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function TaskAssignmentNotifications({ workspaceId }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['taskNotifications', workspaceId],
    queryFn: () => api.entities.TaskAssignmentNotification.filter(
      { workspace_id: workspaceId },
      '-created_date',
      20
    ),
    enabled: !!workspaceId,
    refetchInterval: 30000 // poll every 30s
  });

  const unread = notifications.filter(n => !n.read);

  const markReadMutation = useMutation({
    mutationFn: (id) => api.entities.TaskAssignmentNotification.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taskNotifications', workspaceId] })
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(unread.map(n => api.entities.TaskAssignmentNotification.update(n.id, { read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taskNotifications', workspaceId] })
  });

  const priorityColors = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400',
    urgent: 'text-rose-400'
  };

  const priorityLabels = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-blue-300 hover:text-foreground hover:bg-accent transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-xs text-foreground flex items-center justify-center font-bold">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-12 w-80 sm:w-96 z-50 rounded-xl border border-border bg-card shadow-2xl shadow-black/40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-400" />
                <span className="font-semibold text-foreground text-sm">Task Notifications</span>
                {unread.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium">
                    {unread.length} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread.length > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs text-blue-400 hover:text-primary transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-blue-400 hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10">
                  <Bell className="w-8 h-8 text-blue-500/40 mx-auto mb-2" />
                  <p className="text-blue-400 text-sm">No task notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-border/60 transition-colors ${n.read ? 'opacity-60' : 'bg-primary/5'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${n.read ? 'bg-muted' : 'bg-primary/20'}`}>
                        <CheckSquare className={`w-4 h-4 ${n.read ? 'text-blue-400' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-foreground text-sm font-medium leading-snug truncate">
                            {n.type === 'task_reassigned' ? '🔄' : '📋'} {n.task_title}
                          </p>
                          {!n.read && (
                            <button
                              onClick={() => markReadMutation.mutate(n.id)}
                              className="text-blue-500 hover:text-blue-300 flex-shrink-0 mt-0.5"
                              title="Mark as read"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-blue-300 text-xs mt-0.5">
                          Assigned to <span className="text-foreground font-medium">{n.assigned_to_name}</span>
                          {n.assigned_by_name && <> by <span className="text-foreground">{n.assigned_by_name}</span></>}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {n.task_priority && (
                            <span className={`text-xs font-medium ${priorityColors[n.task_priority]}`}>
                              ⚡ {priorityLabels[n.task_priority]}
                            </span>
                          )}
                          {n.task_deadline && (
                            <span className="text-xs text-blue-400">
                              🗓 {new Date(n.task_deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                          <span className="text-xs text-blue-500">
                            {new Date(n.created_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-border">
                <Link
                  to={createPageUrl('Tasks')}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary transition-colors"
                >
                  View all tasks <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
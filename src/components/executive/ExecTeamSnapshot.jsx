import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle2, CheckCircle, Clock } from 'lucide-react';

export default function ExecTeamSnapshot({ teamMembers, tasks, language }) {
  const pt = language === 'pt';

  const activeMembers = teamMembers.filter(m => m.status === 'active');

  const memberStats = activeMembers.slice(0, 5).map(member => {
    const memberTasks = tasks.filter(t => t.assigned_to === member.id || t.assigned_to_name === member.full_name);
    const completed = memberTasks.filter(t => t.status === 'completed').length;
    const inProgress = memberTasks.filter(t => t.status === 'in_progress').length;
    const overdue = memberTasks.filter(t => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      if (!t.deadline) return false;
      return new Date(t.deadline) < new Date();
    }).length;
    const total = memberTasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { ...member, completed, inProgress, overdue, total, rate };
  });

  const AVATAR_COLORS = ['#e97c3f','#8b5cf6','#22d3ee','#10b981','#f59e0b'];

  return (
    <Card style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCircle2 className="w-4 h-4" style={{ color: '#e97c3f' }} />
            <CardTitle className="text-base font-semibold text-foreground">
              {pt ? 'Equipa' : 'Team Performance'}
            </CardTitle>
          </div>
          <Link to={createPageUrl('Team')} className="text-xs text-blue-400 hover:text-foreground transition-colors">
            {pt ? 'Ver equipa →' : 'View team →'}
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {memberStats.length === 0 ? (
          <div className="text-center py-8">
            <UserCircle2 className="w-10 h-10 text-blue-400/40 mx-auto mb-2" />
            <p className="text-blue-300 text-sm">{pt ? 'Sem membros de equipa' : 'No team members yet'}</p>
            <Link to={createPageUrl('Team')} className="text-xs mt-1 block" style={{ color: '#e97c3f' }}>
              {pt ? 'Adicionar equipa →' : 'Add team →'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {memberStats.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0" style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {m.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-foreground text-sm font-medium truncate">{m.full_name}</p>
                    <span className="text-xs text-blue-300 ml-2">{m.rate}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-background overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.rate}%`, backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }} />
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5" /> {m.completed}
                    </span>
                    <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {m.inProgress}
                    </span>
                    {m.overdue > 0 && (
                      <span className="text-[10px] text-red-400">⚠ {m.overdue}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
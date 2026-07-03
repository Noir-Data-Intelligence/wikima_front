import { useTranslation } from 'react-i18next';
import {
  CheckSquare, Users, Receipt, TrendingUp, Plus, FileText,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Line, LineChart,
} from 'recharts';

import AppShell from '@/components/layout/AppShell';
import PageHeader, { PageContainer } from '@/components/layout/PageHeader';
import StatCard from '@/components/data/StatCard';
import ChartCard, { chartColors } from '@/components/data/ChartCard';
import DataTable from '@/components/data/DataTable';
import EmptyState from '@/components/data/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const revenue = [
  { m: 'Jan', v: 4200 }, { m: 'Feb', v: 5100 }, { m: 'Mar', v: 4800 },
  { m: 'Apr', v: 6300 }, { m: 'May', v: 7100 }, { m: 'Jun', v: 6800 },
];
const tasksTrend = [
  { d: 'Mon', v: 8 }, { d: 'Tue', v: 12 }, { d: 'Wed', v: 9 },
  { d: 'Thu', v: 15 }, { d: 'Fri', v: 11 }, { d: 'Sat', v: 4 },
];

const statusVariant = { active: 'default', pending: 'secondary', overdue: 'destructive' };
const clients = [
  { name: 'Acme Lda', contact: 'ana@acme.pt', invoices: 12, status: 'active' },
  { name: 'Bolt Studio', contact: 'joao@bolt.io', invoices: 5, status: 'pending' },
  { name: 'Cortex SA', contact: 'maria@cortex.pt', invoices: 8, status: 'overdue' },
  { name: 'Delta Foods', contact: 'rui@delta.pt', invoices: 3, status: 'active' },
  { name: 'Echo Media', contact: 'sofia@echo.pt', invoices: 21, status: 'active' },
];

const columns = [
  { accessorKey: 'name', header: 'Cliente' },
  { accessorKey: 'contact', header: 'Contacto' },
  { accessorKey: 'invoices', header: 'Faturas' },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ getValue }) => {
      const s = getValue();
      return <Badge variant={statusVariant[s] || 'secondary'} className="capitalize">{s}</Badge>;
    },
  },
];

export default function DesignSystem() {
  const { t } = useTranslation();

  return (
    <AppShell profile="company" isAdmin user={{ full_name: 'WiKima User', email: 'user@wikima.app' }}>
      <PageContainer>
        <PageHeader
          title="Design System"
          description="Preview da nova casca, tokens de marca, tema claro/escuro e componentes."
          actions={
            <>
              <Button variant="outline"><FileText className="h-4 w-4" /> Exportar</Button>
              <Button><Plus className="h-4 w-4" /> {t('tasks_add', 'New Task')}</Button>
            </>
          }
        />

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tarefas urgentes" value="7" icon={CheckSquare} trend={12} hint="vs. semana passada" />
          <StatCard label="Clientes ativos" value="34" icon={Users} trend={4} />
          <StatCard label="Faturas pendentes" value="9" icon={Receipt} trend={-8} />
          <StatCard label="Receita (mês)" value="€6.8k" icon={TrendingUp} trend={15} />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Receita mensal" description="Últimos 6 meses">
            <BarChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--popover-foreground))' }} />
              <Bar dataKey="v" fill={chartColors[1]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard title="Tarefas concluídas" description="Esta semana">
            <LineChart data={tasksTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--popover-foreground))' }} />
              <Line type="monotone" dataKey="v" stroke={chartColors[2]} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ChartCard>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={clients} pageSize={5} />
          </CardContent>
        </Card>

        {/* Buttons + badges palette */}
        <Card>
          <CardHeader><CardTitle className="text-base">Componentes</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Overdue</Badge>
          </CardContent>
        </Card>

        {/* Empty state */}
        <EmptyState
          icon={FileText}
          title="Sem documentos ainda"
          description="Carrega o teu primeiro documento para o veres aqui organizado."
          action={<Button><Plus className="h-4 w-4" /> Carregar documento</Button>}
        />
      </PageContainer>
    </AppShell>
  );
}

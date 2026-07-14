import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ExecRevenueChart({ invoices, expenses, language }) {
  const [view, setView] = useState('revenue'); // 'revenue' | 'cashflow'
  const pt = language === 'pt';
  const months = pt ? MONTHS_PT : MONTHS_EN;

  const now = new Date();
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: months[d.getMonth()], year: d.getFullYear(), m: d.getMonth() };
  });

  const data = last6.map(({ month, year, m }) => {
    const revenue = invoices
      .filter(i => i.status === 'paid')
      .filter(i => { const d = new Date(i.paid_date || i.date); return d.getMonth() === m && d.getFullYear() === year; })
      .reduce((s, i) => s + (i.total || 0), 0);

    const exp = expenses
      .filter(e => e.type === 'expense')
      .filter(e => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === year; })
      .reduce((s, e) => s + (e.amount || 0), 0);

    return { month, revenue: Math.round(revenue), expenses: Math.round(exp), cashflow: Math.round(revenue - exp) };
  });

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalCashflow = data.reduce((s, d) => s + d.cashflow, 0);

  const fmt = (v) => v >= 1000 ? `€${(v/1000).toFixed(1)}k` : `€${v}`;

  return (
    <Card style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
      <CardHeader className="pb-2 pt-5 px-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: '#e97c3f' }} />
            <CardTitle className="text-base font-semibold text-foreground">
              {pt ? 'Desempenho Financeiro (6 meses)' : 'Financial Performance (6 months)'}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            {[
              { key: 'revenue', label: pt ? 'Receita' : 'Revenue' },
              { key: 'cashflow', label: 'Cash Flow' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: view === key ? 'rgba(233,124,63,0.2)' : 'rgba(255,255,255,0.05)',
                  color: view === key ? '#e97c3f' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${view === key ? '#e97c3f' : 'transparent'}`
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground tabular-nums">
            {fmt(view === 'revenue' ? totalRevenue : totalCashflow)}
          </span>
          <span className="text-sm text-blue-300">
            {pt ? 'últimos 6 meses' : 'last 6 months'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4 pt-2">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e97c3f" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#e97c3f" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCashflow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={45} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              formatter={(v) => [`€${v.toLocaleString()}`, '']}
              labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey={view}
              stroke={view === 'revenue' ? '#e97c3f' : '#10b981'}
              strokeWidth={2.5}
              fill={view === 'revenue' ? 'url(#colorRevenue)' : 'url(#colorCashflow)'}
              dot={{ fill: view === 'revenue' ? '#e97c3f' : '#10b981', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
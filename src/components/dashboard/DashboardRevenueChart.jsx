import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DashboardRevenueChart({ invoices, expenses, language }) {
  const [view, setView] = useState('revenue');
  const pt = language === 'pt';
  const months = pt ? MONTHS_PT : MONTHS_EN;
  const now = new Date();

  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: months[d.getMonth()], m: d.getMonth(), y: d.getFullYear() };
  });

  const data = last6.map(({ label, m, y }) => {
    const revenue = invoices
      .filter(i => i.status === 'paid')
      .filter(i => { const d = new Date(i.paid_date || i.date); return d.getMonth() === m && d.getFullYear() === y; })
      .reduce((s, i) => s + (i.total || 0), 0);
    const exp = expenses
      .filter(e => e.type === 'expense')
      .filter(e => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === y; })
      .reduce((s, e) => s + (e.amount || 0), 0);
    return { month: label, revenue: Math.round(revenue), expenses: Math.round(exp), cashflow: Math.round(revenue - exp) };
  });

  const total = data.reduce((s, d) => s + d[view], 0);
  const fmt = (v) => v >= 1000 ? `€${(v / 1000).toFixed(1)}k` : `€${v}`;
  const color = view === 'revenue' ? '#e97c3f' : '#10b981';

  return (
    <Card style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: '#e97c3f' }} />
            <CardTitle className="text-sm font-semibold text-foreground">
              {pt ? 'Desempenho Financeiro (6 meses)' : 'Financial Performance (6 months)'}
            </CardTitle>
          </div>
          <div className="flex gap-1.5">
            {[
              { key: 'revenue', label: pt ? 'Receita' : 'Revenue' },
              { key: 'cashflow', label: 'Cash Flow' }
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setView(key)}
                className="text-[11px] px-2.5 py-1 rounded-md font-medium transition-all"
                style={{
                  backgroundColor: view === key ? 'rgba(233,124,63,0.2)' : 'rgba(255,255,255,0.05)',
                  color: view === key ? '#e97c3f' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${view === key ? 'rgba(233,124,63,0.4)' : 'transparent'}`
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold text-foreground tabular-nums">{fmt(total)}</span>
          <span className="text-xs text-blue-300">{pt ? 'últimos 6 meses' : 'last 6 months'}</span>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4 pt-1">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={38}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
              formatter={(v) => [`€${v.toLocaleString()}`, '']}
              labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
            />
            <Area type="monotone" dataKey={view} stroke={color} strokeWidth={2}
              fill="url(#chartGrad)" dot={{ fill: color, r: 2.5 }} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
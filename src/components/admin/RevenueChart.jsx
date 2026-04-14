import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function RevenueChart({ appointments, days = 30 }) {
  const chartData = useMemo(() => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayAppts = (appointments || []).filter(a => a.date === dateStr && a.status === 'completed');
      const revenue = dayAppts.reduce((s, a) => {
        return s + (a.total_price || 0) + (a.upsells || []).reduce((us, u) => us + u.price, 0);
      }, 0);
      data.push({
        date: format(date, 'dd/MM'),
        revenue,
        clients: dayAppts.length,
      });
    }
    return data;
  }, [appointments, days]);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-semibold text-foreground mb-4">Receita — Últimos {days} dias</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#666', fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#666', fontSize: 11 }}
            tickFormatter={v => `€${v}`}
          />
          <Tooltip
            contentStyle={{
              background: '#181818',
              border: '1px solid #333',
              borderRadius: 12,
              color: '#fff',
            }}
            formatter={(value) => [`€${value.toFixed(2)}`, 'Receita']}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#C9A84C"
            strokeWidth={2}
            fill="url(#goldGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
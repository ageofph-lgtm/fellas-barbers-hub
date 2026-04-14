import React, { useMemo } from 'react';
import { TrendingUp, Target, DollarSign, BarChart3 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export default function CommissionPanel({ appointments, barber }) {
  const commissionRate = (barber?.commission_percent || 40) / 100;
  const monthlyGoal = barber?.monthly_goal || 3000;

  const stats = useMemo(() => {
    const completed = appointments.filter(a => a.status === 'completed');
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const totalForAppt = (a) => (a.total_price || 0) + (a.upsells || []).reduce((s, u) => s + u.price, 0);

    const todayAppointments = completed.filter(a => a.date === todayStr);
    const weekAppointments = completed.filter(a => {
      const d = parseISO(a.date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });
    const monthAppointments = completed.filter(a => {
      const d = parseISO(a.date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });

    const todayRevenue = todayAppointments.reduce((s, a) => s + totalForAppt(a), 0);
    const weekRevenue = weekAppointments.reduce((s, a) => s + totalForAppt(a), 0);
    const monthRevenue = monthAppointments.reduce((s, a) => s + totalForAppt(a), 0);
    const avgTicket = monthAppointments.length > 0 ? monthRevenue / monthAppointments.length : 0;

    return {
      todayRevenue, weekRevenue, monthRevenue,
      todayCommission: todayRevenue * commissionRate,
      weekCommission: weekRevenue * commissionRate,
      monthCommission: monthRevenue * commissionRate,
      todayClients: todayAppointments.length,
      monthClients: monthAppointments.length,
      avgTicket,
      goalProgress: (monthRevenue / monthlyGoal) * 100,
    };
  }, [appointments, commissionRate, monthlyGoal]);

  const cards = [
    { label: 'Hoje', value: `€${stats.todayCommission.toFixed(0)}`, sub: `${stats.todayClients} clientes`, icon: DollarSign },
    { label: 'Esta Semana', value: `€${stats.weekCommission.toFixed(0)}`, sub: `receita: €${stats.weekRevenue.toFixed(0)}`, icon: TrendingUp },
    { label: 'Este Mês', value: `€${stats.monthCommission.toFixed(0)}`, sub: `ticket médio: €${stats.avgTicket.toFixed(0)}`, icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Goal Progress */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Meta Mensal</span>
          </div>
          <span className="text-sm text-muted-foreground">
            €{stats.monthRevenue.toFixed(0)} / €{monthlyGoal}
          </span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(100, stats.goalProgress)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {stats.goalProgress >= 100
            ? '🎉 Meta atingida!'
            : `${stats.goalProgress.toFixed(0)}% da meta`
          }
        </p>
      </div>
    </div>
  );
}
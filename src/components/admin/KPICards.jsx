import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, AlertTriangle, Scissors, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';

export default function KPICards({ stats }) {
  const RED = '#C8102E';

  const cards = [
    {
      label: 'Receita Confirmada',
      value: `€${(stats.todayRevenue || 0).toFixed(0)}`,
      sub: stats.pendingRevenue > 0 ? `€${stats.pendingRevenue.toFixed(0)} por registar` : null,
      icon: DollarSign,
      color: '#22c55e',
      change: stats.revenueChange,
    },
    {
      label: 'Cortes Hoje',
      value: stats.todayClients || 0,
      sub: stats.walkins > 0 ? `${stats.walkins} walk-in${stats.walkins > 1 ? 's' : ''}` : null,
      icon: Scissors,
      color: RED,
    },
    {
      label: 'Em Andamento',
      value: (stats.inProgress || 0) + (stats.pending || 0),
      sub: stats.inProgress > 0 ? `${stats.inProgress} em cadeira` : null,
      icon: Clock,
      color: '#f59e0b',
    },
    {
      label: 'No-Shows',
      value: stats.noShows || 0,
      sub: stats.noShowValue > 0 ? `€${stats.noShowValue.toFixed(0)} perdidos` : null,
      icon: AlertTriangle,
      color: '#ef4444',
      negative: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider leading-tight">{card.label}</span>
            <card.icon className="w-4 h-4 flex-shrink-0" style={{ color: card.color || 'var(--primary)' }} />
          </div>
          <p className="text-2xl font-black text-foreground">{card.value}</p>
          {card.sub && (
            <p className="text-[11px] mt-1 font-medium" style={{ color: card.negative ? '#ef4444' : 'var(--muted-foreground)' }}>
              {card.sub}
            </p>
          )}
          {card.change !== undefined && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs ${card.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {card.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(card.change).toFixed(0)}% vs ontem
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

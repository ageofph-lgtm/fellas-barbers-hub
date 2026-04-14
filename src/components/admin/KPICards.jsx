import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, AlertTriangle, Armchair, TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICards({ stats }) {
  const cards = [
    {
      label: 'Receita Hoje',
      value: `€${(stats.todayRevenue || 0).toFixed(0)}`,
      icon: DollarSign,
      change: stats.revenueChange,
    },
    {
      label: 'Ocupação Cadeiras',
      value: `${(stats.chairOccupancy || 0).toFixed(0)}%`,
      icon: Armchair,
    },
    {
      label: 'No-Shows',
      value: stats.noShows || 0,
      sub: stats.noShowValue ? `€${stats.noShowValue.toFixed(0)} perdidos` : null,
      icon: AlertTriangle,
      negative: true,
    },
    {
      label: 'Clientes Hoje',
      value: stats.todayClients || 0,
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{card.label}</span>
            <card.icon className={`w-4 h-4 ${card.negative ? 'text-destructive' : 'text-primary'}`} />
          </div>
          <p className="text-2xl font-bold text-foreground">{card.value}</p>
          {card.sub && <p className="text-xs text-destructive mt-1">{card.sub}</p>}
          {card.change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${card.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {card.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(card.change).toFixed(0)}% vs ontem
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
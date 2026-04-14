import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import AdminShopSelector from '../components/admin/ShopSelector';
import KPICards from '../components/admin/KPICards';
import RevenueChart from '../components/admin/RevenueChart';
import { RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const [selectedShop, setSelectedShop] = useState('all');
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Barbershop.list(),
  });

  const { data: allAppointments = [], refetch } = useQuery({
    queryKey: ['admin-appointments'],
    queryFn: () => base44.entities.Appointment.list('-date', 500),
    refetchInterval: 60000,
  });

  const { data: chairs = [] } = useQuery({
    queryKey: ['chairs'],
    queryFn: () => base44.entities.Chair.list(),
  });

  const filteredAppointments = useMemo(() => {
    if (selectedShop === 'all') return allAppointments;
    return allAppointments.filter(a => a.barbershop_id === selectedShop);
  }, [allAppointments, selectedShop]);

  const stats = useMemo(() => {
    const todayAppts = filteredAppointments.filter(a => a.date === today);
    const completed = todayAppts.filter(a => a.status === 'completed');
    const noShows = todayAppts.filter(a => a.status === 'no_show');
    const inProgress = todayAppts.filter(a => a.status === 'in_progress');

    const totalRevenue = (appts) => appts.reduce((s, a) => {
      return s + (a.total_price || 0) + (a.upsells || []).reduce((us, u) => us + u.price, 0);
    }, 0);

    const shopChairs = selectedShop === 'all' ? chairs : chairs.filter(c => c.barbershop_id === selectedShop);
    const occupancy = shopChairs.length > 0 ? (inProgress.length / shopChairs.length) * 100 : 0;

    return {
      todayRevenue: totalRevenue(completed),
      chairOccupancy: occupancy,
      noShows: noShows.length,
      noShowValue: noShows.reduce((s, a) => s + (a.total_price || 0), 0),
      todayClients: completed.length,
    };
  }, [filteredAppointments, today, chairs, selectedShop]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminShopSelector shops={shops} selected={selectedShop} onSelect={setSelectedShop} />
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <KPICards stats={stats} />

      {/* Chart */}
      <RevenueChart appointments={filteredAppointments} days={30} />

      {/* Today's Summary Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Agendamentos de Hoje</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground font-medium p-4">Hora</th>
                <th className="text-left text-xs text-muted-foreground font-medium p-4">Cliente</th>
                <th className="text-left text-xs text-muted-foreground font-medium p-4">Serviço</th>
                <th className="text-left text-xs text-muted-foreground font-medium p-4">Status</th>
                <th className="text-right text-xs text-muted-foreground font-medium p-4">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments
                .filter(a => a.date === today)
                .sort((a, b) => a.start_time?.localeCompare(b.start_time))
                .map(appt => {
                  const statusColors = {
                    scheduled: 'bg-blue-500/20 text-blue-400',
                    in_progress: 'bg-primary/20 text-primary',
                    completed: 'bg-green-500/20 text-green-400',
                    no_show: 'bg-red-500/20 text-red-400',
                    cancelled: 'bg-muted text-muted-foreground',
                  };
                  const statusLabels = {
                    scheduled: 'Agendado',
                    in_progress: 'Em Andamento',
                    completed: 'Concluído',
                    no_show: 'No-Show',
                    cancelled: 'Cancelado',
                  };
                  return (
                    <tr key={appt.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="p-4 text-sm font-mono text-foreground">{appt.start_time}</td>
                      <td className="p-4 text-sm text-foreground">{appt.client_name}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {(appt.services || []).map(s => s.name).join(', ')}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[appt.status] || ''}`}>
                          {statusLabels[appt.status] || appt.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-right font-semibold text-foreground">
                        €{((appt.total_price || 0) + (appt.upsells || []).reduce((s, u) => s + u.price, 0)).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
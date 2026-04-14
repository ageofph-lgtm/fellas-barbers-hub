import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import KanbanBoard from '../components/barber/KanbanBoard';
import CommissionPanel from '../components/barber/CommissionPanel';
import { Calendar, TrendingUp, RefreshCw } from 'lucide-react';

export default function BarberDashboard() {
  const [user, setUser] = useState(null);
  const [barber, setBarber] = useState(null);
  const [tab, setTab] = useState('agenda');
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const barbers = await base44.entities.Barber.filter({ user_email: u.email });
      if (barbers.length > 0) setBarber(barbers[0]);
    });
  }, []);

  const { data: todayAppointments = [], refetch: refetchToday } = useQuery({
    queryKey: ['barber-today', barber?.id],
    queryFn: () => base44.entities.Appointment.filter({ barber_id: barber.id, date: today }),
    enabled: !!barber,
    refetchInterval: 30000,
  });

  const { data: allAppointments = [] } = useQuery({
    queryKey: ['barber-all', barber?.id],
    queryFn: () => base44.entities.Appointment.filter({ barber_id: barber.id }),
    enabled: !!barber,
  });

  if (!barber) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Perfil de Barbeiro</h2>
          <p className="text-muted-foreground">O teu perfil de barbeiro ainda não está configurado. Contacta o administrador.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'agenda', label: 'Agenda', icon: Calendar },
    { key: 'commissions', label: 'Comissões', icon: TrendingUp },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Olá, {barber.name} 👋</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: pt })}
          </p>
        </div>
        <button
          onClick={() => { refetchToday(); queryClient.invalidateQueries({ queryKey: ['barber-all'] }); }}
          className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium flex-1 justify-center transition-all ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'agenda' && (
        <KanbanBoard appointments={todayAppointments} onRefresh={refetchToday} />
      )}
      {tab === 'commissions' && (
        <CommissionPanel appointments={allAppointments} barber={barber} />
      )}
    </div>
  );
}
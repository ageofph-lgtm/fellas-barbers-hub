import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AdminShopSelector from '../components/admin/ShopSelector';

export default function AdminAppointments() {
  const [selectedShop, setSelectedShop] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [search, setSearch] = useState('');
  const dateStr = format(currentDate, 'yyyy-MM-dd');

  const { data: shops = [] } = useQuery({ queryKey: ['shops'], queryFn: () => base44.entities.Barbershop.list() });
  const { data: barbers = [] } = useQuery({ queryKey: ['barbers-all'], queryFn: () => base44.entities.Barber.list() });
  const { data: appointments = [] } = useQuery({
    queryKey: ['admin-day-appts', dateStr], queryFn: () => base44.entities.Appointment.filter({ date: dateStr }),
  });

  const filtered = useMemo(() => {
    let result = appointments;
    if (selectedShop !== 'all') result = result.filter(a => a.barbershop_id === selectedShop);
    if (search) result = result.filter(a => a.client_name?.toLowerCase().includes(search.toLowerCase()) || a.client_phone?.includes(search));
    return result.sort((a, b) => a.start_time?.localeCompare(b.start_time));
  }, [appointments, selectedShop, search]);

  const statusColors = {
    scheduled: 'bg-blue-500/20 text-blue-400',
    checked_in: 'bg-yellow-500/20 text-yellow-400',
    in_progress: 'bg-primary/20 text-primary',
    completed: 'bg-green-500/20 text-green-400',
    no_show: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-muted text-muted-foreground',
  };

  const statusLabels = {
    scheduled: 'Agendado', checked_in: 'Check-in', in_progress: 'Em Andamento',
    completed: 'Concluído', no_show: 'No-Show', cancelled: 'Cancelado',
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agendamentos</h1>
        </div>
        <AdminShopSelector shops={shops} selected={selectedShop} onSelect={setSelectedShop} />
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-3">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-2 rounded-xl bg-secondary text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-foreground">
          {format(currentDate, "EEEE, d 'de' MMMM", { locale: pt })}
        </span>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-2 rounded-xl bg-secondary text-foreground">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome ou telemóvel..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-card border-border rounded-xl h-11"
        />
      </div>

      {/* Appointments List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground font-medium p-4">Hora</th>
                <th className="text-left text-xs text-muted-foreground font-medium p-4">Cliente</th>
                <th className="text-left text-xs text-muted-foreground font-medium p-4 hidden sm:table-cell">Barbeiro</th>
                <th className="text-left text-xs text-muted-foreground font-medium p-4 hidden md:table-cell">Serviços</th>
                <th className="text-left text-xs text-muted-foreground font-medium p-4">Status</th>
                <th className="text-right text-xs text-muted-foreground font-medium p-4">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(appt => {
                const barber = barbers.find(b => b.id === appt.barber_id);
                const total = (appt.total_price || 0) + (appt.upsells || []).reduce((s, u) => s + u.price, 0);
                return (
                  <tr key={appt.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="p-4 text-sm font-mono text-foreground">{appt.start_time}</td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-foreground">{appt.client_name}</p>
                      <p className="text-xs text-muted-foreground">{appt.client_phone}</p>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell">{barber?.name || '—'}</td>
                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                      {(appt.services || []).map(s => s.name).join(', ')}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[appt.status] || ''}`}>
                        {statusLabels[appt.status] || appt.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-right font-semibold text-foreground">€{total.toFixed(2)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sem agendamentos neste dia</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
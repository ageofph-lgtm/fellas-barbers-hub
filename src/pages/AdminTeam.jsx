import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Star, Target, Plus, Edit2, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShopSelector from '../components/admin/ShopSelector';

export default function AdminTeam() {
  const [selectedShop, setSelectedShop] = useState('all');
  const [editingBarber, setEditingBarber] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', barbershop_id: '', commission_percent: 40, monthly_goal: 3000 });
  const queryClient = useQueryClient();

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'], queryFn: () => base44.entities.Barbershop.list(),
  });

  const { data: barbers = [] } = useQuery({
    queryKey: ['barbers-all'], queryFn: () => base44.entities.Barber.list(),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['team-appointments'], queryFn: () => base44.entities.Appointment.list('-date', 500),
  });

  const filteredBarbers = selectedShop === 'all' ? barbers : barbers.filter(b => b.barbershop_id === selectedShop);

  const getBarberStats = (barberId) => {
    const appts = appointments.filter(a => a.barber_id === barberId && a.status === 'completed');
    const revenue = appts.reduce((s, a) => s + (a.total_price || 0) + (a.upsells || []).reduce((us, u) => us + u.price, 0), 0);
    return { clients: appts.length, revenue };
  };

  const handleSave = async () => {
    if (editingBarber) {
      await base44.entities.Barber.update(editingBarber.id, form);
    } else {
      await base44.entities.Barber.create(form);
    }
    queryClient.invalidateQueries({ queryKey: ['barbers-all'] });
    setShowForm(false);
    setEditingBarber(null);
    setForm({ name: '', barbershop_id: '', commission_percent: 40, monthly_goal: 3000 });
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipa</h1>
          <p className="text-muted-foreground">{barbers.length} barbeiros</p>
        </div>
        <div className="flex items-center gap-3">
          <AdminShopSelector shops={shops} selected={selectedShop} onSelect={setSelectedShop} />
          <Button
            onClick={() => { setShowForm(true); setEditingBarber(null); }}
            className="bg-primary text-primary-foreground rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">{editingBarber ? 'Editar' : 'Novo'} Barbeiro</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input placeholder="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border rounded-xl" />
            <Select value={form.barbershop_id} onValueChange={v => setForm({ ...form, barbershop_id: v })}>
              <SelectTrigger className="bg-secondary border-border rounded-xl"><SelectValue placeholder="Loja" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {shops.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Comissão (%)" type="number" value={form.commission_percent} onChange={e => setForm({ ...form, commission_percent: parseInt(e.target.value) })} className="bg-secondary border-border rounded-xl" />
            <Input placeholder="Meta mensal (€)" type="number" value={form.monthly_goal} onChange={e => setForm({ ...form, monthly_goal: parseInt(e.target.value) })} className="bg-secondary border-border rounded-xl" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingBarber(null); }} className="rounded-xl border-border">Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground rounded-xl">Guardar</Button>
          </div>
        </motion.div>
      )}

      {/* Team Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBarbers.map((barber, i) => {
          const stats = getBarberStats(barber.id);
          const shopName = shops.find(s => s.id === barber.barbershop_id)?.name || '';
          return (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                    {barber.photo_url ? <img src={barber.photo_url} className="w-full h-full object-cover" /> : barber.name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{barber.name}</h3>
                    <p className="text-xs text-muted-foreground">{shopName}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingBarber(barber);
                    setForm({
                      name: barber.name, barbershop_id: barber.barbershop_id,
                      commission_percent: barber.commission_percent || 40,
                      monthly_goal: barber.monthly_goal || 3000,
                    });
                    setShowForm(true);
                  }}
                  className="p-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                  <p className="font-semibold text-foreground">{stats.clients}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Receita</p>
                  <p className="font-semibold text-foreground">€{stats.revenue.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Comissão</p>
                  <p className="font-semibold text-primary">{barber.commission_percent || 40}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    <span className="font-semibold text-foreground">{barber.rating?.toFixed(1) || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Goal Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Meta</span>
                  <span>€{stats.revenue.toFixed(0)} / €{barber.monthly_goal || 3000}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, (stats.revenue / (barber.monthly_goal || 3000)) * 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
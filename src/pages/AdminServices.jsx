import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Scissors, Plus, Edit2, Clock, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = ['corte', 'barba', 'combo', 'tratamento', 'coloracao', 'extra'];

export default function AdminServices() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', duration_minutes: '', category: 'corte', photo_url: '', description: '' });
  const queryClient = useQueryClient();

  const { data: services = [] } = useQuery({
    queryKey: ['services-admin'], queryFn: () => base44.entities.Service.list('sort_order'),
  });

  const handleSave = async () => {
    const data = { ...form, price: parseFloat(form.price), duration_minutes: parseInt(form.duration_minutes), is_active: true };
    if (editing) {
      await base44.entities.Service.update(editing.id, data);
    } else {
      await base44.entities.Service.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['services-admin'] });
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', price: '', duration_minutes: '', category: 'corte', photo_url: '', description: '' });
  };

  const handleDelete = async (id) => {
    await base44.entities.Service.update(id, { is_active: false });
    queryClient.invalidateQueries({ queryKey: ['services-admin'] });
  };

  const categoryLabels = { corte: 'Cortes', barba: 'Barba', combo: 'Combos', tratamento: 'Tratamentos', coloracao: 'Coloração', extra: 'Extras' };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground">{services.filter(s => s.is_active !== false).length} serviços activos</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-primary text-primary-foreground rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> Serviço
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">{editing ? 'Editar' : 'Novo'} Serviço</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input placeholder="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border rounded-xl" />
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-secondary border-border rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Preço (€)" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="bg-secondary border-border rounded-xl" />
            <Input placeholder="Duração (min)" type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} className="bg-secondary border-border rounded-xl" />
            <Input placeholder="URL da foto" value={form.photo_url} onChange={e => setForm({ ...form, photo_url: e.target.value })} className="bg-secondary border-border rounded-xl sm:col-span-2" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-xl border-border">Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground rounded-xl">Guardar</Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        {CATEGORIES.map(cat => {
          const items = services.filter(s => s.category === cat && s.is_active !== false);
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">{categoryLabels[cat]}</h3>
              <div className="space-y-2">
                {items.map(service => (
                  <div key={service.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {service.photo_url && (
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                          <img src={service.photo_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-foreground">{service.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{service.duration_minutes}min</span>
                          <span className="text-primary font-bold">€{service.price}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        setEditing(service);
                        setForm({ name: service.name, price: service.price, duration_minutes: service.duration_minutes, category: service.category, photo_url: service.photo_url || '', description: service.description || '' });
                        setShowForm(true);
                      }} className="p-2 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(service.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
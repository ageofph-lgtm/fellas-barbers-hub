import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, Plus, Clock, User, Timer } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

function TimerDisplay({ startTime }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const start = new Date(startTime).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span className="font-mono text-primary font-bold">
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}

function AppointmentCard({ appointment, onStart, onFinish, onAddUpsell }) {
  const isInProgress = appointment.status === 'in_progress';
  const isCompleted = appointment.status === 'completed';
  const total = (appointment.total_price || 0) + (appointment.upsells || []).reduce((a, u) => a + u.price, 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border rounded-2xl p-4 space-y-3 ${
        isInProgress ? 'border-primary/40 gold-glow' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">{appointment.client_name}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{appointment.start_time} — {appointment.end_time}</p>
        </div>
        {isInProgress && appointment.checkin_time && (
          <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
            <Timer className="w-3 h-3 text-primary" />
            <TimerDisplay startTime={appointment.checkin_time} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {(appointment.services || []).map((s, i) => (
          <span key={i} className="text-xs bg-secondary px-2 py-1 rounded-lg text-muted-foreground">
            {s.name}
          </span>
        ))}
        {(appointment.upsells || []).map((u, i) => (
          <span key={`u-${i}`} className="text-xs bg-primary/10 px-2 py-1 rounded-lg text-primary">
            + {u.name} €{u.price}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-lg font-bold text-primary">€{total.toFixed(2)}</span>
        <div className="flex gap-2">
          {appointment.status === 'scheduled' && (
            <button
              onClick={() => onStart(appointment)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
            >
              <Play className="w-4 h-4" /> Iniciar
            </button>
          )}
          {isInProgress && (
            <>
              <button
                onClick={() => onAddUpsell(appointment)}
                className="flex items-center gap-1 bg-secondary text-foreground px-3 py-2 rounded-xl text-sm font-medium hover:bg-secondary/80"
              >
                <Plus className="w-4 h-4" /> Extra
              </button>
              <button
                onClick={() => onFinish(appointment)}
                className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" /> Finalizar
              </button>
            </>
          )}
        </div>
      </div>

      {appointment.notes && (
        <p className="text-xs text-yellow-400 bg-yellow-400/10 px-3 py-2 rounded-lg">
          📝 {appointment.notes}
        </p>
      )}
    </motion.div>
  );
}

export default function KanbanBoard({ appointments, onRefresh }) {
  const [upsellTarget, setUpsellTarget] = useState(null);
  const [upsellName, setUpsellName] = useState('');
  const [upsellPrice, setUpsellPrice] = useState('');

  const columns = {
    arriving: appointments.filter(a => a.status === 'scheduled'),
    inChair: appointments.filter(a => a.status === 'in_progress'),
    completed: appointments.filter(a => a.status === 'completed'),
  };

  const handleStart = async (appt) => {
    await base44.entities.Appointment.update(appt.id, {
      status: 'in_progress',
      checkin_time: new Date().toISOString(),
    });
    onRefresh();
  };

  const handleFinish = async (appt) => {
    const checkin = new Date(appt.checkin_time);
    const now = new Date();
    const actualDuration = Math.round((now - checkin) / 60000);
    await base44.entities.Appointment.update(appt.id, {
      status: 'completed',
      checkout_time: now.toISOString(),
      actual_duration: actualDuration,
      comanda_locked: true,
    });
    onRefresh();
  };

  const handleAddUpsell = async () => {
    if (!upsellTarget || !upsellName || !upsellPrice) return;
    const currentUpsells = upsellTarget.upsells || [];
    await base44.entities.Appointment.update(upsellTarget.id, {
      upsells: [...currentUpsells, { name: upsellName, price: parseFloat(upsellPrice) }],
    });
    setUpsellTarget(null);
    setUpsellName('');
    setUpsellPrice('');
    onRefresh();
  };

  const columnConfig = [
    { key: 'arriving', label: 'A Chegar', color: 'text-blue-400', icon: Clock },
    { key: 'inChair', label: 'Em Cadeira', color: 'text-primary', icon: Timer },
    { key: 'completed', label: 'Concluído', color: 'text-green-400', icon: CheckCircle },
  ];

  return (
    <div className="space-y-4">
      {/* Mobile: Stack columns */}
      <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
        {columnConfig.map(({ key, label, color, icon: Icon }) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-4 h-4 ${color}`} />
              <h3 className={`font-semibold text-sm ${color}`}>{label}</h3>
              <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                {columns[key].length}
              </span>
            </div>
            <div className="space-y-3">
              {columns[key].map(appt => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onStart={handleStart}
                  onFinish={handleFinish}
                  onAddUpsell={setUpsellTarget}
                />
              ))}
              {columns[key].length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm bg-card/50 rounded-2xl border border-dashed border-border">
                  Sem agendamentos
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upsell Modal */}
      {upsellTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end lg:items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-t-3xl lg:rounded-2xl p-6 w-full max-w-md space-y-4"
          >
            <h3 className="font-bold text-lg text-foreground">Adicionar Extra</h3>
            <p className="text-sm text-muted-foreground">Cliente: {upsellTarget.client_name}</p>
            <input
              placeholder="Nome do extra (ex: sobrancelha)"
              value={upsellName}
              onChange={e => setUpsellName(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground"
            />
            <input
              placeholder="Preço (€)"
              type="number"
              value={upsellPrice}
              onChange={e => setUpsellPrice(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setUpsellTarget(null)}
                className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddUpsell}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                Adicionar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
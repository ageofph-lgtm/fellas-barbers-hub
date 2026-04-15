import React, { useState, useEffect } from 'react';
import BarberLoader from '../components/ui/BarberLoader';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { format, startOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, TrendingUp, RefreshCw, Star, Euro, Clock,
  CheckCircle2, Scissors, User, BarChart3, Target, Award,
  Heart, ChevronDown, Plus, QrCode, X, CreditCard,
  Banknote, Smartphone, Zap, Gift, Trophy, AlertTriangle
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const RED = '#C8102E';
const TEST_BARBER_MAP = {
  'b1': '69de1b53358fe5119e3489e7',
  'b2': '69de1b53358fe5119e3489e9',
  'b3': '69de1b53358fe5119e3489eb',
};
const STATUS_CONFIG = {
  scheduled:   { label: 'Agendado',   color: 'text-blue-400 bg-blue-500/15'    },
  confirmed:   { label: 'Confirmado', color: 'text-green-400 bg-green-500/15'  },
  in_progress: { label: 'Em curso',   color: 'text-yellow-400 bg-yellow-500/15'},
  completed:   { label: 'Concluído',  color: 'text-zinc-400 bg-zinc-500/15'    },
  cancelled:   { label: 'Cancelado',  color: 'text-red-400 bg-red-500/15'      },
  no_show:     { label: 'Faltou',     color: 'text-orange-400 bg-orange-500/15'},
};
// Metas mensais (nível de cortes registados no app)
const REWARD_TIERS = [
  { min: 0,  max: 19, label: 'Bronze',   icon: '🥉', color: '#cd7f32', bonus: '0%'  },
  { min: 20, max: 39, label: 'Prata',    icon: '🥈', color: '#aaa',    bonus: '+2%' },
  { min: 40, max: 59, label: 'Ouro',     icon: '🥇', color: '#f0c020', bonus: '+5%' },
  { min: 60, max: 99, label: 'Platina',  icon: '💎', color: '#00cfff', bonus: '+8%' },
  { min: 100,max: 999,label: 'Diamond',  icon: '👑', color: '#c084fc', bonus: '+12%'},
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTier(count) {
  return REWARD_TIERS.find(t => count >= t.min && count <= t.max) || REWARD_TIERS[0];
}
function genPayCode(apptId) {
  return (apptId || '').slice(-6).toUpperCase() || Math.random().toString(36).slice(-6).toUpperCase();
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, highlight }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? 'border-[#C8102E]/30' : 'border-border'}`}
      style={{ background: highlight ? 'rgba(200,16,46,0.08)' : 'var(--card)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 bg-black/20">
        <Icon className="w-4 h-4" style={{ color: highlight ? RED : 'var(--muted-foreground)' }} />
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

// ── Appointment Card ──────────────────────────────────────────────────────────
function AppointmentCard({ appt, onStatusChange, onPayment }) {
  const status = STATUS_CONFIG[appt.status] || STATUS_CONFIG.scheduled;
  const time = appt.start_time || appt.scheduled_time || '--:--';
  const services = appt.services?.map(s => s.name).join(', ')
    || (Array.isArray(appt.service_names) ? appt.service_names.join(', ') : 'Serviço');

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{appt.client_name}</p>
            <p className="text-xs text-muted-foreground">{appt.client_phone || '—'}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{time}</span>
        <span className="flex items-center gap-1 min-w-0 flex-1">
          <Scissors className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{services}</span>
        </span>
        <span className="flex items-center gap-1 font-bold text-foreground">
          <Euro className="w-3 h-3" />{(appt.total_price || 0).toFixed(2)}
        </span>
      </div>

      {/* ── Fluxo de ações: Iniciar → Concluir → Cobrar ──────────────── */}

      {/* 1. Agendado ou confirmado → só Iniciar */}
      {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
        <button onClick={() => onStatusChange(appt.id, 'in_progress')}
          className="w-full py-2.5 rounded-xl text-xs font-bold border border-yellow-500/40 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors">
          ▶ Iniciar corte
        </button>
      )}

      {/* 2. Em curso → só Concluir (pagamento só APÓS concluído) */}
      {appt.status === 'in_progress' && (
        <button onClick={() => onStatusChange(appt.id, 'completed')}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-colors"
          style={{ background: RED, boxShadow: '0 4px 14px rgba(200,16,46,0.3)' }}>
          ✓ Concluir corte
        </button>
      )}

      {/* 3. Concluído e ainda não pago → Registar pagamento */}
      {appt.status === 'completed' && appt.payment_status !== 'paid' && (
        <button onClick={() => onPayment(appt)}
          className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
          style={{ border: `1.5px solid rgba(200,16,46,0.4)`, color: RED, background: 'rgba(200,16,46,0.06)' }}>
          <QrCode className="w-4 h-4" /> Registar pagamento
        </button>
      )}

      {/* 4. Pago → badge final (sem mais botões) */}
      {appt.payment_status === 'paid' && (
        <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 rounded-xl px-3 py-2 border border-green-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-semibold">
            Pago · {appt.payment_method === 'cash' ? 'Numerário' : appt.payment_method === 'mbway' ? 'MB WAY' : 'Cartão'}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ── Walk-in Modal ─────────────────────────────────────────────────────────────
function WalkinModal({ barber, services, onClose, onCreated }) {
  const [clientName, setClientName]   = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selServices, setSelServices] = useState([]);
  const [payMethod, setPayMethod]     = useState('cash');
  const [loading, setLoading]         = useState(false);

  const total = selServices.reduce((s, id) => {
    const svc = services.find(x => x.id === id);
    return s + (svc?.price || 0);
  }, 0);

  const toggle = (id) => setSelServices(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleCreate = async () => {
    if (!clientName.trim() || selServices.length === 0) return;
    setLoading(true);
    try {
      const svcObjs = selServices.map(id => services.find(x => x.id === id)).filter(Boolean);
      const now = new Date();
      const timeStr = format(now, 'HH:mm');
      const dateStr = format(now, 'yyyy-MM-dd');
      await base44.entities.Appointment.create({
        barbershop_id: barber.barbershop_id,
        barbershop_name: barber.barbershop_name || 'Fellas Barbers',
        barber_id: barber.id,
        barber_name: barber.name,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        service_ids: svcObjs.map(s => s.id),
        service_names: svcObjs.map(s => s.name),
        services: svcObjs,
        total_price: total,
        total_duration: svcObjs.reduce((s, x) => s + (x.duration_minutes || 0), 0),
        scheduled_date: dateStr,
        scheduled_time: timeStr,
        date: dateStr,
        start_time: timeStr,
        status: 'in_progress',
        is_walkin: true,
        payment_method: payMethod,
        payment_status: 'pending',
        notes: 'Walk-in — sem marcação prévia',
      });
      onCreated();
      onClose();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const PAY_OPTS = [
    { id: 'cash',  label: 'Numerário',  icon: Banknote   },
    { id: 'mbway', label: 'MB WAY',     icon: Smartphone },
    { id: 'card',  label: 'Cartão',     icon: CreditCard },
  ];

  // Agrupar serviços por categoria
  const grouped = services.filter(s => s.is_active !== false).reduce((acc, svc) => {
    const cat = svc.category || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{ background: 'var(--background)', border: '1px solid var(--border)', borderBottom: 'none', maxHeight: '92vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(200,16,46,0.1)', border: '1px solid rgba(200,16,46,0.25)' }}>
              <Scissors className="w-5 h-5" style={{ color: RED }} />
            </div>
            <div>
              <h3 className="font-black text-foreground text-base leading-tight">Walk-in</h3>
              <p className="text-xs text-muted-foreground">Entrada direta · sem marcação</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-secondary text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scroll area */}
        <div className="overflow-y-auto px-5 py-4 space-y-5" style={{ maxHeight: 'calc(92vh - 160px)' }}>

          {/* Cliente */}
          <div className="space-y-3">
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Cliente</p>
            <div className="rounded-2xl overflow-hidden border border-border bg-card divide-y divide-border">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={clientName} onChange={e => setClientName(e.target.value)}
                  placeholder="Nome do cliente *"
                  className="w-full pl-11 pr-4 py-3.5 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none" />
              </div>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                  placeholder="Telefone (opcional)"
                  className="w-full pl-11 pr-4 py-3.5 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Serviços por categoria */}
          <div className="space-y-3">
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Serviço *</p>
            {Object.entries(grouped).map(([cat, svcs]) => (
              <div key={cat} className="space-y-1.5">
                {Object.keys(grouped).length > 1 && (
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-1">{cat}</p>
                )}
                <div className="rounded-2xl overflow-hidden border border-border divide-y divide-border bg-card">
                  {svcs.map(svc => {
                    const sel = selServices.includes(svc.id);
                    return (
                      <button key={svc.id} onClick={() => toggle(svc.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                        style={{ background: sel ? 'rgba(200,16,46,0.07)' : 'transparent' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                            style={{ borderColor: sel ? RED : 'var(--border)', background: sel ? RED : 'transparent' }}>
                            {sel && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-tight">{svc.name}</p>
                            {svc.duration_minutes && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />{svc.duration_minutes} min
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-black flex-shrink-0 ml-2" style={{ color: RED }}>
                          €{(svc.price || 0).toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Método de pagamento */}
          <div className="space-y-3">
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Método de pagamento</p>
            <div className="grid grid-cols-3 gap-2">
              {PAY_OPTS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setPayMethod(id)}
                  className="py-3 px-2 rounded-2xl flex flex-col items-center gap-1.5 transition-all border"
                  style={{
                    background: payMethod === id ? 'rgba(200,16,46,0.1)' : 'var(--card)',
                    borderColor: payMethod === id ? RED : 'var(--border)',
                  }}>
                  <Icon className="w-4 h-4" style={{ color: payMethod === id ? RED : 'var(--muted-foreground)' }} />
                  <span className="text-[11px] font-bold leading-tight text-center"
                    style={{ color: payMethod === id ? RED : 'var(--muted-foreground)' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer fixo */}
        <div className="px-5 pb-6 pt-3 border-t border-border space-y-3"
          style={{ background: 'var(--background)' }}>
          {selServices.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selServices.length} serviço{selServices.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xl font-black" style={{ color: RED }}>€{total.toFixed(2)}</span>
            </div>
          )}
          <button onClick={handleCreate}
            disabled={loading || !clientName.trim() || selServices.length === 0}
            className="w-full py-4 rounded-2xl font-bold text-white text-sm disabled:opacity-40 transition-all"
            style={{ background: selServices.length > 0 && clientName.trim() ? RED : 'var(--secondary)',
                     color: selServices.length > 0 && clientName.trim() ? '#fff' : 'var(--muted-foreground)',
                     boxShadow: selServices.length > 0 && clientName.trim() ? '0 8px 24px rgba(200,16,46,0.3)' : 'none' }}>
            {loading ? 'A registar...' : selServices.length > 0 && clientName.trim()
              ? `Registar Walk-in · €${total.toFixed(2)}`
              : 'Preenche nome e serviço'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ appt, onClose, onPaid }) {
  const [method, setMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const price = appt?.total_price || 0;
  const client = appt?.client_name || 'Cliente';
  const svc = Array.isArray(appt?.service_names)
    ? appt.service_names.join(', ')
    : (appt?.service_names || 'Serviço');

  const METHOD_OPTIONS = [
    { id: 'cash',  label: 'Numerário',  emoji: '💵', desc: 'Receber em espécie' },
    { id: 'mbway', label: 'MB WAY',     emoji: '📱', desc: `Pedir €${price.toFixed(2)} ao cliente` },
    { id: 'card',  label: 'Cartão',     emoji: '💳', desc: 'Terminal físico' },
  ];

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await base44.entities.Appointment.update(appt.id, {
        payment_method: method,
        payment_status: 'paid',
        status: 'completed',
      });
      setDone(true);
      setTimeout(() => {
        onPaid(appt.id, method);
        onClose();
      }, 1000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{ background: 'var(--background)', borderTop: `3px solid ${RED}` }}
      >
        {done ? (
          /* ── Estado de sucesso ── */
          <div className="flex flex-col items-center justify-center py-12 px-6 gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)' }}
            >
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </motion.div>
            <p className="text-xl font-black text-foreground">Pago! ✓</p>
            <p className="text-sm text-muted-foreground">
              €{price.toFixed(2)} · {METHOD_OPTIONS.find(m => m.id === method)?.label}
            </p>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-black text-foreground">Registar Pagamento</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{client} · {svc}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary hover:bg-border transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* ── Valor ── */}
            <div className="px-5 py-5 border-b border-border text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Valor a cobrar</p>
              <p className="text-5xl font-black" style={{ color: RED }}>
                €{price.toFixed(2)}
              </p>
            </div>

            {/* ── Método ── */}
            <div className="px-5 py-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Forma de pagamento</p>
              {METHOD_OPTIONS.map(({ id, label, emoji, desc }) => {
                const selected = method === id;
                return (
                  <button
                    key={id}
                    onClick={() => setMethod(id)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-left"
                    style={{
                      background: selected ? 'rgba(200,16,46,0.08)' : 'var(--secondary)',
                      border: selected ? `2px solid ${RED}` : '2px solid transparent',
                    }}
                  >
                    <span className="text-2xl leading-none">{emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    {selected && (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: RED }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Instrução MB WAY ── */}
            {method === 'mbway' && (
              <div className="mx-5 mb-4 rounded-2xl p-4 space-y-1"
                style={{ background: 'rgba(200,16,46,0.06)', border: '1px solid rgba(200,16,46,0.2)' }}>
                <p className="text-xs font-bold text-foreground">Instrução para o cliente:</p>
                <p className="text-sm text-muted-foreground">
                  "Enviar <strong className="text-foreground">€{price.toFixed(2)}</strong> por MB WAY para o número da loja"
                </p>
              </div>
            )}

            {/* ── Confirmar ── */}
            <div className="px-5 pb-6 pt-2">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-white text-sm transition-all disabled:opacity-60"
                style={{
                  background: loading ? 'var(--muted)' : RED,
                  boxShadow: loading ? 'none' : '0 6px 20px rgba(200,16,46,0.35)',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    A registar...
                  </span>
                ) : (
                  `✓ Confirmar recebimento · €${price.toFixed(2)}`
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}



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

      {(appt.status === 'scheduled' || appt.status === 'confirmed' || appt.status === 'in_progress') && (
        <div className="flex gap-2 flex-wrap">
          {appt.status !== 'in_progress' && (
            <button onClick={() => onStatusChange(appt.id, 'in_progress')}
              className="flex-1 py-2 rounded-xl text-xs font-bold border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20">
              Iniciar
            </button>
          )}
          <button onClick={() => onStatusChange(appt.id, 'completed')}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: RED }}>
            Concluir
          </button>
          <button onClick={() => onPayment(appt)}
            className="py-2 px-3 rounded-xl text-xs font-bold border border-border text-muted-foreground hover:border-[#C8102E]/40 hover:text-[#C8102E]"
            title="Cobrar">
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Indicador pagamento */}
      {appt.payment_status === 'paid' && (
        <div className="flex items-center gap-1.5 text-xs text-green-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Pago via {appt.payment_method || 'app'}</span>
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
      const appt = await base44.entities.Appointment.create({
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
      onCreated(appt);
      onClose();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const PAY_OPTS = [
    { id: 'cash',  label: 'Numerário',  icon: Banknote   },
    { id: 'mbway', label: 'MB WAY',     icon: Smartphone },
    { id: 'card',  label: 'Cartão',     icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-foreground text-lg">Walk-in</h3>
            <p className="text-xs text-muted-foreground">Cliente sem marcação prévia</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Nome */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome do cliente *</label>
          <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="ex: João Silva"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[#C8102E]/50" />
        </div>

        {/* Telefone */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Telefone (opcional)</label>
          <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="9XX XXX XXX"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[#C8102E]/50" />
        </div>

        {/* Serviços */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Serviços *</label>
          <div className="grid grid-cols-2 gap-2">
            {services.filter(s => s.is_active !== false).map(svc => {
              const sel = selServices.includes(svc.id);
              return (
                <button key={svc.id} onClick={() => toggle(svc.id)}
                  className="p-3 rounded-xl text-left transition-all border"
                  style={{
                    background: sel ? 'rgba(200,16,46,0.1)' : 'var(--secondary)',
                    borderColor: sel ? RED : 'var(--border)',
                  }}>
                  <p className="text-xs font-bold text-foreground truncate">{svc.name}</p>
                  <p className="text-[11px] font-bold mt-0.5" style={{ color: RED }}>€{svc.price}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Método */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Método de pagamento</label>
          <div className="grid grid-cols-3 gap-2">
            {PAY_OPTS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setPayMethod(id)}
                className="p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all border"
                style={{
                  background: payMethod === id ? 'rgba(200,16,46,0.1)' : 'var(--secondary)',
                  borderColor: payMethod === id ? RED : 'var(--border)',
                }}>
                <Icon className="w-4 h-4" style={{ color: payMethod === id ? RED : 'var(--muted-foreground)' }} />
                <span className="text-[11px] font-bold" style={{ color: payMethod === id ? RED : 'var(--muted-foreground)' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        {total > 0 && (
          <div className="flex items-center justify-between py-3 px-4 rounded-xl"
            style={{ background: 'rgba(200,16,46,0.08)', border: `1px solid rgba(200,16,46,0.2)` }}>
            <span className="text-sm font-bold text-foreground">Total</span>
            <span className="text-xl font-black" style={{ color: RED }}>€{total.toFixed(2)}</span>
          </div>
        )}

        {/* Aviso */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-300">Este registo conta para os teus stats e metas mensais. Cortes não registados não contam para recompensas.</p>
        </div>

        {/* CTA */}
        <button onClick={handleCreate} disabled={loading || !clientName.trim() || selServices.length === 0}
          className="w-full py-4 rounded-2xl font-bold text-white text-sm disabled:opacity-40 transition-opacity"
          style={{ background: RED, boxShadow: '0 8px 24px rgba(200,16,46,0.3)' }}>
          {loading ? 'A registar...' : `Registar Walk-in • €${total.toFixed(2)}`}
        </button>
      </motion.div>
    </div>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ appt, onClose, onPaid }) {
  const [method, setMethod]   = useState(appt?.payment_method || 'mbway');
  const [loading, setLoading] = useState(false);
  const [paid, setPaid]       = useState(false);
  const payCode = genPayCode(appt?.id);

  const handleConfirmPaid = async () => {
    setLoading(true);
    try {
      await base44.entities.Appointment.update(appt.id, {
        payment_method: method,
        payment_status: 'paid',
        status: appt.status === 'in_progress' ? 'completed' : appt.status,
      });
      setPaid(true);
      setTimeout(() => { onPaid(); onClose(); }, 1500);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const PAY_OPTS = [
    { id: 'cash',  label: 'Numerário',  icon: Banknote,   desc: 'Pagamento em espécie' },
    { id: 'mbway', label: 'MB WAY',     icon: Smartphone, desc: `Pedir ao cliente: €${(appt?.total_price||0).toFixed(2)}` },
    { id: 'card',  label: 'Cartão',     icon: CreditCard, desc: 'Terminal físico' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md rounded-3xl p-5 space-y-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

        {paid ? (
          <div className="text-center py-8 space-y-3">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.3)' }}>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </motion.div>
            <p className="font-black text-foreground text-xl">Pago! ✓</p>
            <p className="text-muted-foreground text-sm">Corte registado nos teus stats</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-foreground text-lg">Cobrar</h3>
                <p className="text-xs text-muted-foreground">{appt?.client_name} • {Array.isArray(appt?.service_names) ? appt.service_names.join(', ') : 'Serviço'}</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Valor */}
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-1">Valor a cobrar</p>
              <p className="text-4xl font-black" style={{ color: RED }}>€{(appt?.total_price||0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Código: <span className="font-mono font-bold text-foreground">{payCode}</span></p>
            </div>

            {/* Métodos */}
            <div className="space-y-2">
              {PAY_OPTS.map(({ id, label, icon: Icon, desc }) => (
                <button key={id} onClick={() => setMethod(id)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all border text-left"
                  style={{
                    background: method === id ? 'rgba(200,16,46,0.08)' : 'var(--secondary)',
                    borderColor: method === id ? RED : 'var(--border)',
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: method === id ? 'rgba(200,16,46,0.15)' : 'var(--card)' }}>
                    <Icon className="w-4 h-4" style={{ color: method === id ? RED : 'var(--muted-foreground)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  {method === id && <CheckCircle2 className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: RED }} />}
                </button>
              ))}
            </div>

            <button onClick={handleConfirmPaid} disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-white text-sm disabled:opacity-50"
              style={{ background: RED, boxShadow: '0 8px 24px rgba(200,16,46,0.3)' }}>
              {loading ? 'A confirmar...' : 'Confirmar recebimento'}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── Rewards Panel ─────────────────────────────────────────────────────────────
function RewardsPanel({ completedMonth, barber }) {
  const appCount  = completedMonth.filter(a => a.is_walkin || a.payment_status === 'paid').length;
  const totalCount = completedMonth.length;
  const tier = getTier(appCount);
  const nextTier = REWARD_TIERS[REWARD_TIERS.indexOf(tier) + 1];
  const toNext = nextTier ? nextTier.min - appCount : 0;
  const pct = nextTier ? Math.min(100, ((appCount - tier.min) / (nextTier.min - tier.min)) * 100) : 100;

  // Cortes sem registo digital
  const unregistered = totalCount - appCount;

  return (
    <div className="space-y-3">
      {/* Tier card */}
      <div className="rounded-2xl p-4 border border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Nível do mês</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl">{tier.icon}</span>
              <p className="text-xl font-black" style={{ color: tier.color }}>{tier.label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Bónus comissão</p>
            <p className="text-2xl font-black" style={{ color: tier.color }}>{tier.bonus}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{appCount} cortes registados</span>
            {nextTier && <span className="text-muted-foreground">Faltam {toNext} p/ {nextTier.label}</span>}
          </div>
          <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ background: `linear-gradient(90deg, ${tier.color}, ${nextTier?.color || tier.color})` }}
            />
          </div>
          {nextTier && (
            <p className="text-[11px] text-muted-foreground">
              Regista {toNext} corte{toNext !== 1 ? 's' : ''} no app para subir para {nextTier.label} ({nextTier.bonus})
            </p>
          )}
        </div>
      </div>

      {/* Alerta cortes não registados */}
      {unregistered > 0 && (
        <div className="rounded-2xl p-4 border border-yellow-500/25 bg-yellow-500/8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-yellow-300">
                {unregistered} corte{unregistered !== 1 ? 's' : ''} sem pagamento registado
              </p>
              <p className="text-xs text-yellow-400/70 mt-0.5">
                Só os cortes com pagamento confirmado contam para o teu nível e bónus.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tiers overview */}
      <div className="rounded-2xl p-4 border border-border bg-card space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tabela de recompensas</p>
        {REWARD_TIERS.map(t => (
          <div key={t.label} className="flex items-center gap-3">
            <span className="text-lg w-6 text-center">{t.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: t.color }}>{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.min}–{t.max === 999 ? '∞' : t.max} cortes/mês</p>
            </div>
            <span className="text-sm font-black px-2.5 py-1 rounded-lg"
              style={{ background: `${t.color}20`, color: t.color }}>
              {t.bonus}
            </span>
            {tier.label === t.label && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: RED }}>
                ATUAL
              </span>
            )}
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground pt-1 border-t border-border">
          * Bónus aplicado à comissão base. Valores sujeitos a confirmação com a Fellas Barbers.
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BarberDashboard() {
  const { barberId: rawId } = useParams();
  const [barber, setBarber]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('hoje');
  const [showWalkin, setShowWalkin] = useState(false);
  const [payAppt, setPayAppt]       = useState(null);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Load barber
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const realId = TEST_BARBER_MAP[rawId] || rawId;
        if (realId) {
          const list = await base44.entities.Barber.filter({ id: realId });
          if (list.length > 0) { setBarber(list[0]); setLoading(false); return; }
        }
        try {
          const session = JSON.parse(sessionStorage.getItem('fellas_session') || 'null');
          if (session?.role === 'barber' && session?.barberId) {
            const sessionRealId = TEST_BARBER_MAP[session.barberId] || session.barberId;
            const list = await base44.entities.Barber.filter({ id: sessionRealId });
            if (list.length > 0) { setBarber(list[0]); setLoading(false); return; }
          }
        } catch {}
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [rawId]);

  // Queries
  const { data: todayAppts = [], refetch: refetchToday } = useQuery({
    queryKey: ['barber-today', barber?.id],
    queryFn: () => base44.entities.Appointment.filter({ barber_id: barber.id, date: today }),
    enabled: !!barber,
    refetchInterval: 30000,
  });

  const { data: monthAppts = [] } = useQuery({
    queryKey: ['barber-month', barber?.id],
    queryFn: () => base44.entities.Appointment.filter({ barber_id: barber.id }),
    enabled: !!barber,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', barber?.barbershop_id],
    queryFn: () => base44.entities.Service.filter({ barbershop_id: barber.barbershop_id }),
    enabled: !!barber?.barbershop_id,
  });

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Appointment.update(id, { status }),
    onSuccess: () => {
      refetchToday();
      queryClient.invalidateQueries({ queryKey: ['barber-month'] });
    }
  });

  // KPIs
  const completedToday  = todayAppts.filter(a => a.status === 'completed');
  const pendingToday    = todayAppts.filter(a => ['scheduled','confirmed','in_progress'].includes(a.status));
  const revenueToday    = completedToday.reduce((s, a) => s + (a.total_price || 0), 0);
  const commissionToday = revenueToday * ((barber?.commission_percent || 40) / 100);

  const thisMonth = startOfMonth(new Date()).toISOString();
  const completedMonth  = monthAppts.filter(a => a.status === 'completed' && (a.created_date || '') >= thisMonth);
  const revenueMonth    = completedMonth.reduce((s, a) => s + (a.total_price || 0), 0);
  const commissionMonth = revenueMonth * ((barber?.commission_percent || 40) / 100);
  const goalProgress    = barber?.monthly_goal ? Math.min(100, (commissionMonth / barber.monthly_goal) * 100) : 0;

  const tabs = [
    { key: 'hoje',      label: 'Hoje',       icon: Calendar  },
    { key: 'stats',     label: 'Stats',      icon: BarChart3 },
    { key: 'rewards',   label: 'Recompensas',icon: Trophy    },
  ];

  if (loading) return <BarberLoader fullscreen size="lg" label="A carregar..." />;

  if (!barber) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <Scissors className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
        <p className="text-foreground font-bold">Barbeiro não encontrado</p>
        <p className="text-muted-foreground text-sm">Verifica o link ou contacta o administrador.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {barber.photo_url
              ? <img src={barber.photo_url} alt={barber.name} className="w-10 h-10 rounded-xl object-cover border border-border flex-shrink-0" />
              : <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0"><Scissors className="w-5 h-5 text-muted-foreground" /></div>
            }
            <div>
              <h1 className="text-base font-black text-foreground leading-tight">Olá, {barber.name.split(' ')[0]} 👋</h1>
              <p className="text-xs text-muted-foreground">{format(new Date(), "EEE, d MMM", { locale: pt })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Walk-in CTA */}
            <button onClick={() => setShowWalkin(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: RED, boxShadow: '0 4px 12px rgba(200,16,46,0.35)' }}>
              <Plus className="w-3.5 h-3.5" />
              Walk-in
            </button>
            <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 border"
              style={{ background: 'rgba(200,16,46,0.08)', borderColor: 'rgba(200,16,46,0.25)' }}>
              <Star className="w-3.5 h-3.5 fill-current" style={{ color: RED }} />
              <span className="text-sm font-bold" style={{ color: RED }}>{(barber.rating || 0).toFixed(1)}</span>
            </div>
            <button onClick={() => { refetchToday(); queryClient.invalidateQueries({ queryKey: ['barber-month'] }); }}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 bg-secondary rounded-xl p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-lg mx-auto pb-24 lg:px-8">
        <AnimatePresence mode="wait">

          {/* ABA HOJE */}
          {tab === 'hoje' && (
            <motion.div key="hoje" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <KpiCard icon={Euro} label="Faturado hoje" value={`€${revenueToday.toFixed(0)}`} sub={`Comissão: €${commissionToday.toFixed(0)}`} highlight />
                <KpiCard icon={Calendar} label="Marcações" value={todayAppts.length} sub={`${completedToday.length} concluídas`} />
              </div>

              {/* Meta mensal */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" style={{ color: RED }} />
                    <span className="text-sm font-semibold text-foreground">Meta mensal</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: RED }}>{goalProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${goalProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ background: `linear-gradient(90deg, ${RED}, #f0c020)` }} />
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                  <span>€{commissionMonth.toFixed(0)} acumulados</span>
                  <span>Meta: €{barber.monthly_goal || '—'}</span>
                </div>
              </div>

              {/* Walk-in banner se não há marcações */}
              {todayAppts.length === 0 && (
                <button onClick={() => setShowWalkin(true)}
                  className="w-full p-4 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 transition-colors"
                  style={{ borderColor: 'rgba(200,16,46,0.3)', background: 'rgba(200,16,46,0.04)' }}>
                  <Plus className="w-8 h-8" style={{ color: RED, opacity: 0.6 }} />
                  <p className="text-sm font-bold text-foreground">Registar walk-in</p>
                  <p className="text-xs text-muted-foreground">Cliente sem marcação? Regista aqui para contar nos teus stats</p>
                </button>
              )}

              {/* Agenda */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">Agenda de hoje</h3>
                  <span className="text-xs text-muted-foreground">{pendingToday.length} pendentes</span>
                </div>
                {todayAppts.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-3 opacity-25" />
                    <p className="text-sm">Sem marcações para hoje</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...todayAppts]
                      .sort((a, b) => (a.start_time || a.scheduled_time || '').localeCompare(b.start_time || b.scheduled_time || ''))
                      .map(appt => (
                        <AppointmentCard key={appt.id} appt={appt}
                          onStatusChange={(id, status) => changeStatus({ id, status })}
                          onPayment={setPayAppt}
                        />
                      ))}
                  </div>
                )}
              </div>

              {/* Walk-in quick btn bottom */}
              {todayAppts.length > 0 && (
                <button onClick={() => setShowWalkin(true)}
                  className="w-full py-3.5 rounded-2xl font-bold text-xs text-muted-foreground border border-dashed border-border hover:border-[#C8102E]/30 hover:text-[#C8102E] flex items-center justify-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  Adicionar walk-in
                </button>
              )}
            </motion.div>
          )}

          {/* ABA STATS */}
          {tab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <KpiCard icon={Euro}         label="Receita do mês"  value={`€${revenueMonth.toFixed(0)}`} highlight />
                <KpiCard icon={Award}        label="Comissão mês"    value={`€${commissionMonth.toFixed(0)}`} sub={`${barber.commission_percent || 40}%`} />
                <KpiCard icon={CheckCircle2} label="Concluídas mês"  value={completedMonth.length} />
                <KpiCard icon={Star}         label="Avaliação"       value={`${(barber.rating || 0).toFixed(1)}★`} sub={`${barber.total_reviews || 0} reviews`} />
              </div>

              {/* Walk-ins do mês */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4" style={{ color: RED }} />
                  <p className="text-sm font-bold text-foreground">Walk-ins este mês</p>
                </div>
                <p className="text-3xl font-black text-foreground">
                  {completedMonth.filter(a => a.is_walkin).length}
                  <span className="text-sm font-normal text-muted-foreground ml-2">/ {completedMonth.length} total</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedMonth.filter(a => a.payment_status === 'paid').length} com pagamento confirmado
                </p>
              </div>

              {/* Perfil */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {barber.photo_url
                    ? <img src={barber.photo_url} alt={barber.name} className="w-14 h-14 rounded-xl object-cover border border-border" />
                    : <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center"><Scissors className="w-6 h-6 text-muted-foreground" /></div>
                  }
                  <div>
                    <p className="font-bold text-foreground">{barber.name}</p>
                    <p className="text-xs text-muted-foreground">{barber.years_experience || 0} anos de experiência</p>
                    <p className="text-xs mt-0.5" style={{ color: RED }}>Comissão: {barber.commission_percent || 40}%</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(barber.specialties || []).map(s => (
                    <span key={s} className="text-[11px] px-2.5 py-1 rounded-full border"
                      style={{ background: 'rgba(200,16,46,0.08)', color: RED, borderColor: 'rgba(200,16,46,0.2)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ABA RECOMPENSAS */}
          {tab === 'rewards' && (
            <motion.div key="rewards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <RewardsPanel completedMonth={completedMonth} barber={barber} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showWalkin && (
          <WalkinModal
            barber={barber}
            services={services}
            onClose={() => setShowWalkin(false)}
            onCreated={() => {
              refetchToday();
              queryClient.invalidateQueries({ queryKey: ['barber-month'] });
            }}
          />
        )}
        {payAppt && (
          <PaymentModal
            appt={payAppt}
            onClose={() => setPayAppt(null)}
            onPaid={() => {
              refetchToday();
              queryClient.invalidateQueries({ queryKey: ['barber-month'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isToday, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, TrendingUp, RefreshCw, Star, Euro, Clock,
  CheckCircle2, XCircle, Scissors, User, ChevronRight,
  Award, Target, Zap, BarChart3
} from 'lucide-react';

// ── Status helpers ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  scheduled: { label: 'Agendado', color: 'text-blue-400 bg-blue-500/15', dot: 'bg-blue-400' },
  confirmed: { label: 'Confirmado', color: 'text-green-400 bg-green-500/15', dot: 'bg-green-400' },
  in_progress: { label: 'Em curso', color: 'text-yellow-400 bg-yellow-500/15', dot: 'bg-yellow-400' },
  completed: { label: 'Concluído', color: 'text-zinc-400 bg-zinc-500/15', dot: 'bg-zinc-400' },
  cancelled: { label: 'Cancelado', color: 'text-red-400 bg-red-500/15', dot: 'bg-red-400' },
  no_show: { label: 'Faltou', color: 'text-orange-400 bg-orange-500/15', dot: 'bg-orange-400' },
};

// ── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, highlight }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight
      ? 'bg-[#C9A84C]/10 border-[#C9A84C]/30'
      : 'bg-card border-border'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${highlight ? 'bg-[#C9A84C]/20' : 'bg-secondary'}`}>
          <Icon className={`w-4 h-4 ${highlight ? 'text-[#C9A84C]' : 'text-muted-foreground'}`} />
        </div>
      </div>
      <p className={`text-2xl font-black ${highlight ? 'text-[#C9A84C]' : 'text-foreground'}`}>{value}</p>
      <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

// ── Appointment Card ────────────────────────────────────────────────────────
function AppointmentCard({ appt, onStatusChange }) {
  const status = STATUS_CONFIG[appt.status] || STATUS_CONFIG.scheduled;
  const time = appt.start_time || appt.scheduled_time || '--:--';
  const services = appt.services?.map(s => s.name).join(', ') || appt.service_names || 'Serviço';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4 space-y-3"
    >
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
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{time}</span>
        <span className="flex items-center gap-1"><Scissors className="w-3 h-3" />{services}</span>
        <span className="flex items-center gap-1 ml-auto font-bold text-foreground">
          <Euro className="w-3 h-3" />{appt.total_price?.toFixed(2)}
        </span>
      </div>

      {/* Quick actions */}
      {appt.status === 'scheduled' || appt.status === 'confirmed' ? (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onStatusChange(appt.id, 'in_progress')}
            className="flex-1 text-xs font-semibold py-2 rounded-xl bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/25 transition-colors"
          >
            Iniciar
          </button>
          <button
            onClick={() => onStatusChange(appt.id, 'no_show')}
            className="px-3 text-xs font-semibold py-2 rounded-xl bg-secondary text-muted-foreground hover:text-red-400 transition-colors"
          >
            Faltou
          </button>
        </div>
      ) : appt.status === 'in_progress' ? (
        <button
          onClick={() => onStatusChange(appt.id, 'completed')}
          className="w-full text-xs font-semibold py-2 rounded-xl bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Marcar como concluído
        </button>
      ) : null}
    </motion.div>
  );
}

// ── Guest Barber View (não cadastrado) ──────────────────────────────────────
function GuestBarberView({ user, onRegister }) {
  const [name, setName] = useState(user?.full_name || '');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await base44.entities.Barber.create({
        name: name.trim(),
        user_email: user?.email,
        is_active: true,
        rating: 0,
        rating_count: 0,
        commission_percent: 40,
        monthly_goal: 2500,
        specialties: [],
        languages: ['pt'],
        years_experience: 0,
      });
      setDone(true);
      setTimeout(() => onRegister(), 1200);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-[#C9A84C]" />
          </div>
          <h2 className="text-2xl font-black text-foreground">Bem-vindo, barbeiro!</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Cria o teu perfil para aceder ao dashboard. O administrador poderá associar-te a uma unidade.
          </p>
        </div>

        {done ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-2"
          >
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
            <p className="text-green-400 font-semibold">Perfil criado! A carregar...</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                O teu nome
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Ricardo Silva"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C9A84C]/60 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Email
              </label>
              <input
                type="text"
                value={user?.email || ''}
                disabled
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-muted-foreground text-sm cursor-not-allowed"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={submitting || !name.trim()}
              className="w-full py-3.5 rounded-xl bg-[#C9A84C] text-black font-bold text-sm hover:bg-[#d4b55a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'A criar perfil...' : 'Criar perfil e entrar'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function BarberDashboard() {
  const [user, setUser] = useState(null);
  const [barber, setBarber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('hoje');
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const loadBarber = async () => {
    setLoading(true);
    try {
      const u = await base44.auth.me();
      setUser(u);
      const list = await base44.entities.Barber.filter({ user_email: u.email });
      if (list.length > 0) setBarber(list[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBarber(); }, []);

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

  const updateStatus = async ({ id, status }) => {
    await base44.entities.Appointment.update(id, { status });
    refetchToday();
    queryClient.invalidateQueries({ queryKey: ['barber-month'] });
  };

  const { mutate: changeStatus } = useMutation({ mutationFn: updateStatus });

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
      </div>
    );
  }

  // Não cadastrado → auto-registo
  if (!barber) {
    return <GuestBarberView user={user} onRegister={loadBarber} />;
  }

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const completedToday = todayAppts.filter(a => a.status === 'completed');
  const revenueToday = completedToday.reduce((s, a) => s + (a.total_price || 0), 0);
  const commissionToday = revenueToday * ((barber.commission_percent || 40) / 100);

  const completedMonth = monthAppts.filter(a => a.status === 'completed');
  const revenueMonth = completedMonth.reduce((s, a) => s + (a.total_price || 0), 0);
  const commissionMonth = revenueMonth * ((barber.commission_percent || 40) / 100);
  const goalProgress = barber.monthly_goal ? Math.min(100, (commissionMonth / barber.monthly_goal) * 100) : 0;

  const avgRating = barber.rating || 0;
  const pendingToday = todayAppts.filter(a => ['scheduled', 'confirmed', 'in_progress'].includes(a.status));

  const tabs = [
    { key: 'hoje', label: 'Hoje', icon: Calendar },
    { key: 'stats', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-foreground">Olá, {barber.name.split(' ')[0]} 👋</h1>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "EEE, d MMM", { locale: pt })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl px-3 py-1.5">
              <Star className="w-3.5 h-3.5 text-[#C9A84C] fill-current" />
              <span className="text-sm font-bold text-[#C9A84C]">{avgRating.toFixed(1)}</span>
            </div>
            <button
              onClick={() => { refetchToday(); queryClient.invalidateQueries({ queryKey: ['barber-month'] }); }}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 bg-secondary rounded-xl p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 lg:px-8 space-y-4 pb-24">
        <AnimatePresence mode="wait">
          {tab === 'hoje' && (
            <motion.div key="hoje" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* KPIs do dia */}
              <div className="grid grid-cols-2 gap-3">
                <KpiCard icon={Euro} label="Faturado hoje" value={`€${revenueToday.toFixed(0)}`} sub={`Comissão: €${commissionToday.toFixed(0)}`} highlight />
                <KpiCard icon={Calendar} label="Marcações" value={todayAppts.length} sub={`${completedToday.length} concluídas`} />
              </div>

              {/* Progress meta mensal */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#C9A84C]" />
                    <span className="text-sm font-semibold text-foreground">Meta mensal</span>
                  </div>
                  <span className="text-sm font-bold text-[#C9A84C]">{goalProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#C9A84C] to-[#f0d080] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${goalProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>€{commissionMonth.toFixed(0)} recebidos</span>
                  <span>Meta: €{barber.monthly_goal}</span>
                </div>
              </div>

              {/* Lista de hoje */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">Agenda de hoje</h3>
                  <span className="text-xs text-muted-foreground">{pendingToday.length} pendentes</span>
                </div>

                {todayAppts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Sem marcações para hoje</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...todayAppts]
                      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                      .map(appt => (
                        <AppointmentCard
                          key={appt.id}
                          appt={appt}
                          onStatusChange={(id, status) => changeStatus({ id, status })}
                        />
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {tab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <KpiCard icon={Euro} label="Receita do mês" value={`€${revenueMonth.toFixed(0)}`} highlight />
                <KpiCard icon={Award} label="Comissão mês" value={`€${commissionMonth.toFixed(0)}`} sub={`${barber.commission_percent}%`} />
                <KpiCard icon={CheckCircle2} label="Concluídas mês" value={completedMonth.length} />
                <KpiCard icon={Star} label="Avaliação" value={`${avgRating.toFixed(1)}★`} sub={`${barber.rating_count || 0} reviews`} />
              </div>

              {/* Barber profile summary */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">O meu perfil</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Experiência</p>
                    <p className="font-semibold text-foreground mt-0.5">{barber.years_experience || 0} anos</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Comissão</p>
                    <p className="font-semibold text-[#C9A84C] mt-0.5">{barber.commission_percent}%</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Especialidades</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(barber.specialties || []).map(s => (
                        <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

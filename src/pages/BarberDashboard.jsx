import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { format, startOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, TrendingUp, RefreshCw, Star, Euro, Clock,
  CheckCircle2, Scissors, User, BarChart3, Target, Award,
  Heart, ChevronDown
} from 'lucide-react';

// ── Mapa: fake test ID → ID real na DB ───────────────────────────────────────
const TEST_BARBER_MAP = {
  'b1': '69de1b53358fe5119e3489e7', // Ricardo Silva
  'b2': '69de1b53358fe5119e3489e9', // Miguel Santos
  'b3': '69de1b53358fe5119e3489eb', // André Oliveira
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  scheduled:  { label: 'Agendado',   color: 'text-blue-400 bg-blue-500/15'   },
  confirmed:  { label: 'Confirmado', color: 'text-green-400 bg-green-500/15'  },
  in_progress:{ label: 'Em curso',   color: 'text-yellow-400 bg-yellow-500/15'},
  completed:  { label: 'Concluído',  color: 'text-zinc-400 bg-zinc-500/15'    },
  cancelled:  { label: 'Cancelado',  color: 'text-red-400 bg-red-500/15'      },
  no_show:    { label: 'Faltou',     color: 'text-orange-400 bg-orange-500/15'},
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, highlight }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight
      ? 'bg-[#C8102E]/10 border-[#C8102E]/30'
      : 'bg-card border-border'}`}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 bg-black/30">
        <Icon className={`w-4 h-4 ${highlight ? 'text-[#C8102E]' : 'text-muted-foreground'}`} />
      </div>
      <p className={`text-2xl font-black ${highlight ? 'text-[#C8102E]' : 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

// ── Appointment Card ──────────────────────────────────────────────────────────
function AppointmentCard({ appt, onStatusChange }) {
  const status = STATUS_CONFIG[appt.status] || STATUS_CONFIG.scheduled;
  const time = appt.start_time || '--:--';
  const services = appt.services?.map(s => s.name).join(', ') || 'Serviço';

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
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
        <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{time}</span>
        <span className="flex items-center gap-1 min-w-0 flex-1"><Scissors className="w-3 h-3 flex-shrink-0" /><span className="truncate">{services}</span></span>
        <span className="flex items-center gap-1 font-bold text-foreground">
          <Euro className="w-3 h-3" />{appt.total_price?.toFixed(2)}
        </span>
      </div>

      {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
        <div className="flex gap-2">
          <button onClick={() => onStatusChange(appt.id, 'in_progress')}
            className="flex-1 text-xs font-semibold py-2 rounded-xl bg-[#C8102E]/15 text-[#C8102E] border border-[#C8102E]/30 hover:bg-[#C8102E]/25 transition-colors"
          >Iniciar</button>
          <button onClick={() => onStatusChange(appt.id, 'no_show')}
            className="px-3 text-xs font-semibold py-2 rounded-xl bg-secondary text-muted-foreground hover:text-red-400 transition-colors"
          >Faltou</button>
        </div>
      )}
      {appt.status === 'in_progress' && (
        <button onClick={() => onStatusChange(appt.id, 'completed')}
          className="w-full text-xs font-semibold py-2.5 rounded-xl bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Marcar como concluído
        </button>
      )}
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BarberDashboard() {
  const { barberId: rawId } = useParams();
  const [barber, setBarber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('hoje');
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Prioridade 1: ID da URL (pode ser fake b1/b2/b3 ou ID real)
        const realId = TEST_BARBER_MAP[rawId] || rawId;
        if (realId) {
          const list = await base44.entities.Barber.filter({ id: realId });
          if (list.length > 0) { setBarber(list[0]); setLoading(false); return; }
        }
        // Prioridade 2: sessão guardada (barbeiro entrou pelo RoleSelector)
        try {
          const session = JSON.parse(sessionStorage.getItem('fellas_session') || 'null');
          if (session?.role === 'barber' && session?.barberId) {
            const sessionRealId = TEST_BARBER_MAP[session.barberId] || session.barberId;
            const list = await base44.entities.Barber.filter({ id: sessionRealId });
            if (list.length > 0) { setBarber(list[0]); setLoading(false); return; }
          }
        } catch {}
        // Sem fallback: se não encontrou, mostra erro — cada barbeiro tem a SUA conta
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [rawId]);

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

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Appointment.update(id, { status }),
    onSuccess: () => {
      refetchToday();
      queryClient.invalidateQueries({ queryKey: ['barber-month'] });
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C8102E]/30 border-t-[#C8102E] rounded-full animate-spin" />
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Scissors className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
          <p className="text-foreground font-bold">Barbeiro não encontrado</p>
          <p className="text-muted-foreground text-sm">Verifica o link ou contacta o administrador.</p>
        </div>
      </div>
    );
  }

  // KPIs
  const completedToday = todayAppts.filter(a => a.status === 'completed');
  const revenueToday = completedToday.reduce((s, a) => s + (a.total_price || 0), 0);
  const commissionToday = revenueToday * ((barber.commission_percent || 40) / 100);
  const completedMonth = monthAppts.filter(a => a.status === 'completed');
  const revenueMonth = completedMonth.reduce((s, a) => s + (a.total_price || 0), 0);
  const commissionMonth = revenueMonth * ((barber.commission_percent || 40) / 100);
  const goalProgress = barber.monthly_goal ? Math.min(100, (commissionMonth / barber.monthly_goal) * 100) : 0;
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
          <div className="flex items-center gap-3">
            <img src={barber.photo_url} alt={barber.name}
              className="w-10 h-10 rounded-xl object-cover border border-border flex-shrink-0"
            />
            <div>
              <h1 className="text-base font-black text-foreground leading-tight">
                Olá, {barber.name.split(' ')[0]} 👋
              </h1>
              <p className="text-xs text-muted-foreground">
                {format(new Date(), "EEE, d MMM", { locale: pt })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#C8102E]/10 border border-[#C8102E]/30 rounded-xl px-2.5 py-1.5">
              <Star className="w-3.5 h-3.5 text-[#C8102E] fill-current" />
              <span className="text-sm font-bold text-[#C8102E]">{(barber.rating || 0).toFixed(1)}</span>
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
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 lg:px-8 space-y-4 pb-20">
        <AnimatePresence mode="wait">

          {/* ── ABA HOJE ── */}
          {tab === 'hoje' && (
            <motion.div key="hoje" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <KpiCard icon={Euro} label="Faturado hoje" value={`€${revenueToday.toFixed(0)}`} sub={`Comissão: €${commissionToday.toFixed(0)}`} highlight />
                <KpiCard icon={Calendar} label="Marcações" value={todayAppts.length} sub={`${completedToday.length} concluídas`} />
              </div>

              {/* Barra de meta */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#C8102E]" />
                    <span className="text-sm font-semibold text-foreground">Meta mensal</span>
                  </div>
                  <span className="text-sm font-bold text-[#C8102E]">{goalProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#C8102E] to-[#f0d080] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${goalProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                  <span>€{commissionMonth.toFixed(0)} acumulados</span>
                  <span>Meta: €{barber.monthly_goal}</span>
                </div>
              </div>

              {/* Agenda do dia */}
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
                      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                      .map(appt => (
                        <AppointmentCard key={appt.id} appt={appt}
                          onStatusChange={(id, status) => changeStatus({ id, status })}
                        />
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── ABA STATS ── */}
          {tab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <KpiCard icon={Euro} label="Receita do mês" value={`€${revenueMonth.toFixed(0)}`} highlight />
                <KpiCard icon={Award} label="Comissão mês" value={`€${commissionMonth.toFixed(0)}`} sub={`${barber.commission_percent}%`} />
                <KpiCard icon={CheckCircle2} label="Concluídas mês" value={completedMonth.length} />
                <KpiCard icon={Star} label="Avaliação" value={`${(barber.rating || 0).toFixed(1)}★`} sub={`${barber.rating_count || 0} reviews`} />
              </div>

              {/* Perfil */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <img src={barber.photo_url} alt={barber.name}
                    className="w-14 h-14 rounded-xl object-cover border border-border"
                  />
                  <div>
                    <p className="font-bold text-foreground">{barber.name}</p>
                    <p className="text-xs text-muted-foreground">{barber.years_experience || 0} anos de experiência</p>
                    <p className="text-xs text-[#C8102E] mt-0.5">Comissão: {barber.commission_percent}%</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(barber.specialties || []).map(s => (
                    <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-[#C8102E]/10 text-[#C8102E] border border-[#C8102E]/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

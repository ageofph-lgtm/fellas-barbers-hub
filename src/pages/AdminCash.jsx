import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import BlindCashClose from '../components/admin/BlindCashClose';
import { CreditCard, Banknote, Receipt, TrendingUp, Euro, Users, MapPin, ChevronDown, Globe } from 'lucide-react';

const RED = '#C8102E';

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-2xl p-4 border border-border bg-card">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
        style={{ background: accent ? 'rgba(200,16,46,0.12)' : 'var(--secondary)' }}>
        <Icon className="w-4 h-4" style={{ color: accent ? RED : 'var(--muted-foreground)' }} />
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground/60 mt-1">{sub}</p>}
    </div>
  );
}

// ── Shop pill selector ────────────────────────────────────────────────────────
function ShopPills({ shops, selected, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {/* Global */}
      <button
        onClick={() => onSelect('all')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
        style={{
          background: selected === 'all' ? RED : 'var(--secondary)',
          color: selected === 'all' ? '#fff' : 'var(--muted-foreground)',
          border: `1px solid ${selected === 'all' ? RED : 'var(--border)'}`,
        }}
      >
        <Globe className="w-3 h-3" />
        Global
      </button>
      {shops.map(shop => (
        <button
          key={shop.id}
          onClick={() => onSelect(shop.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{
            background: selected === shop.id ? RED : 'var(--secondary)',
            color: selected === shop.id ? '#fff' : 'var(--muted-foreground)',
            border: `1px solid ${selected === shop.id ? RED : 'var(--border)'}`,
          }}
        >
          <MapPin className="w-3 h-3" />
          {shop.name?.replace('Fellas ', '').replace('Barbers ', '') || shop.name}
        </button>
      ))}
    </div>
  );
}

// ── Global overview ───────────────────────────────────────────────────────────
function GlobalOverview({ shops, allAppointments, allReports }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppts = allAppointments.filter(a => a.date === today || a.scheduled_date === today);
  const completed  = todayAppts.filter(a => a.status === 'completed');
  const totalRev   = completed.reduce((s, a) => s + (a.total_price || 0), 0);
  const pending    = todayAppts.filter(a => ['scheduled','confirmed','in_progress'].includes(a.status));
  const cash       = completed.filter(a => a.payment_method === 'cash').reduce((s,a) => s+(a.total_price||0), 0);
  const card       = completed.filter(a => a.payment_method === 'card').reduce((s,a) => s+(a.total_price||0), 0);
  const mbway      = completed.filter(a => a.payment_method === 'mbway').reduce((s,a) => s+(a.total_price||0), 0);

  // Por loja
  const byShop = shops.map(shop => {
    const shopAppts = completed.filter(a => a.barbershop_id === shop.id);
    const rev = shopAppts.reduce((s, a) => s + (a.total_price || 0), 0);
    return { ...shop, rev, count: shopAppts.length };
  }).sort((a, b) => b.rev - a.rev);

  return (
    <div className="space-y-5">
      {/* KPIs globais */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard icon={Euro}      label="Receita total hoje" value={`€${totalRev.toFixed(0)}`} accent />
        <KpiCard icon={Users}     label="Marcações hoje"     value={todayAppts.length} sub={`${completed.length} concluídas`} />
        <KpiCard icon={TrendingUp} label="Pendentes"         value={pending.length} />
        <KpiCard icon={MapPin}    label="Unidades ativas"    value={shops.length} />
      </div>

      {/* Métodos de pagamento */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4" style={{ color: RED }} />
          Métodos de Pagamento — Hoje
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Numerário', val: cash,  icon: '💶' },
            { label: 'Cartão',   val: card,  icon: '💳' },
            { label: 'MBWay',    val: mbway, icon: '📱' },
          ].map(m => (
            <div key={m.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--secondary)' }}>
              <p className="text-xl mb-1">{m.icon}</p>
              <p className="text-base font-black text-foreground">€{m.val.toFixed(0)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Confronto Walk-in vs Digital */}
      {(() => {
        const walkins  = completed.filter(a => a.is_walkin);
        const digital  = completed.filter(a => !a.is_walkin);
        const paidDigital = completed.filter(a => a.payment_status === 'paid');
        const unpaid   = completed.filter(a => a.payment_status !== 'paid');
        const walkinRev  = walkins.reduce((s,a) => s+(a.total_price||0), 0);
        const digitalRev = digital.reduce((s,a) => s+(a.total_price||0), 0);
        const hasAlert   = unpaid.length > 0 || walkins.length > 2;
        return (
          <div className={`rounded-2xl border p-5 ${hasAlert ? 'border-yellow-500/30' : 'border-border'}`}
            style={{ background: hasAlert ? 'rgba(234,179,8,0.05)' : 'var(--card)' }}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Receipt className="w-4 h-4" style={{ color: hasAlert ? '#eab308' : RED }} />
              Rastreabilidade — Hoje
              {hasAlert && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">ATENÇÃO</span>}
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl p-3 text-center" style={{ background: 'var(--secondary)' }}>
                <p className="text-lg font-black text-foreground">{digital.length}</p>
                <p className="text-[11px] text-muted-foreground">Via app (marcação)</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: RED }}>€{digitalRev.toFixed(0)}</p>
              </div>
              <div className="rounded-xl p-3 text-center border"
                style={{ background: walkins.length > 0 ? 'rgba(234,179,8,0.08)' : 'var(--secondary)', borderColor: walkins.length > 0 ? 'rgba(234,179,8,0.25)' : 'var(--border)' }}>
                <p className="text-lg font-black text-foreground">{walkins.length}</p>
                <p className="text-[11px] text-muted-foreground">Walk-ins registados</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: '#eab308' }}>€{walkinRev.toFixed(0)}</p>
              </div>
            </div>
            {unpaid.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <span className="text-yellow-400 text-base flex-shrink-0">⚠️</span>
                <p className="text-xs text-yellow-300">
                  <strong>{unpaid.length} corte{unpaid.length!==1?'s':''}</strong> concluído{unpaid.length!==1?'s':''} sem pagamento confirmado no app.
                  {' '}Confirma com os barbeiros o método de pagamento.
                </p>
              </div>
            )}
            {unpaid.length === 0 && completed.length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <span className="text-green-400 text-base">✓</span>
                <p className="text-xs text-green-300">Todos os cortes têm pagamento registado.</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Por unidade */}}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: RED }} />
            Receita por Unidade — Hoje
          </h3>
        </div>
        <div className="divide-y divide-border/50">
          {byShop.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">Sem dados para hoje</div>
          )}
          {byShop.map((shop, i) => {
            const pct = totalRev > 0 ? (shop.rev / totalRev) * 100 : 0;
            return (
              <div key={shop.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-sm font-bold text-foreground">{shop.name}</span>
                    <span className="text-xs text-muted-foreground">· {shop.count} serviços</span>
                  </div>
                  <span className="text-sm font-black text-foreground">€{shop.rev.toFixed(0)}</span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--secondary)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: RED }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{pct.toFixed(0)}% do total</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Shop detail ───────────────────────────────────────────────────────────────
function ShopDetail({ shopId, shopName, appointments, reports }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppts = appointments.filter(a => a.date === today || a.scheduled_date === today);
  const completed  = todayAppts.filter(a => a.status === 'completed');
  const pending    = todayAppts.filter(a => a.status === 'completed' && a.payment_method === 'pending');
  const locked     = todayAppts.filter(a => a.status === 'completed' && a.comanda_locked);

  const paymentIcons = { cash: '💶', card: '💳', mbway: '📱', transfer: '🏦' };

  return (
    <div className="space-y-5">
      {/* KPIs da loja */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard icon={Euro}  label={`Receita — ${shopName}`}
          value={`€${completed.reduce((s,a)=>s+(a.total_price||0),0).toFixed(0)}`} accent />
        <KpiCard icon={Users} label="Marcações hoje" value={todayAppts.length}
          sub={`${completed.length} concluídas`} />
      </div>

      {/* Pagamentos pendentes */}
      {pending.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4" style={{ color: RED }} />
            Pagamentos Pendentes ({pending.length})
          </h3>
          {pending.map(appt => {
            const total = (appt.total_price || 0) + (appt.upsells || []).reduce((s,u) => s+u.price, 0);
            return (
              <div key={appt.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--secondary)' }}>
                <div>
                  <p className="font-medium text-foreground text-sm">{appt.client_name}</p>
                  <p className="text-xs text-muted-foreground">{(appt.services||[]).map(s=>s.name).join(', ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">€{total.toFixed(2)}</span>
                  <div className="flex gap-1">
                    {['cash','card','mbway'].map(method => (
                      <button key={method}
                        onClick={async () => { await base44.entities.Appointment.update(appt.id, { payment_method: method }); window.location.reload(); }}
                        className="px-2 py-1 text-xs rounded-lg border border-border hover:border-red-400 text-foreground bg-card"
                      >
                        {paymentIcons[method]} {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fecho cego */}
      <BlindCashClose
        appointments={appointments}
        shopId={shopId}
        existingReport={reports.find(r => r.barbershop_id === shopId)}
      />

      {/* Comandas fechadas */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">Comandas Fechadas ({locked.length})</h3>
        </div>
        <div className="divide-y divide-border/50">
          {locked.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">Sem comandas fechadas ainda</div>
          )}
          {locked.map(appt => {
            const total = (appt.total_price || 0) + (appt.upsells || []).reduce((s,u) => s+u.price, 0);
            return (
              <div key={appt.id} className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground">{appt.start_time}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{appt.client_name}</p>
                    <p className="text-xs text-muted-foreground">{(appt.services||[]).map(s=>s.name).join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">{paymentIcons[appt.payment_method]||''}</span>
                  <span className="font-semibold text-foreground">€{total.toFixed(2)}</span>
                  {appt.comanda_locked && <span className="text-xs">🔒</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminCash() {
  const [selectedShop, setSelectedShop] = useState('all');
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Barbershop.list(),
  });

  // Para o global: carrega todos os agendamentos de hoje de todas as lojas
  const { data: allAppointments = [] } = useQuery({
    queryKey: ['cash-all-appointments'],
    queryFn: () => base44.entities.Appointment.filter({ date: today }),
  });

  // Para vista individual: filtra por loja selecionada
  const { data: shopAppointments = [] } = useQuery({
    queryKey: ['cash-shop-appointments', selectedShop],
    queryFn: () => base44.entities.Appointment.filter({ date: today, barbershop_id: selectedShop }),
    enabled: selectedShop !== 'all',
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['cash-reports'],
    queryFn: () => base44.entities.CashReport.filter({ date: today }),
  });

  const selectedShopObj = shops.find(s => s.id === selectedShop);
  const isGlobal = selectedShop === 'all';

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Receipt className="w-6 h-6" style={{ color: RED }} />
            Caixa
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
          </p>
        </div>
        {/* Indicador do que está a ver */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(200,16,46,0.08)', border: '1px solid rgba(200,16,46,0.2)' }}>
          {isGlobal
            ? <><Globe className="w-4 h-4" style={{ color: RED }}/><span className="text-sm font-bold" style={{ color: RED }}>Vista Global</span></>
            : <><MapPin className="w-4 h-4" style={{ color: RED }}/><span className="text-sm font-bold" style={{ color: RED }}>{selectedShopObj?.name}</span></>
          }
        </div>
      </div>

      {/* Selector de lojas */}
      <ShopPills shops={shops} selected={selectedShop} onSelect={setSelectedShop} />

      {/* Conteúdo */}
      {isGlobal ? (
        <GlobalOverview
          shops={shops}
          allAppointments={allAppointments}
          allReports={reports}
        />
      ) : (
        <ShopDetail
          shopId={selectedShop}
          shopName={selectedShopObj?.name || ''}
          appointments={shopAppointments}
          reports={reports}
        />
      )}
    </div>
  );
}

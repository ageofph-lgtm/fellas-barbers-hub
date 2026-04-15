import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, User, Calendar, Clock, Scissors, MessageSquare, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const RED = '#C8102E';

export default function BookingConfirmation({
  shop, barber, services, slot, clientInfo, onClientChange, notes, onNotesChange, onConfirm, isSubmitting
}) {
  const total = services.reduce((a, s) => a + s.price, 0);
  const duration = services.reduce((a, s) => a + s.duration_minutes, 0);
  const canConfirm = !isSubmitting && clientInfo.name?.trim() && clientInfo.phone?.trim();

  return (
    <div className="space-y-5 pb-36">
      {/* Summary Card */}
      <div className="rounded-2xl border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: RED }}>
            <Scissors className="w-3 h-3 text-white" />
          </div>
          <p className="text-sm font-black text-foreground">Resumo do agendamento</p>
        </div>
        <div className="divide-y divide-border">
          <Row icon={MapPin} label="Barbearia" value={shop?.name} />
          <Row icon={User} label="Barbeiro" value={barber?.name} />
          <Row icon={Calendar} label="Data" value={slot?.date ? format(slot.date, "EEE, d MMM", { locale: pt }) : '—'} />
          <Row icon={Clock} label="Hora" value={`${slot?.time || '—'} · ${duration} min`} />
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Serviços</p>
            {services.map(s => (
              <div key={s.id} className="flex justify-between items-center text-sm py-0.5">
                <span className="text-foreground">{s.name}</span>
                <span className="font-bold" style={{ color: RED }}>€{s.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 py-3 flex justify-between items-center border-t border-border"
          style={{ background: 'rgba(200,16,46,0.04)' }}>
          <span className="text-sm font-bold text-muted-foreground">Total</span>
          <span className="text-2xl font-black" style={{ color: RED }}>€{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Client Info */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Os teus dados</p>
        <input
          type="text"
          placeholder="Nome completo *"
          value={clientInfo.name || ''}
          onChange={e => onClientChange({ ...clientInfo, name: e.target.value })}
          className="w-full rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground border border-border bg-card focus:outline-none"
          style={{ '--tw-ring-color': RED }}
          onFocus={e => e.target.style.borderColor = RED}
          onBlur={e => e.target.style.borderColor = ''}
        />
        <input
          type="tel"
          placeholder="Telemóvel * (ex: 912 345 678)"
          value={clientInfo.phone || ''}
          onChange={e => onClientChange({ ...clientInfo, phone: e.target.value })}
          className="w-full rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground border border-border bg-card focus:outline-none"
          onFocus={e => e.target.style.borderColor = RED}
          onBlur={e => e.target.style.borderColor = ''}
        />
        <input
          type="email"
          placeholder="Email (opcional)"
          value={clientInfo.email || ''}
          onChange={e => onClientChange({ ...clientInfo, email: e.target.value })}
          className="w-full rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground border border-border bg-card focus:outline-none"
          onFocus={e => e.target.style.borderColor = RED}
          onBlur={e => e.target.style.borderColor = ''}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Notas</p>
        </div>
        <textarea
          placeholder="Ex: prefiro máquina 2, alérgico a gilete..."
          value={notes || ''}
          onChange={e => onNotesChange(e.target.value)}
          rows={3}
          className="w-full rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border bg-card focus:outline-none resize-none"
          onFocus={e => e.target.style.borderColor = RED}
          onBlur={e => e.target.style.borderColor = ''}
        />
      </div>

      {/* ── CTA fixo ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3"
        style={{ background: 'linear-gradient(to top, var(--background) 80%, transparent)' }}
      >
        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          className="w-full py-4 rounded-2xl font-black text-white text-sm transition-all disabled:opacity-40"
          style={{
            background: canConfirm ? RED : 'var(--muted)',
            boxShadow: canConfirm ? '0 8px 24px rgba(200,16,46,0.35)' : 'none',
          }}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> A confirmar...
            </span>
          ) : (
            `Confirmar Agendamento · €${total.toFixed(2)}`
          )}
        </button>
        {!clientInfo.name?.trim() && (
          <p className="text-center text-xs text-muted-foreground mt-2">Preenche o nome e telemóvel para continuar</p>
        )}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Icon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground text-right truncate">{value || '—'}</span>
      </div>
    </div>
  );
}

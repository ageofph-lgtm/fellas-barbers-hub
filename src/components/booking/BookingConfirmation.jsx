import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, User, Calendar, Clock, Scissors, MessageSquare, Check } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function BookingConfirmation({
  shop, barber, services, slot, clientInfo, onClientChange, notes, onNotesChange, onConfirm, isSubmitting
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center"
        >
          <Check className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Confirma o teu agendamento</h2>
        <p className="text-muted-foreground mt-2">Revê os detalhes antes de confirmar</p>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Barbearia</p>
            <p className="font-semibold text-foreground">{shop?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Barbeiro</p>
            <p className="font-semibold text-foreground">{barber?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Scissors className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Serviços</p>
            {services.map(s => (
              <p key={s.id} className="font-medium text-foreground text-sm">{s.name} — €{s.price}</p>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Data e Hora</p>
            <p className="font-semibold text-foreground">
              {slot?.date ? format(slot.date, "EEEE, d 'de' MMMM", { locale: pt }) : ''} às {slot?.time}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Duração</p>
            <p className="font-semibold text-foreground">{services.reduce((a, s) => a + s.duration_minutes, 0)} min</p>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex justify-between items-center">
          <span className="text-muted-foreground font-medium">Total</span>
          <span className="text-2xl font-bold text-primary">€{services.reduce((a, s) => a + s.price, 0).toFixed(2)}</span>
        </div>
      </div>

      {/* Client Info */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Os teus dados</h3>
        <Input
          placeholder="Nome completo"
          value={clientInfo.name}
          onChange={e => onClientChange({ ...clientInfo, name: e.target.value })}
          className="bg-card border-border rounded-xl h-12"
        />
        <Input
          placeholder="Telemóvel (ex: 912 345 678)"
          value={clientInfo.phone}
          onChange={e => onClientChange({ ...clientInfo, phone: e.target.value })}
          className="bg-card border-border rounded-xl h-12"
        />
        <Input
          placeholder="Email (opcional)"
          type="email"
          value={clientInfo.email}
          onChange={e => onClientChange({ ...clientInfo, email: e.target.value })}
          className="bg-card border-border rounded-xl h-12"
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Notas (ex: alérgico a gilete)</span>
        </div>
        <Textarea
          placeholder="Algo que o barbeiro deva saber..."
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          className="bg-card border-border rounded-xl min-h-[80px]"
        />
      </div>

      <Button
        onClick={onConfirm}
        disabled={isSubmitting || !clientInfo.name || !clientInfo.phone}
        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg gold-glow-strong"
      >
        {isSubmitting ? 'A confirmar...' : 'Confirmar Agendamento'}
      </Button>
    </div>
  );
}
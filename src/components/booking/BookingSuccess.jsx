import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function BookingSuccess({ appointment, onNewBooking, onViewLoyalty }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-24 h-24 mx-auto rounded-full bg-green-500/20 flex items-center justify-center"
      >
        <CheckCircle className="w-12 h-12 text-green-400" />
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Agendamento Confirmado!</h2>
        <p className="text-muted-foreground mt-2">Vamos enviar-te um lembrete por WhatsApp</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 text-left max-w-sm mx-auto">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <p className="font-semibold text-foreground">
              {appointment?.date ? format(new Date(appointment.date), "d 'de' MMMM", { locale: pt }) : ''}
            </p>
            <p className="text-sm text-muted-foreground">às {appointment?.start_time}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-sm mx-auto">
        <Button
          onClick={onViewLoyalty}
          variant="outline"
          className="w-full h-12 rounded-2xl border-primary/40 text-primary hover:bg-primary/10"
        >
          Ver Cartão de Fidelidade <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          onClick={onNewBooking}
          className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          Novo Agendamento
        </Button>
      </div>
    </motion.div>
  );
}
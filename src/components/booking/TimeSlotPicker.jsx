import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addDays, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';

function generateSlots(openHour, closeHour, durationMinutes, bookedSlots, selectedDate) {
  const slots = [];
  const now = new Date();
  const step = 30;

  for (let h = openHour; h < closeHour; h++) {
    for (let m = 0; m < 60; m += step) {
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const endMinutes = h * 60 + m + durationMinutes;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;

      if (endH > closeHour || (endH === closeHour && endM > 0)) continue;

      // Skip past times for today
      if (isToday(selectedDate)) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(h, m, 0);
        if (isBefore(slotTime, now)) continue;
      }

      // Check conflicts with booked slots
      const slotStart = h * 60 + m;
      const slotEnd = slotStart + durationMinutes;
      const isConflict = bookedSlots.some(b => {
        const [bh, bm] = b.start.split(':').map(Number);
        const [eh, em] = b.end.split(':').map(Number);
        const bStart = bh * 60 + bm;
        const bEnd = eh * 60 + em;
        return slotStart < bEnd && slotEnd > bStart;
      });

      if (!isConflict) {
        slots.push({
          time: timeStr,
          endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
        });
      }
    }
  }
  return slots;
}

export default function TimeSlotPicker({ appointments, totalDuration, shopHours, selectedSlot, onSelect }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const days = useMemo(() => {
    const start = addDays(startOfDay(new Date()), weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekOffset]);

  const bookedSlots = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return (appointments || [])
      .filter(a => a.date === dateStr && a.status !== 'cancelled' && a.status !== 'no_show')
      .map(a => ({ start: a.start_time, end: a.end_time }));
  }, [selectedDate, appointments]);

  const slots = useMemo(() => {
    if (!selectedDate || !shopHours) return [];
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayKey = days[selectedDate.getDay()];
    const hours = shopHours[dayKey];
    if (!hours?.open || !hours?.close) return [];
    const [oh] = hours.open.split(':').map(Number);
    const [ch] = hours.close.split(':').map(Number);
    return generateSlots(oh, ch, totalDuration, bookedSlots, selectedDate);
  }, [selectedDate, totalDuration, bookedSlots, shopHours]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Quando preferes?</h2>
        <p className="text-muted-foreground mt-2">
          <Clock className="w-4 h-4 inline mr-1" />
          Duração total: {totalDuration} min
        </p>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
          disabled={weekOffset === 0}
          className="p-2 rounded-xl bg-secondary text-foreground disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-muted-foreground font-medium">
          {format(days[0], "d MMM", { locale: pt })} — {format(days[6], "d MMM", { locale: pt })}
        </span>
        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="p-2 rounded-xl bg-secondary text-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {days.map((day) => {
          const isActive = isSameDay(day, selectedDate);
          const isPast = isBefore(day, startOfDay(new Date()));
          return (
            <button
              key={day.toISOString()}
              disabled={isPast}
              onClick={() => setSelectedDate(day)}
              className={`flex-shrink-0 flex flex-col items-center py-3 px-4 rounded-2xl transition-all min-w-[60px] ${
                isActive
                  ? 'bg-primary text-primary-foreground gold-glow'
                  : isPast
                    ? 'opacity-30 text-muted-foreground'
                    : 'bg-card border border-border text-foreground hover:border-primary/40'
              }`}
            >
              <span className="text-[10px] uppercase font-medium">
                {format(day, 'EEE', { locale: pt })}
              </span>
              <span className="text-lg font-bold">{format(day, 'd')}</span>
            </button>
          );
        })}
      </div>

      {/* Time Slots */}
      {slots.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((slot, i) => {
            const isActive = selectedSlot?.time === slot.time && isSameDay(selectedDate, selectedSlot?.date);
            return (
              <motion.button
                key={slot.time}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onSelect({ ...slot, date: selectedDate })}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground gold-glow'
                    : 'bg-card border border-border text-foreground hover:border-primary/40'
                }`}
              >
                {slot.time}
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p>Sem horários disponíveis para este dia</p>
        </div>
      )}
    </div>
  );
}
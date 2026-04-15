import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addDays, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';

const RED = '#C8102E';

// Horários padrão por nome da loja (fallback robusto)
const SHOP_HOURS_FALLBACK = {
  'Alameda':      { open: 10, close: 19, openSat: 10, closeSat: 17, openSun: null },
  'Campo Grande': { open: 10, close: 20, openSat: 10, closeSat: 18, openSun: null },
  'Almada':       { open: 10, close: 20, openSat: 10, closeSat: 18, openSun: null },
};

function getShopOpenClose(shop, dayOfWeek) {
  // Tentar ler dos campos da DB primeiro
  let hoursStr = null;
  if (dayOfWeek === 0) hoursStr = shop?.hours_sunday;
  else if (dayOfWeek === 6) hoursStr = shop?.hours_saturday;
  else hoursStr = shop?.hours_weekday;

  if (hoursStr && hoursStr.toLowerCase() !== 'fechado') {
    const m = hoursStr.match(/(\d{1,2})[h:](\d{0,2})\s*[-–—]\s*(\d{1,2})[h:](\d{0,2})/);
    if (m) return { open: +m[1], close: +m[3] };
  }

  // Fallback static
  for (const [key, val] of Object.entries(SHOP_HOURS_FALLBACK)) {
    if (shop?.name?.includes(key)) {
      if (dayOfWeek === 0) return val.openSun ? { open: val.openSun, close: val.openSun } : null;
      if (dayOfWeek === 6) return { open: val.openSat, close: val.closeSat };
      return { open: val.open, close: val.close };
    }
  }
  // Fallback genérico
  if (dayOfWeek === 0) return null; // Domingo fechado
  if (dayOfWeek === 6) return { open: 10, close: 18 };
  return { open: 10, close: 20 };
}

function generateSlots(openH, closeH, durationMin, bookedSlots, date) {
  const slots = [];
  const now = new Date();
  for (let h = openH; h < closeH; h++) {
    for (let m = 0; m < 60; m += 30) {
      const endMin = h * 60 + m + durationMin;
      if (endMin > closeH * 60) continue;
      if (isToday(date)) {
        const t = new Date(date);
        t.setHours(h, m, 0);
        if (isBefore(t, now)) continue;
      }
      const start = h * 60 + m;
      const end   = start + durationMin;
      const clash = bookedSlots.some(b => {
        const [bh, bm] = (b.start || '00:00').split(':').map(Number);
        const [eh, em] = (b.end   || '00:00').split(':').map(Number);
        return start < (eh*60+em) && end > (bh*60+bm);
      });
      if (!clash) {
        const endH = Math.floor(endMin/60), endM = endMin%60;
        slots.push({
          time:    `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
          endTime: `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`,
        });
      }
    }
  }
  return slots;
}

export default function TimeSlotPicker({ shop, appointments, totalDuration, selectedSlot, onSelect }) {
  const [weekOffset, setWeekOffset]   = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const days = useMemo(() => {
    const base = addDays(startOfDay(new Date()), weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(base, i));
  }, [weekOffset]);

  const bookedSlots = useMemo(() => {
    const ds = format(selectedDate, 'yyyy-MM-dd');
    return (appointments || [])
      .filter(a => a.date === ds && !['cancelled','no_show'].includes(a.status))
      .map(a => ({ start: a.start_time, end: a.end_time }));
  }, [selectedDate, appointments]);

  const slots = useMemo(() => {
    const hc = getShopOpenClose(shop, selectedDate.getDay());
    if (!hc) return [];
    return generateSlots(hc.open, hc.close, totalDuration || 30, bookedSlots, selectedDate);
  }, [selectedDate, totalDuration, bookedSlots, shop]);

  return (
    <div className="space-y-5 pb-6">
      <div className="text-center">
        <h2 className="text-xl font-black text-foreground">Quando preferes?</h2>
        <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
          <Clock className="w-3.5 h-3.5"/> Duração: {totalDuration} min
        </p>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekOffset(Math.max(0, weekOffset-1))} disabled={weekOffset===0}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center disabled:opacity-30">
          <ChevronLeft className="w-5 h-5 text-foreground"/>
        </button>
        <span className="text-xs font-bold text-muted-foreground">
          {format(days[0], "d MMM", {locale:pt})} – {format(days[6], "d MMM", {locale:pt})}
        </span>
        <button onClick={() => setWeekOffset(weekOffset+1)}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ChevronRight className="w-5 h-5 text-foreground"/>
        </button>
      </div>

      {/* Day strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        {days.map(day => {
          const active = isSameDay(day, selectedDate);
          const past   = isBefore(day, startOfDay(new Date()));
          const hc     = getShopOpenClose(shop, day.getDay());
          const closed = !hc;
          return (
            <button key={day.toISOString()}
              disabled={past || closed}
              onClick={() => setSelectedDate(day)}
              className="flex-shrink-0 flex flex-col items-center py-2.5 px-3 rounded-2xl transition-all min-w-[52px] text-center"
              style={{
                background: active ? RED : 'var(--card)',
                color: active ? '#fff' : closed || past ? 'var(--muted-foreground)' : 'var(--foreground)',
                border: active ? 'none' : '1px solid var(--border)',
                opacity: past || closed ? 0.4 : 1,
              }}>
              <span className="text-[9px] uppercase font-bold tracking-wide">
                {format(day, 'EEE', {locale:pt})}
              </span>
              <span className="text-base font-black mt-0.5">{format(day, 'd')}</span>
              {closed && <span className="text-[8px] mt-0.5">Fechado</span>}
            </button>
          );
        })}
      </div>

      {/* Slots grid */}
      {slots.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {slots.map((slot, i) => {
            const active = selectedSlot?.time === slot.time && isSameDay(selectedDate, selectedSlot?.date);
            return (
              <motion.button key={slot.time}
                initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                transition={{ delay: i*0.02 }}
                onClick={() => onSelect({ ...slot, date: selectedDate })}
                className="py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: active ? RED : 'var(--card)',
                  color: active ? '#fff' : 'var(--foreground)',
                  border: active ? 'none' : '1px solid var(--border)',
                  boxShadow: active ? '0 4px 12px rgba(200,16,46,0.3)' : 'none',
                }}>
                {slot.time}
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 space-y-2">
          <Clock className="w-8 h-8 mx-auto text-muted-foreground opacity-40"/>
          <p className="text-sm text-muted-foreground">Sem horários disponíveis</p>
          <p className="text-xs text-muted-foreground">Tenta outro dia</p>
        </div>
      )}
    </div>
  );
}

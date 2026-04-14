import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ChevronRight, Navigation, Loader2, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';

// ── Helpers ──────────────────────────────────────────────────────────────────

function toRad(deg) { return deg * Math.PI / 180; }

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DAYS_PT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAYS_LABEL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getHoursForDay(openingHours, dayIndex) {
  const key = DAYS_PT[dayIndex];
  const h = openingHours?.[key];
  if (!h?.open || !h?.close) return null;
  return `${h.open}–${h.close}`;
}

function isOpenNow(openingHours) {
  if (!openingHours) return false;
  const now = new Date();
  const key = DAYS_PT[now.getDay()];
  const h = openingHours?.[key];
  if (!h?.open || !h?.close) return false;
  const cur = now.getHours() * 100 + now.getMinutes();
  const [oh, om] = h.open.split(':').map(Number);
  const [ch, cm] = h.close.split(':').map(Number);
  return cur >= oh * 100 + om && cur <= ch * 100 + cm;
}

function getNextOpenDays(openingHours, count = 4) {
  const result = [];
  const today = new Date();
  for (let i = 0; i < 7 && result.length < count; i++) {
    const d = addDays(today, i);
    const key = DAYS_PT[d.getDay()];
    const h = openingHours?.[key];
    if (h?.open && h?.close) {
      result.push({
        label: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : DAYS_LABEL[d.getDay()],
        hours: `${h.open}–${h.close}`,
        isToday: i === 0,
      });
    }
  }
  return result;
}

function DistanceBadge({ km }) {
  if (km === null) return null;
  const color = km < 2 ? 'text-green-400 bg-green-500/15 border-green-500/30'
    : km < 5 ? 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30'
    : 'text-zinc-400 bg-zinc-500/15 border-zinc-500/30';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      <Navigation className="w-3 h-3" />
      {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ShopSelector({ shops, appointments = [], onSelect }) {
  const [userLocation, setUserLocation] = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState(false);
  const [expandedShop, setExpandedShop] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) { setGeoLoading(false); setGeoError(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => { setGeoLoading(false); setGeoError(true); },
      { timeout: 6000 }
    );
  }, []);

  // Enrich shops with distance + sort by distance
  const enrichedShops = shops.map((shop) => {
    let km = null;
    if (userLocation && shop.latitude && shop.longitude) {
      km = haversineKm(userLocation.lat, userLocation.lon, shop.latitude, shop.longitude);
    }
    return { ...shop, km };
  }).sort((a, b) => {
    if (a.km === null && b.km === null) return 0;
    if (a.km === null) return 1;
    if (b.km === null) return -1;
    return a.km - b.km;
  });

  // Count available slots today per barbershop
  const today = format(new Date(), 'yyyy-MM-dd');
  const getAvailableToday = (shopId) => {
    return appointments.filter(a => a.barbershop_id === shopId && a.date === today && a.status === 'available').length;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground">Escolhe a barbearia</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          {geoLoading ? (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Loader2 className="w-3 h-3 animate-spin" /> A detectar localização...
            </span>
          ) : geoError ? (
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Localização não disponível
            </span>
          ) : (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <Navigation className="w-3 h-3" /> Ordenado por proximidade
            </span>
          )}
        </div>
      </div>

      {/* Shop Cards */}
      <div className="grid gap-3">
        {enrichedShops.map((shop, i) => {
          const open = isOpenNow(shop.opening_hours);
          const nextDays = getNextOpenDays(shop.opening_hours, 3);
          const isExpanded = expandedShop === shop.id;

          return (
            <motion.div
              key={shop.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`bg-card border rounded-2xl overflow-hidden transition-all duration-300 ${
                open ? 'border-border hover:border-primary/40' : 'border-border/50 opacity-75'
              }`}
            >
              {/* Main Row */}
              <button
                className="w-full p-4 flex items-center gap-3 text-left"
                onClick={() => open ? onSelect(shop) : setExpandedShop(isExpanded ? null : shop.id)}
              >
                {/* Icon / Photo */}
                <div className="w-14 h-14 rounded-xl bg-secondary overflow-hidden flex-shrink-0 relative">
                  {shop.photo_url ? (
                    <img src={shop.photo_url} alt={shop.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#C9A84C]/10">
                      <MapPin className="w-5 h-5 text-[#C9A84C]" />
                    </div>
                  )}
                  {/* Closest badge */}
                  {i === 0 && shop.km !== null && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C9A84C] flex items-center justify-center">
                      <span className="text-[8px] font-black text-black">★</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground text-base leading-tight">{shop.name}</h3>
                    {i === 0 && shop.km !== null && (
                      <span className="text-[10px] font-bold text-[#C9A84C] bg-[#C9A84C]/10 px-1.5 py-0.5 rounded-full">
                        + próxima
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{shop.address}</p>

                  {/* Badges row */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {open ? 'Aberto' : 'Fechado'}
                    </span>

                    <DistanceBadge km={shop.km} />

                    {/* Next opening hours */}
                    {nextDays[0] && (
                      <span className="text-xs text-zinc-500">
                        {open ? nextDays[0].hours : `Abre ${nextDays[1]?.label || ''} ${nextDays[1]?.hours || ''}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="flex-shrink-0">
                  {open ? (
                    <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/20 flex items-center justify-center">
                      <ChevronRight className="w-5 h-5 text-[#C9A84C]" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded: Horários próximos dias (só para fechadas) */}
              {!open && isExpanded && nextDays.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-4 border-t border-border/50"
                >
                  <p className="text-xs text-zinc-500 mt-3 mb-2 font-medium uppercase tracking-wide">Próximos horários</p>
                  <div className="grid grid-cols-3 gap-2">
                    {nextDays.map((d, idx) => (
                      <div key={idx} className="bg-secondary/50 rounded-xl p-2.5 text-center">
                        <p className="text-xs font-bold text-foreground">{d.label}</p>
                        <p className="text-[11px] text-[#C9A84C] mt-0.5">{d.hours}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Open shop: inline hours preview */}
              {open && (
                <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
                  {nextDays.map((d, idx) => (
                    <div key={idx} className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-center ${
                      d.isToday ? 'bg-[#C9A84C]/15 border border-[#C9A84C]/30' : 'bg-secondary/60'
                    }`}>
                      <p className={`text-[10px] font-bold ${d.isToday ? 'text-[#C9A84C]' : 'text-muted-foreground'}`}>{d.label}</p>
                      <p className="text-[11px] text-foreground mt-0.5">{d.hours}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

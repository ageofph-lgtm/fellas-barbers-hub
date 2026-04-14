import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ChevronRight, Navigation, Loader2, Calendar, Heart, Star } from 'lucide-react';
import { addDays } from 'date-fns';

// ── Geo helpers ───────────────────────────────────────────────────────────────
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

function getNextOpenDays(openingHours, count = 3) {
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

// ── Permission screen ─────────────────────────────────────────────────────────
function GeoPermissionScreen({ onAllow, onSkip }) {
  const [requesting, setRequesting] = useState(false);

  const handleAllow = () => {
    setRequesting(true);
    onAllow();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center text-center py-8 px-4"
    >
      <div className="w-20 h-20 rounded-3xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mb-6">
        <Navigation className="w-9 h-9 text-[#C9A84C]" />
      </div>
      <h3 className="text-xl font-black text-foreground mb-2">Onde estás?</h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-8">
        Usa a tua localização para ver a barbearia mais próxima e a distância até cada unidade.
      </p>
      <button
        onClick={handleAllow}
        disabled={requesting}
        className="w-full max-w-xs py-4 rounded-2xl bg-[#C9A84C] text-black font-bold text-sm mb-3 hover:bg-[#d4b55a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
        {requesting ? 'A detectar...' : 'Usar a minha localização'}
      </button>
      <button
        onClick={onSkip}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        Continuar sem localização
      </button>
    </motion.div>
  );
}

// ── Distance badge ────────────────────────────────────────────────────────────
function DistanceBadge({ km }) {
  if (km === null || km === undefined) return null;
  const color = km < 2
    ? 'text-green-400 bg-green-500/15 border-green-500/30'
    : km < 5
    ? 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30'
    : 'text-zinc-400 bg-zinc-500/15 border-zinc-500/30';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      <Navigation className="w-3 h-3" />
      {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ShopSelector({ shops, onSelect, favoriteShopId }) {
  const [geoState, setGeoState] = useState('asking'); // 'asking' | 'loading' | 'done' | 'denied'
  const [userLocation, setUserLocation] = useState(null);
  const [expandedShop, setExpandedShop] = useState(null);

  const requestGeo = useCallback(() => {
    setGeoState('loading');
    if (!navigator.geolocation) { setGeoState('denied'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoState('done');
      },
      () => setGeoState('denied'),
      { timeout: 8000 }
    );
  }, []);

  // Enrich + sort
  const enrichedShops = shops.map((shop) => {
    let km = null;
    if (userLocation && shop.latitude && shop.longitude) {
      km = haversineKm(userLocation.lat, userLocation.lon, shop.latitude, shop.longitude);
    }
    const isFav = shop.id === favoriteShopId;
    return { ...shop, km, isFav };
  }).sort((a, b) => {
    // Favorito sempre primeiro
    if (a.isFav && !b.isFav) return -1;
    if (!a.isFav && b.isFav) return 1;
    // Depois por distância
    if (a.km === null && b.km === null) return 0;
    if (a.km === null) return 1;
    if (b.km === null) return -1;
    return a.km - b.km;
  });

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-foreground">Escolhe a barbearia</h2>
        {geoState === 'done' && (
          <span className="text-xs text-green-400 flex items-center justify-center gap-1 mt-1">
            <Navigation className="w-3 h-3" /> Ordenado por proximidade
          </span>
        )}
        {geoState === 'denied' && (
          <span className="text-xs text-zinc-500 flex items-center justify-center gap-1 mt-1">
            <MapPin className="w-3 h-3" /> Localização não disponível
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Ecrã de pedido de permissão */}
        {geoState === 'asking' && (
          <GeoPermissionScreen
            onAllow={requestGeo}
            onSkip={() => setGeoState('denied')}
          />
        )}

        {/* Loading geo */}
        {geoState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 gap-3"
          >
            <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
            <p className="text-sm text-muted-foreground">A detectar localização...</p>
          </motion.div>
        )}

        {/* Lista de lojas */}
        {(geoState === 'done' || geoState === 'denied') && (
          <motion.div
            key="shops"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {enrichedShops.map((shop, i) => {
              const open = isOpenNow(shop.opening_hours);
              const nextDays = getNextOpenDays(shop.opening_hours, 3);
              const isExpanded = expandedShop === shop.id;
              const isClosest = i === 0 && shop.km !== null;

              return (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                    shop.isFav
                      ? 'border-[#C9A84C]/50 bg-gradient-to-br from-[#C9A84C]/5 to-card'
                      : open
                      ? 'border-border bg-card hover:border-[#C9A84C]/30'
                      : 'border-border/40 bg-card/60 opacity-70'
                  }`}
                >
                  <button
                    className="w-full p-4 flex items-center gap-3 text-left"
                    onClick={() => open ? onSelect(shop) : setExpandedShop(isExpanded ? null : shop.id)}
                  >
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative bg-secondary">
                      {shop.photo_url
                        ? <img src={shop.photo_url} alt={shop.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center bg-[#C9A84C]/10">
                            <MapPin className="w-5 h-5 text-[#C9A84C]" />
                          </div>
                      }
                      {shop.isFav && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#C9A84C] flex items-center justify-center">
                          <Heart className="w-2.5 h-2.5 text-black fill-black" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-sm leading-tight">{shop.name}</h3>
                        {shop.isFav && (
                          <span className="text-[10px] font-bold text-[#C9A84C] bg-[#C9A84C]/10 px-1.5 py-0.5 rounded-full">
                            Favorita
                          </span>
                        )}
                        {isClosest && !shop.isFav && (
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-500/10 px-1.5 py-0.5 rounded-full">
                            + próxima
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{shop.address}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          open ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {open ? 'Aberto' : 'Fechado'}
                        </span>
                        <DistanceBadge km={shop.km} />
                        {nextDays[0] && open && (
                          <span className="text-xs text-zinc-500">{nextDays[0].hours}</span>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex-shrink-0">
                      {open
                        ? <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/15 flex items-center justify-center">
                            <ChevronRight className="w-5 h-5 text-[#C9A84C]" />
                          </div>
                        : <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                          </div>
                      }
                    </div>
                  </button>

                  {/* Horários expandidos (lojas fechadas) */}
                  <AnimatePresence>
                    {!open && isExpanded && nextDays.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-4 border-t border-border/40"
                      >
                        <p className="text-[10px] text-zinc-500 mt-3 mb-2 font-semibold uppercase tracking-wider">
                          Próximos horários
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {nextDays.map((d, idx) => (
                            <div key={idx} className="bg-secondary/60 rounded-xl p-2.5 text-center">
                              <p className="text-xs font-bold text-foreground">{d.label}</p>
                              <p className="text-[11px] text-[#C9A84C] mt-0.5">{d.hours}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Horários inline (lojas abertas) */}
                  {open && (
                    <div className="px-4 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                      {nextDays.map((d, idx) => (
                        <div key={idx} className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-center ${
                          d.isToday ? 'bg-[#C9A84C]/15 border border-[#C9A84C]/30' : 'bg-secondary/60'
                        }`}>
                          <p className={`text-[10px] font-bold ${d.isToday ? 'text-[#C9A84C]' : 'text-muted-foreground'}`}>
                            {d.label}
                          </p>
                          <p className="text-[11px] text-foreground mt-0.5">{d.hours}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

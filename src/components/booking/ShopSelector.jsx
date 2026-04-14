import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ChevronRight, Navigation, Calendar, Heart, Phone } from 'lucide-react';
import { addDays } from 'date-fns';

const RED = '#C8102E';

// ── Dados reais das lojas (fallback se DB não tiver horários/coords) ──────────
const SHOP_DATA = {
  'Alameda': {
    address: 'Alameda Dom Afonso Henriques, 47A · Lisboa',
    phone: '+351 912 286 442',
    lat: 38.7318, lon: -9.1353,
    hours: { weekday: '10:00–19:00', saturday: '10:00–17:00', sunday: 'Fechado' },
    schedule: { mon: { open: '10:00', close: '19:00' }, tue: { open: '10:00', close: '19:00' }, wed: { open: '10:00', close: '19:00' }, thu: { open: '10:00', close: '19:00' }, fri: { open: '10:00', close: '19:00' }, sat: { open: '10:00', close: '17:00' } },
  },
  'Campo Grande': {
    address: 'Campo Grande, 296 B · Alvalade · Lisboa',
    phone: '+351 910 452 767',
    lat: 38.7573, lon: -9.1538,
    hours: { weekday: '10:00–20:00', saturday: '10:00–18:00', sunday: 'Fechado' },
    schedule: { mon: { open: '10:00', close: '20:00' }, tue: { open: '10:00', close: '20:00' }, wed: { open: '10:00', close: '20:00' }, thu: { open: '10:00', close: '20:00' }, fri: { open: '10:00', close: '20:00' }, sat: { open: '10:00', close: '18:00' } },
  },
  'Almada': {
    address: 'Av. do Cristo Rei 2A · Almada',
    phone: '+351 923 343 517',
    lat: 38.6769, lon: -9.1717,
    hours: { weekday: '10:00–20:00', saturday: '10:00–18:00', sunday: 'Fechado' },
    schedule: { mon: { open: '10:00', close: '20:00' }, tue: { open: '10:00', close: '20:00' }, wed: { open: '10:00', close: '20:00' }, thu: { open: '10:00', close: '20:00' }, fri: { open: '10:00', close: '20:00' }, sat: { open: '10:00', close: '18:00' } },
  },
};

function getShopData(shop) {
  for (const [key, val] of Object.entries(SHOP_DATA)) {
    if (shop.name?.includes(key)) return val;
  }
  return null;
}

// ── Geo ───────────────────────────────────────────────────────────────────────
function toRad(d) { return d * Math.PI / 180; }
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const DAYS_KEY = ['sun','mon','tue','wed','thu','fri','sat'];
const DAYS_PT  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function isOpenNow(schedule) {
  if (!schedule) return false;
  const now = new Date(), key = DAYS_KEY[now.getDay()], h = schedule[key];
  if (!h?.open || !h?.close) return false;
  const cur = now.getHours()*100 + now.getMinutes();
  const [oh,om] = h.open.split(':').map(Number);
  const [ch,cm] = h.close.split(':').map(Number);
  return cur >= oh*100+om && cur <= ch*100+cm;
}

function getNextDays(schedule, count = 3) {
  const res = [];
  for (let i = 0; i < 7 && res.length < count; i++) {
    const d = addDays(new Date(), i), key = DAYS_KEY[d.getDay()], h = schedule?.[key];
    if (h?.open && h?.close) res.push({ label: i===0?'Hoje':i===1?'Amanhã':DAYS_PT[d.getDay()], hours:`${h.open}–${h.close}`, isToday: i===0 });
  }
  return res;
}

function DistanceBadge({ km }) {
  if (km == null) return null;
  const [color, bg] = km < 2 ? ['#22c55e','rgba(34,197,94,0.12)'] : km < 5 ? ['#eab308','rgba(234,179,8,0.12)'] : ['#71717a','rgba(113,113,122,0.12)'];
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border"
      style={{ color, background: bg, borderColor: color + '50' }}>
      <Navigation className="w-3 h-3" />
      {km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`}
    </span>
  );
}

export default function ShopSelector({ shops, userLocation, favoriteShopId, onSelect }) {
  const [expanded, setExpanded] = useState(null);

  const enriched = shops.map(shop => {
    const extra = getShopData(shop);
    const lat = shop.latitude  || extra?.lat;
    const lon = shop.longitude || extra?.lon;
    const schedule = shop.opening_hours || extra?.schedule;
    const address  = shop.address       || extra?.address || '';
    const phone    = shop.phone         || extra?.phone   || '';
    let km = null;
    if (userLocation && lat && lon) km = haversineKm(userLocation.lat, userLocation.lon, lat, lon);
    return { ...shop, lat, lon, schedule, address, phone, km, isFav: shop.id === favoriteShopId };
  }).sort((a,b) => {
    if (a.isFav && !b.isFav) return -1;
    if (!a.isFav && b.isFav) return 1;
    if (a.km==null && b.km==null) return 0;
    if (a.km==null) return 1; if (b.km==null) return -1;
    return a.km - b.km;
  });

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h2 className="text-xl font-black text-foreground uppercase tracking-wide">Escolhe a unidade</h2>
        {userLocation
          ? <p className="text-xs flex items-center justify-center gap-1 mt-1" style={{ color: '#22c55e' }}><Navigation className="w-3 h-3"/> Ordenado por proximidade</p>
          : <p className="text-xs text-muted-foreground mt-1">3 unidades em Lisboa e Almada</p>
        }
      </div>

      {enriched.map((shop, i) => {
        const open     = isOpenNow(shop.schedule);
        const nextDays = getNextDays(shop.schedule, 3);
        const isExp    = expanded === shop.id;
        const isClose  = i === 0 && shop.km != null && !shop.isFav;

        return (
          <motion.div key={shop.id}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl border overflow-hidden transition-all duration-200"
            style={{
              borderColor: shop.isFav ? `${RED}60` : open ? 'var(--border)' : 'rgba(var(--border),0.4)',
              background: shop.isFav ? 'rgba(200,16,46,0.04)' : 'var(--card)',
              opacity: !open && !shop.isFav ? 0.72 : 1,
            }}
          >
            <button className="w-full p-4 flex items-center gap-3 text-left"
              onClick={() => open ? onSelect(shop) : setExpanded(isExp ? null : shop.id)}>
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative bg-secondary">
                {shop.photo_url
                  ? <img src={shop.photo_url} alt={shop.name} className="w-full h-full object-cover"/>
                  : <div className="w-full h-full flex items-center justify-center"
                      style={{ background: 'rgba(200,16,46,0.08)' }}>
                      <MapPin className="w-5 h-5" style={{ color: RED }}/>
                    </div>
                }
                {shop.isFav && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: RED }}>
                    <Heart className="w-2.5 h-2.5 fill-white text-white"/>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-foreground text-sm">{shop.name}</h3>
                  {shop.isFav && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ color: RED, background: 'rgba(200,16,46,0.12)' }}>Favorita ♥</span>
                  )}
                  {isClose && (
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-500/10 px-1.5 py-0.5 rounded-full">
                      + próxima
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{shop.address}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {/* Status */}
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: open ? '#22c55e' : RED,
                      background: open ? 'rgba(34,197,94,0.12)' : 'rgba(200,16,46,0.12)',
                    }}>
                    <Clock className="w-3 h-3"/>
                    {open ? 'Aberto' : 'Fechado'}
                  </span>
                  <DistanceBadge km={shop.km}/>
                  {open && nextDays[0] && (
                    <span className="text-xs text-muted-foreground">{nextDays[0].hours}</span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: open ? 'rgba(200,16,46,0.12)' : 'var(--secondary)' }}>
                {open
                  ? <ChevronRight className="w-5 h-5" style={{ color: RED }}/>
                  : <Calendar className="w-4 h-4 text-muted-foreground"/>
                }
              </div>
            </button>

            {/* Horários fechada expandida */}
            <AnimatePresence>
              {!open && isExp && nextDays.length > 0 && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                  className="px-4 pb-4 border-t border-border/40">
                  <p className="text-[10px] text-muted-foreground mt-3 mb-2 font-bold uppercase tracking-wider">Próximos horários</p>
                  <div className="grid grid-cols-3 gap-2">
                    {nextDays.map((d,idx) => (
                      <div key={idx} className="rounded-xl p-2.5 text-center bg-secondary/60">
                        <p className="text-xs font-bold text-foreground">{d.label}</p>
                        <p className="text-[11px] mt-0.5 font-semibold" style={{ color: RED }}>{d.hours}</p>
                      </div>
                    ))}
                  </div>
                  {shop.phone && (
                    <a href={`tel:${shop.phone}`}
                      className="mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Phone className="w-3.5 h-3.5" style={{ color: RED }}/>
                      {shop.phone}
                    </a>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Horários aberta inline */}
            {open && (
              <div className="px-4 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {nextDays.map((d,idx) => (
                  <div key={idx} className="flex-shrink-0 rounded-lg px-3 py-1.5 text-center"
                    style={d.isToday
                      ? { background: 'rgba(200,16,46,0.1)', border: `1px solid rgba(200,16,46,0.3)` }
                      : { background: 'rgba(255,255,255,0.04)' }}>
                    <p className={`text-[10px] font-bold`}
                      style={{ color: d.isToday ? RED : 'var(--muted-foreground)' }}>{d.label}</p>
                    <p className="text-[11px] text-foreground mt-0.5">{d.hours}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

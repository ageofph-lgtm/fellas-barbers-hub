import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ChevronRight, Navigation, Calendar, Heart, Phone } from 'lucide-react';
import { addDays } from 'date-fns';

const RED = '#C8102E';

const SHOP_DATA = {
  'Alameda':      { address: 'Alameda Dom Afonso Henriques, 47A · Lisboa', phone: '+351 912 286 442', lat: 38.7318, lon: -9.1353, schedule: { mon:{open:'10:00',close:'19:00'}, tue:{open:'10:00',close:'19:00'}, wed:{open:'10:00',close:'19:00'}, thu:{open:'10:00',close:'19:00'}, fri:{open:'10:00',close:'19:00'}, sat:{open:'10:00',close:'17:00'} } },
  'Campo Grande': { address: 'Campo Grande, 296 B · Alvalade · Lisboa',    phone: '+351 910 452 767', lat: 38.7573, lon: -9.1538, schedule: { mon:{open:'10:00',close:'20:00'}, tue:{open:'10:00',close:'20:00'}, wed:{open:'10:00',close:'20:00'}, thu:{open:'10:00',close:'20:00'}, fri:{open:'10:00',close:'20:00'}, sat:{open:'10:00',close:'18:00'} } },
  'Almada':       { address: 'Av. do Cristo Rei 2A · Almada',              phone: '+351 923 343 517', lat: 38.6769, lon: -9.1717, schedule: { mon:{open:'10:00',close:'20:00'}, tue:{open:'10:00',close:'20:00'}, wed:{open:'10:00',close:'20:00'}, thu:{open:'10:00',close:'20:00'}, fri:{open:'10:00',close:'20:00'}, sat:{open:'10:00',close:'18:00'} } },
};

function getExtra(shop) {
  for (const [k, v] of Object.entries(SHOP_DATA)) {
    if (shop.name?.includes(k)) return v;
  }
  return null;
}

function toRad(d) { return d * Math.PI / 180; }
function haversineKm(la1, lo1, la2, lo2) {
  const R = 6371, dLa = toRad(la2-la1), dLo = toRad(lo2-lo1);
  const a = Math.sin(dLa/2)**2 + Math.cos(toRad(la1))*Math.cos(toRad(la2))*Math.sin(dLo/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const DAYS_KEY = ['sun','mon','tue','wed','thu','fri','sat'];
const DAYS_PT  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function isOpenNow(sched) {
  if (!sched) return false;
  const now = new Date(), k = DAYS_KEY[now.getDay()], h = sched[k];
  if (!h?.open||!h?.close) return false;
  const cur = now.getHours()*100+now.getMinutes();
  const [oh,om]=h.open.split(':').map(Number), [ch,cm]=h.close.split(':').map(Number);
  return cur>=oh*100+om && cur<=ch*100+cm;
}

function getNextDays(sched, count=3) {
  const res=[];
  for(let i=0;i<7&&res.length<count;i++){
    const d=addDays(new Date(),i),k=DAYS_KEY[d.getDay()],h=sched?.[k];
    if(h?.open&&h?.close) res.push({label:i===0?'Hoje':i===1?'Amanhã':DAYS_PT[d.getDay()],hours:`${h.open}–${h.close}`,isToday:i===0});
  }
  return res;
}

function DistanceBadge({ km }) {
  if (km==null) return null;
  const [col,bg] = km<2?['#22c55e','rgba(34,197,94,0.12)']:km<5?['#eab308','rgba(234,179,8,0.12)']:['#71717a','rgba(113,113,122,0.12)'];
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border"
      style={{color:col,background:bg,borderColor:col+'50'}}>
      <Navigation className="w-3 h-3"/>{km<1?`${Math.round(km*1000)} m`:`${km.toFixed(1)} km`}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
// TODAS as lojas aparecem sempre. Favorita tem card destacado mas não some.
export default function ShopSelector({ shops, userLocation, favoriteShopId, onSelect, onFavorite }) {
  const [expanded, setExpanded] = useState(null);

  const enriched = shops.map(shop => {
    const extra = getExtra(shop);
    const lat  = shop.latitude  || extra?.lat;
    const lon  = shop.longitude || extra?.lon;
    const sched = shop.opening_hours || extra?.schedule;
    const address = shop.address || extra?.address || '';
    const phone   = shop.phone   || extra?.phone   || '';
    let km = null;
    if (userLocation && lat && lon) km = haversineKm(userLocation.lat, userLocation.lon, lat, lon);
    return { ...shop, lat, lon, sched, address, phone, km, isFav: shop.id === favoriteShopId };
  }).sort((a,b) => {
    // Favorita sempre primeiro
    if (a.isFav&&!b.isFav) return -1;
    if (!a.isFav&&b.isFav) return 1;
    // Depois por distância se disponível
    if (a.km==null&&b.km==null) return 0;
    if (a.km==null) return 1; if (b.km==null) return -1;
    return a.km-b.km;
  });

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h2 className="text-xl font-black text-foreground uppercase tracking-wide">Escolhe a unidade</h2>
        {userLocation
          ? <p className="text-xs flex items-center justify-center gap-1 mt-1" style={{color:'#22c55e'}}><Navigation className="w-3 h-3"/> Ordenado por proximidade</p>
          : <p className="text-xs text-muted-foreground mt-1">3 unidades em Lisboa e Almada</p>
        }
      </div>

      {enriched.map((shop, i) => {
        const open     = isOpenNow(shop.sched);
        const nextDays = getNextDays(shop.sched, 3);
        const isExp    = expanded === shop.id;
        const isClose  = i===0 && shop.km!=null && !shop.isFav;

        return (
          <motion.div key={shop.id}
            initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
            className="rounded-2xl border overflow-hidden transition-all duration-200"
            style={{
              // Favorita: borda vermelha + fundo levemente tintado + sombra
              borderColor: shop.isFav ? RED : open ? 'var(--border)' : 'var(--border)',
              background: shop.isFav ? `rgba(200,16,46,0.04)` : 'var(--card)',
              boxShadow: shop.isFav ? `0 4px 20px rgba(200,16,46,0.15), 0 0 0 1px ${RED}` : 'none',
              opacity: !open && !shop.isFav ? 0.72 : 1,
            }}
          >
            {/* Badge favorita no topo */}
            {shop.isFav && (
              <div className="flex items-center gap-1.5 px-4 pt-3 pb-0">
                <Heart className="w-3 h-3 fill-current" style={{color:RED}}/>
                <span className="text-[10px] font-black tracking-wider uppercase" style={{color:RED}}>Loja Favorita</span>
              </div>
            )}

            <button className="w-full p-4 flex items-center gap-3 text-left"
              onClick={() => open ? onSelect(shop) : setExpanded(isExp ? null : shop.id)}>

              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative bg-secondary">
                {shop.photo_url
                  ? <img src={shop.photo_url} alt={shop.name} className="w-full h-full object-cover"/>
                  : <div className="w-full h-full flex items-center justify-center"
                      style={{background:'rgba(200,16,46,0.08)'}}>
                      <MapPin className="w-5 h-5" style={{color:RED}}/>
                    </div>
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-foreground text-sm">{shop.name}</h3>
                  {isClose && <span className="text-[10px] font-bold text-zinc-400 bg-zinc-500/10 px-1.5 py-0.5 rounded-full">+ próxima</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{shop.address}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{color:open?'#22c55e':RED, background:open?'rgba(34,197,94,0.12)':'rgba(200,16,46,0.12)'}}>
                    <Clock className="w-3 h-3"/>{open?'Aberto':'Fechado'}
                  </span>
                  <DistanceBadge km={shop.km}/>
                  {open && nextDays[0] && <span className="text-xs text-muted-foreground">{nextDays[0].hours}</span>}
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                {/* Botão favoritar */}
                {onFavorite && (
                  <button
                    onClick={e => { e.stopPropagation(); onFavorite(shop); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-secondary"
                    title={shop.isFav ? 'Remover favorita' : 'Marcar como favorita'}
                  >
                    <Heart className="w-4 h-4 transition-colors"
                      style={{color:shop.isFav?RED:'var(--muted-foreground)', fill:shop.isFav?RED:'transparent'}}/>
                  </button>
                )}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{background:open?'rgba(200,16,46,0.12)':'var(--secondary)'}}>
                  {open
                    ? <ChevronRight className="w-4 h-4" style={{color:RED}}/>
                    : <Calendar className="w-4 h-4 text-muted-foreground"/>
                  }
                </div>
              </div>
            </button>

            {/* Horários fechada */}
            <AnimatePresence>
              {!open && isExp && nextDays.length>0 && (
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                  className="px-4 pb-4 border-t border-border/40">
                  <p className="text-[10px] text-muted-foreground mt-3 mb-2 font-bold uppercase tracking-wider">Próximos horários</p>
                  <div className="grid grid-cols-3 gap-2">
                    {nextDays.map((d,idx)=>(
                      <div key={idx} className="rounded-xl p-2.5 text-center bg-secondary/60">
                        <p className="text-xs font-bold text-foreground">{d.label}</p>
                        <p className="text-[11px] mt-0.5 font-semibold" style={{color:RED}}>{d.hours}</p>
                      </div>
                    ))}
                  </div>
                  {shop.phone && (
                    <a href={`tel:${shop.phone}`} className="mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Phone className="w-3.5 h-3.5" style={{color:RED}}/>{shop.phone}
                    </a>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Horários aberta */}
            {open && (
              <div className="px-4 pb-3 flex gap-2 overflow-x-auto" style={{scrollbarWidth:'none'}}>
                {nextDays.map((d,idx)=>(
                  <div key={idx} className="flex-shrink-0 rounded-lg px-3 py-1.5 text-center"
                    style={d.isToday?{background:'rgba(200,16,46,0.1)',border:`1px solid rgba(200,16,46,0.3)`}:{background:'rgba(128,128,128,0.08)'}}>
                    <p className="text-[10px] font-bold" style={{color:d.isToday?RED:'var(--muted-foreground)'}}>{d.label}</p>
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

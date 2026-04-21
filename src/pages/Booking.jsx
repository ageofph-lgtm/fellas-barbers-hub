import React, { useState, useMemo, useCallback } from 'react';
import BarberLoader from '../components/ui/BarberLoader';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home, Heart, Star, ChevronRight, Navigation, Loader2, Scissors, User, MapPin, Clock } from 'lucide-react';
import ServiceSelector from '../components/booking/ServiceSelector';
import BarberSelector from '../components/booking/BarberSelector';
import TimeSlotPicker from '../components/booking/TimeSlotPicker';
import BookingConfirmation from '../components/booking/BookingConfirmation';
import BookingSuccess from '../components/booking/BookingSuccess';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import ThemeToggleFloat from '../components/ui/ThemeToggleFloat';

// ── Constants ─────────────────────────────────────────────────────────────────
const RED = '#C8102E';
const STEPS = ['geo', 'profile', 'services', 'barber', 'time', 'confirm', 'success'];
const STEP_LABELS = [null, null, 'Serviços', 'Barbeiro', 'Horário', 'Confirmação', null];

// ── Prefs ─────────────────────────────────────────────────────────────────────
const KEY = 'fellas_client_prefs';
function loadPrefs() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } }
function savePrefs(p) { localStorage.setItem(KEY, JSON.stringify(p)); }

// ── Geo Screen ────────────────────────────────────────────────────────────────
function GeoScreen({ onResult }) {
  const [loading, setLoading] = useState(false);
  const request = () => {
    setLoading(true);
    if (!navigator.geolocation) { onResult(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => onResult({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => onResult(null),
      { timeout: 8000 }
    );
  };

  return (
    <div className="min-h-[72vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xs w-full">
        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center"
          style={{ background: 'rgba(200,16,46,0.1)', border: `1px solid rgba(200,16,46,0.3)` }}>
          <Navigation className="w-9 h-9" style={{ color: RED }} />
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground">Onde estás?</h3>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            Usamos a tua localização para mostrar a unidade mais próxima e a distância até cada loja.
          </p>
        </div>
        <div className="space-y-3">
          <button onClick={request} disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{ background: RED, color: '#fff' }}
          >
            {loading ? <BarberLoader size="sm" /> : <Navigation className="w-4 h-4" />}
            {loading ? 'A detectar...' : 'Usar a minha localização'}
          </button>
          <button onClick={() => onResult(null)}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            Continuar sem localização — ver todas as lojas
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Client Profile ────────────────────────────────────────────────────────────
function ClientProfile({ prefs, shops, allBarbers, onBook, onEditName, onFavoriteShop, userLocation }) {
  const name = prefs.clientName || '';

  // ── Static shop data (coords + hours fallback) ───────────────────────────
  const STATIC = {
    'Alameda':      { lat: 38.7318, lon: -9.1353, wd: '10:00-19:00', sat: '10:00-17:00', sun: null },
    'Campo Grande': { lat: 38.7573, lon: -9.1538, wd: '10:00-20:00', sat: '10:00-18:00', sun: null },
    'Almada':       { lat: 38.6769, lon: -9.1717, wd: '10:00-20:00', sat: '10:00-18:00', sun: null },
  };
  function getStatic(shop) {
    for (const [k, v] of Object.entries(STATIC)) {
      if (shop.name?.includes(k)) return v;
    }
    return null;
  }
  function getCoords(shop) {
    const st = getStatic(shop);
    return { lat: parseFloat(shop.lat) || st?.lat || null, lon: parseFloat(shop.lon) || st?.lon || null };
  }
  function dist(la1, lo1, la2, lo2) {
    if (!la1 || !la2) return null;
    const R = 6371, dr = Math.PI/180;
    const dLa = (la2-la1)*dr, dLo = (lo2-lo1)*dr;
    const a = Math.sin(dLa/2)**2 + Math.cos(la1*dr)*Math.cos(la2*dr)*Math.sin(dLo/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  function getHours(shop, dayIdx) {
    const st = getStatic(shop);
    if (dayIdx === 0) return shop.hours_sunday || st?.sun || null;
    if (dayIdx === 6) return shop.hours_saturday || st?.sat || null;
    return shop.hours_weekday || st?.wd || null;
  }
  function parseH(h) {
    if (!h) return null;
    const m = h.match(/(\d{1,2})[h:](\d{0,2})\s*[-–—]\s*(\d{1,2})[h:](\d{0,2})/);
    if (!m) return null;
    const label = h.replace(/\s/g,'').replace(/[–—]/,'-');
    return { open: +m[1]*60+(+m[2]||0), close: +m[3]*60+(+m[4]||0), label };
  }
  function isOpen(shop) {
    const h = getHours(shop, new Date().getDay());
    const p = parseH(h); if (!p) return false;
    const c = new Date().getHours()*60+new Date().getMinutes();
    return c >= p.open && c < p.close;
  }
  function nextDays(shop) {
    const DN = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    return [0,1,2].map(i => {
      const d = new Date(); d.setDate(d.getDate()+i);
      const p = parseH(getHours(shop, d.getDay()));
      return { label: i===0?'Hoje':i===1?'Amanhã':DN[d.getDay()], hours: p?.label||null };
    });
  }

  // ── Sort: favorita primeiro, depois por distância ────────────────────────
  const sorted = [...shops].sort((a,b) => {
    if (a.id===prefs.favoriteShopId) return -1;
    if (b.id===prefs.favoriteShopId) return 1;
    if (userLocation) {
      const ca=getCoords(a), cb=getCoords(b);
      const da=dist(userLocation.lat,userLocation.lon,ca.lat,ca.lon);
      const db=dist(userLocation.lat,userLocation.lon,cb.lat,cb.lon);
      if (da!==null&&db!==null) return da-db;
    }
    return 0;
  });

  return (
    <div className="space-y-4 pb-6">
      {/* Greeting */}
      <div className="flex items-center gap-3 pt-1">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background:'rgba(200,16,46,0.1)', border:'1px solid rgba(200,16,46,0.25)' }}>
          <User className="w-6 h-6" style={{ color: RED }} />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground">
            {name ? `Olá, ${name.split(' ')[0]}!` : 'Bem-vindo à Fellas!'}
          </h2>
          <button onClick={onEditName} className="text-xs text-muted-foreground">
            {name ? 'Editar nome →' : 'Adicionar o teu nome →'}
          </button>
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">Escolhe a loja</p>
        {userLocation && (
          <span className="text-[10px] font-bold flex items-center gap-1" style={{ color:'#22c55e' }}>
            <Navigation className="w-3 h-3"/> Por distância
          </span>
        )}
      </div>

      {/* Shop cards */}
      <div className="space-y-3">
        {sorted.map((shop, i) => {
          const fav = shop.id === prefs.favoriteShopId;
          const open = isOpen(shop);
          const days = nextDays(shop);
          const coords = getCoords(shop);
          const km = userLocation && coords.lat
            ? dist(userLocation.lat, userLocation.lon, coords.lat, coords.lon)
            : null;

          return (
            <motion.div key={shop.id}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i*0.06 }}
              className="rounded-2xl overflow-hidden"
              style={{
                border: fav ? `2px solid ${RED}` : '1px solid var(--border)',
                background: fav ? 'rgba(200,16,46,0.03)' : 'var(--card)',
              }}
            >
              {/* Fav badge */}
              {fav && (
                <div className="flex items-center gap-1.5 px-4 pt-2.5">
                  <Heart className="w-3 h-3 fill-current" style={{ color:RED }} />
                  <span className="text-[10px] font-black tracking-wider uppercase" style={{ color:RED }}>Favorita</span>
                </div>
              )}

              {/* Main row */}
              <div className="flex items-start gap-3 px-4 pt-3 pb-2">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: fav?'rgba(200,16,46,0.12)':'var(--secondary)' }}>
                  {shop.photo_url
                    ? <img src={shop.photo_url} alt={shop.name} className="w-full h-full object-cover rounded-xl"/>
                    : <MapPin className="w-5 h-5" style={{ color: fav?RED:'var(--muted-foreground)' }}/>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm">{shop.name}</p>
                  {shop.address && <p className="text-xs text-muted-foreground truncate">{shop.address}</p>}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {/* Aberto/Fechado */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: open?'rgba(34,197,94,0.1)':'rgba(100,100,100,0.08)',
                        color: open?'#22c55e':'var(--muted-foreground)',
                        border: open?'1px solid rgba(34,197,94,0.2)':'1px solid var(--border)',
                      }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: open?'#22c55e':'var(--muted-foreground)' }}/>
                      {open?'Aberto':'Fechado'}
                    </span>
                    {/* Distância */}
                    {km !== null && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                        <Navigation className="w-3 h-3"/>
                        {km<1?`${Math.round(km*1000)}m`:`${km.toFixed(1)} km`}
                      </span>
                    )}
                  </div>
                </div>
                {/* Fav button */}
                <button onClick={(e) => { e.stopPropagation(); onFavoriteShop(shop); }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{ background:'var(--secondary)' }}>
                  <Heart className="w-4 h-4" style={{ color:fav?RED:'var(--muted-foreground)', fill:fav?RED:'transparent' }}/>
                </button>
              </div>

              {/* Horários próximos 3 dias */}
              <div className="grid grid-cols-3 gap-1 px-4 pb-3">
                {days.map(({ label, hours }) => (
                  <div key={label} className="text-center rounded-xl py-1.5 px-1 bg-secondary/50">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-[11px] font-semibold" style={{ color: hours?'var(--foreground)':'var(--muted-foreground)' }}>
                      {hours || '—'}
                    </p>
                  </div>
                ))}
              </div>

              {/* ── CTA AGENDAR — largo, clicável, impossível de perder ── */}
              <button
                onClick={() => onBook({ skipToShop: shop })}
                className="w-full py-3.5 font-black text-sm text-white transition-all"
                style={{
                  background: RED,
                  boxShadow: fav ? '0 4px 16px rgba(200,16,46,0.3)' : 'none',
                }}
              >
                Agendar nesta loja →
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {[[String(shops.length||'—'),'Unidades'],['1000+','Reviews'],['4.9★','Rating']].map(([v,l]) => (
          <div key={l} className="p-3 rounded-xl bg-card border border-border text-center">
            <p className="text-base font-black" style={{ color:RED }}>{v}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <ThemeToggleFloat />
    </div>
  );
}

function NameEditor({ initialName, onSave }) {
  const [val, setVal] = useState(initialName || '');
  return (
    <div className="space-y-5 pt-4">
      <h3 className="text-lg font-black text-foreground">O teu nome</h3>
      <input type="text" value={val} onChange={e => setVal(e.target.value)}
        placeholder="Ex: João Silva" autoFocus
        className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
        style={{ outline: 'none' }}
        onFocus={e => e.target.style.borderColor = RED}
        onBlur={e => e.target.style.borderColor = ''}
      />
      <button onClick={() => onSave(val.trim())} disabled={!val.trim()}
        className="w-full py-3.5 rounded-2xl font-bold text-sm transition-colors disabled:opacity-40"
        style={{ background: RED, color: '#fff' }}>
        Guardar
      </button>
    </div>
  );
}

// ── BarberSelector com favorito ───────────────────────────────────────────────
function BarberSelectorWithFav({ barbers, selected, favoriteBarberRelId, onSelect, onFavorite }) {
  const sorted = [...barbers].sort((a, b) => {
    if (a.id === favoriteBarberRelId) return -1;
    if (b.id === favoriteBarberRelId) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-foreground">Escolhe o barbeiro</h2>
        <p className="text-xs text-muted-foreground mt-1">Toca em ♡ para guardar favorito</p>
      </div>
      <div className="space-y-3">
        {sorted.map((barber, i) => {
          const isFav = barber.id === favoriteBarberRelId;
          return (
            <motion.div key={barber.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl border overflow-hidden transition-all"
              style={{ borderColor: isFav ? `${RED}80` : '', background: isFav ? 'rgba(200,16,46,0.04)' : '' }}>
              <div className="flex items-center gap-3 p-4">
                <button className="flex-1 flex items-center gap-3 text-left" onClick={() => onSelect(barber)}>
                  <div className="relative flex-shrink-0">
                    {barber.photo_url
                      ? <img src={barber.photo_url} alt={barber.name} className="w-14 h-14 rounded-xl object-cover border border-border" />
                      : <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center"><Scissors className="w-6 h-6 text-muted-foreground" /></div>
                    }
                    {isFav && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: RED }}>
                        <Heart className="w-2.5 h-2.5 fill-white text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm">{barber.name}</p>
                    {barber.rating > 0 && (
                      <p className="text-xs mt-0.5 font-semibold" style={{ color: RED }}>
                        ★ {barber.rating?.toFixed(1)}
                        {barber.years_experience > 0 && <span className="text-muted-foreground font-normal"> · {barber.years_experience} anos</span>}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(barber.specialties || []).slice(0, 2).map(s => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  </div>
                </button>
                <button onClick={() => onFavorite(barber)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors hover:bg-secondary">
                  <Heart className={`w-5 h-5 transition-colors`}
                    style={{ color: isFav ? RED : '', fill: isFav ? RED : 'transparent' }} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Booking() {
  const [step, setStep] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [editingName, setEditingName] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientInfo, setClientInfo] = useState(() => {
    const p = loadPrefs();
    return { name: p.clientName || '', phone: p.clientPhone || '', email: p.clientEmail || '' };
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const navigate = useNavigate();

  const { data: shops = [] } = useQuery({ queryKey: ['barbershops'], queryFn: () => base44.entities.Barbershop.filter({ is_active: true }) });
  const { data: allBarbers = [] } = useQuery({ queryKey: ['all-barbers'], queryFn: () => base44.entities.Barber.filter({ is_active: true }) });
  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: () => base44.entities.Service.filter({ is_active: true }) });
  const { data: barbers = [] } = useQuery({
    queryKey: ['barbers', selectedShop?.id],
    queryFn: () => base44.entities.Barber.filter({ barbershop_id: selectedShop.id, is_active: true }),
    enabled: !!selectedShop,
  });
  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', selectedShop?.id, selectedBarber?.id],
    queryFn: () => base44.entities.Appointment.filter({ barbershop_id: selectedShop.id, barber_id: selectedBarber.id }),
    enabled: !!selectedShop && !!selectedBarber,
  });

  const total         = useMemo(() => selectedServices.reduce((a, s) => a + s.price, 0), [selectedServices]);
  const totalDuration = useMemo(() => selectedServices.reduce((a, s) => a + s.duration_minutes, 0), [selectedServices]);
  const toggleService = (s) => setSelectedServices(prev => prev.some(x => x.id === s.id) ? prev.filter(x => x.id !== s.id) : [...prev, s]);

  const updatePrefs = useCallback((u) => setPrefs(prev => { const n = { ...prev, ...u }; savePrefs(n); return n; }), []);

  const startBooking = ({ skipToShop, skipToBarber } = {}) => {
    setEditingName(false);
    if (skipToShop) { setSelectedShop(skipToShop); setStep(2); }
    else if (skipToBarber) {
      const full = allBarbers.find(b => b.id === skipToBarber.id);
      if (full) { const shop = shops.find(s => s.id === full.barbershop_id); if (shop) setSelectedShop(shop); setSelectedBarber(full); setStep(5); }
      else setStep(2);
    } else setStep(2);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const dateStr = format(selectedSlot.date, 'yyyy-MM-dd');
    const endMin  = selectedSlot.time.split(':').map(Number).reduce((h, m) => h * 60 + m) + totalDuration;
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
    const appt = await base44.entities.Appointment.create({
      barbershop_id: selectedShop.id, barber_id: selectedBarber.id,
      barbershop_name: selectedShop.name, barber_name: selectedBarber.name,
      client_name: clientInfo.name, client_phone: clientInfo.phone, client_email: clientInfo.email,
      services: selectedServices.map(s => ({ service_id: s.id, name: s.name, price: s.price, duration_minutes: s.duration_minutes })),
      service_names: selectedServices.map(s => s.name),
      total_price: total, total_duration: totalDuration,
      date: dateStr, start_time: selectedSlot.time, end_time: endTime,
      status: 'scheduled', notes,
      payment_method: 'pending',
      payment_status: 'pending',
      is_walkin: false,
    });
    updatePrefs({ clientName: clientInfo.name, clientPhone: clientInfo.phone, clientEmail: clientInfo.email });
    setCreatedAppointment(appt);
    setIsSubmitting(false);
    setStep(6);
  };

  const resetBooking = () => { setStep(1); setSelectedShop(null); setSelectedServices([]); setSelectedBarber(null); setSelectedSlot(null); setNotes(''); setCreatedAppointment(null); };
  const goBack = () => { if (step >= 2 && step < 6) setStep(step - 1); };

  const currentStep = STEPS[step];
  const progressStep = step - 2;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border"
        style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2 flex items-center gap-3">
          {step > 1 && step < 6 ? (
            <button onClick={goBack}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => navigate('/')}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0">
              <Home className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2 flex-1">
            {/* Inline crown icon */}
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(200,16,46,0.12)', border: '1px solid rgba(200,16,46,0.25)' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M2 17L4 7L8 12L12 4L16 12L20 7L22 17H2Z" stroke="#C8102E" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(200,16,46,0.2)"/>
                <rect x="2" y="17" width="20" height="2" rx="1" fill="#C8102E"/>
              </svg>
            </div>
            <span className="font-black text-foreground tracking-wider text-sm">FELLAS</span>
            {step > 1 && step < 6 && STEP_LABELS[step] && (
              <span className="text-xs text-muted-foreground">· {STEP_LABELS[step]}</span>
            )}
            {userLocation && step >= 2 && (
              <span className="ml-auto text-xs flex items-center gap-1" style={{ color: '#22c55e' }}>
                <Navigation className="w-3 h-3" /> GPS
              </span>
            )}
          </div>
        </div>

        {/* Progress */}
        {step >= 2 && step < 6 && (
          <div className="max-w-lg mx-auto px-4 pb-3 pt-1">
            <div className="flex gap-1.5">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500"
                  style={{ background: i < progressStep ? RED : i === progressStep ? `${RED}70` : '' }}
                  data-inactive={i > progressStep}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep + (editingName ? '_edit' : '')}
            initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.15 }}
          >
            {currentStep === 'geo'     && <GeoScreen onResult={loc => { setUserLocation(loc); setStep(1); }} />}
            {currentStep === 'profile' && !editingName && (
              <ClientProfile prefs={prefs} shops={shops} allBarbers={allBarbers} userLocation={userLocation} onBook={startBooking} onEditName={() => setEditingName(true)} onFavoriteShop={shop => updatePrefs({ favoriteShopId: shop.id })} />
            )}
            {currentStep === 'profile' && editingName && (
              <NameEditor initialName={prefs.clientName}
                onSave={name => { updatePrefs({ clientName: name }); setClientInfo(p => ({ ...p, name })); setEditingName(false); }} />
            )}
            {currentStep === 'services' && (
              <ServiceSelector services={services} selected={selectedServices} onToggle={toggleService}
                total={total} totalDuration={totalDuration} onNext={() => setStep(3)} />
            )}
            {currentStep === 'barber' && (
              <BarberSelectorWithFav barbers={barbers} selected={selectedBarber}
                favoriteBarberRelId={prefs.favoriteBarberRelId}
                onSelect={b => { setSelectedBarber(b); setStep(4); }}
                onFavorite={b => updatePrefs({ favoriteBarberRelId: b.id })} />
            )}
            {currentStep === 'time' && (
              <TimeSlotPicker shop={selectedShop} appointments={appointments} totalDuration={totalDuration}
                selectedSlot={selectedSlot}
                onSelect={slot => { setSelectedSlot(slot); setStep(5); }} />
            )}
            {currentStep === 'confirm' && (
              <BookingConfirmation shop={selectedShop} barber={selectedBarber} services={selectedServices}
                slot={selectedSlot} clientInfo={clientInfo} onClientChange={setClientInfo}
                notes={notes} onNotesChange={setNotes} onConfirm={handleConfirm} isSubmitting={isSubmitting} />
            )}
            {currentStep === 'success' && (
              <BookingSuccess appointment={createdAppointment} onNewBooking={resetBooking}
                onViewLoyalty={() => navigate('/loyalty')} />
            )}
          </motion.div>
        </AnimatePresence>


      </div>
    </div>
  );
}


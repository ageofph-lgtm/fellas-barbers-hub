import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home, Heart, Star, ChevronRight, Navigation, Loader2, Scissors, User } from 'lucide-react';
import ShopSelector from '../components/booking/ShopSelector';
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
const STEPS = ['geo', 'profile', 'shop', 'services', 'barber', 'time', 'confirm', 'success'];
const STEP_LABELS = [null, null, 'Loja', 'Serviços', 'Barbeiro', 'Horário', 'Confirmação'];

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
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {loading ? 'A detectar...' : 'Usar a minha localização'}
          </button>
          <button onClick={() => onResult(null)}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Continuar sem localização
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Client Profile ────────────────────────────────────────────────────────────
function ClientProfile({ prefs, shops, allBarbers, onBook, onEditName, onFavoriteShop }) {
  const favShop   = shops.find(s => s.id === prefs.favoriteShopId);
  const name      = prefs.clientName || '';

  // Ordenar: favorita sempre primeiro
  const sortedShops = [...shops].sort((a, b) => {
    if (a.id === prefs.favoriteShopId) return -1;
    if (b.id === prefs.favoriteShopId) return 1;
    return 0;
  });

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(200,16,46,0.1)', border: `1px solid rgba(200,16,46,0.25)` }}>
          <User className="w-6 h-6" style={{ color: RED }} />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground">
            {name ? `Olá, ${name.split(' ')[0]}!` : 'Bem-vindo à Fellas!'}
          </h2>
          <button onClick={onEditName} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {name ? 'Editar nome' : 'Adicionar o teu nome →'}
          </button>
        </div>
      </div>

      {/* Todas as lojas — favorita destacada */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Escolhe a loja</p>

        {sortedShops.map((shop, i) => {
          const isFav = shop.id === prefs.favoriteShopId;
          return (
            <motion.div
              key={shop.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl overflow-hidden"
              style={{
                border: isFav ? `1.5px solid ${RED}` : '1px solid var(--border)',
                background: isFav ? 'rgba(200,16,46,0.05)' : 'var(--card)',
                boxShadow: isFav ? `0 4px 18px rgba(200,16,46,0.14)` : 'none',
              }}
            >
              {/* Badge favorita */}
              {isFav && (
                <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-0">
                  <Heart className="w-3 h-3 fill-current" style={{ color: RED }} />
                  <span className="text-[10px] font-black tracking-wider uppercase" style={{ color: RED }}>Loja Favorita</span>
                </div>
              )}

              <div className="flex items-center gap-3 p-4">
                {/* Ícone / foto */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isFav ? 'rgba(200,16,46,0.12)' : 'var(--secondary)' }}>
                  {shop.photo_url
                    ? <img src={shop.photo_url} alt={shop.name} className="w-full h-full object-cover rounded-xl" />
                    : <MapPin className="w-5 h-5" style={{ color: isFav ? RED : 'var(--muted-foreground)' }} />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm">{shop.name}</p>
                  {shop.address && <p className="text-xs text-muted-foreground mt-0.5 truncate">{shop.address}</p>}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Favoritar */}
                  <button
                    onClick={() => onFavoriteShop(shop)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-secondary"
                    title={isFav ? 'Remover favorita' : 'Marcar como favorita'}
                  >
                    <Heart className="w-4 h-4 transition-all"
                      style={{ color: isFav ? RED : 'var(--muted-foreground)', fill: isFav ? RED : 'transparent' }} />
                  </button>
                  {/* Agendar nesta loja */}
                  <button
                    onClick={() => onBook({ skipToShop: shop })}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: isFav ? RED : 'var(--secondary)',
                      color: isFav ? '#fff' : 'var(--muted-foreground)',
                    }}
                    title="Agendar nesta loja"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA global */}
      <motion.button whileTap={{ scale: 0.98 }} onClick={() => onBook({})}
        className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
        style={{ background: RED, color: '#fff', boxShadow: '0 8px 24px rgba(200,16,46,0.25)' }}>
        <Scissors className="w-4 h-4" />
        Ver todas as unidades
      </motion.button>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-2">
        {[['3', 'Unidades'], ['1000+', 'Reviews'], ['4.9★', 'Rating']].map(([v, l]) => (
          <div key={l} className="p-3 rounded-xl bg-card border border-border text-center">
            <p className="text-base font-black" style={{ color: RED }}>{v}</p>
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
    if (skipToShop) { setSelectedShop(skipToShop); setStep(3); }
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
      client_name: clientInfo.name, client_phone: clientInfo.phone, client_email: clientInfo.email,
      services: selectedServices.map(s => ({ service_id: s.id, name: s.name, price: s.price, duration_minutes: s.duration_minutes })),
      total_price: total, total_duration: totalDuration,
      date: dateStr, start_time: selectedSlot.time, end_time: endTime,
      status: 'scheduled', notes,
    });
    updatePrefs({ clientName: clientInfo.name, clientPhone: clientInfo.phone, clientEmail: clientInfo.email });
    setCreatedAppointment(appt);
    setIsSubmitting(false);
    setStep(7);
  };

  const resetBooking = () => { setStep(1); setSelectedShop(null); setSelectedServices([]); setSelectedBarber(null); setSelectedSlot(null); setNotes(''); setCreatedAppointment(null); };
  const goBack = () => { if (step === 2) setStep(1); else if (step > 2 && step < 7) setStep(step - 1); };

  const currentStep = STEPS[step];
  const progressStep = step - 2;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border"
        style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2 flex items-center gap-3">
          {step > 1 && step < 7 ? (
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
            {step > 1 && step < 7 && STEP_LABELS[step] && (
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
        {step >= 2 && step < 7 && (
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
      <div className="max-w-lg mx-auto px-4 py-5 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep + (editingName ? '_edit' : '')}
            initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.15 }}
          >
            {currentStep === 'geo'     && <GeoScreen onResult={loc => { setUserLocation(loc); setStep(1); }} />}
            {currentStep === 'profile' && !editingName && (
              <ClientProfile prefs={prefs} shops={shops} allBarbers={allBarbers} onBook={startBooking} onEditName={() => setEditingName(true)} onFavoriteShop={shop => updatePrefs({ favoriteShopId: shop.id })} />
            )}
            {currentStep === 'profile' && editingName && (
              <NameEditor initialName={prefs.clientName}
                onSave={name => { updatePrefs({ clientName: name }); setClientInfo(p => ({ ...p, name })); setEditingName(false); }} />
            )}
            {currentStep === 'shop' && (
              <ShopSelector shops={shops} userLocation={userLocation} favoriteShopId={prefs.favoriteShopId}
                onSelect={shop => { setSelectedShop(shop); setStep(3); }}
                onFavorite={shop => updatePrefs({ favoriteShopId: shop.id })} />
            )}
            {currentStep === 'services' && (
              <ServiceSelector services={services} selected={selectedServices} onToggle={toggleService}
                total={total} totalDuration={totalDuration} />
            )}
            {currentStep === 'barber' && (
              <BarberSelectorWithFav barbers={barbers} selected={selectedBarber}
                favoriteBarberRelId={prefs.favoriteBarberRelId}
                onSelect={b => { setSelectedBarber(b); setStep(5); }}
                onFavorite={b => updatePrefs({ favoriteBarberRelId: b.id })} />
            )}
            {currentStep === 'time' && (
              <TimeSlotPicker appointments={appointments} totalDuration={totalDuration}
                shopHours={selectedShop?.opening_hours} selectedSlot={selectedSlot}
                onSelect={slot => { setSelectedSlot(slot); setStep(6); }} />
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

        {/* CTA fixo serviços */}
        {currentStep === 'services' && selectedServices.length > 0 && (
          <div className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-40">
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setStep(4)}
              className="w-full py-4 rounded-2xl font-bold text-sm transition-all"
              style={{ background: RED, color: '#fff', boxShadow: `0 8px 24px rgba(200,16,46,0.3)` }}>
              Continuar — {selectedServices.length} serviço{selectedServices.length > 1 ? 's' : ''} · €{total.toFixed(2)}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}

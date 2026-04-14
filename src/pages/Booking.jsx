import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Scissors, Home, User, Heart, Star, ChevronRight, Navigation, Loader2 } from 'lucide-react';
import ShopSelector from '../components/booking/ShopSelector';
import ServiceSelector from '../components/booking/ServiceSelector';
import BarberSelector from '../components/booking/BarberSelector';
import TimeSlotPicker from '../components/booking/TimeSlotPicker';
import BookingConfirmation from '../components/booking/BookingConfirmation';
import BookingSuccess from '../components/booking/BookingSuccess';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const STEPS = ['geo', 'profile', 'shop', 'services', 'barber', 'time', 'confirm', 'success'];
const STEP_LABELS = [null, null, 'Loja', 'Serviços', 'Barbeiro', 'Horário', 'Confirmação'];

// ── Prefs (localStorage) ──────────────────────────────────────────────────────
const STORAGE_KEY = 'fellas_client_prefs';
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function savePrefs(p) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }

// ── Geo permission screen ─────────────────────────────────────────────────────
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
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xs">
        <div className="w-20 h-20 rounded-3xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto">
          <Navigation className="w-9 h-9 text-[#C9A84C]" />
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground">Onde estás?</h3>
          <p className="text-muted-foreground text-sm mt-2">
            Usa a tua localização para ver a barbearia mais próxima e a distância até cada unidade.
          </p>
        </div>
        <div className="space-y-3 w-full">
          <button
            onClick={request}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[#C9A84C] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#d4b55a] transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {loading ? 'A detectar...' : 'Usar a minha localização'}
          </button>
          <button
            onClick={() => onResult(null)}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Continuar sem localização
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Client Profile home ───────────────────────────────────────────────────────
function ClientProfile({ prefs, shops, allBarbers, onBook, onEditName }) {
  const favShop = shops.find(s => s.id === prefs.favoriteShopId);
  const favBarber = allBarbers.find(b => b.id === prefs.favoriteBarberRelId);
  const name = prefs.clientName || '';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-[#C9A84C]" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground">
            {name ? `Olá, ${name.split(' ')[0]}!` : 'Bem-vindo à Fellas!'}
          </h2>
          <button onClick={onEditName} className="text-xs text-muted-foreground hover:text-[#C9A84C] transition-colors">
            {name ? 'Editar nome' : 'Adicionar o teu nome →'}
          </button>
        </div>
      </div>

      {(favShop || favBarber) && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Os teus favoritos</p>
          {favShop && (
            <motion.button whileTap={{ scale: 0.98 }}
              onClick={() => onBook({ skipToShop: favShop })}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border border-[#C9A84C]/40 bg-gradient-to-br from-[#C9A84C]/8 to-card text-left hover:border-[#C9A84C]/60 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/15 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-[#C9A84C] fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Loja favorita</p>
                <p className="font-bold text-foreground text-sm truncate">{favShop.name}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#C9A84C]" />
            </motion.button>
          )}
          {favBarber && (
            <motion.button whileTap={{ scale: 0.98 }}
              onClick={() => onBook({ skipToBarber: favBarber })}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border border-zinc-700 bg-card text-left hover:border-[#C9A84C]/40 transition-all"
            >
              {favBarber.photo_url
                ? <img src={favBarber.photo_url} alt={favBarber.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                : <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0"><Scissors className="w-4 h-4 text-muted-foreground" /></div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Barbeiro favorito</p>
                <p className="font-bold text-foreground text-sm truncate">{favBarber.name}</p>
              </div>
              {favBarber.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#C9A84C] fill-current" />
                  <span className="text-xs font-bold text-[#C9A84C]">{favBarber.rating?.toFixed(1)}</span>
                </div>
              )}
            </motion.button>
          )}
        </div>
      )}

      <motion.button whileTap={{ scale: 0.98 }}
        onClick={() => onBook({})}
        className="w-full py-4 rounded-2xl bg-[#C9A84C] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#d4b55a] transition-colors shadow-lg shadow-[#C9A84C]/15"
      >
        <Scissors className="w-4 h-4" />
        Marcar agendamento
      </motion.button>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-card border border-border text-center">
          <p className="text-xl font-black text-[#C9A84C]">4</p>
          <p className="text-xs text-muted-foreground mt-0.5">Unidades</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border text-center">
          <p className="text-xl font-black text-[#C9A84C]">6</p>
          <p className="text-xs text-muted-foreground mt-0.5">Barbeiros</p>
        </div>
      </div>
    </div>
  );
}

// ── Name editor ───────────────────────────────────────────────────────────────
function NameEditor({ initialName, onSave }) {
  const [val, setVal] = useState(initialName || '');
  return (
    <div className="space-y-5 pt-4">
      <h3 className="text-lg font-black text-foreground">O teu nome</h3>
      <input type="text" value={val} onChange={e => setVal(e.target.value)}
        placeholder="Ex: João Silva" autoFocus
        className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C9A84C]/60 text-sm"
      />
      <button onClick={() => onSave(val.trim())} disabled={!val.trim()}
        className="w-full py-3.5 rounded-2xl bg-[#C9A84C] text-black font-bold text-sm disabled:opacity-40"
      >Guardar</button>
    </div>
  );
}

// ── BarberSelector com favorito inline ───────────────────────────────────────
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
        <p className="text-xs text-muted-foreground mt-1">Toca no ♡ para guardar como favorito</p>
      </div>
      <div className="space-y-3">
        {sorted.map((barber, i) => {
          const isFav = barber.id === favoriteBarberRelId;
          return (
            <motion.div key={barber.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`rounded-2xl border transition-all ${isFav
                ? 'border-[#C9A84C]/50 bg-gradient-to-br from-[#C9A84C]/5 to-card'
                : 'border-border bg-card'}`}
            >
              <div className="flex items-center gap-3 p-4">
                <button className="flex-1 flex items-center gap-3 text-left" onClick={() => onSelect(barber)}>
                  <div className="relative flex-shrink-0">
                    {barber.photo_url
                      ? <img src={barber.photo_url} alt={barber.name} className="w-14 h-14 rounded-xl object-cover" />
                      : <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center"><Scissors className="w-6 h-6 text-muted-foreground" /></div>
                    }
                    {isFav && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C9A84C] flex items-center justify-center">
                        <Heart className="w-2.5 h-2.5 text-black fill-black" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground text-sm">{barber.name}</p>
                      {isFav && <span className="text-[10px] text-[#C9A84C] font-bold">Favorito</span>}
                    </div>
                    {barber.rating > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-[#C9A84C] fill-current" />
                        <span className="text-xs font-bold text-[#C9A84C]">{barber.rating?.toFixed(1)}</span>
                        {barber.years_experience > 0 && <span className="text-xs text-muted-foreground">· {barber.years_experience} anos</span>}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(barber.specialties || []).slice(0, 2).map(s => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  </div>
                </button>
                <button onClick={() => onFavorite(barber)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                >
                  <Heart className={`w-5 h-5 transition-colors ${isFav ? 'text-[#C9A84C] fill-current' : 'text-zinc-600 hover:text-[#C9A84C]'}`} />
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
  const [step, setStep] = useState(0); // 0=geo, 1=profile
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

  const { data: shops = [] } = useQuery({
    queryKey: ['barbershops'],
    queryFn: () => base44.entities.Barbershop.filter({ is_active: true }),
  });
  const { data: allBarbers = [] } = useQuery({
    queryKey: ['all-barbers'],
    queryFn: () => base44.entities.Barber.filter({ is_active: true }),
  });
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.filter({ is_active: true }),
  });
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

  const total = useMemo(() => selectedServices.reduce((a, s) => a + s.price, 0), [selectedServices]);
  const totalDuration = useMemo(() => selectedServices.reduce((a, s) => a + s.duration_minutes, 0), [selectedServices]);

  const toggleService = (service) => {
    setSelectedServices(prev =>
      prev.some(s => s.id === service.id) ? prev.filter(s => s.id !== service.id) : [...prev, service]
    );
  };

  const updatePrefs = useCallback((updates) => {
    setPrefs(prev => { const next = { ...prev, ...updates }; savePrefs(next); return next; });
  }, []);

  const handleGeoResult = (loc) => {
    setUserLocation(loc);
    setStep(1); // vai para o perfil
  };

  const startBooking = ({ skipToShop, skipToBarber } = {}) => {
    setEditingName(false);
    if (skipToShop) {
      setSelectedShop(skipToShop);
      setStep(3); // serviços
    } else if (skipToBarber) {
      const full = allBarbers.find(b => b.id === skipToBarber.id);
      if (full) {
        const shop = shops.find(s => s.id === full.barbershop_id);
        if (shop) setSelectedShop(shop);
        setSelectedBarber(full);
        setStep(5); // horário
      } else { setStep(2); }
    } else {
      setStep(2); // seleção de loja
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const dateStr = format(selectedSlot.date, 'yyyy-MM-dd');
    const endMinutes = selectedSlot.time.split(':').map(Number).reduce((h, m) => h * 60 + m) + totalDuration;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
    const appt = await base44.entities.Appointment.create({
      barbershop_id: selectedShop.id,
      barber_id: selectedBarber.id,
      client_name: clientInfo.name,
      client_phone: clientInfo.phone,
      client_email: clientInfo.email,
      services: selectedServices.map(s => ({ service_id: s.id, name: s.name, price: s.price, duration_minutes: s.duration_minutes })),
      total_price: total,
      total_duration: totalDuration,
      date: dateStr,
      start_time: selectedSlot.time,
      end_time: endTime,
      status: 'scheduled',
      notes,
    });
    updatePrefs({ clientName: clientInfo.name, clientPhone: clientInfo.phone, clientEmail: clientInfo.email });
    setCreatedAppointment(appt);
    setIsSubmitting(false);
    setStep(7); // success
  };

  const resetBooking = () => {
    setStep(1);
    setSelectedShop(null);
    setSelectedServices([]);
    setSelectedBarber(null);
    setSelectedSlot(null);
    setNotes('');
    setCreatedAppointment(null);
  };

  const goBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3 && selectedShop) setStep(2);
    else if (step > 2 && step < 7) setStep(step - 1);
  };

  const currentStep = STEPS[step];
  const showBack = step > 1 && step < 7;
  const showHome = step <= 1;
  const progressStep = step - 2; // 0-based para a barra (começa no step 2)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2 flex items-center gap-3">
          {showBack ? (
            <button onClick={goBack} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => navigate('/')} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0">
              <Home className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0">
              <Scissors className="w-3.5 h-3.5 text-[#C9A84C]" />
            </div>
            <span className="font-black text-foreground tracking-wider text-sm">FELLAS</span>
            {step > 1 && step < 7 && STEP_LABELS[step] && (
              <span className="text-xs text-muted-foreground">· {STEP_LABELS[step]}</span>
            )}
            {userLocation && step >= 2 && (
              <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
                <Navigation className="w-3 h-3" /> GPS
              </span>
            )}
          </div>
        </div>

        {/* Progress bar (steps 2-6) */}
        {step >= 2 && step < 7 && (
          <div className="max-w-lg mx-auto px-4 pb-3 pt-1">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i < progressStep ? 'bg-[#C9A84C]' : i === progressStep ? 'bg-[#C9A84C]/50' : 'bg-border'
                }`} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-32">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep + (editingName ? '_edit' : '')}
            initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.16 }}
          >
            {currentStep === 'geo' && (
              <GeoScreen onResult={handleGeoResult} />
            )}

            {currentStep === 'profile' && !editingName && (
              <ClientProfile
                prefs={prefs}
                shops={shops}
                allBarbers={allBarbers}
                onBook={startBooking}
                onEditName={() => setEditingName(true)}
              />
            )}

            {currentStep === 'profile' && editingName && (
              <NameEditor initialName={prefs.clientName}
                onSave={(name) => { updatePrefs({ clientName: name }); setClientInfo(p => ({ ...p, name })); setEditingName(false); }}
              />
            )}

            {currentStep === 'shop' && (
              <ShopSelector
                shops={shops}
                userLocation={userLocation}
                favoriteShopId={prefs.favoriteShopId}
                onSelect={(shop) => {
                  setSelectedShop(shop);
                  updatePrefs({ favoriteShopId: shop.id });
                  setStep(3);
                }}
              />
            )}

            {currentStep === 'services' && (
              <ServiceSelector
                services={services}
                selected={selectedServices}
                onToggle={toggleService}
                total={total}
                totalDuration={totalDuration}
              />
            )}

            {currentStep === 'barber' && (
              <BarberSelectorWithFav
                barbers={barbers}
                selected={selectedBarber}
                favoriteBarberRelId={prefs.favoriteBarberRelId}
                onSelect={(b) => { setSelectedBarber(b); setStep(5); }}
                onFavorite={(b) => updatePrefs({ favoriteBarberRelId: b.id })}
              />
            )}

            {currentStep === 'time' && (
              <TimeSlotPicker
                appointments={appointments}
                totalDuration={totalDuration}
                shopHours={selectedShop?.opening_hours}
                selectedSlot={selectedSlot}
                onSelect={(slot) => { setSelectedSlot(slot); setStep(6); }}
              />
            )}

            {currentStep === 'confirm' && (
              <BookingConfirmation
                shop={selectedShop}
                barber={selectedBarber}
                services={selectedServices}
                slot={selectedSlot}
                clientInfo={clientInfo}
                onClientChange={setClientInfo}
                notes={notes}
                onNotesChange={setNotes}
                onConfirm={handleConfirm}
                isSubmitting={isSubmitting}
              />
            )}

            {currentStep === 'success' && (
              <BookingSuccess
                appointment={createdAppointment}
                onNewBooking={resetBooking}
                onViewLoyalty={() => navigate('/loyalty')}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* CTA serviços */}
        {currentStep === 'services' && selectedServices.length > 0 && (
          <div className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-40">
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setStep(4)}
              className="w-full bg-[#C9A84C] text-black py-4 rounded-2xl font-bold text-sm shadow-lg shadow-[#C9A84C]/20 hover:bg-[#d4b55a] transition-colors"
            >
              Continuar — {selectedServices.length} serviço{selectedServices.length > 1 ? 's' : ''} · €{total.toFixed(2)}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}

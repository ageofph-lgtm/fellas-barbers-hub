import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Scissors, Home, User, Heart, Star, ChevronRight, MapPin } from 'lucide-react';
import ShopSelector from '../components/booking/ShopSelector';
import ServiceSelector from '../components/booking/ServiceSelector';
import BarberSelector from '../components/booking/BarberSelector';
import TimeSlotPicker from '../components/booking/TimeSlotPicker';
import BookingConfirmation from '../components/booking/BookingConfirmation';
import BookingSuccess from '../components/booking/BookingSuccess';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const STEPS = ['profile', 'shop', 'services', 'barber', 'time', 'confirm', 'success'];
const STEP_LABELS = ['Perfil', 'Loja', 'Serviços', 'Barbeiro', 'Horário', 'Confirmação'];

// ── Favorites storage (localStorage) ─────────────────────────────────────────
const STORAGE_KEY = 'fellas_client_prefs';
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function savePrefs(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

// ── Client Profile / Home ─────────────────────────────────────────────────────
function ClientProfile({ prefs, shops, barbers, onBook, onEditName }) {
  const favShop = shops.find(s => s.id === prefs.favoriteShopId);
  const favBarber = barbers.find(b => b.id === prefs.favoriteBarberRelId);
  const name = prefs.clientName || '';

  return (
    <div className="space-y-5">
      {/* Greeting */}
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

      {/* Favoritos */}
      {(favShop || favBarber) && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Os teus favoritos</p>

          {favShop && (
            <motion.button
              whileTap={{ scale: 0.98 }}
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
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onBook({ skipToBarber: favBarber })}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border border-zinc-700 bg-card text-left hover:border-[#C9A84C]/40 transition-all"
            >
              <img
                src={favBarber.photo_url}
                alt={favBarber.name}
                className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Barbeiro favorito</p>
                <p className="font-bold text-foreground text-sm truncate">{favBarber.name}</p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-[#C9A84C] fill-current" />
                <span className="text-xs font-bold text-[#C9A84C]">{favBarber.rating?.toFixed(1)}</span>
              </div>
            </motion.button>
          )}
        </div>
      )}

      {/* CTA principal */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => onBook({})}
        className="w-full py-4 rounded-2xl bg-[#C9A84C] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#d4b55a] transition-colors shadow-lg shadow-[#C9A84C]/20"
      >
        <Scissors className="w-4 h-4" />
        Marcar agendamento
      </motion.button>

      {/* Info rápida */}
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
      <input
        type="text"
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="Ex: João Silva"
        autoFocus
        className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C9A84C]/60 text-sm"
      />
      <button
        onClick={() => onSave(val.trim())}
        disabled={!val.trim()}
        className="w-full py-3.5 rounded-2xl bg-[#C9A84C] text-black font-bold text-sm disabled:opacity-40"
      >
        Guardar
      </button>
    </div>
  );
}

// ── Main Booking ──────────────────────────────────────────────────────────────
export default function Booking() {
  const [step, setStep] = useState(0); // 0 = profile
  const [prefs, setPrefs] = useState(loadPrefs);
  const [editingName, setEditingName] = useState(false);

  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientInfo, setClientInfo] = useState({
    name: loadPrefs().clientName || '',
    phone: loadPrefs().clientPhone || '',
    email: loadPrefs().clientEmail || '',
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
    queryFn: () => base44.entities.Service.filter({ is_active: true }, 'sort_order'),
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
      prev.some(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    );
  };

  const updatePrefs = useCallback((updates) => {
    setPrefs(prev => {
      const next = { ...prev, ...updates };
      savePrefs(next);
      return next;
    });
  }, []);

  const handleFavoriteShop = (shop) => updatePrefs({ favoriteShopId: shop.id });
  const handleFavoriteBarber = (barber) => updatePrefs({ favoriteBarberRelId: barber.id });

  const startBooking = ({ skipToShop, skipToBarber } = {}) => {
    setEditingName(false);
    if (skipToShop) {
      setSelectedShop(skipToShop);
      setStep(2); // vai direto para serviços
    } else if (skipToBarber) {
      // Encontrar a loja do barbeiro favorito
      const favBarberFull = allBarbers.find(b => b.id === skipToBarber.id);
      if (favBarberFull) {
        const shop = shops.find(s => s.id === favBarberFull.barbershop_id);
        if (shop) setSelectedShop(shop);
        setSelectedBarber(favBarberFull);
        setStep(4); // vai direto para horário
      } else {
        setStep(1);
      }
    } else {
      setStep(1);
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
      services: selectedServices.map(s => ({
        service_id: s.id, name: s.name, price: s.price, duration_minutes: s.duration_minutes
      })),
      total_price: total,
      total_duration: totalDuration,
      date: dateStr,
      start_time: selectedSlot.time,
      end_time: endTime,
      status: 'scheduled',
      notes,
    });
    // Guardar dados do cliente para próxima vez
    updatePrefs({ clientName: clientInfo.name, clientPhone: clientInfo.phone, clientEmail: clientInfo.email });
    setCreatedAppointment(appt);
    setIsSubmitting(false);
    setStep(6);
  };

  const resetBooking = () => {
    setStep(0);
    setSelectedShop(null);
    setSelectedServices([]);
    setSelectedBarber(null);
    setSelectedSlot(null);
    setNotes('');
    setCreatedAppointment(null);
  };

  const goBack = () => {
    if (step === 1) setStep(0);
    else if (step > 1 && step < 6) setStep(step - 1);
  };

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2 flex items-center gap-3">
          {step > 0 && step < 6 ? (
            <button onClick={goBack} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => navigate('/')} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0">
              <Home className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0">
              <Scissors className="w-3.5 h-3.5 text-[#C9A84C]" />
            </div>
            <div className="min-w-0">
              <span className="font-black text-foreground tracking-wider text-sm">FELLAS</span>
              {step > 0 && step < 6 && (
                <span className="text-xs text-muted-foreground ml-2">{STEP_LABELS[step]}</span>
              )}
            </div>
          </div>
        </div>

        {/* Progress (só nos steps de booking) */}
        {step > 0 && step < 6 && (
          <div className="max-w-lg mx-auto px-4 pb-3 pt-1">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i < step ? 'bg-[#C9A84C]' : i === step ? 'bg-[#C9A84C]/50' : 'bg-border'
                }`} />
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
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.16 }}
          >
            {/* Perfil do cliente */}
            {currentStep === 'profile' && !editingName && (
              <ClientProfile
                prefs={prefs}
                shops={shops}
                barbers={allBarbers}
                onBook={startBooking}
                onEditName={() => setEditingName(true)}
              />
            )}

            {currentStep === 'profile' && editingName && (
              <NameEditor
                initialName={prefs.clientName}
                onSave={(name) => {
                  updatePrefs({ clientName: name });
                  setClientInfo(prev => ({ ...prev, name }));
                  setEditingName(false);
                }}
              />
            )}

            {/* Seleção de loja */}
            {currentStep === 'shop' && (
              <ShopSelector
                shops={shops}
                favoriteShopId={prefs.favoriteShopId}
                onSelect={(shop) => {
                  setSelectedShop(shop);
                  handleFavoriteShop(shop); // auto-guarda última loja visitada
                  setStep(2);
                }}
              />
            )}

            {/* Serviços */}
            {currentStep === 'services' && (
              <ServiceSelector
                services={services}
                selected={selectedServices}
                onToggle={toggleService}
                total={total}
                totalDuration={totalDuration}
              />
            )}

            {/* Barbeiro */}
            {currentStep === 'barber' && (
              <BarberSelectorWithFav
                barbers={barbers}
                selected={selectedBarber}
                favoriteBarberRelId={prefs.favoriteBarberRelId}
                onSelect={(barber) => {
                  setSelectedBarber(barber);
                  setStep(4);
                }}
                onFavorite={handleFavoriteBarber}
              />
            )}

            {/* Horário */}
            {currentStep === 'time' && (
              <TimeSlotPicker
                appointments={appointments}
                totalDuration={totalDuration}
                shopHours={selectedShop?.opening_hours}
                selectedSlot={selectedSlot}
                onSelect={(slot) => { setSelectedSlot(slot); setStep(5); }}
              />
            )}

            {/* Confirmação */}
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

            {/* Sucesso */}
            {currentStep === 'success' && (
              <BookingSuccess
                appointment={createdAppointment}
                onNewBooking={resetBooking}
                onViewLoyalty={() => navigate('/loyalty')}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* CTA Serviços */}
        {currentStep === 'services' && selectedServices.length > 0 && (
          <div className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-40">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setStep(3)}
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

// ── BarberSelector com favorito ───────────────────────────────────────────────
function BarberSelectorWithFav({ barbers, selected, favoriteBarberRelId, onSelect, onFavorite }) {
  // Ordenar: favorito primeiro
  const sorted = [...barbers].sort((a, b) => {
    if (a.id === favoriteBarberRelId) return -1;
    if (b.id === favoriteBarberRelId) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-foreground">Escolhe o barbeiro</h2>
        <p className="text-sm text-muted-foreground mt-1">Toca no ♡ para guardar como favorito</p>
      </div>
      <div className="space-y-3">
        {sorted.map((barber, i) => {
          const isFav = barber.id === favoriteBarberRelId;
          const isSelected = selected?.id === barber.id;
          return (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`rounded-2xl border transition-all ${
                isFav ? 'border-[#C9A84C]/50 bg-gradient-to-br from-[#C9A84C]/5 to-card'
                : isSelected ? 'border-[#C9A84C]/70 bg-card'
                : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center gap-3 p-4">
                <button className="flex-1 flex items-center gap-3 text-left" onClick={() => onSelect(barber)}>
                  <div className="relative flex-shrink-0">
                    <img
                      src={barber.photo_url}
                      alt={barber.name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
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
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-[#C9A84C] fill-current" />
                      <span className="text-xs font-bold text-[#C9A84C]">{barber.rating?.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">· {barber.years_experience} anos</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(barber.specialties || []).slice(0, 2).map(s => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  </div>
                </button>

                {/* Botão favorito */}
                <button
                  onClick={(e) => { e.stopPropagation(); onFavorite(barber); }}
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

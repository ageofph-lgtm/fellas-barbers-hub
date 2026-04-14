import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Scissors } from 'lucide-react';
import ShopSelector from '../components/booking/ShopSelector';
import ServiceSelector from '../components/booking/ServiceSelector';
import BarberSelector from '../components/booking/BarberSelector';
import TimeSlotPicker from '../components/booking/TimeSlotPicker';
import BookingConfirmation from '../components/booking/BookingConfirmation';
import BookingSuccess from '../components/booking/BookingSuccess';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const STEPS = ['shop', 'services', 'barber', 'time', 'confirm', 'success'];

export default function Booking() {
  const [step, setStep] = useState(0);
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientInfo, setClientInfo] = useState({ name: '', phone: '', email: '' });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const navigate = useNavigate();

  const { data: shops = [] } = useQuery({
    queryKey: ['barbershops'],
    queryFn: () => base44.entities.Barbershop.filter({ is_active: true }),
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
    setCreatedAppointment(appt);
    setIsSubmitting(false);
    setStep(5);
  };

  const goBack = () => {
    if (step > 0 && step < 5) setStep(step - 1);
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const resetBooking = () => {
    setStep(0);
    setSelectedShop(null);
    setSelectedServices([]);
    setSelectedBarber(null);
    setSelectedSlot(null);
    setClientInfo({ name: '', phone: '', email: '' });
    setNotes('');
    setCreatedAppointment(null);
  };

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          {step > 0 && step < 5 && (
            <button onClick={goBack} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2 flex-1">
            <Scissors className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground tracking-tight">FELLAS BARBERS</span>
          </div>
        </div>
        {/* Progress Bar */}
        {step < 5 && (
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    i <= step ? 'bg-primary' : 'bg-border'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 'shop' && (
              <ShopSelector shops={shops} onSelect={(shop) => { setSelectedShop(shop); setStep(1); }} />
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
              <BarberSelector
                barbers={barbers}
                selected={selectedBarber}
                onSelect={(barber) => { setSelectedBarber(barber); setStep(3); }}
              />
            )}
            {currentStep === 'time' && (
              <TimeSlotPicker
                appointments={appointments}
                totalDuration={totalDuration}
                shopHours={selectedShop?.opening_hours}
                selectedSlot={selectedSlot}
                onSelect={(slot) => { setSelectedSlot(slot); setStep(4); }}
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

        {/* Next Button for Services Step */}
        {currentStep === 'services' && selectedServices.length > 0 && (
          <div className="fixed bottom-24 left-4 right-4 lg:left-auto lg:right-8 lg:max-w-md z-40">
            <button
              onClick={handleNext}
              className="w-full bg-card border border-primary/40 text-primary py-3 rounded-2xl font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
            >
              Continuar →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, Crown } from 'lucide-react';
import { setSessionRole } from '../components/layout/AppLayout';

// ── Brand ─────────────────────────────────────────────────────────────────────
// Logo oficial: coroa com asas e tesoura cruzada
const LOGO_URL = 'https://fellasbarber.com/wp-content/uploads/2024/01/logo-fellas-barbers.png';

// ── Barbeiros de teste (dados reais quando disponíveis) ───────────────────────
const TEST_BARBERS = [
  {
    id: 'b1',
    name: 'Ricardo Silva',
    shop: 'Alameda',
    specialty: 'Fade · Degradê · Design',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    rating: 4.9,
    years: 8,
  },
  {
    id: 'b2',
    name: 'Miguel Santos',
    shop: 'Campo Grande',
    specialty: 'Fade · Coloração · Moderno',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    rating: 4.8,
    years: 6,
  },
  {
    id: 'b3',
    name: 'André Oliveira',
    shop: 'Almada',
    specialty: 'Fade · Clássico · Barba',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
    rating: 4.8,
    years: 7,
  },
];

// ── Logo component ────────────────────────────────────────────────────────────
function FellasLogo({ size = 'md' }) {
  const sz = size === 'lg' ? 'w-20 h-20' : 'w-14 h-14';
  return (
    <div className={`${sz} flex items-center justify-center`}>
      <img
        src={LOGO_URL}
        alt="Fellas Barbers"
        className="w-full h-full object-contain"
        onError={(e) => {
          // fallback inline SVG crown
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
      <div className="w-full h-full hidden items-center justify-center">
        <Crown className={size === 'lg' ? 'w-12 h-12' : 'w-8 h-8'} style={{ color: '#C8102E' }} />
      </div>
    </div>
  );
}

export default function RoleSelector() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('role');
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedBarberId, setSelectedBarberId] = useState(null);

  const handleRoleClick = (roleId) => {
    setSelectedRole(roleId);
    if (roleId === 'barber') {
      setTimeout(() => setPhase('barber'), 180);
    } else if (roleId === 'client') {
      setTimeout(() => navigate('/booking'), 180);
    } else if (roleId === 'admin') {
      setSessionRole({ role: 'admin' });
      setTimeout(() => navigate('/admin'), 180);
    }
  };

  const handleBarberSelect = (barber) => {
    setSelectedBarberId(barber.id);
    setSessionRole({ role: 'barber', barberId: barber.id, barberName: barber.name });
    setTimeout(() => navigate(`/barber/${barber.id}`), 180);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: 'linear-gradient(160deg, #0A0A0A 60%, #1a0305 100%)' }}
    >
      {/* Hero logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <FellasLogo size="lg" />
        <h1 className="text-3xl font-black tracking-[0.2em] text-white mt-4 uppercase">
          FELLAS <span style={{ color: '#C8102E' }}>BARBERS</span>
        </h1>
        <p className="text-xs tracking-[0.35em] text-zinc-500 uppercase mt-1">Premium · Lisboa · Almada</p>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── Fase: escolha de perfil ── */}
        {phase === 'role' && (
          <motion.div
            key="role"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-xs space-y-3"
          >
            <p className="text-zinc-500 text-xs text-center tracking-widest uppercase mb-5">Seleciona o teu perfil</p>

            {/* Cliente */}
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              onClick={() => handleRoleClick('client')} whileTap={{ scale: 0.97 }}
              className={`w-full text-left rounded-2xl border p-4 flex items-center gap-4 transition-all duration-200
                ${selectedRole === 'client' ? 'border-[#C8102E] ring-2 ring-[#C8102E]/40' : 'border-zinc-800 hover:border-zinc-600'}`}
              style={{ background: selectedRole === 'client' ? 'rgba(200,16,46,0.08)' : 'rgba(255,255,255,0.03)' }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(200,16,46,0.12)', border: '1px solid rgba(200,16,46,0.25)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#C8102E" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">Cliente</p>
                <p className="text-zinc-500 text-xs mt-0.5">Marcar agendamento</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </motion.button>

            {/* Barbeiro */}
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              onClick={() => handleRoleClick('barber')} whileTap={{ scale: 0.97 }}
              className={`w-full text-left rounded-2xl border p-4 flex items-center gap-4 transition-all duration-200
                ${selectedRole === 'barber' ? 'border-[#C8102E] ring-2 ring-[#C8102E]/40' : 'border-zinc-800 hover:border-zinc-600'}`}
              style={{ background: selectedRole === 'barber' ? 'rgba(200,16,46,0.08)' : 'rgba(255,255,255,0.03)' }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(200,16,46,0.12)', border: '1px solid rgba(200,16,46,0.25)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#C8102E" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">Barbeiro</p>
                <p className="text-zinc-500 text-xs mt-0.5">Agenda, comissões e stats</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </motion.button>

            {/* Admin */}
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              onClick={() => handleRoleClick('admin')} whileTap={{ scale: 0.97 }}
              className={`w-full text-left rounded-2xl border p-4 flex items-center gap-4 transition-all duration-200
                ${selectedRole === 'admin' ? 'border-[#C8102E] ring-2 ring-[#C8102E]/40' : 'border-zinc-800 hover:border-zinc-600'}`}
              style={{ background: selectedRole === 'admin' ? 'rgba(200,16,46,0.08)' : 'rgba(255,255,255,0.03)' }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(200,16,46,0.12)', border: '1px solid rgba(200,16,46,0.25)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#C8102E" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm">Administrador</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ color: '#C8102E', background: 'rgba(200,16,46,0.15)', border: '1px solid rgba(200,16,46,0.3)' }}>
                    RESTRITO
                  </span>
                </div>
                <p className="text-zinc-500 text-xs mt-0.5">Gestão completa da rede</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </motion.button>

            <p className="text-zinc-700 text-[11px] text-center pt-3">Em produção: acesso controlado por email</p>
          </motion.div>
        )}

        {/* ── Fase: escolha de barbeiro ── */}
        {phase === 'barber' && (
          <motion.div
            key="barber"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="w-full max-w-xs space-y-3"
          >
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => { setPhase('role'); setSelectedRole(null); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <p className="text-zinc-400 text-sm font-medium">Qual é o teu perfil?</p>
            </div>

            {TEST_BARBERS.map((barber, i) => (
              <motion.button
                key={barber.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => handleBarberSelect(barber)}
                whileTap={{ scale: 0.97 }}
                className={`w-full text-left rounded-2xl border p-4 flex items-center gap-4 transition-all duration-200
                  ${selectedBarberId === barber.id ? 'border-[#C8102E] ring-2 ring-[#C8102E]/40' : 'border-zinc-800 hover:border-[#C8102E]/50'}`}
                style={{ background: selectedBarberId === barber.id ? 'rgba(200,16,46,0.08)' : 'rgba(255,255,255,0.03)' }}
              >
                <img src={barber.photo} alt={barber.name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-zinc-800" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{barber.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#C8102E' }}>Fellas {barber.shop}</p>
                  <p className="text-zinc-500 text-[11px] mt-0.5 truncate">{barber.specialty}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs font-bold" style={{ color: '#C8102E' }}>★ {barber.rating}</span>
                  <span className="text-[10px] text-zinc-600">{barber.years} anos</span>
                </div>
              </motion.button>
            ))}

            <p className="text-zinc-700 text-[11px] text-center pt-2">Em produção: login por email + senha</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

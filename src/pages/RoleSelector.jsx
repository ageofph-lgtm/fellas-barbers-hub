import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Briefcase, User, ChevronRight, ArrowLeft } from 'lucide-react';

// ── Barbeiros de teste ────────────────────────────────────────────────────────
const TEST_BARBERS = [
  {
    id: 'b1',
    name: 'Ricardo Silva',
    shop: 'Fellas Alameda',
    specialty: 'Fade · Degradê · Design',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    rating: 4.9,
    years: 8,
  },
  {
    id: 'b2',
    name: 'Miguel Santos',
    shop: 'Fellas Campo Grande',
    specialty: 'Fade · Coloração · Moderno',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    rating: 4.8,
    years: 6,
  },
  {
    id: 'b3',
    name: 'André Oliveira',
    shop: 'Fellas Almada',
    specialty: 'Fade · Clássico · Barba',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
    rating: 4.8,
    years: 7,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

export default function RoleSelector() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('role'); // 'role' | 'barber'
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);

  const handleRoleClick = (roleId) => {
    setSelectedRole(roleId);
    if (roleId === 'barber') {
      setTimeout(() => setPhase('barber'), 220);
    } else if (roleId === 'client') {
      setTimeout(() => navigate('/booking'), 220);
    } else if (roleId === 'admin') {
      setTimeout(() => navigate('/admin'), 220);
    }
  };

  const handleBarberSelect = (barber) => {
    setSelectedBarber(barber.id);
    setTimeout(() => navigate(`/barber/${barber.id}`), 220);
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-5 py-10">

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-10 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
            <Scissors className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-widest text-white leading-none">FELLAS</h1>
            <p className="text-[9px] font-bold tracking-[0.4em] text-[#C9A84C] uppercase">Barbers</p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── FASE: escolha de perfil ── */}
        {phase === 'role' && (
          <motion.div
            key="role"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-xs space-y-3"
          >
            <motion.p variants={cardVariants} className="text-zinc-500 text-sm text-center mb-5">
              Quem és tu?
            </motion.p>

            {/* Cliente */}
            <motion.button
              variants={cardVariants}
              onClick={() => handleRoleClick('client')}
              whileTap={{ scale: 0.97 }}
              className={`w-full text-left rounded-2xl border p-4 flex items-center gap-4
                bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 hover:border-zinc-500
                transition-all duration-200 outline-none
                ${selectedRole === 'client' ? 'ring-2 ring-[#C9A84C]' : ''}`}
            >
              <div className="w-11 h-11 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-[#C9A84C]" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">Cliente</p>
                <p className="text-zinc-400 text-xs mt-0.5">Agendar um corte ou serviço</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </motion.button>

            {/* Barbeiro */}
            <motion.button
              variants={cardVariants}
              onClick={() => handleRoleClick('barber')}
              whileTap={{ scale: 0.97 }}
              className={`w-full text-left rounded-2xl border p-4 flex items-center gap-4
                bg-gradient-to-br from-amber-950/50 to-zinc-900 border-amber-800/40 hover:border-amber-600/60
                transition-all duration-200 outline-none
                ${selectedRole === 'barber' ? 'ring-2 ring-[#C9A84C]' : ''}`}
            >
              <div className="w-11 h-11 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center flex-shrink-0">
                <Scissors className="w-5 h-5 text-[#C9A84C]" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">Barbeiro</p>
                <p className="text-zinc-400 text-xs mt-0.5">Ver agenda e comissões</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </motion.button>

            {/* Admin */}
            <motion.button
              variants={cardVariants}
              onClick={() => handleRoleClick('admin')}
              whileTap={{ scale: 0.97 }}
              className={`w-full text-left rounded-2xl border p-4 flex items-center gap-4
                bg-gradient-to-br from-yellow-950/30 to-zinc-900 border-yellow-800/30 hover:border-yellow-600/50
                transition-all duration-200 outline-none
                ${selectedRole === 'admin' ? 'ring-2 ring-[#C9A84C]' : ''}`}
            >
              <div className="w-11 h-11 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-[#C9A84C]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm">Administrador</p>
                  <span className="text-[9px] font-bold text-[#C9A84C] border border-[#C9A84C]/40 rounded-full px-1.5 py-0.5 bg-[#C9A84C]/10">
                    RESTRITO
                  </span>
                </div>
                <p className="text-zinc-400 text-xs mt-0.5">Gestão completa da rede</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </motion.button>

            <motion.p
              variants={cardVariants}
              className="text-zinc-700 text-[11px] text-center pt-4"
            >
              Em produção: acesso controlado por email
            </motion.p>
          </motion.div>
        )}

        {/* ── FASE: escolha de barbeiro ── */}
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
                className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <p className="text-zinc-400 text-sm">Seleciona o teu perfil</p>
            </div>

            {TEST_BARBERS.map((barber, i) => (
              <motion.button
                key={barber.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => handleBarberSelect(barber)}
                whileTap={{ scale: 0.97 }}
                className={`w-full text-left rounded-2xl border p-4 flex items-center gap-4
                  bg-gradient-to-br from-zinc-800/80 to-zinc-900 border-zinc-700 hover:border-[#C9A84C]/50
                  transition-all duration-200 outline-none
                  ${selectedBarber === barber.id ? 'ring-2 ring-[#C9A84C] border-[#C9A84C]/50' : ''}`}
              >
                <img
                  src={barber.photo}
                  alt={barber.name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{barber.name}</p>
                  <p className="text-[#C9A84C] text-[11px] mt-0.5">{barber.shop}</p>
                  <p className="text-zinc-500 text-[11px] mt-0.5 truncate">{barber.specialty}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs font-bold text-[#C9A84C]">★ {barber.rating}</span>
                  <span className="text-[10px] text-zinc-600">{barber.years} anos</span>
                </div>
              </motion.button>
            ))}

            <p className="text-zinc-700 text-[11px] text-center pt-2">
              Em produção: login por email + senha
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

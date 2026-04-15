import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, Crown, Sun, Moon } from 'lucide-react';
import { setSessionRole } from '../components/layout/AppLayout';
import { useTheme } from '../App';

const TEST_BARBERS = [
  { id: 'b1', name: 'Ricardo Silva',  shop: 'Alameda',      specialty: 'Fade · Degradê · Design',    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', rating: 4.9, years: 8 },
  { id: 'b2', name: 'Miguel Santos',  shop: 'Campo Grande', specialty: 'Fade · Coloração · Moderno',  photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', rating: 4.8, years: 6 },
  { id: 'b3', name: 'André Oliveira', shop: 'Almada',       specialty: 'Fade · Clássico · Barba',     photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face', rating: 4.8, years: 7 },
];

const RED = '#C8102E';

function CrownIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 17L4 7L8 12L12 4L16 12L20 7L22 17H2Z"
        stroke={RED} strokeWidth="1.5" strokeLinejoin="round" fill={`${RED}25`}/>
      <rect x="2" y="17" width="20" height="2" rx="1" fill={RED}/>
    </svg>
  );
}

// ── Toggle inline ─────────────────────────────────────────────────────────────
function ThemeToggleBtn() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      style={{
        background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
      }}
      title={isDark ? 'Modo Claro' : 'Modo Escuro'}
    >
      {isDark
        ? <Sun  className="w-4 h-4" style={{ color: '#f59e0b' }} />
        : <Moon className="w-4 h-4" style={{ color: RED }} />
      }
    </button>
  );
}

export default function RoleSelector() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [phase, setPhase] = useState('role');
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedBarberId, setSelectedBarberId] = useState(null);

  const handleRoleClick = (roleId) => {
    setSelectedRole(roleId);
    if (roleId === 'barber')  { setTimeout(() => setPhase('barber'), 180); }
    else if (roleId === 'client') { setTimeout(() => navigate('/booking'), 180); }
    else if (roleId === 'admin')  { setSessionRole({ role: 'admin' }); setTimeout(() => navigate('/admin'), 180); }
  };

  const handleBarberSelect = (barber) => {
    setSelectedBarberId(barber.id);
    setSessionRole({ role: 'barber', barberId: barber.id, barberName: barber.name });
    setTimeout(() => navigate(`/barber/${barber.id}`), 180);
  };

  const bg = isDark
    ? 'linear-gradient(160deg, #0A0A0A 60%, #1a0305 100%)'
    : 'linear-gradient(160deg, #f8f8f8 60%, #fff0f0 100%)';

  return (
    <div className="min-h-screen flex flex-col px-5 py-8" style={{ background: bg }}>

      {/* ── Topbar com toggle ── */}
      <div className="flex justify-end mb-6">
        <ThemeToggleBtn />
      </div>

      {/* ── Hero logo ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col items-center mb-10"
      >
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(200,16,46,0.1)', border: '1px solid rgba(200,16,46,0.25)' }}>
          <CrownIcon size={40} />
        </div>
        <h1 className="text-3xl font-black tracking-[0.2em] text-foreground uppercase">
          FELLAS <span style={{ color: RED }}>BARBERS</span>
        </h1>
        <p className="text-xs tracking-[0.35em] text-muted-foreground uppercase mt-1">Premium · Lisboa · Almada</p>
      </motion.div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col items-center justify-start">
        <AnimatePresence mode="wait">

          {/* Fase: perfil */}
          {phase === 'role' && (
            <motion.div key="role"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-xs space-y-3"
            >
              <p className="text-muted-foreground text-xs text-center tracking-widest uppercase mb-5">Seleciona o teu perfil</p>

              {[
                { id: 'client', label: 'Cliente',        sub: 'Marcar agendamento',      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
                { id: 'barber', label: 'Barbeiro',       sub: 'Agenda, comissões e stats', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /> },
                { id: 'admin',  label: 'Administrador',  sub: 'Gestão completa da rede',  icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />, badge: 'RESTRITO' },
              ].map((item, i) => (
                <motion.button key={item.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  onClick={() => handleRoleClick(item.id)} whileTap={{ scale: 0.97 }}
                  className="w-full text-left rounded-2xl border p-4 flex items-center gap-4 transition-all duration-200"
                  style={{
                    borderColor: selectedRole === item.id ? RED : isDark ? '#27272a' : '#e4e4e7',
                    background: selectedRole === item.id ? 'rgba(200,16,46,0.08)' : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    boxShadow: selectedRole === item.id ? `0 0 0 2px ${RED}40` : 'none',
                  }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(200,16,46,0.12)', border: '1px solid rgba(200,16,46,0.25)' }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={RED} strokeWidth={2}>{item.icon}</svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground text-sm">{item.label}</p>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ color: RED, background: 'rgba(200,16,46,0.12)', border: '1px solid rgba(200,16,46,0.25)' }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs mt-0.5">{item.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              ))}

              <p className="text-muted-foreground/40 text-[11px] text-center pt-3">Em produção: acesso controlado por email</p>
            </motion.div>
          )}

          {/* Fase: barbeiro */}
          {phase === 'barber' && (
            <motion.div key="barber"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-xs space-y-3"
            >
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => { setPhase('role'); setSelectedRole(null); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', border: '1px solid var(--border)' }}>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <p className="text-muted-foreground text-sm font-medium">Qual é o teu perfil?</p>
              </div>

              {TEST_BARBERS.map((barber, i) => (
                <motion.button key={barber.id}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  onClick={() => handleBarberSelect(barber)} whileTap={{ scale: 0.97 }}
                  className="w-full text-left rounded-2xl border p-4 flex items-center gap-4 transition-all duration-200"
                  style={{
                    borderColor: selectedBarberId === barber.id ? RED : isDark ? '#27272a' : '#e4e4e7',
                    background: selectedBarberId === barber.id ? 'rgba(200,16,46,0.08)' : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    boxShadow: selectedBarberId === barber.id ? `0 0 0 2px ${RED}40` : 'none',
                  }}
                >
                  <img src={barber.photo} alt={barber.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-border" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm">{barber.name}</p>
                    <p className="text-xs mt-0.5 font-medium" style={{ color: RED }}>Fellas {barber.shop}</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5 truncate">{barber.specialty}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs font-bold" style={{ color: RED }}>★ {barber.rating}</span>
                    <span className="text-[10px] text-muted-foreground">{barber.years} anos</span>
                  </div>
                </motion.button>
              ))}

              <p className="text-muted-foreground/40 text-[11px] text-center pt-2">Em produção: login por email + senha</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
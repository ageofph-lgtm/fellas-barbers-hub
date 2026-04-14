import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Scissors, BarChart3, Users, Package, LogOut, Menu, X, ShieldAlert, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../App';

const RED = '#C8102E';

// ── Session ───────────────────────────────────────────────────────────────────
export function getSessionRole() {
  try { return JSON.parse(sessionStorage.getItem('fellas_session') || 'null'); } catch { return null; }
}
export function setSessionRole(data) { sessionStorage.setItem('fellas_session', JSON.stringify(data)); }
export function clearSessionRole()  { sessionStorage.removeItem('fellas_session'); }

const NAV_ADMIN = [
  { path: '/admin',              icon: BarChart3, label: 'Dashboard'    },
  { path: '/admin/appointments', icon: Calendar,  label: 'Agendamentos' },
  { path: '/admin/team',         icon: Users,     label: 'Equipa'       },
  { path: '/admin/services',     icon: Scissors,  label: 'Serviços'     },
  { path: '/admin/stock',        icon: Package,   label: 'Estoque'      },
  { path: '/admin/cash',         icon: Home,      label: 'Caixa'        },
];

const NAV_BARBER = [
  { path: '/barber',       icon: Calendar,  label: 'Agenda' },
  { path: '/barber/stats', icon: BarChart3, label: 'Stats'  },
];

function CrownIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 17L4 7L8 12L12 4L16 12L20 7L22 17H2Z"
        stroke={RED} strokeWidth="1.5" strokeLinejoin="round" fill={`${RED}25`}/>
      <rect x="2" y="17" width="20" height="2" rx="1" fill={RED}/>
    </svg>
  );
}

// ── Toggle button ─────────────────────────────────────────────────────────────
function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (compact) {
    return (
      <button onClick={toggleTheme}
        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-secondary"
        title={isDark ? 'Activar modo claro' : 'Activar modo escuro'}
      >
        {isDark
          ? <Sun  className="w-4 h-4" style={{ color: '#f59e0b' }} />
          : <Moon className="w-4 h-4 text-muted-foreground" />
        }
      </button>
    );
  }

  return (
    <button onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-xl w-full transition-all hover:bg-secondary"
      title={isDark ? 'Activar modo claro' : 'Activar modo escuro'}
    >
      <div className="w-8 h-4 rounded-full relative transition-colors flex-shrink-0"
        style={{ background: isDark ? '#333' : '#e5e7eb', border: '1px solid var(--border)' }}>
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className="absolute top-0.5 w-3 h-3 rounded-full"
          style={{
            background: isDark ? '#f59e0b' : '#C8102E',
            left: isDark ? '2px' : 'calc(100% - 14px)',
          }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        {isDark ? 'Modo Claro' : 'Modo Escuro'}
      </span>
      {isDark
        ? <Sun  className="w-3.5 h-3.5 ml-auto" style={{ color: '#f59e0b' }} />
        : <Moon className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
      }
    </button>
  );
}

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const session     = getSessionRole();
  const sessionRole = session?.role;

  if (!sessionRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center space-y-4 max-w-xs">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'rgba(200,16,46,0.1)', border: `1px solid rgba(200,16,46,0.25)` }}>
            <CrownIcon size={32} />
          </div>
          <h2 className="text-xl font-black text-foreground">Sessão expirada</h2>
          <p className="text-muted-foreground text-sm">Volta ao início para selecionar o teu perfil.</p>
          <Link to="/" className="inline-block px-6 py-3 rounded-2xl font-bold text-sm"
            style={{ background: RED, color: '#fff' }}>
            Ir para o início
          </Link>
        </div>
      </div>
    );
  }

  if (sessionRole === 'barber' && location.pathname.startsWith('/admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center space-y-4 max-w-xs">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-red-500/10 border border-red-500/30">
            <ShieldAlert className="w-8 h-8 text-red-400"/>
          </div>
          <h2 className="text-xl font-black text-foreground">Acesso restrito</h2>
          <p className="text-muted-foreground text-sm">Esta área é exclusiva para administradores.</p>
          <Link to="/" className="inline-block px-6 py-3 rounded-2xl font-bold text-sm"
            style={{ background: RED, color: '#fff' }}>
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin     = sessionRole === 'admin';
  const navItems    = isAdmin ? NAV_ADMIN : NAV_BARBER;
  const displayName = isAdmin ? 'Administrador' : (session?.barberName || 'Barbeiro');
  const roleLabel   = isAdmin ? 'Admin' : 'Barbeiro';

  // Sidebar bg: escuro em dark, quase branco em light
  const sidebarBg  = isDark ? '#0A0A0A' : '#f8f8f8';
  const headerBg   = isDark ? 'rgba(10,10,10,0.96)' : 'rgba(248,248,248,0.96)';

  const handleLogout = () => { clearSessionRole(); navigate('/'); };

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border fixed h-full z-30"
        style={{ background: sidebarBg }}>

        {/* Logo + theme toggle */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(200,16,46,0.1)', border: `1px solid rgba(200,16,46,0.25)` }}>
                <CrownIcon size={18} />
              </div>
              <div>
                <h1 className="font-black text-base text-foreground tracking-widest">FELLAS</h1>
                <p className="text-[9px] font-bold tracking-[0.35em] uppercase" style={{ color: RED }}>Barbers</p>
              </div>
            </Link>
            <ThemeToggle compact />
          </div>
        </div>

        {/* Role badge */}
        <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded-xl flex items-center gap-2"
          style={{
            background: isAdmin ? 'rgba(200,16,46,0.1)' : 'rgba(34,197,94,0.08)',
            border: `1px solid ${isAdmin ? 'rgba(200,16,46,0.25)' : 'rgba(34,197,94,0.2)'}`,
          }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: isAdmin ? RED : '#22c55e' }} />
          <span className="text-xs font-bold" style={{ color: isAdmin ? RED : '#22c55e' }}>{roleLabel}</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path
              || (item.path !== '/barber' && item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={{
                  background: isActive ? 'rgba(200,16,46,0.12)' : 'transparent',
                  color: isActive ? RED : 'var(--muted-foreground)',
                  borderLeft: isActive ? `3px solid ${RED}` : '3px solid transparent',
                }}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          {/* Theme toggle full */}
          <ThemeToggle />
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: 'rgba(200,16,46,0.2)', color: RED }}>
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-red-400 transition-colors p-1" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 border-b border-border"
        style={{ background: headerBg, backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <CrownIcon size={18} />
            <span className="font-black text-foreground tracking-widest text-sm">FELLAS</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                color: isAdmin ? RED : '#22c55e',
                background: isAdmin ? 'rgba(200,16,46,0.12)' : 'rgba(34,197,94,0.1)',
              }}>
              {roleLabel}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Theme toggle compact no header mobile */}
            <ThemeToggle compact />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-muted-foreground hover:text-foreground">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="border-t border-border overflow-hidden"
              style={{ background: sidebarBg }}>
              <nav className="p-3 space-y-0.5">
                {navItems.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: isActive ? 'rgba(200,16,46,0.12)' : 'transparent',
                        color: isActive ? RED : 'var(--muted-foreground)',
                      }}>
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="pt-2 mt-2 border-t border-border">
                  <ThemeToggle />
                  <p className="px-4 py-1.5 text-xs text-muted-foreground mt-1">{displayName} · {roleLabel}</p>
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-400 w-full transition-colors">
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

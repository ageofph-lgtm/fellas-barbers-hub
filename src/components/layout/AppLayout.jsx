import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Home, Calendar, Scissors, BarChart3, Users, Package, LogOut, Menu, X, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

// ── Identidade do sessão ──────────────────────────────────────────────────────
// Guardado no sessionStorage quando se seleciona barbeiro/admin no RoleSelector
// { role: 'barber' | 'admin', barberId?: string, barberName?: string }
export function getSessionRole() {
  try { return JSON.parse(sessionStorage.getItem('fellas_session') || 'null'); }
  catch { return null; }
}
export function setSessionRole(data) {
  sessionStorage.setItem('fellas_session', JSON.stringify(data));
}
export function clearSessionRole() {
  sessionStorage.removeItem('fellas_session');
}

const ADMIN_EMAILS = ['ageofph@gmail.com'];

const NAV_ITEMS_ADMIN = [
  { path: '/admin',              icon: BarChart3, label: 'Dashboard'    },
  { path: '/admin/appointments', icon: Calendar,  label: 'Agendamentos' },
  { path: '/admin/team',         icon: Users,     label: 'Equipa'       },
  { path: '/admin/services',     icon: Scissors,  label: 'Serviços'     },
  { path: '/admin/stock',        icon: Package,   label: 'Estoque'      },
  { path: '/admin/cash',         icon: Home,      label: 'Caixa'        },
];

const NAV_ITEMS_BARBER = [
  { path: '/barber', icon: Calendar,  label: 'Agenda'    },
  { path: '/barber/stats', icon: BarChart3, label: 'Stats' },
];

// ── Guard: barbeiros não entram em /admin/* ────────────────────────────────
function RouteGuard({ session, location }) {
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isBarberRoute = location.pathname.startsWith('/barber');

  if (isAdminRoute && session?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-black text-foreground">Acesso restrito</h2>
          <p className="text-muted-foreground text-sm">Esta área é exclusiva para administradores.</p>
          <Link
            to="/"
            className="inline-block mt-2 px-6 py-3 rounded-2xl bg-[#C9A84C] text-black font-bold text-sm hover:bg-[#d4b55a] transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return null; // sem bloqueio
}

export default function AppLayout() {
  const [authUser, setAuthUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Sessão salva pelo RoleSelector
  const session = getSessionRole();

  useEffect(() => {
    base44.auth.me().then(setAuthUser).catch(() => {});
  }, []);

  // Quem é admin: email na whitelist OU role=admin na DB OU session.role=admin
  const isAdmin = session?.role === 'admin'
    || authUser?.role === 'admin'
    || ADMIN_EMAILS.includes(authUser?.email);

  const isBarber = session?.role === 'barber' && !isAdmin;

  const navItems = isAdmin ? NAV_ITEMS_ADMIN : NAV_ITEMS_BARBER;

  // Nome e avatar para a sidebar
  const displayName = isBarber
    ? (session?.barberName || 'Barbeiro')
    : (authUser?.full_name || 'Admin');

  const roleLabel = isAdmin ? 'Administrador' : 'Barbeiro';

  const handleLogout = () => {
    clearSessionRole();
    navigate('/');
  };

  // Guard inline
  const guard = RouteGuard({ session, location });
  if (guard) return guard;

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card fixed h-full z-30">
        <div className="p-5 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-[#C9A84C]" />
            </div>
            <div>
              <h1 className="font-black text-base text-foreground tracking-wider">FELLAS</h1>
              <p className="text-[9px] text-[#C9A84C] font-bold tracking-[0.3em] uppercase">Barbers</p>
            </div>
          </Link>
        </div>

        {/* Role badge */}
        <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded-xl bg-secondary flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-[#C9A84C]' : 'bg-green-400'}`} />
          <span className="text-xs font-semibold text-muted-foreground">{roleLabel}</span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] text-xs font-black flex-shrink-0">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-red-400 transition-colors" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-[#C9A84C]" />
            <span className="font-black text-foreground tracking-wider text-sm">FELLAS</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isAdmin ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'bg-green-500/15 text-green-400'
            }`}>{roleLabel}</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-muted-foreground">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border overflow-hidden bg-[#080808]"
            >
              <nav className="p-3 space-y-0.5">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="pt-2 border-t border-border mt-2">
                  <div className="px-4 py-2 text-xs text-muted-foreground">{displayName} · {roleLabel}</div>
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-400 w-full transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

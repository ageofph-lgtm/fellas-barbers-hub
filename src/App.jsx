import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Booking from './pages/Booking';
import Loyalty from './pages/Loyalty';
import BarberDashboard from './pages/BarberDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminCash from './pages/AdminCash';
import AdminTeam from './pages/AdminTeam';
import AdminStock from './pages/AdminStock';
import AdminServices from './pages/AdminServices';
import AdminAppointments from './pages/AdminAppointments';
import AppLayout from './components/layout/AppLayout';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public - Client */}
      <Route path="/" element={<Booking />} />
      <Route path="/loyalty" element={<Loyalty />} />

      {/* Barber & Admin - with Layout */}
      <Route element={<AppLayout />}>
        <Route path="/barber" element={<BarberDashboard />} />
        <Route path="/barber/commissions" element={<BarberDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/appointments" element={<AdminAppointments />} />
        <Route path="/admin/team" element={<AdminTeam />} />
        <Route path="/admin/services" element={<AdminServices />} />
        <Route path="/admin/stock" element={<AdminStock />} />
        <Route path="/admin/cash" element={<AdminCash />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
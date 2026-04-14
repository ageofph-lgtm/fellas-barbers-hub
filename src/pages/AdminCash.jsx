import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import AdminShopSelector from '../components/admin/ShopSelector';
import BlindCashClose from '../components/admin/BlindCashClose';
import { CreditCard, Banknote, Receipt } from 'lucide-react';

export default function AdminCash() {
  const [selectedShop, setSelectedShop] = useState('all');
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Barbershop.list(),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['cash-appointments', selectedShop],
    queryFn: () => {
      if (selectedShop === 'all') return base44.entities.Appointment.filter({ date: today });
      return base44.entities.Appointment.filter({ date: today, barbershop_id: selectedShop });
    },
    enabled: selectedShop !== 'all',
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['cash-reports', selectedShop],
    queryFn: () => {
      if (selectedShop === 'all') return base44.entities.CashReport.filter({ date: today });
      return base44.entities.CashReport.filter({ date: today, barbershop_id: selectedShop });
    },
  });

  const completedWithPayment = appointments.filter(a => a.status === 'completed' && a.comanda_locked);
  const pendingPayment = appointments.filter(a => a.status === 'completed' && a.payment_method === 'pending');

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Caixa</h1>
          <p className="text-muted-foreground">{format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: pt })}</p>
        </div>
        <AdminShopSelector shops={shops} selected={selectedShop} onSelect={setSelectedShop} />
      </div>

      {selectedShop === 'all' ? (
        <div className="text-center py-16 text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Seleciona uma loja para gerir o caixa</p>
        </div>
      ) : (
        <>
          {/* Pending payments */}
          {pendingPayment.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Pagamentos Pendentes ({pendingPayment.length})
              </h3>
              {pendingPayment.map(appt => {
                const total = (appt.total_price || 0) + (appt.upsells || []).reduce((s, u) => s + u.price, 0);
                return (
                  <div key={appt.id} className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">{appt.client_name}</p>
                      <p className="text-xs text-muted-foreground">{(appt.services || []).map(s => s.name).join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">€{total.toFixed(2)}</span>
                      <div className="flex gap-1">
                        {['cash', 'card', 'mbway'].map(method => (
                          <button
                            key={method}
                            onClick={async () => {
                              await base44.entities.Appointment.update(appt.id, { payment_method: method });
                              window.location.reload();
                            }}
                            className="px-3 py-1.5 text-xs rounded-lg bg-card border border-border hover:border-primary/40 text-foreground capitalize"
                          >
                            {method === 'cash' ? '💶' : method === 'card' ? '💳' : '📱'} {method}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Blind Cash Close */}
          <BlindCashClose
            appointments={appointments}
            shopId={selectedShop}
            existingReport={reports.find(r => r.barbershop_id === selectedShop)}
          />

          {/* Closed appointments */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold text-foreground">Comandas Fechadas ({completedWithPayment.length})</h3>
            </div>
            <div className="divide-y divide-border/50">
              {completedWithPayment.map(appt => {
                const total = (appt.total_price || 0) + (appt.upsells || []).reduce((s, u) => s + u.price, 0);
                const methodIcons = { cash: '💶', card: '💳', mbway: '📱', transfer: '🏦' };
                return (
                  <div key={appt.id} className="flex items-center justify-between p-4 hover:bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground">{appt.start_time}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{appt.client_name}</p>
                        <p className="text-xs text-muted-foreground">{(appt.services || []).map(s => s.name).join(', ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{methodIcons[appt.payment_method] || ''}</span>
                      <span className="font-semibold text-foreground">€{total.toFixed(2)}</span>
                      {appt.comanda_locked && <span className="text-xs">🔒</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
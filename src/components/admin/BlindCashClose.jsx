import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function BlindCashClose({ appointments, shopId, existingReport, onComplete }) {
  const [declaredCash, setDeclaredCash] = useState('');
  const [declaredCard, setDeclaredCard] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState(existingReport);

  const expected = useMemo(() => {
    const completed = appointments.filter(a => a.status === 'completed' && a.comanda_locked);
    let cash = 0, card = 0, mbway = 0;
    completed.forEach(a => {
      const total = (a.total_price || 0) + (a.upsells || []).reduce((s, u) => s + u.price, 0);
      if (a.payment_method === 'cash') cash += total;
      else if (a.payment_method === 'card') card += total;
      else if (a.payment_method === 'mbway') card += total;
    });
    return { cash, card, total: cash + card + mbway };
  }, [appointments]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const cashVal = parseFloat(declaredCash) || 0;
    const cardVal = parseFloat(declaredCard) || 0;
    const cashDisc = cashVal - expected.cash;
    const cardDisc = cardVal - expected.card;
    const hasDisc = Math.abs(cashDisc) > 0 || Math.abs(cardDisc) > 0;

    const reportData = {
      barbershop_id: shopId,
      date: format(new Date(), 'yyyy-MM-dd'),
      operator_declared_cash: cashVal,
      operator_declared_card: cardVal,
      expected_cash: expected.cash,
      expected_card: expected.card,
      total_revenue: expected.total,
      has_discrepancy: hasDisc,
      cash_discrepancy: cashDisc,
      card_discrepancy: cardDisc,
      status: 'declared',
      closed_at: new Date().toISOString(),
    };

    let created;
    if (report) {
      await base44.entities.CashReport.update(report.id, reportData);
      created = { ...report, ...reportData };
    } else {
      created = await base44.entities.CashReport.create(reportData);
    }

    // Notify admin if discrepancy
    if (hasDisc) {
      await base44.entities.Notification.create({
        type: 'cash_discrepancy',
        title: '⚠️ Quebra de Caixa',
        message: `Discrepância de €${(Math.abs(cashDisc) + Math.abs(cardDisc)).toFixed(2)} na loja.`,
        barbershop_id: shopId,
        target_role: 'admin',
        metadata: { cash_discrepancy: cashDisc, card_discrepancy: cardDisc },
      });
    }

    setReport(created);
    setRevealed(true);
    setIsSubmitting(false);
    if (onComplete) onComplete(created);
  };

  if (report && revealed) {
    const cashDisc = report.cash_discrepancy || 0;
    const cardDisc = report.card_discrepancy || 0;
    const hasDisc = report.has_discrepancy;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card border border-border rounded-2xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          {hasDisc ? (
            <AlertTriangle className="w-5 h-5 text-destructive" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
          <h3 className="font-bold text-lg text-foreground">
            {hasDisc ? 'Quebra Detectada' : 'Caixa Fechado ✓'}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Dinheiro</p>
            <p className="text-sm text-foreground">Declarado: €{report.operator_declared_cash?.toFixed(2)}</p>
            <p className="text-sm text-foreground">Esperado: €{report.expected_cash?.toFixed(2)}</p>
            <p className={`text-sm font-bold ${cashDisc === 0 ? 'text-green-400' : 'text-destructive'}`}>
              Diferença: €{cashDisc.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Cartão/TPA</p>
            <p className="text-sm text-foreground">Declarado: €{report.operator_declared_card?.toFixed(2)}</p>
            <p className="text-sm text-foreground">Esperado: €{report.expected_card?.toFixed(2)}</p>
            <p className={`text-sm font-bold ${cardDisc === 0 ? 'text-green-400' : 'text-destructive'}`}>
              Diferença: €{cardDisc.toFixed(2)}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Lock className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-bold text-lg text-foreground">Fecho de Caixa — Declaração Cega</h3>
          <p className="text-sm text-muted-foreground">Insere o valor que tens fisicamente. O valor esperado será revelado depois.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Dinheiro na gaveta (€)</label>
          <Input
            type="number"
            step="0.01"
            value={declaredCash}
            onChange={e => setDeclaredCash(e.target.value)}
            placeholder="0.00"
            className="bg-secondary border-border rounded-xl h-12 text-lg font-mono"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Valor no TPA/Cartão (€)</label>
          <Input
            type="number"
            step="0.01"
            value={declaredCard}
            onChange={e => setDeclaredCard(e.target.value)}
            placeholder="0.00"
            className="bg-secondary border-border rounded-xl h-12 text-lg font-mono"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-3 rounded-xl">
        <EyeOff className="w-4 h-4" />
        O valor esperado do sistema está oculto até submeter a declaração.
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || (!declaredCash && !declaredCard)}
        className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        {isSubmitting ? 'A processar...' : 'Submeter Declaração'}
      </Button>
    </div>
  );
}
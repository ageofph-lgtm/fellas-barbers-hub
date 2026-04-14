import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Stamp, Gift, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function LoyaltyCardView() {
  const [phone, setPhone] = useState('');
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!phone) return;
    setLoading(true);
    const cards = await base44.entities.LoyaltyCard.filter({ client_phone: phone });
    setCard(cards.length > 0 ? cards[0] : null);
    setSearched(true);
    setLoading(false);
  };

  const stamps = card?.stamps || 0;
  const totalRedeemed = card?.total_redeemed || 0;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
          <Gift className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Cartão de Fidelidade</h2>
        <p className="text-muted-foreground mt-2">10 cortes = 1 serviço grátis!</p>
      </div>

      {/* Phone Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="O teu telemóvel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-10 bg-card border-border rounded-xl h-12"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading} className="h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-6">
          {loading ? '...' : 'Ver'}
        </Button>
      </div>

      {searched && card && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/30 rounded-2xl p-6 gold-glow"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-foreground text-lg">{card.client_name || 'Cliente'}</p>
              <p className="text-sm text-muted-foreground">{card.client_phone}</p>
            </div>
            {totalRedeemed > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium">
                {totalRedeemed}x resgatado
              </span>
            )}
          </div>

          {/* Stamps Grid */}
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 10 }, (_, i) => (
              <motion.div
                key={i}
                initial={i < stamps ? { scale: 0 } : {}}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-all ${
                  i < stamps
                    ? 'bg-primary/20 border-primary'
                    : 'bg-secondary/50 border-border'
                }`}
              >
                {i < stamps ? (
                  <Stamp className="w-6 h-6 text-primary" />
                ) : (
                  <span className="text-xs text-muted-foreground">{i + 1}</span>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-4 text-center">
            {stamps >= 10 ? (
              <p className="text-primary font-bold text-lg">🎉 Parabéns! Tens um serviço grátis!</p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Faltam <span className="text-primary font-bold">{10 - stamps}</span> selos para o serviço grátis
              </p>
            )}
          </div>
        </motion.div>
      )}

      {searched && !card && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum cartão encontrado para este número.</p>
          <p className="text-sm mt-1">O cartão é criado automaticamente no teu primeiro corte!</p>
        </div>
      )}
    </div>
  );
}
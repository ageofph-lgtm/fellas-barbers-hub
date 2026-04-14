import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ChevronRight } from 'lucide-react';

function isOpenNow(openingHours) {
  if (!openingHours) return false;
  const now = new Date();
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = days[now.getDay()];
  const hours = openingHours[today];
  if (!hours || !hours.open || !hours.close) return false;
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const [oh, om] = hours.open.split(':').map(Number);
  const [ch, cm] = hours.close.split(':').map(Number);
  return currentTime >= oh * 100 + om && currentTime <= ch * 100 + cm;
}

export default function ShopSelector({ shops, onSelect }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Escolhe a tua barbearia</h2>
        <p className="text-muted-foreground mt-2">Seleciona a unidade mais próxima de ti</p>
      </div>
      <div className="grid gap-4">
        {shops.map((shop, i) => {
          const open = isOpenNow(shop.opening_hours);
          return (
            <motion.button
              key={shop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelect(shop)}
              className="w-full bg-card border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-primary/40 hover:gold-glow transition-all duration-300 text-left group"
            >
              <div className="w-16 h-16 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                {shop.photo_url ? (
                  <img src={shop.photo_url} alt={shop.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-lg">{shop.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{shop.address}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {open ? 'Aberto agora' : 'Fechado'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
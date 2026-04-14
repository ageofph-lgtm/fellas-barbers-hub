import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Check, ShoppingCart } from 'lucide-react';

export default function ServiceSelector({ services, selected, onToggle, total, totalDuration }) {
  const categories = ['corte', 'barba', 'combo', 'tratamento', 'coloracao', 'extra'];
  const categoryLabels = {
    corte: 'Cortes', barba: 'Barba', combo: 'Combos',
    tratamento: 'Tratamentos', coloracao: 'Coloração', extra: 'Extras'
  };

  const grouped = categories.reduce((acc, cat) => {
    const items = services.filter(s => s.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">O que vais fazer?</h2>
        <p className="text-muted-foreground mt-2">Seleciona os serviços desejados</p>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 px-1">
            {categoryLabels[cat]}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {items.map((service, i) => {
              const isSelected = selected.some(s => s.id === service.id);
              return (
                <motion.button
                  key={service.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onToggle(service)}
                  className={`relative bg-card border rounded-2xl overflow-hidden text-left transition-all duration-300 ${
                    isSelected
                      ? 'border-primary gold-glow'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  {service.photo_url && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={service.photo_url}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className="font-semibold text-foreground text-sm">{service.name}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {service.duration_minutes}min
                      </div>
                      <span className="text-primary font-bold text-sm">€{service.price}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Floating Cart Bar */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 left-4 right-4 lg:left-auto lg:right-8 lg:max-w-md z-50"
          >
            <div className="bg-primary text-primary-foreground rounded-2xl p-4 flex items-center justify-between gold-glow-strong">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" />
                <div>
                  <p className="font-bold">{selected.length} serviço{selected.length > 1 ? 's' : ''}</p>
                  <p className="text-xs opacity-80">{totalDuration} min</p>
                </div>
              </div>
              <span className="text-xl font-bold">€{total.toFixed(2)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
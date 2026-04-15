import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, ChevronRight } from 'lucide-react';

const RED = '#C8102E';

const CAT_LABELS = {
  corte: 'Cortes', barba: 'Barba', combo: 'Combos',
  tratamento: 'Tratamentos', coloracao: 'Coloração', extra: 'Extras'
};
const CAT_ORDER = ['corte', 'barba', 'combo', 'tratamento', 'coloracao', 'extra'];

export default function ServiceSelector({ services, selected, onToggle, total, totalDuration, onNext }) {
  const grouped = CAT_ORDER.reduce((acc, cat) => {
    const items = services.filter(s => s.category === cat && s.is_active !== false);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  const hasSelected = selected.length > 0;

  return (
    <div className="space-y-5 pb-36">
      <div className="text-center">
        <h2 className="text-xl font-black text-foreground">O que vais fazer?</h2>
        <p className="text-sm text-muted-foreground mt-1">Seleciona um ou mais serviços</p>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
            {CAT_LABELS[cat] || cat}
          </h3>
          <div className="space-y-2">
            {items.map((svc) => {
              const sel = selected.some(s => s.id === svc.id);
              return (
                <motion.button
                  key={svc.id}
                  layout
                  onClick={() => onToggle(svc)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all"
                  style={{
                    background: sel ? 'rgba(200,16,46,0.07)' : 'var(--card)',
                    border: sel ? `1.5px solid ${RED}` : '1.5px solid var(--border)',
                  }}
                >
                  {/* Check circle */}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: sel ? RED : 'var(--secondary)',
                      border: sel ? 'none' : '1.5px solid var(--border)',
                    }}>
                    {sel && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                  {/* Name + duration */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm leading-tight">{svc.name}</p>
                    {svc.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{svc.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />{svc.duration_minutes} min
                    </div>
                  </div>
                  {/* Price */}
                  <p className="font-black text-sm flex-shrink-0"
                    style={{ color: sel ? RED : 'var(--foreground)' }}>
                    €{(svc.price || 0).toFixed(2)}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── CTA fixo ── */}
      <AnimatePresence>
        {hasSelected && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3"
            style={{ background: 'linear-gradient(to top, var(--background) 80%, transparent)' }}
          >
            <button
              onClick={onNext}
              className="w-full py-4 rounded-2xl font-black text-white text-sm flex items-center justify-between px-5"
              style={{ background: RED, boxShadow: '0 8px 24px rgba(200,16,46,0.35)' }}
            >
              <span>
                {selected.length} serviço{selected.length > 1 ? 's' : ''} · {totalDuration} min
              </span>
              <span className="flex items-center gap-1.5">
                €{total.toFixed(2)}
                <ChevronRight className="w-5 h-5" />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Award } from 'lucide-react';

const FLAG_MAP = {
  pt: '🇵🇹', en: '🇬🇧', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹',
  br: '🇧🇷', nl: '🇳🇱', ru: '🇷🇺', zh: '🇨🇳', ar: '🇸🇦', uk: '🇺🇦',
};

export default function BarberSelector({ barbers, selected, onSelect }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Escolhe o teu barbeiro</h2>
        <p className="text-muted-foreground mt-2">Quem vai cuidar de ti hoje?</p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:mx-0 lg:px-0">
        {barbers.map((barber, i) => {
          const isSelected = selected?.id === barber.id;
          return (
            <motion.button
              key={barber.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelect(barber)}
              className={`snap-center flex-shrink-0 w-48 lg:w-full bg-card border rounded-2xl p-5 text-center transition-all duration-300 ${
                isSelected
                  ? 'border-primary gold-glow'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden bg-secondary">
                {barber.photo_url ? (
                  <img src={barber.photo_url} alt={barber.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                    {barber.name?.[0]}
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-foreground">{barber.name}</h3>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                <span className="text-sm text-foreground font-medium">{barber.rating?.toFixed(1) || '5.0'}</span>
                <span className="text-xs text-muted-foreground">({barber.rating_count || 0})</span>
              </div>
              <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground">
                <Award className="w-3 h-3" />
                {barber.years_experience || 0} anos exp.
              </div>
              {barber.languages?.length > 0 && (
                <div className="flex justify-center gap-1 mt-2">
                  {barber.languages.map(lang => (
                    <span key={lang} className="text-sm">{FLAG_MAP[lang] || lang}</span>
                  ))}
                </div>
              )}
              {barber.specialties?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {barber.specialties.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
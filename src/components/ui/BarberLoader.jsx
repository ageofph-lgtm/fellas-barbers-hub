import React from "react";
import { motion } from "framer-motion";

const RED = "#C8102E";

/**
 * BarberLoader — loading screen unificado para toda a app Fellas Barbers.
 * Props:
 *   size: "sm" | "md" | "lg" (default "md")
 *   fullscreen: bool (default false) — envolve em min-h-screen
 *   label: string opcional
 */
export default function BarberLoader({ size = "md", fullscreen = false, label }) {
  const dims = { sm: 28, md: 44, lg: 60 }[size] || 44;
  const stroke = { sm: 1.5, md: 2, lg: 2.5 }[size] || 2;

  const loader = (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* Scissors SVG animado */}
      <motion.div
        animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: dims, height: dims }}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
          width={dims} height={dims}>
          {/* Lâmina superior */}
          <motion.line
            x1="6" y1="6" x2="21" y2="19"
            stroke={RED} strokeWidth={stroke} strokeLinecap="round"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Lâmina inferior */}
          <motion.line
            x1="6" y1="18" x2="21" y2="5"
            stroke={RED} strokeWidth={stroke} strokeLinecap="round"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Parafuso central */}
          <circle cx="12" cy="12" r="1.5" fill={RED} />
          {/* Olhal superior */}
          <circle cx="5.5" cy="5.5" r="2" stroke={RED} strokeWidth={stroke} fill="none" />
          {/* Olhal inferior */}
          <circle cx="5.5" cy="18.5" r="2" stroke={RED} strokeWidth={stroke} fill="none" />
        </svg>
      </motion.div>

      {label && (
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="text-xs font-semibold text-muted-foreground"
        >
          {label}
        </motion.p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {loader}
      </div>
    );
  }

  return loader;
}

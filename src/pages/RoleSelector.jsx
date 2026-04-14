import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scissors, Briefcase, User } from 'lucide-react';

const roles = [
  {
    id: 'client',
    label: 'Cliente',
    description: 'Agendar um corte ou serviço',
    icon: User,
    path: '/booking',
    color: 'from-zinc-700 to-zinc-800',
    border: 'border-zinc-600 hover:border-zinc-400',
    badge: null,
  },
  {
    id: 'barber',
    label: 'Barbeiro',
    description: 'Ver agenda e comissões',
    icon: Scissors,
    path: '/barber',
    color: 'from-amber-900/40 to-zinc-900',
    border: 'border-amber-700/50 hover:border-amber-500',
    badge: null,
  },
  {
    id: 'admin',
    label: 'Administrador',
    description: 'Gestão completa da barbearia',
    icon: Briefcase,
    path: '/admin',
    color: 'from-yellow-900/30 to-zinc-900',
    border: 'border-yellow-600/40 hover:border-yellow-400',
    badge: 'Acesso restrito',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

export default function RoleSelector() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleSelect = (role) => {
    setSelected(role.id);
    setTimeout(() => navigate(role.path), 280);
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
            <Scissors className="w-6 h-6 text-[#C9A84C]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-widest text-white">FELLAS</h1>
            <p className="text-[10px] font-bold tracking-[0.35em] text-[#C9A84C] uppercase">Barbers</p>
          </div>
        </div>
        <p className="text-zinc-500 text-sm mt-4">Seleciona o teu perfil para continuar</p>
      </motion.div>

      {/* Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-sm flex flex-col gap-4"
      >
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selected === role.id;

          return (
            <motion.button
              key={role.id}
              variants={cardVariants}
              onClick={() => handleSelect(role)}
              whileTap={{ scale: 0.97 }}
              className={`
                relative w-full text-left rounded-2xl border p-5
                bg-gradient-to-br ${role.color} ${role.border}
                transition-all duration-200 outline-none
                ${isSelected ? 'ring-2 ring-[#C9A84C] scale-[0.98]' : ''}
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  bg-black/30 border border-white/5
                `}>
                  <Icon className="w-6 h-6 text-[#C9A84C]" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-base">{role.label}</span>
                    {role.badge && (
                      <span className="text-[10px] font-semibold text-[#C9A84C] border border-[#C9A84C]/40 rounded-full px-2 py-0.5 bg-[#C9A84C]/10">
                        {role.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm mt-0.5">{role.description}</p>
                </div>

                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  transition-all duration-200
                  ${isSelected ? 'border-[#C9A84C] bg-[#C9A84C]' : 'border-zinc-600'}
                `}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-black"
                    />
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-zinc-600 text-xs mt-10 text-center max-w-xs"
      >
        Acesso por convite para barbeiros e administradores. Em breve, login automático por email.
      </motion.p>
    </div>
  );
}

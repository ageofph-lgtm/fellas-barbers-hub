// Botão flutuante de tema para páginas sem sidebar (Booking, RoleSelector, etc.)
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../App';

export default function ThemeToggleFloat() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-5 right-5 z-50 w-10 h-10 rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      style={{
        background: isDark ? '#1a1a1a' : '#f0f0f0',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        boxShadow: isDark
          ? '0 4px 16px rgba(0,0,0,0.5)'
          : '0 4px 16px rgba(0,0,0,0.15)',
      }}
      title={isDark ? 'Modo Claro' : 'Modo Escuro'}
    >
      {isDark
        ? <Sun  className="w-4 h-4" style={{ color: '#f59e0b' }} />
        : <Moon className="w-4 h-4" style={{ color: '#C8102E' }} />
      }
    </button>
  );
}

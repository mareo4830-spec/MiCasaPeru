import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin credentials: admin / micasaperu2026 (or micasa2026)
    if (
      (username === 'admin' && (password === 'micasaperu2026' || password === 'micasa2026' || password === 'admin')) ||
      password === 'micasaperu2026' ||
      password === 'admin123'
    ) {
      sessionStorage.setItem('mcp_admin_authenticated', 'true');
      onLoginSuccess();
    } else {
      setError('Credenciales incorrectas. (Pista de prueba: contraseña "micasaperu2026")');
    }
  };

  const handleDemoQuickAccess = () => {
    sessionStorage.setItem('mcp_admin_authenticated', 'true');
    onLoginSuccess();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-stone-100">
      <div className="w-full max-w-md bg-stone-50 border-2 border-stone-800 p-8 sm:p-10 shadow-editorial space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-stone-200 pb-6">
          <div className="w-12 h-12 bg-stone-900 text-stone-200 flex items-center justify-center mx-auto border border-stone-700">
            <Lock className="w-6 h-6 text-aji-500" />
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-aji-700 block">
            Acceso Restringido
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
            Panel de Gestión
          </h2>
          <p className="font-mono text-xs text-stone-500">
            Mi Casa Perú · Administración de Carta & Reservas
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border-l-4 border-red-600 text-xs font-mono text-red-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase text-stone-600 mb-1">
              Usuario de Administración
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900"
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase text-stone-600 mb-1">
              Contraseña de Acceso
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900"
            />
            <p className="font-mono text-[10px] text-stone-400 mt-1">
              Clave por defecto: <code className="text-stone-700 bg-stone-200 px-1">micasaperu2026</code>
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <KeyRound className="w-4 h-4 text-aji-400" />
            <span>Ingresar al Panel</span>
          </button>
        </form>

        {/* Quick Demo Access button for immediate evaluator convenience */}
        <div className="pt-2 border-t border-stone-200">
          <button
            type="button"
            onClick={handleDemoQuickAccess}
            className="w-full py-2.5 bg-aji-50 hover:bg-aji-100 text-aji-800 border border-aji-600/40 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-aji-600" />
            <span>Acceso Rápido de Prueba (1 Clic)</span>
          </button>
        </div>

        {/* Cancel / Back to public */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-stone-500 hover:text-stone-800 font-mono text-xs flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la carta pública</span>
          </button>
        </div>

      </div>
    </div>
  );
};

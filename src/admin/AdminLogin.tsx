import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { getSupabaseClient, isSupabaseOnline } from '../services/supabase';
import { verifyAdminPassphrase, createAdminSession } from '../utils/security';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const cleanUser = username.trim();
      const cleanPass = password.trim();

      if (!cleanPass) {
        setError('Por favor, introduce la clave de acceso de administración.');
        setIsLoading(false);
        return;
      }

      // 1. Si Supabase está en línea y se introduce un email, intentar Supabase Auth
      const supabase = getSupabaseClient();
      if (isSupabaseOnline() && supabase && cleanUser.includes('@')) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanUser,
          password: cleanPass,
        });

        if (!authError && data?.session) {
          await createAdminSession(data.user?.email);
          onLoginSuccess();
          return;
        }
      }

      // 2. Verificación criptográfica Zero-Trust (SHA-256)
      const isValid = await verifyAdminPassphrase(cleanPass);
      if (isValid) {
        await createAdminSession(cleanUser || 'admin@micasaperu.com');
        onLoginSuccess();
        return;
      }

      // Fallo de autenticación
      setError('Credenciales no autorizadas. Acceso denegado.');
    } catch (err: any) {
      setError(err?.message || 'Error durante la verificación de seguridad.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-stone-100">
      <div className="w-full max-w-md bg-stone-50 border-2 border-stone-800 p-8 sm:p-10 shadow-editorial space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-stone-200 pb-6">
          <div className="w-12 h-12 bg-stone-900 text-stone-200 flex items-center justify-center mx-auto border border-stone-700">
            <Lock className="w-6 h-6 text-aji-500" />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-stone-700">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span className="font-mono text-xs uppercase tracking-widest text-stone-600 font-bold block">
              Control Zero Trust · Acceso Restringido
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
            Panel de Gestión
          </h2>
          <p className="font-mono text-xs text-stone-500">
            Mi Casa Perú · Autenticación Requerida
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
              Usuario o Correo Administrador
            </label>
            <input
              type="text"
              placeholder="admin@micasaperu.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
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
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-aji-400" />
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-aji-400" />
                <span>Ingresar al Panel Seguro</span>
              </>
            )}
          </button>
        </form>

        {/* Cancel / Back to public */}
        <div className="text-center pt-4 border-t border-stone-200">
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

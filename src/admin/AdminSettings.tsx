import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  RotateCcw, 
  RefreshCw,
  Copy,
  Check,
  ShieldAlert
} from 'lucide-react';
import { 
  updateAdminPassword, 
  resetAdminPasswordToDefault, 
  checkHasCustomPassword 
} from '../utils/security';

const ADMIN_CONFIG_SQL = `-- Ejecuta este script UNA SOLA VEZ en Supabase (SQL Editor) para habilitar el guardado para todos:
create table if not exists public.admin_config (
  key text primary key,
  value text not null,
  description text default '',
  updated_at timestamptz default timezone('utc'::text, now())
);

alter table public.admin_config enable row level security;

drop policy if exists "Lectura de config admin" on public.admin_config;
create policy "Lectura de config admin" 
  on public.admin_config for select 
  to anon, authenticated 
  using (true);

drop policy if exists "Modificación de config admin" on public.admin_config;
create policy "Modificación de config admin" 
  on public.admin_config for all 
  to anon, authenticated 
  using (true) 
  with check (true);`;

export const AdminSettings: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const [passwordStatus, setPasswordStatus] = useState<{
    hasCustom: boolean;
    source: 'supabase' | 'local' | 'default';
    updatedAt?: string;
  }>({ hasCustom: false, source: 'default' });

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    showSql?: boolean;
  } | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await checkHasCustomPassword();
      setPasswordStatus(status);
    } catch {
      // ignore
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const pass = newPassword.trim();
    if (pass.length < 6) {
      setFeedback({
        type: 'error',
        message: 'La contraseña debe contener al menos 6 caracteres por seguridad.',
      });
      return;
    }

    if (pass !== confirmPassword.trim()) {
      setFeedback({
        type: 'error',
        message: 'Las contraseñas no coinciden. Asegúrate de escribirlas idénticas en ambos campos.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await updateAdminPassword(pass);

      if (res.tableNeedsCreation) {
        setFeedback({
          type: 'warning',
          message: res.message,
          showSql: true,
        });
      } else if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message,
        });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setFeedback({
          type: 'error',
          message: res.message,
        });
      }

      await loadStatus();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Error inesperado al guardar la contraseña.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResetPassword = async () => {
    if (confirm('¿Restablecer la contraseña a la clave predeterminada inicial (micasaperu2026)?')) {
      const res = await resetAdminPasswordToDefault();
      setFeedback({
        type: 'success',
        message: res.message,
      });
      setNewPassword('');
      setConfirmPassword('');
      await loadStatus();
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(ADMIN_CONFIG_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      
      {/* Page Header */}
      <div className="border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-stone-900 text-amber-400 border border-stone-800">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
              Seguridad del Panel
            </h2>
            <p className="font-mono text-xs text-stone-500 mt-0.5">
              Gestiona la contraseña de acceso al panel de administración para todos los usuarios.
            </p>
          </div>
        </div>
      </div>

      {/* Main Password Card */}
      <div className="bg-white border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-100">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-stone-500 block">
              Estado de la Clave
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-1 font-mono text-xs font-bold uppercase border ${
                passwordStatus.source === 'supabase'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : passwordStatus.source === 'local'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-stone-100 text-stone-700 border-stone-300'
              }`}>
                {passwordStatus.source === 'supabase'
                  ? '● Sincronizada en la Nube (Activa para Todos)'
                  : passwordStatus.source === 'local'
                  ? '▲ Guardada en este Navegador'
                  : '○ Contraseña Inicial (micasaperu2026)'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetPassword}
            className="px-3 py-1.5 border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 font-mono text-xs flex items-center gap-1.5 self-start sm:self-auto transition-colors"
            title="Restablecer a micasaperu2026"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Restablecer a clave inicial</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 border font-mono text-xs space-y-3 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : feedback.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-sans text-xs">
                <p className="font-semibold">{feedback.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Form */}
        <form onSubmit={handleSavePassword} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-stone-700 mb-1.5 font-bold">
                Nueva Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Escribe al menos 6 caracteres..."
                  className="w-full bg-stone-50 border border-stone-300 px-3.5 py-2.5 text-base sm:text-sm text-stone-900 focus:outline-none focus:border-ink font-mono pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-stone-700 mb-1.5 font-bold">
                Confirmar Nueva Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la misma contraseña..."
                className="w-full bg-stone-50 border border-stone-300 px-3.5 py-2.5 text-base sm:text-sm text-stone-900 focus:outline-none focus:border-ink font-mono"
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-stone-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>Protegida con hash SHA-256 criptográfico</span>
            </span>

            <button
              type="submit"
              disabled={savingPassword || !newPassword.trim() || !confirmPassword.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors font-bold shadow-sm"
            >
              {savingPassword ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Guardar Contraseña Para Todos</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>

      {/* SQL Table Instruction Card (Always visible and accessible) */}
      <div className="bg-stone-900 text-stone-100 border border-stone-800 p-6 sm:p-7 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white">
                Código SQL para Supabase (Sincronización Global)
              </h3>
              <p className="font-mono text-[11px] text-stone-400 mt-0.5">
                Copia este código y pégalo en el <strong>SQL Editor</strong> de Supabase para habilitar que la clave se guarde para todos los dispositivos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={copySqlToClipboard}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0 shadow-sm"
          >
            {copiedSql ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4 text-stone-900" />}
            <span>{copiedSql ? '¡Código SQL Copiado!' : 'Copiar Código SQL'}</span>
          </button>
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs text-stone-300">
            <strong>Instrucciones rápidas:</strong>
            <span className="text-stone-400 ml-1">
              Entra a tu proyecto en <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">supabase.com</a> ➔ <strong>SQL Editor</strong> ➔ Pega el código de abajo y pulsa <strong>Run</strong>.
            </span>
          </p>
          <pre className="p-4 bg-stone-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-stone-800 leading-relaxed rounded">
            {ADMIN_CONFIG_SQL}
          </pre>
        </div>
      </div>

    </div>
  );
};

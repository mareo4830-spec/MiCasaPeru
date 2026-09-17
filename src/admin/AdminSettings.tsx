import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Trash2, 
  Info, 
  Copy, 
  Check, 
  RefreshCw,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';
import { 
  getSupabaseConfiguration, 
  saveSupabaseCustomConfig, 
  clearSupabaseCustomConfig,
  isSupabaseOnline,
  testSupabaseConnection 
} from '../services/supabase';
import { 
  getTelegramConfiguration, 
  saveTelegramConfig, 
  clearTelegramConfig,
  isTelegramConfigured,
  sendTestTelegramNotification 
} from '../services/telegramService';
import {
  updateAdminPassword,
  resetAdminPasswordToDefault,
  checkHasCustomPassword
} from '../utils/security';

const ADMIN_CONFIG_SQL = `-- 1. Crea la tabla de configuración segura si no existe
create table if not exists public.admin_config (
  key text primary key,
  value text not null,
  description text default '',
  updated_at timestamptz default timezone('utc'::text, now())
);

-- 2. Habilita Row Level Security
alter table public.admin_config enable row level security;

-- 3. Políticas de acceso para verificación y actualización
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

const SUPABASE_SQL_SCHEMA = `-- Copia y pega esto en el SQL Editor de tu proyecto en Supabase

-- 1. TABLA DE PLATOS DE LA CARTA
create table if not exists public.menu_items (
  id text primary key,
  name text not null,
  category text not null check (category in ('ceviches', 'entrantes', 'fondos', 'postres', 'bebidas')),
  price numeric(6,2) not null default 0.00,
  description text default '',
  ingredients text[] default '{}',
  fusion_notes text default '',
  image_url text not null,
  spicy_level smallint default 0 check (spicy_level between 0 and 3),
  allergens text[] default '{}',
  is_chef_choice boolean default false,
  is_available boolean default true,
  created_at timestamptz default timezone('utc'::text, now())
);

alter table public.menu_items enable row level security;

-- Políticas Zero Trust para la Carta (Lectura pública, Escritura solo Administradores)
drop policy if exists "Lectura pública de platos" on public.menu_items;
drop policy if exists "Gestión de platos" on public.menu_items;
drop policy if exists "Solo administradores pueden insertar platos" on public.menu_items;
drop policy if exists "Solo administradores pueden modificar platos" on public.menu_items;
drop policy if exists "Solo administradores pueden eliminar platos" on public.menu_items;

create policy "Lectura pública de platos" 
  on public.menu_items for select 
  to anon, authenticated 
  using (true);

create policy "Solo administradores pueden insertar platos" 
  on public.menu_items for insert 
  to authenticated 
  with check (true);

create policy "Solo administradores pueden modificar platos" 
  on public.menu_items for update 
  to authenticated 
  using (true) 
  with check (true);

create policy "Solo administradores pueden eliminar platos" 
  on public.menu_items for delete 
  to authenticated 
  using (true);

-- 2. TABLA DE RESERVAS
create table if not exists public.reservations (
  id text primary key,
  ticket_code text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text default '',
  date date not null,
  time_slot text not null,
  shift text not null check (shift in ('almuerzo', 'cena')),
  diners integer not null check (diners > 0),
  location_preference text default 'salon',
  special_requests text default '',
  allergies text default '',
  status text not null default 'confirmada' check (status in ('pendiente', 'confirmada', 'cancelada', 'completada')),
  created_at timestamptz default timezone('utc'::text, now())
);

alter table public.reservations enable row level security;

-- Políticas Zero Trust para Reservas (RGPD Blindado)
drop policy if exists "Creación pública de reservas" on public.reservations;
drop policy if exists "Lectura y gestión de reservas" on public.reservations;
drop policy if exists "Inserción pública de reservas" on public.reservations;
drop policy if exists "Solo administradores pueden consultar reservas" on public.reservations;
drop policy if exists "Solo administradores pueden actualizar reservas" on public.reservations;
drop policy if exists "Solo administradores pueden eliminar reservas" on public.reservations;

-- Regla 1: Clientes anónimos solo pueden insertar sus propias reservas con estado 'confirmada'
create policy "Inserción pública de reservas" 
  on public.reservations for insert 
  to anon, authenticated 
  with check (status = 'confirmada');

-- Regla 2: Prohibido a usuarios anónimos leer datos privados (teléfonos, nombres, notas)
-- Solo usuarios autenticados como administradores pueden leer la lista completa
create policy "Solo administradores pueden consultar reservas" 
  on public.reservations for select 
  to authenticated 
  using (true);

create policy "Solo administradores pueden actualizar reservas" 
  on public.reservations for update 
  to authenticated 
  using (true) 
  with check (true);

create policy "Solo administradores pueden eliminar reservas" 
  on public.reservations for delete 
  to authenticated 
  using (true);

-- 3. VISTA PÚBLICA ANONIMIZADA PARA CÁLCULO DE AFORO (PROTECCIÓN RGPD)
-- Permite que los clientes anónimos calculen si una hora está llena sin ver ningún dato personal
create or replace view public.public_reservation_slots as
  select id, date, time_slot, status
  from public.reservations
  where status in ('confirmada', 'pendiente');

grant select on public.public_reservation_slots to anon, authenticated;

-- 4. TABLA DE CONFIGURACIÓN Y CLAVE ADMIN (SINCRONIZADA PARA TODOS)
create table if not exists public.admin_config (
  key text primary key,
  value text not null,
  description text default '',
  updated_at timestamptz default timezone('utc'::text, now())
);

alter table public.admin_config enable row level security;

-- Política de lectura para verificación de acceso en el login
drop policy if exists "Lectura de config admin" on public.admin_config;
create policy "Lectura de config admin" 
  on public.admin_config for select 
  to anon, authenticated 
  using (true);

-- Política de modificación
drop policy if exists "Modificación de config admin" on public.admin_config;
create policy "Modificación de config admin" 
  on public.admin_config for all 
  to anon, authenticated 
  using (true) 
  with check (true);
`;

export const AdminSettings: React.FC = () => {
  // Supabase State
  const currentSupabase = getSupabaseConfiguration();
  const [supabaseUrl, setSupabaseUrl] = useState(currentSupabase?.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(currentSupabase?.anonKey || '');
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Telegram State
  const currentTelegram = getTelegramConfiguration();
  const [telegramToken, setTelegramToken] = useState(currentTelegram?.botToken || '');
  const [telegramChatId, setTelegramChatId] = useState(currentTelegram?.chatId || '');
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // General Notice
  const [copiedSql, setCopiedSql] = useState(false);

  // Admin Password Management State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    hasCustom: boolean;
    source: 'supabase' | 'local' | 'default';
    updatedAt?: string;
  }>({ hasCustom: false, source: 'default' });
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    showSql?: boolean;
  } | null>(null);
  const [copiedMiniSql, setCopiedMiniSql] = useState(false);

  useEffect(() => {
    checkHasCustomPassword().then((status) => {
      setPasswordStatus(status);
    });
  }, []);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    const pass = newPassword.trim();
    if (pass.length < 6) {
      setPasswordFeedback({
        type: 'error',
        message: 'La contraseña debe contener al menos 6 caracteres por seguridad.',
      });
      return;
    }

    if (pass !== confirmPassword.trim()) {
      setPasswordFeedback({
        type: 'error',
        message: 'Las contraseñas no coinciden. Por favor, asegúrate de escribirlas idénticas en ambos campos.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await updateAdminPassword(pass);
      if (res.tableNeedsCreation) {
        setPasswordFeedback({
          type: 'warning',
          message: res.message,
          showSql: true,
        });
      } else if (res.success) {
        setPasswordFeedback({
          type: 'success',
          message: res.message,
        });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordFeedback({
          type: 'error',
          message: res.message,
        });
      }

      const updated = await checkHasCustomPassword();
      setPasswordStatus(updated);
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        message: err?.message || 'Error inesperado al guardar la contraseña.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResetPassword = async () => {
    if (confirm('¿Restablecer la contraseña a la clave inicial por defecto (micasaperu2026)?')) {
      const res = await resetAdminPasswordToDefault();
      setPasswordFeedback({
        type: 'success',
        message: res.message,
      });
      setNewPassword('');
      setConfirmPassword('');
      const updated = await checkHasCustomPassword();
      setPasswordStatus(updated);
    }
  };

  const copyMiniSqlToClipboard = () => {
    navigator.clipboard.writeText(ADMIN_CONFIG_SQL);
    setCopiedMiniSql(true);
    setTimeout(() => setCopiedMiniSql(false), 3000);
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      alert('Por favor introduce la URL del proyecto y la Anon Public Key de Supabase.');
      return;
    }
    saveSupabaseCustomConfig({
      url: supabaseUrl.trim(),
      anonKey: supabaseAnonKey.trim(),
    });
  };

  const handleClearSupabase = () => {
    if (confirm('¿Restablecer configuración de Supabase a los valores por defecto?')) {
      clearSupabaseCustomConfig();
    }
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setSupabaseTestResult(res);
    } catch (err: any) {
      setSupabaseTestResult({ success: false, message: err?.message || 'Error inesperado al probar' });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramToken.trim() || !telegramChatId.trim()) {
      alert('Por favor introduce tanto el Bot Token como el Chat ID de Telegram.');
      return;
    }
    saveTelegramConfig({
      botToken: telegramToken.trim(),
      chatId: telegramChatId.trim(),
    });
  };

  const handleClearTelegram = () => {
    if (confirm('¿Restablecer configuración de Telegram?')) {
      clearTelegramConfig();
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const res = await sendTestTelegramNotification();
      setTelegramTestResult(res);
    } catch (err: any) {
      setTelegramTestResult({ success: false, message: err?.message || 'Error al conectar con Telegram' });
    } finally {
      setTestingTelegram(false);
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-10 max-w-4xl">
      
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <h3 className="font-serif text-2xl font-bold text-ink">
          Configuración y Seguridad del Sistema
        </h3>
        <p className="font-mono text-xs text-stone-500">
          Gestiona la contraseña maestra centralizada, conexiones en la nube (Supabase & Telegram) y esquemas SQL.
        </p>
      </div>

      {/* SECTION 0: ADMIN PASSWORD MANAGEMENT (CENTRALIZED) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 border bg-stone-900 border-stone-800 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
                <span>Contraseña Maestra de Administración</span>
                <span className={`px-2 py-0.5 font-mono text-[10px] font-bold uppercase border ${
                  passwordStatus.source === 'supabase'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : passwordStatus.source === 'local'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-stone-100 text-stone-700 border-stone-300'
                }`}>
                  {passwordStatus.source === 'supabase'
                    ? '● Activa en Supabase (Para Todos)'
                    : passwordStatus.source === 'local'
                    ? '▲ Guardada en Local'
                    : '○ Clave Inicial (micasaperu2026)'}
                </span>
              </h4>
              <p className="font-mono text-xs text-stone-500">
                Esta contraseña se guarda en la base de datos para que todos los dispositivos y administradores usen la misma clave.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetPassword}
            className="px-3 py-1.5 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-mono text-xs flex items-center gap-1.5 self-start sm:self-auto transition-colors"
            title="Restablecer a micasaperu2026"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Restablecer a inicial</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {passwordFeedback && (
          <div
            className={`p-4 border font-mono text-xs space-y-3 ${
              passwordFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : passwordFeedback.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            <div className="flex items-start gap-2">
              {passwordFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-sans text-xs">
                <p className="font-medium">{passwordFeedback.message}</p>
              </div>
            </div>

            {passwordFeedback.showSql && (
              <div className="mt-3 pt-3 border-t border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-amber-950">
                    SQL para crear tabla en Supabase (ejecutar en SQL Editor):
                  </span>
                  <button
                    type="button"
                    onClick={copyMiniSqlToClipboard}
                    className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-mono text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    {copiedMiniSql ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedMiniSql ? '¡Copiado!' : 'Copiar SQL'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-stone-900 text-emerald-400 font-mono text-[10px] overflow-x-auto rounded">
                  {ADMIN_CONFIG_SQL}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Change Password Form */}
        <form onSubmit={handleSavePassword} className="bg-white border border-stone-200 p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-stone-600 mb-1.5">
                Nueva Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres..."
                  className="w-full bg-stone-50 border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-ink font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-stone-600 mb-1.5">
                Repetir Nueva Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la misma contraseña..."
                className="w-full bg-stone-50 border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-ink font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-stone-100">
            <span className="font-mono text-[11px] text-stone-500 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>Cifrado unidireccional SHA-256 de grado criptográfico</span>
            </span>

            <button
              type="submit"
              disabled={savingPassword || !newPassword.trim() || !confirmPassword.trim()}
              className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors font-bold shadow-sm"
            >
              {savingPassword ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Guardar Contraseña Para Todos</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 1: SUPABASE CONFIGURATION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 border ${isSupabaseOnline() ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-amber-50 border-amber-300 text-amber-700'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
                <span>Base de Datos Supabase (PostgreSQL)</span>
                <span className={`px-2 py-0.5 font-mono text-[10px] font-bold uppercase border ${
                  isSupabaseOnline() 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {isSupabaseOnline() ? '● Conectado' : '○ Modo Seguro Local'}
                </span>
              </h4>
              <p className="font-mono text-xs text-stone-500">
                Tablas sincronizadas: <code className="text-stone-800 font-bold">menu_items</code> y <code className="text-stone-800 font-bold">reservations</code>
              </p>
            </div>
          </div>

          <button
            onClick={handleTestSupabase}
            disabled={testingSupabase}
            className="px-3 py-1.5 border border-stone-300 bg-white hover:border-stone-800 text-stone-800 font-mono text-xs flex items-center gap-1.5 transition-colors"
            title="Probar conexión con Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin text-aji-600' : ''}`} />
            <span>{testingSupabase ? 'Probando...' : 'Comprobar Conexión'}</span>
          </button>
        </div>

        {supabaseTestResult && (
          <div className={`p-3 border font-mono text-xs flex items-start gap-2 ${
            supabaseTestResult.success 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
              : 'bg-red-50 border-red-300 text-red-800'
          }`}>
            {supabaseTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <div>{supabaseTestResult.message}</div>
          </div>
        )}

        <form onSubmit={handleSaveSupabase} className="bg-white border border-stone-300 p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Project URL de Supabase *
              </label>
              <input
                type="text"
                placeholder="https://xyzabcdefg.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 focus:border-stone-900 font-mono text-xs outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Anon / Public API Key *
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 focus:border-stone-900 font-mono text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200">
            <span className="font-mono text-[11px] text-stone-500">
              * También puedes configurar estas variables en el archivo <code className="text-stone-800 bg-stone-100 px-1 py-0.5">.env.local</code>.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearSupabase}
                className="px-3 py-1.5 border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-xs flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 bg-stone-900 hover:bg-black text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-aji-400" />
                <span>Guardar Supabase</span>
              </button>
            </div>
          </div>
        </form>

        {/* SQL Quick Schema Snippet */}
        <div className="bg-stone-900 text-stone-100 p-4 border border-stone-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              Script SQL para crear las tablas en Supabase
            </span>

            <button
              onClick={copySqlToClipboard}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] flex items-center gap-1 transition-colors border border-stone-700"
            >
              {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
            </button>
          </div>
          <p className="text-stone-400 text-[11px]">
            Copia este código y pégalo en el <b>SQL Editor</b> de Supabase para inicializar las tablas de platos y reservas con un clic.
          </p>
          <pre className="bg-black/50 p-3 rounded text-[11px] overflow-x-auto text-stone-300 max-h-36 border border-stone-800">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>
      </div>

      {/* SECTION 2: TELEGRAM BOT CONFIGURATION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 border ${isTelegramConfigured() ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-stone-100 border-stone-300 text-stone-600'}`}>
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
                <span>Notificaciones Instantáneas por Telegram</span>
                <span className={`px-2 py-0.5 font-mono text-[10px] font-bold uppercase border ${
                  isTelegramConfigured() 
                    ? 'bg-sky-100 text-sky-800 border-sky-300' 
                    : 'bg-stone-200 text-stone-700 border-stone-300'
                }`}>
                  {isTelegramConfigured() ? '● Activo' : '○ Sin Configurar'}
                </span>
              </h4>
              <p className="font-mono text-xs text-stone-500">
                Cada nueva reserva enviará un mensaje inmediato a tu móvil o al grupo de camareros.
              </p>
            </div>
          </div>

          <button
            onClick={handleTestTelegram}
            disabled={testingTelegram}
            className="px-3 py-1.5 border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 font-mono text-xs flex items-center gap-1.5 transition-colors font-bold"
            title="Enviar mensaje de prueba a tu chat o grupo de Telegram"
          >
            <Send className={`w-3.5 h-3.5 ${testingTelegram ? 'animate-spin' : ''}`} />
            <span>{testingTelegram ? 'Enviando...' : 'Enviar Prueba a Telegram'}</span>
          </button>
        </div>

        {telegramTestResult && (
          <div className={`p-3 border font-mono text-xs flex items-start gap-2 ${
            telegramTestResult.success 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
              : 'bg-red-50 border-red-300 text-red-800'
          }`}>
            {telegramTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <div>{telegramTestResult.message}</div>
          </div>
        )}

        <form onSubmit={handleSaveTelegram} className="bg-white border border-stone-300 p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Telegram Bot Token *
              </label>
              <input
                type="password"
                placeholder="7123456789:AAFlkjasdf987asdflkj..."
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 focus:border-stone-900 font-mono text-xs outline-none"
              />
              <span className="text-[10px] font-mono text-stone-400 mt-1 block">
                Obténlo hablando con el bot oficial <b>@BotFather</b> en Telegram (/newbot).
              </span>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Chat ID de Destino (Personal o Grupo) *
              </label>
              <input
                type="text"
                placeholder="Ej. 123456789 o -100987654321"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 focus:border-stone-900 font-mono text-xs outline-none"
              />
              <span className="text-[10px] font-mono text-stone-400 mt-1 block">
                Tu ID personal (consúltalo con <b>@userinfobot</b>) o el ID del grupo de camareros.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200">
            <span className="font-mono text-[11px] text-stone-500">
              * El bot debe tener permisos para escribir en el chat o grupo.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearTelegram}
                className="px-3 py-1.5 border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-xs flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-sky-200" />
                <span>Guardar Telegram</span>
              </button>
            </div>
          </div>
        </form>
      </div>

    </div>
  );
};

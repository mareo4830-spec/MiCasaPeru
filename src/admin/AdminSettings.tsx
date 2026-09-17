import React, { useState } from 'react';
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
  RefreshCw 
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
          Conexiones en la Nube (Supabase & Telegram)
        </h3>
        <p className="font-mono text-xs text-stone-500">
          Gestiona la sincronización en tiempo real de productos y reservas, y las alertas al instante en Telegram.
        </p>
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

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfigStatus } from '../types';

const STORAGE_KEY = 'mcp_supabase_config';

export interface SupabaseCustomConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfiguration(): SupabaseCustomConfig | null {
  // 1. Try localStorage override first
  const localSaved = localStorage.getItem(STORAGE_KEY);
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (parsed?.url && parsed?.anonKey) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  // 2. Try Vite environment variables
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (
    envUrl && 
    envAnonKey && 
    !envUrl.includes('tu-proyecto') && 
    !envAnonKey.includes('tu-anon-key') &&
    envUrl.startsWith('http')
  ) {
    return {
      url: envUrl.trim(),
      anonKey: envAnonKey.trim(),
    };
  }

  return null;
}

let supabaseInstance: SupabaseClient | null = null;
let isConfigured = false;

const config = getSupabaseConfiguration();

if (config) {
  try {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    isConfigured = true;
  } catch (error) {
    console.warn('[Supabase] Error al inicializar cliente Supabase, usando modo local:', error);
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseInstance;
}

export function isSupabaseOnline(): boolean {
  return isConfigured && supabaseInstance !== null;
}

export function getSupabaseStatus(): SupabaseConfigStatus {
  return {
    isConfigured,
    url: config?.url,
    isFallback: !isConfigured,
  };
}

export function saveSupabaseCustomConfig(customConfig: SupabaseCustomConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customConfig));
  window.location.reload();
}

export function clearSupabaseCustomConfig() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

/**
 * Realiza un test rápido comprobando la conectividad con Supabase
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  if (!supabaseInstance) {
    return {
      success: false,
      message: 'Supabase no está configurado aún. Añade la URL y la Anon Key en Ajustes o en el archivo .env.local',
    };
  }

  try {
    const { error } = await supabaseInstance
      .from('menu_items')
      .select('id')
      .limit(1);

    if (error) {
      // If table does not exist, provide helpful message
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Conectado a Supabase, pero la tabla "menu_items" no existe todavía. Ejecuta el script SQL en Supabase.',
        };
      }
      return {
        success: false,
        message: `Error de Supabase: ${error.message}`,
      };
    }

    return {
      success: true,
      message: '¡Conexión exitosa con Supabase y las tablas de Mi Casa Perú!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Fallo de conexión de red con Supabase: ${err?.message || err}`,
    };
  }
}

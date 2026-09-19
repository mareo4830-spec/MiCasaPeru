import { getSupabaseClient, isSupabaseOnline } from './supabase';
import { MenuItem } from '../types';
import { INITIAL_MENU } from '../data/initialMenu';
import { sanitizeInput } from '../utils/security';

const TABLE_NAME = 'menu_items';
const LOCAL_STORAGE_KEY = 'mcp_menu_items_cache';

// Helper for local storage retrieval
function getLocalMenuItems(): MenuItem[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  // Initialize with initial menu
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MENU));
  return INITIAL_MENU;
}

function saveLocalMenuItems(items: MenuItem[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
}

// Convert Supabase row to MenuItem
function mapRowToMenuItem(row: any): MenuItem {
  return {
    id: String(row.id),
    name: row.name || '',
    category: row.category || 'fondos',
    price: Number(row.price) || 0,
    description: row.description || '',
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    fusionNotes: row.fusion_notes || '',
    imageUrl: row.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    spicyLevel: typeof row.spicy_level === 'number' ? (row.spicy_level as 0 | 1 | 2 | 3) : 0,
    allergens: Array.isArray(row.allergens) ? row.allergens : [],
    isChefChoice: Boolean(row.is_chef_choice),
    isAvailable: row.is_available !== false,
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

// Convert MenuItem to Supabase row format
function mapMenuItemToRow(item: Partial<MenuItem>) {
  const row: Record<string, any> = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.name !== undefined) row.name = item.name;
  if (item.category !== undefined) row.category = item.category;
  if (item.price !== undefined) row.price = item.price;
  if (item.description !== undefined) row.description = item.description;
  if (item.ingredients !== undefined) row.ingredients = item.ingredients;
  if (item.fusionNotes !== undefined) row.fusion_notes = item.fusionNotes;
  if (item.imageUrl !== undefined) row.image_url = item.imageUrl;
  if (item.spicyLevel !== undefined) row.spicy_level = item.spicyLevel;
  if (item.allergens !== undefined) row.allergens = item.allergens;
  if (item.isChefChoice !== undefined) row.is_chef_choice = item.isChefChoice;
  if (item.isAvailable !== undefined) row.is_available = item.isAvailable;
  return row;
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const supabase = getSupabaseClient();

  if (isSupabaseOnline() && supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('[Supabase] Error al consultar menu_items, usando almacenamiento local:', error.message);
        return getLocalMenuItems();
      }

      if (data && data.length > 0) {
        const items = data.map(mapRowToMenuItem);
        saveLocalMenuItems(items);
        return items;
      } else {
        // If Supabase table is empty, seed it with the authentic initial menu!
        console.info('[Supabase] Tabla menu_items vacía en Supabase, sembrando carta inicial...');
        await seedInitialMenu();
        return INITIAL_MENU;
      }
    } catch (err) {
      console.warn('[Supabase] Fallo de red al consultar menu_items, usando fallback local:', err);
      return getLocalMenuItems();
    }
  }

  return getLocalMenuItems();
}

function sanitizeImageUrl(url: string | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Validar si es una data URL segura de imagen
  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
    if (trimmed.length <= 2500000) {
      return trimmed;
    }
  }
  // Si es una URL http o https estándar
  if (/^https?:\/\/[^\s<>"']+$/i.test(trimmed)) {
    return sanitizeInput(trimmed, 2000);
  }
  return sanitizeInput(trimmed, 800);
}

export async function addMenuItem(newItem: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  const supabase = getSupabaseClient();
  const id = 'item-' + Date.now();
  const itemToStore: MenuItem = {
    ...newItem,
    id,
    name: sanitizeInput(newItem.name, 100),
    description: sanitizeInput(newItem.description || '', 500),
    fusionNotes: sanitizeInput(newItem.fusionNotes || '', 300),
    imageUrl: sanitizeImageUrl(newItem.imageUrl),
    ingredients: (newItem.ingredients || []).map((ing) => sanitizeInput(ing, 80)).filter(Boolean),
    allergens: (newItem.allergens || []).map((al) => sanitizeInput(al, 50)).filter(Boolean),
  };

  if (isSupabaseOnline() && supabase) {
    try {
      const rowData = {
        ...mapMenuItemToRow(itemToStore),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([rowData])
        .select()
        .single();

      if (error) {
        console.warn('[Supabase] Fallo al añadir plato en Supabase, guardando localmente:', error.message);
      } else if (data) {
        const created = mapRowToMenuItem(data);
        const local = getLocalMenuItems();
        saveLocalMenuItems([created, ...local]);
        return created;
      }
    } catch (err) {
      console.warn('[Supabase] Excepción al añadir plato en nube:', err);
    }
  }

  const local = getLocalMenuItems();
  const updated = [itemToStore, ...local];
  saveLocalMenuItems(updated);
  return itemToStore;
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
  const supabase = getSupabaseClient();

  const sanitizedUpdates: Partial<MenuItem> = { ...updates };
  if (updates.name !== undefined) sanitizedUpdates.name = sanitizeInput(updates.name, 100);
  if (updates.description !== undefined) sanitizedUpdates.description = sanitizeInput(updates.description, 500);
  if (updates.fusionNotes !== undefined) sanitizedUpdates.fusionNotes = sanitizeInput(updates.fusionNotes, 300);
  if (updates.imageUrl !== undefined) sanitizedUpdates.imageUrl = sanitizeImageUrl(updates.imageUrl);
  if (updates.ingredients !== undefined) {
    sanitizedUpdates.ingredients = updates.ingredients.map((ing) => sanitizeInput(ing, 80)).filter(Boolean);
  }
  if (updates.allergens !== undefined) {
    sanitizedUpdates.allergens = updates.allergens.map((al) => sanitizeInput(al, 50)).filter(Boolean);
  }

  if (isSupabaseOnline() && supabase) {
    try {
      const rowUpdates = mapMenuItemToRow(sanitizedUpdates);
      const { error } = await supabase
        .from(TABLE_NAME)
        .update(rowUpdates)
        .eq('id', id);

      if (error) {
        console.warn('[Supabase] Fallo al actualizar plato en Supabase:', error.message);
      }
    } catch (err) {
      console.warn('[Supabase] Excepción al actualizar plato en nube:', err);
    }
  }

  const local = getLocalMenuItems();
  const updated = local.map((item) => (item.id === id ? { ...item, ...sanitizedUpdates } : item));
  saveLocalMenuItems(updated);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  if (isSupabaseOnline() && supabase) {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('[Supabase] Fallo al eliminar plato en Supabase:', error.message);
      }
    } catch (err) {
      console.warn('[Supabase] Excepción al eliminar plato en nube:', err);
    }
  }

  const local = getLocalMenuItems();
  const filtered = local.filter((item) => item.id !== id);
  saveLocalMenuItems(filtered);
}

export async function seedInitialMenu(): Promise<MenuItem[]> {
  const supabase = getSupabaseClient();

  if (isSupabaseOnline() && supabase) {
    try {
      const rows = INITIAL_MENU.map((item) => ({
        ...mapMenuItemToRow(item),
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from(TABLE_NAME)
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        console.warn('[Supabase] Error al sembrar carta en Supabase:', error.message);
      } else {
        console.info('[Supabase] Carta fundacional sembrada exitosamente en Supabase.');
      }
    } catch (err) {
      console.warn('[Supabase] Excepción al sembrar carta en nube:', err);
    }
  }

  saveLocalMenuItems(INITIAL_MENU);
  return INITIAL_MENU;
}

/**
 * Suscripción en tiempo real a cambios en la carta (Supabase Realtime)
 */
export function subscribeToMenuChanges(onChange: () => void): (() => void) | null {
  const supabase = getSupabaseClient();
  if (!isSupabaseOnline() || !supabase) return null;

  try {
    const channel = supabase
      .channel('public:menu_items')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE_NAME },
        () => {
          console.info('[Supabase Realtime] Cambio detectado en carta, actualizando...');
          onChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] No se pudo inicializar canal de tiempo real:', err);
    return null;
  }
}

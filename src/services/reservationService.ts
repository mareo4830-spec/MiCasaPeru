import { getSupabaseClient, isSupabaseOnline } from './supabase';
import { sendTelegramReservationNotification } from './telegramService';
import { Reservation, ReservationStatus } from '../types';
import { 
  isSessionValid, 
  validateCustomerName, 
  validateCustomerPhone, 
  validateCustomerEmail, 
  validateNotes 
} from '../utils/security';

const TABLE_NAME = 'reservations';
const LOCAL_STORAGE_KEY = 'mcp_reservations_cache';

const SAMPLE_RESERVATIONS: Reservation[] = [
  {
    id: 'res-1',
    ticketCode: 'MCP-2026-9142',
    customerName: 'Alejandro Morales Serrano',
    customerPhone: '654 32 10 98',
    customerEmail: 'alejandro.morales@example.com',
    date: new Date().toISOString().split('T')[0], // Set to today so today's stats show it!
    timeSlot: '14:30',
    shift: 'almuerzo',
    diners: 4,
    locationPreference: 'salon',
    specialRequests: 'Mesa cerca del ventanal. Uno de los comensales es celíaco.',
    allergies: 'Gluten',
    status: 'confirmada',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'res-2',
    ticketCode: 'MCP-2026-4820',
    customerName: 'Carmen Ortiz Delgado',
    customerPhone: '612 98 76 54',
    customerEmail: 'carmen.ortiz@example.com',
    date: new Date().toISOString().split('T')[0], // Today dinner
    timeSlot: '21:00',
    shift: 'cena',
    diners: 2,
    locationPreference: 'terraza',
    specialRequests: 'Celebración de aniversario. Si es posible, preparar una copa de bienvenida con Pisco Sour.',
    allergies: 'Ninguna',
    status: 'confirmada',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'res-3',
    ticketCode: 'MCP-2026-3391',
    customerName: 'Mateo Rivas Benítez',
    customerPhone: '699 11 22 33',
    customerEmail: 'mateo.rivas@example.com',
    date: new Date().toISOString().split('T')[0], // Today lunch
    timeSlot: '14:00',
    shift: 'almuerzo',
    diners: 6,
    locationPreference: 'salon',
    specialRequests: 'Almuerzo de trabajo. Deseamos probar el lomo saltado ibérico y ceviche mixto.',
    allergies: 'Ninguna',
    status: 'pendiente',
    createdAt: new Date().toISOString(),
  }
];

function getLocalReservations(): Reservation[] {
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
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SAMPLE_RESERVATIONS));
  return SAMPLE_RESERVATIONS;
}

function saveLocalReservations(reservations: Reservation[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reservations));
}

export const MAX_TABLES_PER_WINDOW = 5;
export const WINDOW_DURATION_MINUTES = 90; // 1 hora y media
export const LUNCH_SLOTS = ['13:30', '14:00', '14:30', '15:00', '15:30'];
export const DINNER_SLOTS = ['20:30', '21:00', '21:30', '22:00', '22:30'];

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Comprueba si una fecha y hora ya han pasado respecto a la hora actual local
 */
export function isTimeSlotInPast(dateStr: string, timeStr: string): boolean {
  const today = getTodayDateString();
  if (dateStr < today) return true;
  if (dateStr > today) return false;

  // Si es hoy, comparar con la hora actual
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotMinutes = timeToMinutes(timeStr);
  return slotMinutes <= currentMinutes;
}

/**
 * Calcula cuántas mesas están reservadas en la franja de 1h y media (90 minutos)
 */
export function getTableOccupationCount(
  dateStr: string, 
  timeStr: string, 
  reservations: Reservation[]
): number {
  const targetMinutes = timeToMinutes(timeStr);

  return reservations.filter((r) => {
    if (r.date !== dateStr) return false;
    if (r.status === 'cancelada') return false;

    const resMinutes = timeToMinutes(r.timeSlot);
    // Hay solapamiento de mesas si la diferencia de inicio es menor a 90 minutos
    return Math.abs(resMinutes - targetMinutes) < WINDOW_DURATION_MINUTES;
  }).length;
}

/**
 * Devuelve el estado completo de disponibilidad de un slot
 */
export function getSlotAvailability(
  dateStr: string, 
  timeStr: string, 
  reservations: Reservation[]
): { 
  occupied: number; 
  max: number; 
  isFull: boolean; 
  isPast: boolean; 
  canBook: boolean; 
  remaining: number 
} {
  const isPast = isTimeSlotInPast(dateStr, timeStr);
  const occupied = getTableOccupationCount(dateStr, timeStr, reservations);
  const isFull = occupied >= MAX_TABLES_PER_WINDOW;
  const remaining = Math.max(0, MAX_TABLES_PER_WINDOW - occupied);
  const canBook = !isPast && !isFull;

  return {
    occupied,
    max: MAX_TABLES_PER_WINDOW,
    isFull,
    isPast,
    canBook,
    remaining,
  };
}

export function generateTicketCode(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `MCP-2026-${randomNum}`;
}

function mapRowToReservation(row: any): Reservation {
  return {
    id: String(row.id),
    ticketCode: row.ticket_code || `MCP-${String(row.id).substring(0, 4).toUpperCase()}`,
    customerName: row.customer_name || 'Cliente',
    customerPhone: row.customer_phone || '',
    customerEmail: row.customer_email || '',
    date: row.date || '',
    timeSlot: row.time_slot || '',
    shift: row.shift || 'almuerzo',
    diners: Number(row.diners) || 2,
    locationPreference: row.location_preference || 'indiferente',
    specialRequests: row.special_requests || '',
    allergies: row.allergies || '',
    status: row.status || 'pendiente',
    createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
  };
}

function mapReservationToRow(res: Partial<Reservation>) {
  const row: Record<string, any> = {};
  if (res.id !== undefined) row.id = res.id;
  if (res.ticketCode !== undefined) row.ticket_code = res.ticketCode;
  if (res.customerName !== undefined) row.customer_name = res.customerName;
  if (res.customerPhone !== undefined) row.customer_phone = res.customerPhone;
  if (res.customerEmail !== undefined) row.customer_email = res.customerEmail;
  if (res.date !== undefined) row.date = res.date;
  if (res.timeSlot !== undefined) row.time_slot = res.timeSlot;
  if (res.shift !== undefined) row.shift = res.shift;
  if (res.diners !== undefined) row.diners = res.diners;
  if (res.locationPreference !== undefined) row.location_preference = res.locationPreference;
  if (res.specialRequests !== undefined) row.special_requests = res.specialRequests;
  if (res.allergies !== undefined) row.allergies = res.allergies;
  if (res.status !== undefined) row.status = res.status;
  return row;
}

export async function fetchReservations(): Promise<Reservation[]> {
  const supabase = getSupabaseClient();
  const isAdmin = isSessionValid();

  if (isSupabaseOnline() && supabase) {
    try {
      if (isAdmin) {
        // Modo Administrador: consulta completa de reservas con credenciales autenticadas
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .order('date', { ascending: false })
          .order('time_slot', { ascending: true });

        if (!error && data && data.length > 0) {
          const reservations = data.map(mapRowToReservation);
          saveLocalReservations(reservations);
          return reservations;
        } else if (error) {
          console.warn('[Supabase] Error al consultar reservations (admin):', error.message);
        }
      } else {
        // Modo Público / Anónimo: Zero Trust RGPD.
        // Consulta la vista anonimizada public_reservation_slots para calcular el aforo sin exponer datos privados.
        const { data, error } = await supabase
          .from('public_reservation_slots')
          .select('id, date, time_slot, status');

        if (!error && data) {
          return data.map((row: any) => ({
            id: String(row.id),
            ticketCode: '***',
            customerName: 'Comensal Confirmado',
            customerPhone: '***',
            customerEmail: '',
            date: row.date,
            timeSlot: row.time_slot,
            shift: LUNCH_SLOTS.includes(row.time_slot) ? 'almuerzo' : 'cena',
            diners: 2,
            locationPreference: 'indiferente',
            specialRequests: '',
            allergies: '',
            status: row.status as ReservationStatus,
            createdAt: new Date().toISOString(),
          }));
        } else if (error) {
          // Si la vista aún no está creada, no podemos filtrar anónimamente de la tabla privada
          console.info('[Supabase] Vista public_reservation_slots no disponible o restringida por RLS.');
        }
      }
    } catch (err) {
      console.warn('[Supabase] Fallo de red al consultar reservas:', err);
    }
  }

  // Fallback local: Si es admin devuelve todo, si es anónimo devuelve los registros anonimizados
  const local = getLocalReservations();
  if (isAdmin) return local;

  return local.map((r) => ({
    ...r,
    ticketCode: '***',
    customerName: 'Comensal Confirmado',
    customerPhone: '***',
    customerEmail: '',
    specialRequests: '',
    allergies: '',
  }));
}

export async function createReservation(
  data: Omit<Reservation, 'id' | 'ticketCode' | 'createdAt' | 'status'>
): Promise<Reservation> {
  // 1. Sanitización y validación estricta de inputs (Zero Trust XSS & Injection Prevention)
  const nameVal = validateCustomerName(data.customerName);
  if (!nameVal.isValid) {
    throw new Error(nameVal.error || 'Nombre de cliente inválido.');
  }

  const phoneVal = validateCustomerPhone(data.customerPhone);
  if (!phoneVal.isValid) {
    throw new Error(phoneVal.error || 'Número de teléfono inválido.');
  }

  const emailVal = validateCustomerEmail(data.customerEmail);
  if (!emailVal.isValid) {
    throw new Error(emailVal.error || 'Correo electrónico no válido.');
  }

  const notesVal = validateNotes(data.specialRequests || '', 250);
  const allergiesVal = validateNotes(data.allergies || '', 200);

  // 2. Validar que la fecha y hora no hayan pasado
  if (isTimeSlotInPast(data.date, data.timeSlot)) {
    throw new Error('No es posible reservar en una fecha u hora que ya ha pasado.');
  }

  // 3. Validar aforo máximo de 5 mesas en ventana de 1 hora y media (90 min)
  const existingReservations = await fetchReservations();
  const occupiedTables = getTableOccupationCount(data.date, data.timeSlot, existingReservations);
  if (occupiedTables >= MAX_TABLES_PER_WINDOW) {
    throw new Error(
      `Aforo completo: Ya hay ${MAX_TABLES_PER_WINDOW} mesas reservadas para este tramo de hora y media. Por favor, selecciona otro horario o turno.`
    );
  }

  const supabase = getSupabaseClient();
  const ticketCode = generateTicketCode();
  const nowISO = new Date().toISOString();
  const id = 'res-' + Date.now();

  const sanitizedReservation: Reservation = {
    ...data,
    customerName: nameVal.sanitizedValue,
    customerPhone: phoneVal.sanitizedValue,
    customerEmail: emailVal.sanitizedValue,
    specialRequests: notesVal.sanitizedValue,
    allergies: allergiesVal.sanitizedValue,
    id,
    ticketCode,
    status: 'confirmada', // Auto-confirmada con localizador digital
    createdAt: nowISO,
  };

  // 4. Guardar en Supabase si está disponible
  if (isSupabaseOnline() && supabase) {
    try {
      const row = {
        ...mapReservationToRow(sanitizedReservation),
        created_at: nowISO,
      };

      const { data: insertedData, error } = await supabase
        .from(TABLE_NAME)
        .insert([row])
        .select()
        .single();

      if (error) {
        console.warn('[Supabase] Error al guardar reserva en Supabase:', error.message);
      } else if (insertedData) {
        sanitizedReservation.id = String(insertedData.id);
      }
    } catch (err) {
      console.warn('[Supabase] Excepción al guardar reserva en Supabase:', err);
    }
  }

  // 5. Persistir siempre en el caché local
  const local = getLocalReservations();
  const updated = [sanitizedReservation, ...local];
  saveLocalReservations(updated);

  // 6. Enviar notificación instantánea a Telegram (con datos desinfectados)
  sendTelegramReservationNotification(sanitizedReservation).catch((err) => {
    console.error('[Telegram] Fallo al enviar notificación en segundo plano:', err);
  });

  return sanitizedReservation;
}

export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
  const supabase = getSupabaseClient();

  if (isSupabaseOnline() && supabase) {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ status })
        .eq('id', id);

      if (error) {
        console.warn('[Supabase] Error al actualizar estado de reserva en Supabase:', error.message);
      }
    } catch (err) {
      console.warn('[Supabase] Excepción al actualizar estado:', err);
    }
  }

  const local = getLocalReservations();
  const updated = local.map((res) => (res.id === id ? { ...res, status } : res));
  saveLocalReservations(updated);
}

export async function deleteReservation(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  if (isSupabaseOnline() && supabase) {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('[Supabase] Error al eliminar reserva en Supabase:', error.message);
      }
    } catch (err) {
      console.warn('[Supabase] Excepción al eliminar reserva:', err);
    }
  }

  const local = getLocalReservations();
  const filtered = local.filter((res) => res.id !== id);
  saveLocalReservations(filtered);
}

/**
 * Suscripción en tiempo real a nuevas reservas y cambios de estado (Supabase Realtime)
 */
export function subscribeToReservationChanges(onChange: () => void): (() => void) | null {
  const supabase = getSupabaseClient();
  if (!isSupabaseOnline() || !supabase) return null;

  try {
    const channel = supabase
      .channel('public:reservations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE_NAME },
        () => {
          console.info('[Supabase Realtime] Cambio detectado en reservas, actualizando...');
          onChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] No se pudo inicializar canal de reservas:', err);
    return null;
  }
}

export type DishCategory = 'todos' | 'ceviches' | 'entrantes' | 'fondos' | 'postres' | 'bebidas';

export interface MenuItem {
  id: string;
  name: string;
  category: 'ceviches' | 'entrantes' | 'fondos' | 'postres' | 'bebidas';
  price: number;
  description: string;
  ingredients?: string[];
  fusionNotes?: string;
  imageUrl: string;
  spicyLevel: 0 | 1 | 2 | 3; // 0 = sin picante, 1 = suave, 2 = medio (ají amarillo), 3 = intenso (rocoto)
  allergens: string[];
  isChefChoice: boolean;
  isAvailable: boolean;
  createdAt?: string;
}

export type ReservationStatus = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';

export interface Reservation {
  id: string;
  ticketCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  shift: 'almuerzo' | 'cena';
  diners: number;
  locationPreference: 'salon' | 'terraza' | 'indiferente';
  specialRequests?: string;
  allergies?: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface FirebaseConfigStatus {
  isConfigured: boolean;
  projectId?: string;
  isFallback: boolean;
}

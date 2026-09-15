import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  query
} from 'firebase/firestore';
import { getFirestoreInstance, isFirebaseOnline } from './firebase';
import { Reservation, ReservationStatus } from '../types';

const COLLECTION_NAME = 'reservations';
const LOCAL_STORAGE_KEY = 'mcp_reservations_cache';

const SAMPLE_RESERVATIONS: Reservation[] = [
  {
    id: 'res-1',
    ticketCode: 'MCP-2026-9142',
    customerName: 'Alejandro Morales Serrano',
    customerPhone: '654 32 10 98',
    customerEmail: 'alejandro.morales@example.com',
    date: '2026-09-16',
    timeSlot: '14:30',
    shift: 'almuerzo',
    diners: 4,
    locationPreference: 'salon',
    specialRequests: 'Mesa cerca del ventanal. Uno de los comensales es celíaco.',
    allergies: 'Gluten',
    status: 'confirmada',
    createdAt: '2026-09-14T18:30:00Z',
  },
  {
    id: 'res-2',
    ticketCode: 'MCP-2026-4820',
    customerName: 'Carmen Ortiz Delgado',
    customerPhone: '612 98 76 54',
    customerEmail: 'carmen.ortiz@example.com',
    date: '2026-09-16',
    timeSlot: '21:00',
    shift: 'cena',
    diners: 2,
    locationPreference: 'terraza',
    specialRequests: 'Celebración de aniversario. Si es posible, preparar una copa de bienvenida con Pisco Sour.',
    allergies: 'Ninguna',
    status: 'confirmada',
    createdAt: '2026-09-15T09:15:00Z',
  },
  {
    id: 'res-3',
    ticketCode: 'MCP-2026-3391',
    customerName: 'Mateo Rivas Benítez',
    customerPhone: '699 11 22 33',
    customerEmail: 'mateo.rivas@example.com',
    date: '2026-09-17',
    timeSlot: '14:00',
    shift: 'almuerzo',
    diners: 6,
    locationPreference: 'salon',
    specialRequests: 'Almuerzo de trabajo. Deseamos probar el lomo saltado ibérico y ceviche mixto.',
    allergies: 'Ninguna',
    status: 'pendiente',
    createdAt: '2026-09-15T11:40:00Z',
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

export function generateTicketCode(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `MCP-2026-${randomNum}`;
}

export async function fetchReservations(): Promise<Reservation[]> {
  const db = getFirestoreInstance();

  if (isFirebaseOnline() && db) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const reservations: Reservation[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          reservations.push({
            id: docSnapshot.id,
            ticketCode: data.ticketCode || `MCP-${docSnapshot.id.substring(0, 4).toUpperCase()}`,
            customerName: data.customerName || 'Cliente',
            customerPhone: data.customerPhone || '',
            customerEmail: data.customerEmail || '',
            date: data.date || '',
            timeSlot: data.timeSlot || '',
            shift: data.shift || 'almuerzo',
            diners: Number(data.diners) || 2,
            locationPreference: data.locationPreference || 'indiferente',
            specialRequests: data.specialRequests || '',
            allergies: data.allergies || '',
            status: data.status || 'pendiente',
            createdAt: data.createdAt ? String(data.createdAt) : new Date().toISOString(),
          });
        });
        saveLocalReservations(reservations);
        return reservations;
      } else {
        // If Firestore collection has no items yet, fallback or seed sample
        return getLocalReservations();
      }
    } catch (err) {
      console.warn('[Firestore] Error al consultar reservas en la nube:', err);
      return getLocalReservations();
    }
  }

  return getLocalReservations();
}

export async function createReservation(
  data: Omit<Reservation, 'id' | 'ticketCode' | 'createdAt' | 'status'>
): Promise<Reservation> {
  const db = getFirestoreInstance();
  const ticketCode = generateTicketCode();
  const nowISO = new Date().toISOString();

  const newReservation: Reservation = {
    ...data,
    id: 'res-' + Date.now(),
    ticketCode,
    status: 'confirmada', // Auto confirm with ticket
    createdAt: nowISO,
  };

  if (isFirebaseOnline() && db) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const docRef = await addDoc(colRef, {
        ...newReservation,
        createdAt: serverTimestamp(),
      });
      newReservation.id = docRef.id;
    } catch (err) {
      console.warn('[Firestore] Error al guardar reserva en nube, persistiendo localmente:', err);
    }
  }

  const local = getLocalReservations();
  const updated = [newReservation, ...local];
  saveLocalReservations(updated);

  return newReservation;
}

export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
  const db = getFirestoreInstance();

  if (isFirebaseOnline() && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { status });
    } catch (err) {
      console.warn('[Firestore] Error al actualizar estado de reserva en nube:', err);
    }
  }

  const local = getLocalReservations();
  const updated = local.map((res) => (res.id === id ? { ...res, status } : res));
  saveLocalReservations(updated);
}

export async function deleteReservation(id: string): Promise<void> {
  const db = getFirestoreInstance();

  if (isFirebaseOnline() && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[Firestore] Error al eliminar reserva en nube:', err);
    }
  }

  const local = getLocalReservations();
  const filtered = local.filter((res) => res.id !== id);
  saveLocalReservations(filtered);
}

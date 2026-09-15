import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { getFirestoreInstance, isFirebaseOnline } from './firebase';
import { MenuItem } from '../types';
import { INITIAL_MENU } from '../data/initialMenu';

const COLLECTION_NAME = 'menuItems';
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

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const db = getFirestoreInstance();

  if (isFirebaseOnline() && db) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);

      if (!snapshot.empty) {
        const items: MenuItem[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          items.push({
            id: docSnapshot.id,
            name: data.name || '',
            category: data.category || 'fondos',
            price: Number(data.price) || 0,
            description: data.description || '',
            ingredients: data.ingredients || [],
            fusionNotes: data.fusionNotes || '',
            imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
            spicyLevel: typeof data.spicyLevel === 'number' ? (data.spicyLevel as 0 | 1 | 2 | 3) : 0,
            allergens: data.allergens || [],
            isChefChoice: Boolean(data.isChefChoice),
            isAvailable: data.isAvailable !== false,
            createdAt: data.createdAt ? String(data.createdAt) : undefined,
          });
        });
        saveLocalMenuItems(items);
        return items;
      } else {
        // If Firestore collection is empty, seed it with the authentic initial menu!
        console.info('[Firestore] Colección menuItems vacía, sembrando carta inicial...');
        await seedInitialMenu();
        return INITIAL_MENU;
      }
    } catch (err) {
      console.warn('[Firestore] Error al consultar menuItems en la nube, usando almacenamiento local:', err);
      return getLocalMenuItems();
    }
  }

  return getLocalMenuItems();
}

export async function addMenuItem(newItem: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  const db = getFirestoreInstance();
  const id = 'item-' + Date.now();
  const itemToStore: MenuItem = { ...newItem, id };

  if (isFirebaseOnline() && db) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const docRef = await addDoc(colRef, {
        ...newItem,
        createdAt: serverTimestamp(),
      });
      const createdItem: MenuItem = { ...newItem, id: docRef.id };
      
      // Update local cache
      const local = getLocalMenuItems();
      saveLocalMenuItems([createdItem, ...local]);
      return createdItem;
    } catch (err) {
      console.warn('[Firestore] Fallo al añadir plato en nube, guardando localmente:', err);
    }
  }

  const local = getLocalMenuItems();
  const updated = [itemToStore, ...local];
  saveLocalMenuItems(updated);
  return itemToStore;
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
  const db = getFirestoreInstance();

  if (isFirebaseOnline() && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { ...updates });
    } catch (err) {
      console.warn('[Firestore] Fallo al actualizar plato en nube:', err);
    }
  }

  const local = getLocalMenuItems();
  const updated = local.map((item) => (item.id === id ? { ...item, ...updates } : item));
  saveLocalMenuItems(updated);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const db = getFirestoreInstance();

  if (isFirebaseOnline() && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[Firestore] Fallo al eliminar plato en nube:', err);
    }
  }

  const local = getLocalMenuItems();
  const filtered = local.filter((item) => item.id !== id);
  saveLocalMenuItems(filtered);
}

export async function seedInitialMenu(): Promise<MenuItem[]> {
  const db = getFirestoreInstance();

  if (isFirebaseOnline() && db) {
    try {
      for (const item of INITIAL_MENU) {
        const docRef = doc(db, COLLECTION_NAME, item.id);
        await setDoc(docRef, {
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
          ingredients: item.ingredients || [],
          fusionNotes: item.fusionNotes || '',
          imageUrl: item.imageUrl,
          spicyLevel: item.spicyLevel,
          allergens: item.allergens,
          isChefChoice: item.isChefChoice,
          isAvailable: item.isAvailable,
          createdAt: new Date().toISOString(),
        });
      }
      console.info('[Firestore] Carta fundacional sembrada exitosamente en Firestore.');
    } catch (err) {
      console.warn('[Firestore] Error al sembrar carta en nube:', err);
    }
  }

  saveLocalMenuItems(INITIAL_MENU);
  return INITIAL_MENU;
}

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { FirebaseConfigStatus } from '../types';

// Helper to get configuration from environment or localStorage override
export function getFirebaseConfiguration() {
  const localSavedConfig = localStorage.getItem('mcp_firebase_config');
  if (localSavedConfig) {
    try {
      const parsed = JSON.parse(localSavedConfig);
      if (parsed && parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (envApiKey && envProjectId && envApiKey !== 'your-api-key' && envProjectId !== 'your-project-id') {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  return null;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let isConfigured = false;

const config = getFirebaseConfiguration();

if (config) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(config);
    db = getFirestore(app);
    isConfigured = true;
  } catch (error) {
    console.warn('[Firebase] Error al inicializar Firebase SDK, operando en modo local seguro:', error);
  }
}

export function getFirestoreInstance(): Firestore | null {
  return db;
}

export function isFirebaseOnline(): boolean {
  return isConfigured && db !== null;
}

export function getFirebaseStatus(): FirebaseConfigStatus {
  return {
    isConfigured,
    projectId: config?.projectId,
    isFallback: !isConfigured,
  };
}

export function saveFirebaseCustomConfig(customConfig: {
  apiKey: string;
  projectId: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}) {
  localStorage.setItem('mcp_firebase_config', JSON.stringify(customConfig));
  window.location.reload();
}

export function clearFirebaseCustomConfig() {
  localStorage.removeItem('mcp_firebase_config');
  window.location.reload();
}

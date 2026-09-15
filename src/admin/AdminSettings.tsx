import React, { useState } from 'react';
import { Database, ShieldCheck, CheckCircle2, AlertCircle, Save, Trash2, Key, Info } from 'lucide-react';
import { 
  getFirebaseStatus, 
  getFirebaseConfiguration, 
  saveFirebaseCustomConfig, 
  clearFirebaseCustomConfig,
  isFirebaseOnline 
} from '../services/firebase';

export const AdminSettings: React.FC = () => {
  const status = getFirebaseStatus();
  const currentConfig = getFirebaseConfiguration();

  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      alert('Por favor introduce al menos el API Key y el Project ID de Firebase.');
      return;
    }
    saveFirebaseCustomConfig({
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      appId: appId.trim(),
    });
  };

  const handleClear = () => {
    if (confirm('¿Restablecer configuración de Firebase a los valores por defecto?')) {
      clearFirebaseCustomConfig();
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <h3 className="font-serif text-2xl font-bold text-ink">
          Conexión Firebase Firestore
        </h3>
        <p className="font-mono text-xs text-stone-500">
          Estado y configuración de las colecciones <code className="text-stone-800">menuItems</code> y <code className="text-stone-800">reservations</code>.
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white border border-stone-300 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-none border ${isFirebaseOnline() ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-amber-50 border-amber-300 text-amber-700'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-lg font-bold text-ink">
                {isFirebaseOnline() ? 'Conectado a Cloud Firestore' : 'Modo Almacenamiento Local Seguro'}
              </h4>
              <p className="font-mono text-xs text-stone-500">
                {isFirebaseOnline() 
                  ? `Proyecto activo: ${status.projectId || 'Personalizado'}` 
                  : 'Operando con emulación reactiva en localStorage (sin caídas ni bloqueos).'}
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-1 font-mono text-[11px] font-bold uppercase border ${
            isFirebaseOnline() 
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}>
            {isFirebaseOnline() ? '● En Línea' : '○ Modo Local Seguro'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-200 font-mono text-xs">
          <div className="bg-stone-50 p-3 border border-stone-200 space-y-1">
            <span className="text-stone-400 uppercase text-[10px] block">Colección Carta</span>
            <span className="font-bold text-stone-800 text-sm">menuItems</span>
            <p className="text-stone-500 text-[11px]">Sincronización bidireccional de platos, precios, alérgenos y fotos.</p>
          </div>

          <div className="bg-stone-50 p-3 border border-stone-200 space-y-1">
            <span className="text-stone-400 uppercase text-[10px] block">Colección Reservas</span>
            <span className="font-bold text-stone-800 text-sm">reservations</span>
            <p className="text-stone-500 text-[11px]">Recepción de reservas web, comensales, turnos y localizadores.</p>
          </div>
        </div>
      </div>

      {/* Manual Configuration Form */}
      <div className="bg-stone-50 border border-stone-300 p-6 sm:p-8 space-y-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-aji-700 block mb-1">
            Credenciales de Proyecto
          </span>
          <h4 className="font-serif text-xl font-bold text-ink">
            Vincular tu Proyecto de Firebase Firestore
          </h4>
          <p className="font-sans text-xs text-stone-600 mt-1">
            Si deseas conectar directamente tu base de datos de producción de Firebase sin tocar código ni reiniciar el servidor, puedes ingresar los datos de tu consola de Firebase aquí:
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 font-sans text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono uppercase text-stone-600 mb-1">API Key *</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full p-2.5 bg-white border border-stone-300 text-sm font-mono focus:outline-none focus:border-stone-900"
              />
            </div>

            <div>
              <label className="block font-mono uppercase text-stone-600 mb-1">Project ID *</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="micasaperu-restaurante"
                className="w-full p-2.5 bg-white border border-stone-300 text-sm font-mono focus:outline-none focus:border-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono uppercase text-stone-600 mb-1">Auth Domain</label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="micasaperu.firebaseapp.com"
                className="w-full p-2.5 bg-white border border-stone-300 text-sm font-mono focus:outline-none focus:border-stone-900"
              />
            </div>

            <div>
              <label className="block font-mono uppercase text-stone-600 mb-1">App ID</label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef"
                className="w-full p-2.5 bg-white border border-stone-300 text-sm font-mono focus:outline-none focus:border-stone-900"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={handleClear}
              className="font-mono text-xs text-stone-500 hover:text-red-700 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar credenciales personalizadas</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm font-bold"
            >
              <Save className="w-3.5 h-3.5 text-aji-400" />
              <span>Guardar y Reconectar</span>
            </button>
          </div>
        </form>

        <div className="p-4 bg-stone-200/60 border border-stone-300 font-mono text-xs text-stone-600 space-y-1">
          <p className="font-bold text-stone-800 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-aji-600" />
            <span>Configuración mediante variables de entorno (.env)</span>
          </p>
          <p className="text-[11px]">
            También puedes crear un archivo <code className="text-stone-900 font-bold">.env.local</code> en la raíz del proyecto con las variables:
          </p>
          <pre className="bg-stone-900 text-stone-200 p-2.5 text-[10px] overflow-x-auto mt-1">
{`VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_AUTH_DOMAIN=tu_project_id.firebaseapp.com`}
          </pre>
        </div>
      </div>

    </div>
  );
};

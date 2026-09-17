import React, { useState, useEffect } from 'react';
import { Cookie, X, Check, Sliders, ShieldCheck } from 'lucide-react';
import { AppView } from '../App';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'mcp_cookie_consent_preferences';

interface CookieConsentProps {
  onNavigateLegal: (view: AppView) => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onNavigateLegal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  // Custom toggles
  const [allowAnalytics, setAllowAnalytics] = useState(false);
  const [allowMarketing, setAllowMarketing] = useState(false);

  useEffect(() => {
    // Check if user already took a decision
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Delay display slightly for smooth page entry
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed: CookiePreferences = JSON.parse(saved);
        setAllowAnalytics(Boolean(parsed.analytics));
        setAllowMarketing(Boolean(parsed.marketing));
      } catch {
        // ignore
      }
    }

    // Global listener so footer or legal page can re-open settings anytime
    const handleReopen = () => {
      setIsConfiguring(true);
      setIsOpen(true);
    };

    window.addEventListener('mcp-open-cookie-settings', handleReopen);
    return () => {
      window.removeEventListener('mcp-open-cookie-settings', handleReopen);
    };
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setIsOpen(false);
    setIsConfiguring(false);

    // Apply or clean cookies based on decision
    if (!prefs.analytics) {
      // Remove any analytics trackers if present
    }
  };

  const handleAcceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRejectNonEssential = () => {
    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSaveCustom = () => {
    savePreferences({
      necessary: true,
      analytics: allowAnalytics,
      marketing: allowMarketing,
      timestamp: new Date().toISOString(),
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Floating Minimalist Bottom Banner (Ultra Minimalista, solid dark, technical font) */}
      <div 
        role="dialog" 
        aria-label="Consentimiento de Cookies" 
        className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none animate-in fade-in slide-in-from-bottom duration-300"
      >
        <div className="max-w-5xl mx-auto bg-stone-950 text-stone-200 border border-stone-800 p-5 sm:p-6 shadow-2xl pointer-events-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            
            {/* Explanatory text */}
            <div className="space-y-1.5 max-w-2xl font-mono text-xs text-stone-300">
              <div className="flex items-center gap-2 text-stone-100 font-bold uppercase tracking-wider text-[11px]">
                <Cookie className="w-3.5 h-3.5 text-aji-400" />
                <span>Gestión de Cookies & Privacidad (RGPD / LSSI-CE)</span>
              </div>
              <p className="font-sans text-xs text-stone-400 leading-relaxed">
                Utilizamos cookies técnicas necesarias para el funcionamiento del libro de reservas y la carta digital. 
                Las analíticas nos ayudan a mejorar la velocidad y servicio gastronómico. Puedes consultar los detalles en nuestra{' '}
                <button
                  type="button"
                  onClick={() => onNavigateLegal('politica-cookies')}
                  className="underline hover:text-white text-stone-200 font-bold decoration-stone-500"
                >
                  Política de Cookies
                </button>.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-mono text-xs shrink-0">
              <button
                type="button"
                onClick={() => setIsConfiguring(true)}
                className="px-3 py-2 bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-white border border-stone-800 transition-colors flex items-center gap-1.5"
              >
                <Sliders className="w-3 h-3 text-stone-400" />
                <span>Configurar</span>
              </button>

              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-3.5 py-2 bg-stone-900 hover:bg-stone-850 text-stone-200 hover:text-white border border-stone-700 transition-colors"
              >
                <span>Rechazar no esenciales</span>
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-aji-600 hover:bg-aji-500 text-white font-bold border border-aji-500 uppercase tracking-wider transition-colors shadow-sm"
              >
                <span>Aceptar todas</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Modal Drawer */}
      {isConfiguring && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsConfiguring(false);
          }}
        >
          <div className="bg-white text-stone-900 max-w-xl w-full border border-stone-300 shadow-2xl p-6 sm:p-8 space-y-6 font-sans animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-aji-600" />
                <h3 className="font-serif text-xl font-bold text-ink">Preferencias de Privacidad</h3>
              </div>
              <button
                onClick={() => setIsConfiguring(false)}
                className="p-1 text-stone-400 hover:text-stone-900 font-mono text-sm"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              Personaliza qué tecnologías de almacenamiento permites en tu navegador. Puedes modificar esta elección en cualquier momento desde el pie de página de la web.
            </p>

            {/* Cookies Toggles */}
            <div className="space-y-4 font-mono text-xs">
              
              {/* Necessary */}
              <div className="p-3.5 bg-stone-50 border border-stone-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 uppercase tracking-wider">1. Cookies Técnicas & de Sesión</span>
                  <span className="text-[10px] uppercase font-bold text-stone-500 bg-stone-200 px-2 py-0.5">Siempre Activas</span>
                </div>
                <p className="font-sans text-xs text-stone-500">
                  Estrictamente necesarias para el libro de reservas, asignación de turnos y seguridad en el panel. No pueden desactivarse.
                </p>
              </div>

              {/* Analytics */}
              <div className="p-3.5 bg-white border border-stone-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 uppercase tracking-wider">2. Cookies Analíticas y Rendimiento</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowAnalytics}
                      onChange={(e) => setAllowAnalytics(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-aji-600"></div>
                  </label>
                </div>
                <p className="font-sans text-xs text-stone-500">
                  Nos permiten analizar de forma anónima las visitas para optimizar la velocidad y la oferta de platos de la carta.
                </p>
              </div>

              {/* Marketing */}
              <div className="p-3.5 bg-white border border-stone-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 uppercase tracking-wider">3. Preferencias y Personalización</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowMarketing}
                      onChange={(e) => setAllowMarketing(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-aji-600"></div>
                  </label>
                </div>
                <p className="font-sans text-xs text-stone-500">
                  Recuerdan tus preferencias de visualización y filtrado de alérgenos en futuras visitas.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200 font-mono text-xs">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="w-full sm:w-auto px-4 py-2 border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700 uppercase tracking-wider"
              >
                Rechazar Todo
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="w-full sm:w-auto px-4 py-2 border border-stone-900 bg-white hover:bg-stone-100 text-stone-900 font-bold uppercase tracking-wider"
                >
                  Guardar Selección
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto px-4 py-2 bg-stone-900 hover:bg-black text-white font-bold uppercase tracking-wider"
                >
                  Aceptar Todas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

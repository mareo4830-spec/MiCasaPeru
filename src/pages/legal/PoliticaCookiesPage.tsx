import React from 'react';
import { LegalLayout } from './LegalLayout';
import { AppView } from '../../App';
import { Settings } from 'lucide-react';

interface PoliticaCookiesPageProps {
  onNavigate: (view: AppView) => void;
  onOpenCookieSettings?: () => void;
}

export const PoliticaCookiesPage: React.FC<PoliticaCookiesPageProps> = ({
  onNavigate,
  onOpenCookieSettings,
}) => {
  const handleOpenConfig = () => {
    if (onOpenCookieSettings) {
      onOpenCookieSettings();
    } else {
      window.dispatchEvent(new CustomEvent('mcp-open-cookie-settings'));
    }
  };

  return (
    <LegalLayout
      title="Política de Cookies"
      subtitle="Información detallada sobre la tipología, finalidad y configuración de las cookies utilizadas en este sitio web conforme al art. 22.2 de la LSSI-CE y directrices de la AEPD."
      lastUpdated="Septiembre 2026"
      currentLegalView="politica-cookies"
      onNavigate={onNavigate}
    >
      <div className="bg-stone-100 border-l-4 border-aji-600 p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-ink text-base">Panel de Configuración de Consentimiento</h3>
          <p className="text-xs text-stone-600 font-sans">
            Puedes modificar o retirar tu consentimiento de cookies en cualquier momento.
          </p>
        </div>
        <button
          onClick={handleOpenConfig}
          className="px-4 py-2 bg-stone-900 hover:bg-black text-white font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Configurar Cookies Ahora</span>
        </button>
      </div>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          1. ¿Qué son las Cookies?
        </h2>
        <p>
          Una cookie es un pequeño archivo de texto que un sitio web descarga en tu navegador o dispositivo (ordenador, tablet o teléfono móvil) 
          al acceder a determinadas páginas. Las cookies permiten almacenar y recuperar información sobre los hábitos de navegación 
          de un usuario o de su equipo para optimizar el funcionamiento de la web, recordar preferencias y ofrecer una navegación segura.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          2. Tipología de Cookies que Utilizamos
        </h2>
        <p>
          En cumplimiento con las directrices de la Agencia Española de Protección de Datos (AEPD), te informamos de los tipos de cookies 
          y tecnologías de almacenamiento local que emplea esta web:
        </p>

        <div className="space-y-4 pt-2">
          <div className="border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-serif font-bold text-base text-ink">
                A) Cookies Técnicas y Estrictamente Necesarias (Exentas de consentimiento)
              </h3>
              <span className="px-2 py-0.5 bg-stone-100 text-stone-700 font-mono text-[10px] font-bold uppercase border border-stone-300">
                Siempre Activas
              </span>
            </div>
            <p className="text-sm text-stone-600 mb-3">
              Son indispensables para el correcto funcionamiento de la web, la navegación entre secciones, la gestión de sesiones del panel de control 
              y el almacenamiento temporal del estado de reservas o platos de la carta sin caídas de servicio.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border border-stone-200">
                <thead className="bg-stone-100 text-stone-700">
                  <tr>
                    <th className="p-2 border-b">Cookie / Almacenamiento</th>
                    <th className="p-2 border-b">Proveedor</th>
                    <th className="p-2 border-b">Finalidad</th>
                    <th className="p-2 border-b">Caducidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-600">
                  <tr>
                    <td className="p-2 font-bold">mcp_cookie_consent</td>
                    <td className="p-2">Propia</td>
                    <td className="p-2">Guarda las preferencias del usuario respecto a las cookies.</td>
                    <td className="p-2">12 meses</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold">mcp_menu_items_cache</td>
                    <td className="p-2">Propia</td>
                    <td className="p-2">Caché local seguro para navegación rápida en la carta.</td>
                    <td className="p-2">Persistente</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold">mcp_reservations_cache</td>
                    <td className="p-2">Propia</td>
                    <td className="p-2">Garantiza la visualización de tickets de reserva sin pérdidas.</td>
                    <td className="p-2">Persistente</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold">sb-*-auth-token</td>
                    <td className="p-2">Supabase</td>
                    <td className="p-2">Sesión segura autenticada para el panel de administración.</td>
                    <td className="p-2">Sesión</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-serif font-bold text-base text-ink">
                B) Cookies Analíticas y de Medición (Requieren consentimiento previo)
              </h3>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-mono text-[10px] font-bold uppercase border border-amber-300">
                Configurable
              </span>
            </div>
            <p className="text-sm text-stone-600 mb-3">
              Permiten cuantificar el número de usuarios que visitan la carta o el formulario de reservas para realizar la medición 
              y análisis estadístico del uso que hacen del servicio, permitiendo mejorar la oferta gastronómica y la velocidad de carga.
            </p>
            <p className="font-mono text-xs text-stone-500">
              * Proveedores analíticos: [GOOGLE_ANALYTICS / PLAUSIBLE / NINGUNO_ACTUALMENTE]. Solo se activan si el usuario pulsa «Aceptar todas» o las activa en el panel.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          3. Cómo Gestionar o Desactivar Cookies desde tu Navegador
        </h2>
        <p>
          Además de nuestro panel de configuración, puedes permitir, bloquear o eliminar las cookies instaladas en tu equipo 
          mediante la configuración de las opciones de tu navegador web:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-stone-700 text-sm font-mono">
          <li><strong>Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.</li>
          <li><strong>Mozilla Firefox:</strong> Opciones &gt; Privacidad y Seguridad &gt; Cookies y datos del sitio.</li>
          <li><strong>Apple Safari:</strong> Preferencias &gt; Privacidad &gt; Bloquear todas las cookies.</li>
          <li><strong>Microsoft Edge:</strong> Configuración &gt; Privacidad, búsqueda y servicios &gt; Borrar datos de navegación.</li>
        </ul>
      </section>
    </LegalLayout>
  );
};

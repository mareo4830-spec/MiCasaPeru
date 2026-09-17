import React from 'react';
import { ShieldCheck, ArrowUp, Phone, MapPin, Cookie, Scale } from 'lucide-react';
import { AppView } from '../App';

interface FooterProps {
  onNavigateAdmin: () => void;
  onNavigateLegal?: (view: AppView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateAdmin, onNavigateLegal }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLegalClick = (e: React.MouseEvent, view: AppView) => {
    e.preventDefault();
    if (onNavigateLegal) {
      onNavigateLegal(view);
    } else {
      window.location.hash = view;
    }
  };

  const handleOpenCookies = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('mcp-open-cookie-settings'));
  };

  return (
    <footer className="bg-stone-950 text-stone-300 font-sans border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        
        {/* Top Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-stone-800">
          
          {/* Brand Col (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-serif text-2xl font-bold text-white tracking-tight">
                Mi Casa Perú
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 bg-stone-900 border border-stone-700 text-aji-400">
                Fusión Huelva
              </span>
            </div>

            <p className="text-stone-400 text-xs sm:text-sm font-sans leading-relaxed max-w-sm">
              Restaurante de cocina fusión peruano-española. Uniendo la frescura del mar y dehesas de Huelva 
              con la técnica culinaria ancestral de los ajíes del Perú.
            </p>

            <div className="font-mono text-xs text-stone-400 space-y-1">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-aji-500" />
                <span>C. Isla Cristina 6, 21006 Huelva</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-aji-500" />
                <a href="tel:643567250" className="hover:text-white transition-colors">643 56 72 50</a>
              </p>
            </div>
          </div>

          {/* Service Links (3 cols) */}
          <div className="md:col-span-3 space-y-3 font-mono text-xs">
            <span className="text-stone-500 uppercase tracking-widest text-[10px] block">
              Carta & Servicios
            </span>
            <ul className="space-y-2 text-stone-300">
              <li><a href="#carta" className="hover:text-aji-400 transition-colors">Ceviches & Mar</a></li>
              <li><a href="#carta" className="hover:text-aji-400 transition-colors">Causas & Entrantes</a></li>
              <li><a href="#carta" className="hover:text-aji-400 transition-colors">Lomo Saltado & Fondos</a></li>
              <li><a href="#carta" className="hover:text-aji-400 transition-colors">Pisco Bar</a></li>
              <li><a href="#servicios" className="hover:text-aji-400 transition-colors">Salón & Terraza</a></li>
            </ul>
          </div>

          {/* Commitments & Policy (4 cols) */}
          <div className="md:col-span-4 space-y-3 font-mono text-xs">
            <span className="text-stone-500 uppercase tracking-widest text-[10px] block">
              Garantía Gastronómica
            </span>
            <p className="text-stone-400 text-xs font-sans leading-relaxed">
              Trabajamos con pescados salvajes sometidos a congelación previa reglamentaria para consumo seguro en crudo según normativa sanitaria europea (RD 1420/2006).
            </p>
            <div className="pt-2">
              <button
                onClick={scrollToTop}
                className="py-2 px-3 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
              >
                <ArrowUp className="w-3.5 h-3.5 text-aji-400" />
                <span>Volver al inicio</span>
              </button>
            </div>
          </div>

        </div>

        {/* Legal Links Bar (RGPD & LSSI-CE Compliance) */}
        <div className="py-6 border-b border-stone-800/80 flex flex-wrap items-center justify-between gap-y-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-stone-500">
            <Scale className="w-3.5 h-3.5 text-stone-400" />
            <span className="uppercase tracking-wider text-[11px]">Marco Legal (España / UE):</span>
          </div>
          
          <nav aria-label="Enlaces Legales" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-stone-400">
            <button
              onClick={(e) => handleLegalClick(e, 'aviso-legal')}
              className="hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Aviso Legal
            </button>
            <button
              onClick={(e) => handleLegalClick(e, 'politica-privacidad')}
              className="hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Política de Privacidad
            </button>
            <button
              onClick={(e) => handleLegalClick(e, 'politica-cookies')}
              className="hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Política de Cookies
            </button>
            <button
              onClick={(e) => handleLegalClick(e, 'terminos-condiciones')}
              className="hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Términos y Condiciones
            </button>
            <button
              onClick={handleOpenCookies}
              className="inline-flex items-center gap-1.5 text-stone-400 hover:text-amber-400 transition-colors border border-stone-800 px-2 py-0.5 bg-stone-900/60"
            >
              <Cookie className="w-3 h-3 text-amber-500" />
              <span>Configurar Cookies</span>
            </button>
          </nav>
        </div>

        {/* Bottom Bar with Admin access */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-stone-500">
          <div>
            © {new Date().getFullYear()} Mi Casa Perú · Huelva. Todos los derechos reservados.
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={onNavigateAdmin}
              className="text-stone-400 hover:text-aji-400 flex items-center gap-1 transition-colors border border-stone-800 px-2.5 py-1 bg-stone-900/50"
              title="Panel de administración de carta y reservas"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-aji-500" />
              <span>Panel Admin (/admin)</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};

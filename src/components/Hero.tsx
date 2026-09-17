import React from 'react';
import { ArrowDownRight, Sparkles, MapPin, Clock, Compass, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onNavigateReservas?: () => void;
  onNavigateCarta?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigateReservas, onNavigateCarta }) => {
  return (
    <section id="inicio" className="relative border-b border-stone-200 bg-grain overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 pb-16 lg:py-20">
        
        {/* Editorial Masthead layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left / Editorial Typography (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Stamp badge */}
            <div className="inline-flex items-center gap-2 border border-stone-300 bg-stone-100 px-3 py-1 font-mono text-xs uppercase tracking-widest text-stone-700">
              <span className="w-2 h-2 rounded-full bg-aji-600 animate-pulse"></span>
              <span>Huelva · C. Isla Cristina 6 · Fusión Peruano-Española</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-ink tracking-tight leading-[1.1]">
              Donde el fuego de los Andes besa el mar de Huelva.
            </h1>

            {/* Manifesto Paragraph */}
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl font-sans font-normal">
              Reinventamos la tradición criolla con el mejor género del litoral onubense. 
              Corvina salvaje en leche de tigre de ají limo, lomo saltado de presa ibérica de Jabugo 
              y causas coronadas con gamba blanca. Cocina honesta, sabores rotundos y memoria viva.
            </p>

            {/* Key Editorial Metrics / Stamps */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-y border-stone-200 py-4 font-mono text-xs text-stone-800">
              <div>
                <span className="text-stone-500 block text-[10px] uppercase tracking-wider">Ticket Medio</span>
                <span className="font-bold text-sm text-ink">10€ — 20€</span>
              </div>
              <div className="border-l border-stone-200 pl-4">
                <span className="text-stone-500 block text-[10px] uppercase tracking-wider">Servicio en Local</span>
                <span className="font-bold text-sm text-aji-700">Salón & Terraza</span>
              </div>
              <div className="border-l border-stone-200 pl-4">
                <span className="text-stone-500 block text-[10px] uppercase tracking-wider">Horario Diario</span>
                <span className="font-bold text-sm text-ink">13:30h — 23:30h</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#carta"
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById('carta');
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    window.history.pushState(null, '', '#carta');
                  } else if (onNavigateCarta) {
                    onNavigateCarta();
                  } else {
                    window.location.hash = '#carta';
                  }
                }}
                className="px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-2 group cursor-pointer"
              >
                <span>Descubrir la Carta</span>
                <ArrowDownRight className="w-4 h-4 text-aji-400 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
              </a>

              <a
                href="#reservas"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigateReservas) {
                    onNavigateReservas();
                  } else {
                    window.location.hash = '#reservas';
                  }
                }}
                className="px-6 py-3.5 border border-aji-600 bg-aji-50 hover:bg-aji-600 hover:text-white text-aji-800 text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <span>Reservar Mesa Online</span>
              </a>

              <a
                href="tel:643567250"
                className="text-xs font-mono uppercase text-stone-600 hover:text-ink tracking-wider underline underline-offset-4 ml-2"
              >
                O llama al 643 56 72 50
              </a>
            </div>

          </div>

          {/* Right / Asymmetric Visual Artifact (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="relative border border-stone-300 bg-stone-100 p-3 sm:p-4 shadow-editorial">
              
              {/* Image Frame */}
              <div className="relative overflow-hidden aspect-[4/5] bg-stone-200 border border-stone-300">
                <img
                  src="https://images.unsplash.com/photo-1535400255456-984241443b29?auto=format&fit=crop&w=1000&q=85"
                  alt="Ceviche Clásico Mi Casa con corvina salvaje y ají limo"
                  className="w-full h-full object-cover grayscale-[15%] contrast-[1.05] hover:grayscale-0 transition-all duration-700 hover:scale-105"
                  loading="eager"
                />
                <div className="absolute top-3 left-3 bg-stone-900/90 text-stone-200 text-[10px] font-mono uppercase px-2 py-1 tracking-widest border border-stone-700">
                  Plato Insignia · Ceviche Clásico
                </div>
                <div className="absolute bottom-3 right-3 bg-aji-600 text-white text-xs font-mono font-bold px-2.5 py-1 tracking-wider">
                  15,50 €
                </div>
              </div>

              {/* Editorial Quote integrated cleanly into the card flow */}
              <div className="mt-3 pt-3 border-t border-stone-200/80 bg-white/70 p-3 border border-stone-200">
                <p className="font-serif italic text-stone-800 text-xs sm:text-sm leading-snug">
                  "La pureza marina del litoral de Huelva unida al fuego milenario de los ajíes andinos."
                </p>
                <span className="font-mono text-[10px] uppercase tracking-widest text-aji-700 mt-1 block">
                  — Filosofía Culinaria · Mi Casa Perú
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

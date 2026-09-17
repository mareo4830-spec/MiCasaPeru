import React from 'react';
import { UtensilsCrossed, Sun, Wine, ArrowUpRight, Calendar, Sparkles } from 'lucide-react';

interface ServiceHighlightsProps {
  onNavigateReservas?: () => void;
}

export const ServiceHighlights: React.FC<ServiceHighlightsProps> = ({ onNavigateReservas }) => {
  return (
    <section id="servicios" className="border-b border-stone-200 bg-stone-100/70 py-16 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-stone-300 gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-aji-700 block mb-2">
              [ 01 · Servicio Exclusivo en Local ]
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
              La Experiencia en Mi Casa Perú
            </h2>
          </div>
          <p className="font-mono text-xs text-stone-600 uppercase tracking-wider max-w-md">
            Cocina viva y directa. No realizamos envíos a domicilio ni comida para llevar: 
            cada ceviche y salteado al wok se sirve al momento exacto en mesa.
          </p>
        </div>

        {/* 3 Editorial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: El Salón Principal */}
          <div className="bg-stone-50 border border-stone-300 p-8 flex flex-col justify-between hover:border-stone-800 transition-colors relative group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs text-stone-400 font-bold">ESPACIO / 01</span>
                <div className="p-3 bg-stone-200/70 text-stone-900 border border-stone-300">
                  <UtensilsCrossed className="w-5 h-5 text-aji-600" />
                </div>
              </div>

              <h3 className="font-serif text-2xl font-bold text-ink group-hover:text-aji-700 transition-colors">
                El Salón Principal
              </h3>

              <p className="text-stone-600 text-sm leading-relaxed font-sans">
                Ambiente íntimo, sobrio y acogedor en C. Isla Cristina 6. Vajilla de autor, 
                atención en mesa de ritmo pausado y la atmósfera perfecta para comidas familiares o de negocios.
              </p>

              <ul className="font-mono text-xs text-stone-600 space-y-1.5 pt-2 border-t border-stone-200">
                <li className="flex items-center gap-2">
                  <span className="text-aji-600">✓</span> Salón climatizado y confort acústico
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-aji-600">✓</span> Presentación de platos recién salidos del fuego
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-aji-600">✓</span> Reserva online con ticket digital inmediato
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-stone-200">
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
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2 transition-colors"
              >
                <span>Reservar en Salón</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-aji-400" />
              </a>
            </div>
          </div>

          {/* Card 2: Terraza Exterior */}
          <div className="bg-stone-50 border border-stone-300 p-8 flex flex-col justify-between hover:border-stone-800 transition-colors relative group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs text-stone-400 font-bold">ESPACIO / 02</span>
                <div className="p-3 bg-stone-200/70 text-stone-900 border border-stone-300">
                  <Sun className="w-5 h-5 text-aji-600" />
                </div>
              </div>

              <h3 className="font-serif text-2xl font-bold text-ink group-hover:text-aji-700 transition-colors">
                La Terraza Exterior
              </h3>

              <p className="text-stone-600 text-sm leading-relaxed font-sans">
                Disfruta de la suave brisa de Huelva en nuestra terraza al aire libre. 
                El entorno idóneo para acompañar unas causas de gamba blanca o un ceviche mixto con la luz natural del sur.
              </p>

              <ul className="font-mono text-xs text-stone-600 space-y-1.5 pt-2 border-t border-stone-200">
                <li className="flex items-center gap-2">
                  <span className="text-aji-600">✓</span> Mesas exteriores en calle tranquila
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-aji-600">✓</span> Disponible tanto en almuerzos como en cenas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-aji-600">✓</span> Opción preferente seleccionable al reservar
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-stone-200">
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
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2 transition-colors"
              >
                <span>Reservar en Terraza</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-aji-400" />
              </a>
            </div>
          </div>

          {/* Card 3: Coctelería Pisco Bar */}
          <div className="bg-stone-50 border border-stone-300 p-8 flex flex-col justify-between hover:border-stone-800 transition-colors relative group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs text-stone-400 font-bold">EXPERIENCIA / 03</span>
                <div className="p-3 bg-stone-200/70 text-stone-900 border border-stone-300">
                  <Wine className="w-5 h-5 text-aji-600" />
                </div>
              </div>

              <h3 className="font-serif text-2xl font-bold text-ink group-hover:text-aji-700 transition-colors">
                Coctelería & Pisco Bar
              </h3>

              <p className="text-stone-600 text-sm leading-relaxed font-sans">
                El maridaje emblemático que corona la experiencia en mesa. 
                Pisco Sours batidos en coctelera tradicional con lima fresca exprimida a mano y chilcanos refrescantes de maracuyá.
              </p>

              <ul className="font-mono text-xs text-stone-600 space-y-1.5 pt-2 border-t border-stone-200">
                <li className="flex items-center gap-2">
                  <span className="text-aji-600">✓</span> Pisco Quebranta 100% puro de uva
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-aji-600">✓</span> Cerveza peruana Cusqueña helada
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-aji-600">✓</span> Cócteles servidos directos a tu mesa
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-stone-200">
              <a
                href="#carta"
                className="w-full py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-900 font-mono text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2 transition-colors border border-stone-300 font-bold"
              >
                <span>Ver Coctelería en Carta</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-aji-600" />
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

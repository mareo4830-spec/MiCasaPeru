import React from 'react';
import { MapPin, Phone, Clock, MessageSquare, ExternalLink, Navigation } from 'lucide-react';

export const LocationContact: React.FC = () => {
  return (
    <section id="contacto" className="py-20 px-4 sm:px-8 border-b border-stone-200 bg-stone-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-aji-700 block mb-2">
            [ 05 · Dónde Encontrarnos ]
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-ink">
            Visítanos en Huelva Capital
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-3 font-sans">
            Calle Isla Cristina 6, 21006 Huelva. Fácil acceso, terraza exterior y ambiente íntimo para tus comidas o cenas.
          </p>
        </div>

        {/* Location & Map Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Details (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-stone-300 p-8 flex flex-col justify-between shadow-sm space-y-6">
            <div className="space-y-6">
              
              {/* Address item */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-stone-100 text-stone-800 border border-stone-200 shrink-0">
                  <MapPin className="w-5 h-5 text-aji-600" />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-stone-400 block tracking-wider">Dirección Postal</span>
                  <h4 className="font-serif text-lg font-bold text-ink">Calle Isla Cristina 6</h4>
                  <p className="text-stone-600 text-xs font-mono mt-0.5">21006 Huelva, Andalucía, España</p>
                </div>
              </div>

              {/* Telephone item */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-stone-100 text-stone-800 border border-stone-200 shrink-0">
                  <Phone className="w-5 h-5 text-aji-600" />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-stone-400 block tracking-wider">Teléfono de Contacto</span>
                  <a 
                    href="tel:643567250"
                    className="font-mono text-xl font-bold text-aji-700 hover:text-aji-800 transition-colors block"
                  >
                    643 56 72 50
                  </a>
                  <p className="text-stone-500 text-xs mt-0.5">Llamadas y WhatsApp para reservas y consultas</p>
                </div>
              </div>

              {/* Schedule item */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-stone-100 text-stone-800 border border-stone-200 shrink-0">
                  <Clock className="w-5 h-5 text-aji-600" />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-stone-400 block tracking-wider">Horario de Apertura</span>
                  <div className="font-mono text-xs text-stone-800 space-y-1 mt-1">
                    <p><span className="font-bold text-stone-900">Almuerzos:</span> 13:30h — 16:00h</p>
                    <p><span className="font-bold text-stone-900">Cenas:</span> 20:30h — 23:30h</p>
                    <p className="text-stone-500 text-[11px] pt-1">Abierto de martes a domingo (Lunes descanso semanal del equipo)</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Action Links */}
            <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row gap-3">
              <a
                href="https://maps.google.com/?q=Calle+Isla+Cristina+6+Huelva"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-aji-400" />
                <span>Cómo Llegar (GPS)</span>
              </a>

              <a
                href="https://wa.me/34643567250?text=Hola%20Mi%20Casa%20Per%C3%BA,%20tengo%20una%20consulta"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Escribir por WhatsApp</span>
              </a>
            </div>

          </div>

          {/* Interactive Map Visual (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-stone-300 p-4 shadow-sm flex flex-col justify-between">
            <div className="relative w-full h-[320px] sm:h-[380px] bg-stone-200 overflow-hidden border border-stone-300">
              <iframe
                title="Mapa de localización Mi Casa Perú Huelva"
                src="https://maps.google.com/maps?q=Calle%20Isla%20Cristina%206,%20Huelva&t=&z=16&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0 filter grayscale contrast-125 hover:filter-none transition-all duration-700"
                loading="lazy"
              />
              
              <div className="absolute top-4 left-4 bg-stone-950/90 text-white px-3 py-1.5 font-mono text-xs border border-stone-700 shadow-md flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-aji-400 shrink-0" />
                <span>C. Isla Cristina 6 · Huelva</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-stone-500 gap-2">
              <span>Zona residencial tranquila con zonas de aparcamiento libre.</span>
              <a
                href="https://maps.google.com/?q=Calle+Isla+Cristina+6+Huelva"
                target="_blank"
                rel="noopener noreferrer"
                className="text-aji-700 hover:text-aji-800 flex items-center gap-1 font-bold underline underline-offset-2"
              >
                <span>Ver en Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

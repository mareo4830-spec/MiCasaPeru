import React from 'react';
import { Compass, Flame, Droplets, Award } from 'lucide-react';

export const StoryFusion: React.FC = () => {
  return (
    <section id="fusion" className="py-20 px-4 sm:px-8 border-b border-stone-200 bg-stone-900 text-stone-100">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column (5 cols): Manifesto & Identity */}
          <div className="lg:col-span-5 space-y-6">
            <span className="font-mono text-xs uppercase tracking-widest text-aji-400 block">
              [ 04 · Manifiesto de Fusión ]
            </span>

            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              Dos tierras milenarias unidas por el fuego y el mar.
            </h2>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed font-sans">
              "Mi Casa Perú" nace en Huelva con un compromiso rotundo: no hacer cocina de imitación, 
              sino celebrar un diálogo genuino. Los ajíes andinos importados en su punto óptimo de maduración 
              encuentran su pareja perfecta en la lonja onubense y las dehesas de la sierra.
            </p>

            <div className="border-l-2 border-aji-500 pl-4 py-2 my-4">
              <blockquote className="font-serif italic text-lg sm:text-xl text-stone-200 leading-snug">
                "El rocoto tiene bravura, pero cuando toca la dulzura de una gamba blanca de Huelva recién capturada, se produce una armonía inolvidable."
              </blockquote>
              <span className="font-mono text-xs text-aji-400 mt-2 block uppercase tracking-wider">
                — Filosofía de Cocina Mi Casa Perú
              </span>
            </div>
          </div>

          {/* Right Column (7 cols): The 4 Pillars of Fusion */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Pillar 1 */}
            <div className="bg-stone-800/80 border border-stone-700 p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-aji-400 font-mono text-xs uppercase tracking-wider">
                <Droplets className="w-4 h-4" />
                <span>El Litoral Onubense</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-white">Gamba Blanca & Corvina</h3>
              <p className="text-stone-400 text-xs font-sans leading-relaxed">
                Seleccionamos diariamente piezas de corvina fresca y gamba de la costa de Huelva para que el corte y la emulsión de leche de tigre ocurran al instante de pedirlo.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-stone-800/80 border border-stone-700 p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-aji-400 font-mono text-xs uppercase tracking-wider">
                <Flame className="w-4 h-4" />
                <span>La Sierra de Huelva</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-white">Presa Ibérica de Bellota</h3>
              <p className="text-stone-400 text-xs font-sans leading-relaxed">
                El lomo saltado alcanza otra dimensión cuando la carne que entra al wok con pisco es presa de Jabugo, infiltrada y jugosa al punto exacto.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-stone-800/80 border border-stone-700 p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-aji-400 font-mono text-xs uppercase tracking-wider">
                <Compass className="w-4 h-4" />
                <span>El Alma de los Andes</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-white">Ajíes Nativos & Choclo</h3>
              <p className="text-stone-400 text-xs font-sans leading-relaxed">
                Ají amarillo para la causa y el ají de gallina, rocoto para la bravura del ceviche mixto, y maíz choclo de grano gigante traído de los valles sagrados.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-stone-800/80 border border-stone-700 p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-aji-400 font-mono text-xs uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>Pisco Quebranta Puro</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-white">Coctelería Artesanal</h3>
              <p className="text-stone-400 text-xs font-sans leading-relaxed">
                Nuestros Pisco Sours se preparan con lima natural exprimida a mano en el momento y pisco de uva quebranta 100%, logrando la corona de espuma perfecta.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

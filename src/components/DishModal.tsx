import React from 'react';
import { X, Flame, AlertCircle, Sparkles, Utensils } from 'lucide-react';
import { MenuItem } from '../types';

interface DishModalProps {
  dish: MenuItem | null;
  onClose: () => void;
  onBookTable: () => void;
}

export const DishModal: React.FC<DishModalProps> = ({ dish, onClose, onBookTable }) => {
  if (!dish) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-stone-50 border border-stone-300 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-stone-900/80 hover:bg-stone-900 text-stone-200 hover:text-white transition-colors border border-stone-700"
          aria-label="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-stone-200 border-b border-stone-300">
          <img
            src={dish.imageUrl}
            alt={dish.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-4 bg-stone-900/90 text-stone-200 text-xs font-mono uppercase px-2.5 py-1 border border-stone-700">
            Categoría: {dish.category}
          </div>
          {dish.isChefChoice && (
            <div className="absolute top-4 left-4 bg-aji-600 text-white text-xs font-mono uppercase px-2.5 py-1 font-bold">
              ★ Recomendación del Chef
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Title & Price */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-stone-200 pb-4">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
              {dish.name}
            </h3>
            <span className="font-mono text-2xl font-bold text-aji-700 shrink-0">
              {dish.price.toFixed(2).replace('.', ',')} €
            </span>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-stone-400 block">
              Descripción & Preparación
            </span>
            <p className="text-stone-700 text-base leading-relaxed font-sans">
              {dish.description}
            </p>
          </div>

          {/* Fusion Notes (Hallmark highlight) */}
          {dish.fusionNotes && (
            <div className="bg-stone-100 border-l-2 border-aji-600 p-4">
              <span className="font-mono text-xs uppercase tracking-wider text-aji-700 font-bold block mb-1">
                Fusión Perú · Huelva
              </span>
              <p className="text-stone-700 text-sm italic font-serif">
                "{dish.fusionNotes}"
              </p>
            </div>
          )}

          {/* Ingredients list */}
          {dish.ingredients && dish.ingredients.length > 0 && (
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-stone-400 block mb-2">
                Ingredientes Principales
              </span>
              <div className="flex flex-wrap gap-1.5">
                {dish.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="font-mono text-xs bg-stone-200/80 text-stone-800 px-2.5 py-1 border border-stone-300"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meta specs: Picante & Alérgenos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-200 font-mono text-xs">
            <div>
              <span className="text-stone-400 block uppercase text-[10px] tracking-wider mb-1">Nivel de Ají / Picante</span>
              <div className="flex items-center gap-1.5 text-stone-800">
                {dish.spicyLevel === 0 ? (
                  <span className="text-stone-500">Sin picante</span>
                ) : (
                  <div className="flex items-center gap-1 text-aji-600 font-bold">
                    {Array.from({ length: dish.spicyLevel }).map((_, i) => (
                      <Flame key={i} className="w-4 h-4 fill-aji-600" />
                    ))}
                    <span className="ml-1 text-xs">
                      {dish.spicyLevel === 1 ? 'Suave' : dish.spicyLevel === 2 ? 'Ají Amarillo (Medio)' : 'Rocoto (Intenso)'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <span className="text-stone-400 block uppercase text-[10px] tracking-wider mb-1">Alérgenos Declarados</span>
              <div className="flex flex-wrap gap-1">
                {dish.allergens && dish.allergens.length > 0 ? (
                  dish.allergens.map((alg, i) => (
                    <span key={i} className="px-2 py-0.5 bg-stone-200 text-stone-800 text-[11px] border border-stone-300">
                      {alg}
                    </span>
                  ))
                ) : (
                  <span className="text-stone-500">Sin alérgenos comunes declarados</span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-200">
            <button
              onClick={() => {
                onClose();
                onBookTable();
              }}
              className="w-full py-3 bg-aji-600 hover:bg-aji-700 text-white font-mono text-xs uppercase tracking-widest text-center transition-colors flex items-center justify-center gap-2 font-bold shadow-sm"
            >
              <Utensils className="w-4 h-4" />
              <span>Reservar Mesa para Degustar este Plato</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

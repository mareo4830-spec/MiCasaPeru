import React, { useState, useEffect } from 'react';
import { Search, Flame, Sparkles, RefreshCw, Filter, Utensils, Check } from 'lucide-react';
import { MenuItem, DishCategory } from '../types';
import { fetchMenuItems, subscribeToMenuChanges } from '../services/menuService';
import { DishModal } from './DishModal';

interface MenuSectionProps {
  onSelectDishForReservation?: (dishName: string) => void;
  onNavigateReservas?: () => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ onSelectDishForReservation, onNavigateReservas }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<DishCategory>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyChefChoice, setOnlyChefChoice] = useState(false);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const items = await fetchMenuItems();
      setMenuItems(items);
    } catch (err) {
      console.error('Error loading menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
    const unsubscribe = subscribeToMenuChanges(() => {
      loadMenu();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Category definitions with Spanish labels
  const categories: { key: DishCategory; label: string }[] = [
    { key: 'todos', label: 'Toda la Carta' },
    { key: 'ceviches', label: 'Ceviches & Mar' },
    { key: 'entrantes', label: 'Entrantes & Causas' },
    { key: 'fondos', label: 'Fondos & Brasas' },
    { key: 'postres', label: 'Postres Artesanales' },
    { key: 'bebidas', label: 'Pisco Bar & Bebidas' },
  ];

  // Filtering
  const filteredItems = menuItems.filter((item) => {
    // Availability
    if (!item.isAvailable) return false;

    // Category match
    if (activeCategory !== 'todos' && item.category !== activeCategory) {
      return false;
    }

    // Chef choice filter
    if (onlyChefChoice && !item.isChefChoice) {
      return false;
    }

    // Search query match in name, description, ingredients or fusionNotes
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inName = item.name.toLowerCase().includes(q);
      const inDesc = item.description.toLowerCase().includes(q);
      const inNotes = item.fusionNotes ? item.fusionNotes.toLowerCase().includes(q) : false;
      const inIngredients = item.ingredients?.some((ing) => ing.toLowerCase().includes(q)) ?? false;
      return inName || inDesc || inNotes || inIngredients;
    }

    return true;
  });

  return (
    <section id="carta" className="py-20 px-4 sm:px-8 border-b border-stone-200 bg-stone-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-stone-300 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs uppercase tracking-widest text-aji-700">
                [ 02 · Colección Gastronómica ]
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-ink">
              La Carta Fusión
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadMenu}
              disabled={loading}
              className="p-2.5 border border-stone-300 hover:border-stone-800 text-stone-600 hover:text-stone-900 bg-stone-100 transition-colors"
              title="Actualizar carta"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-aji-600' : ''}`} />
            </button>
            <div className="text-right">
              <span className="font-mono text-xs text-stone-500 block">Precios con IVA incluido</span>
              <span className="font-mono text-xs font-bold text-stone-800">Huelva · C. Isla Cristina 6</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar: Categories, Search, Chef Recommendation Toggle */}
        <div className="space-y-4 mb-10">
          
          {/* Categories Tab Bar */}
          <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-4">
            {categories.map((cat) => {
              const count = cat.key === 'todos' 
                ? menuItems.filter(i => i.isAvailable).length
                : menuItems.filter(i => i.category === cat.key && i.isAvailable).length;

              const isActive = activeCategory === cat.key;

              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3.5 py-2 font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 border ${
                    isActive
                      ? 'bg-stone-900 text-stone-50 border-stone-900'
                      : 'bg-stone-100/90 text-stone-700 border-stone-300 hover:border-stone-800'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 ${isActive ? 'bg-stone-800 text-stone-300' : 'bg-stone-200 text-stone-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search bar & Chef Recommendation Switch */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar por plato o ingrediente (gamba, corvina, rocoto, ibérico...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900 transition-colors placeholder:text-stone-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-stone-400 hover:text-stone-800"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Toggle: Chef's Choice */}
            <button
              onClick={() => setOnlyChefChoice(!onlyChefChoice)}
              className={`px-4 py-2 border font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                onlyChefChoice
                  ? 'border-aji-600 bg-aji-50 text-aji-800'
                  : 'border-stone-300 bg-white text-stone-600 hover:border-stone-500'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${onlyChefChoice ? 'text-aji-600' : 'text-stone-400'}`} />
              <span>Solo Selección del Chef</span>
              {onlyChefChoice && <Check className="w-3.5 h-3.5 text-aji-600" />}
            </button>
          </div>

        </div>

        {/* Dynamic Menu Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3 font-mono text-stone-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-aji-600" />
            <p className="text-xs uppercase tracking-widest">Consultando colección Firestore (menuItems)...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-stone-300 bg-stone-100/50 p-8 space-y-3">
            <Utensils className="w-8 h-8 text-stone-400 mx-auto" />
            <h4 className="font-serif text-lg font-bold text-stone-800">No se encontraron platos</h4>
            <p className="font-sans text-sm text-stone-500 max-w-sm mx-auto">
              No hay platos que coincidan con la búsqueda o filtro seleccionado.
            </p>
            <button
              onClick={() => {
                setActiveCategory('todos');
                setSearchQuery('');
                setOnlyChefChoice(false);
              }}
              className="mt-2 px-4 py-2 bg-stone-900 text-white font-mono text-xs uppercase tracking-wider"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                onClick={() => setSelectedDish(item)}
                className="bg-white border border-stone-300 hover:border-stone-900 transition-all duration-300 flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-editorial relative"
              >
                <div>
                  {/* Dish Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-stone-100 border-b border-stone-200">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    
                    {/* Category Stamp */}
                    <div className="absolute top-2.5 left-2.5 bg-stone-900/85 text-stone-200 text-[10px] font-mono uppercase px-2 py-0.5 tracking-wider">
                      {item.category}
                    </div>

                    {item.isChefChoice && (
                      <div className="absolute top-2.5 right-2.5 bg-aji-600 text-white text-[10px] font-mono uppercase px-2 py-0.5 font-bold">
                        ★ Chef
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6 space-y-3">
                    {/* Title and Price */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-serif text-xl font-bold text-ink group-hover:text-aji-700 transition-colors leading-snug">
                        {item.name}
                      </h3>
                      <span className="font-mono text-lg font-bold text-aji-700 shrink-0">
                        {item.price.toFixed(2).replace('.', ',')} €
                      </span>
                    </div>

                    {/* Short Description */}
                    <p className="text-stone-600 text-xs sm:text-sm font-sans line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Fusion Notes tag */}
                    {item.fusionNotes && (
                      <p className="font-serif italic text-xs text-stone-500 border-l border-aji-600/60 pl-2 line-clamp-1">
                        {item.fusionNotes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer: Spicy level, Allergens & Inspect button */}
                <div className="px-5 sm:px-6 py-3 border-t border-stone-100 bg-stone-50/70 flex items-center justify-between font-mono text-[11px] text-stone-600">
                  <div className="flex items-center gap-2">
                    {item.spicyLevel > 0 && (
                      <div className="flex items-center gap-0.5 text-aji-600" title={`Picante nivel ${item.spicyLevel}`}>
                        {Array.from({ length: item.spicyLevel }).map((_, i) => (
                          <Flame key={i} className="w-3.5 h-3.5 fill-aji-600" />
                        ))}
                      </div>
                    )}
                    {item.allergens && item.allergens.length > 0 && (
                      <span className="text-stone-400 text-[10px] truncate max-w-[120px]">
                        {item.allergens.join(', ')}
                      </span>
                    )}
                  </div>

                  <span className="text-aji-700 group-hover:translate-x-1 transition-transform text-xs font-bold">
                    Detalles →
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>

      {/* Dish Modal Dialog */}
      <DishModal
        dish={selectedDish}
        onClose={() => setSelectedDish(null)}
        onBookTable={() => {
          setSelectedDish(null);
          if (onNavigateReservas) {
            onNavigateReservas();
          } else {
            const resElement = document.getElementById('reservas');
            if (resElement) {
              resElement.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }}
      />
    </section>
  );
};

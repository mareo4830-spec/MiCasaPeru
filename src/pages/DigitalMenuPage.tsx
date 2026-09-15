import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Flame, 
  Sparkles, 
  RefreshCw, 
  Phone, 
  ExternalLink, 
  Info, 
  Utensils, 
  Check, 
  ChevronRight,
  HelpCircle,
  QrCode
} from 'lucide-react';
import { MenuItem, DishCategory } from '../types';
import { fetchMenuItems } from '../services/menuService';
import { isFirebaseOnline } from '../services/firebase';
import { DishModal } from '../components/DishModal';

interface DigitalMenuPageProps {
  onGoToFullWeb: () => void;
}

export const DigitalMenuPage: React.FC<DigitalMenuPageProps> = ({ onGoToFullWeb }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<DishCategory>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyChefChoice, setOnlyChefChoice] = useState(false);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [activeAllergenFilter, setActiveAllergenFilter] = useState<string>('todos');

  // Detect table number from URL params (e.g., /carta?mesa=3 or #carta-digital?mesa=3)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesaParam = params.get('mesa') || params.get('table');
    if (mesaParam) {
      setTableNumber(mesaParam);
    } else {
      // Also check hash query e.g. #carta?mesa=4
      const hash = window.location.hash;
      if (hash.includes('mesa=')) {
        const match = hash.match(/mesa=([^&]+)/);
        if (match && match[1]) {
          setTableNumber(match[1]);
        }
      }
    }
  }, []);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const data = await fetchMenuItems();
      setItems(data);
    } catch (err) {
      console.error('Error fetching menu items for NFC page:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const categories: { key: DishCategory; label: string }[] = [
    { key: 'todos', label: 'Toda la Carta' },
    { key: 'ceviches', label: 'Ceviches & Mar' },
    { key: 'entrantes', label: 'Entrantes & Causas' },
    { key: 'fondos', label: 'Fondos & Brasas' },
    { key: 'postres', label: 'Postres' },
    { key: 'bebidas', label: 'Pisco Bar' },
  ];

  // Common allergens for quick filter pills
  const commonAllergens = [
    { key: 'todos', label: 'Todos' },
    { key: 'Sin Gluten', label: 'Sin Gluten' },
    { key: 'Pescado', label: 'Pescado' },
    { key: 'Crustáceos', label: 'Gamba/Marisco' },
    { key: 'Lácteos', label: 'Lácteos' },
  ];

  const filteredItems = items.filter((item) => {
    if (!item.isAvailable) return false;

    if (activeCategory !== 'todos' && item.category !== activeCategory) {
      return false;
    }

    if (onlyChefChoice && !item.isChefChoice) {
      return false;
    }

    if (activeAllergenFilter !== 'todos') {
      if (activeAllergenFilter === 'Sin Gluten') {
        if (item.allergens?.includes('Gluten')) return false;
      } else {
        if (!item.allergens?.includes(activeAllergenFilter)) return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inName = item.name.toLowerCase().includes(q);
      const inDesc = item.description.toLowerCase().includes(q);
      const inIngredients = item.ingredients?.some((ing) => ing.toLowerCase().includes(q)) ?? false;
      const inNotes = item.fusionNotes ? item.fusionNotes.toLowerCase().includes(q) : false;
      return inName || inDesc || inIngredients || inNotes;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-aji-600 selection:text-white pb-24">
      
      {/* Top NFC Header */}
      <header className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
        
        {/* Table / Location micro-bar */}
        <div className="bg-stone-900 text-stone-300 font-mono text-[11px] px-4 py-1.5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-white uppercase tracking-wider">
              {tableNumber ? `MESA ${tableNumber}` : 'SERVICIO EN MESA'}
            </span>
            <span className="text-stone-500 hidden sm:inline">·</span>
            <span className="text-stone-400 hidden sm:inline">C. Isla Cristina 6, Huelva</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:643567250"
              className="text-aji-400 hover:text-white flex items-center gap-1 font-bold"
            >
              <Phone className="w-3 h-3" />
              <span>643 56 72 50</span>
            </a>
          </div>
        </div>

        {/* Main Branding Bar for Table Menu */}
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-black text-ink tracking-tight">
                Mi Casa Perú
              </h1>
              <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-aji-50 border border-aji-600/40 text-aji-700 font-bold">
                Carta Digital
              </span>
            </div>
            <p className="font-mono text-[10px] sm:text-[11px] text-stone-500 uppercase tracking-widest mt-0.5">
              Cocina Fusión Peruano-Española en Huelva
            </p>
          </div>

          {/* Quick Exit to Full Restaurant Web */}
          <button
            onClick={onGoToFullWeb}
            className="px-3 py-1.5 border border-stone-300 hover:border-stone-800 bg-stone-100 font-mono text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1 transition-colors"
            title="Ver la web completa con historia, fotos y reservas"
          >
            <span className="hidden sm:inline">Web Completa</span>
            <ExternalLink className="w-3.5 h-3.5 text-aji-600" />
          </button>
        </div>

        {/* Sticky Category Tabs for fast mobile scrolling */}
        <div className="max-w-4xl mx-auto px-4 pb-2.5 overflow-x-auto no-scrollbar flex gap-2 border-t border-stone-100 pt-2 font-mono text-xs">
          {categories.map((cat) => {
            const count = cat.key === 'todos'
              ? items.filter(i => i.isAvailable).length
              : items.filter(i => i.category === cat.key && i.isAvailable).length;

            const isActive = activeCategory === cat.key;

            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 shrink-0 border transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-stone-900 text-stone-50 border-stone-900 font-bold'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1 py-0.2 ${isActive ? 'bg-stone-800 text-stone-300' : 'bg-stone-200 text-stone-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Search & Allergen Toolbar */}
        <div className="bg-white border border-stone-300 p-4 shadow-sm space-y-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar plato, ingrediente o alérgeno (gamba, corvina, rocoto...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-300 text-xs sm:text-sm font-sans focus:outline-none focus:border-stone-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-stone-400 hover:text-stone-800"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Dietary Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-stone-400 uppercase text-[10px] shrink-0">Filtrar:</span>
              {commonAllergens.map((alg) => (
                <button
                  key={alg.key}
                  onClick={() => setActiveAllergenFilter(alg.key)}
                  className={`px-2 py-0.5 border transition-colors shrink-0 ${
                    activeAllergenFilter === alg.key
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {alg.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setOnlyChefChoice(!onlyChefChoice)}
              className={`px-2.5 py-0.5 border flex items-center gap-1 transition-colors ${
                onlyChefChoice 
                  ? 'bg-aji-50 border-aji-600 text-aji-800 font-bold' 
                  : 'bg-stone-100 border-stone-200 text-stone-600'
              }`}
            >
              <Sparkles className="w-3 h-3 text-aji-600" />
              <span>Chef (★)</span>
            </button>
          </div>

        </div>

        {/* Informational banner on table */}
        <div className="bg-stone-100 border border-stone-300 p-3 font-mono text-xs flex items-center justify-between text-stone-600">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-aji-600 shrink-0" />
            <span>Precios con IVA incluido. Consulta cualquier duda o adaptación con el equipo de sala.</span>
          </div>
          <button
            onClick={loadMenu}
            className="p-1 text-stone-500 hover:text-stone-900"
            title="Actualizar carta"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-aji-600' : ''}`} />
          </button>
        </div>

        {/* Dish List */}
        {loading ? (
          <div className="py-20 text-center space-y-3 font-mono text-stone-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-aji-600" />
            <p className="text-xs uppercase tracking-widest">Cargando carta oficial para la mesa...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-stone-300 bg-white p-8 space-y-3">
            <Utensils className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-stone-800">No hay platos para este filtro</h3>
            <p className="font-sans text-xs text-stone-500 max-w-xs mx-auto">
              Prueba a cambiar de categoría o restablecer la búsqueda.
            </p>
            <button
              onClick={() => {
                setActiveCategory('todos');
                setSearchQuery('');
                setActiveAllergenFilter('todos');
                setOnlyChefChoice(false);
              }}
              className="mt-2 px-4 py-2 bg-stone-900 text-white font-mono text-xs uppercase"
            >
              Restablecer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                onClick={() => setSelectedDish(item)}
                className="bg-white border border-stone-300 hover:border-stone-800 p-4 sm:p-5 transition-all flex flex-col sm:flex-row gap-4 cursor-pointer group shadow-sm active:bg-stone-50"
              >
                {/* Photo */}
                <div className="w-full sm:w-36 h-36 sm:h-28 overflow-hidden bg-stone-100 border border-stone-200 shrink-0 relative">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {item.isChefChoice && (
                    <div className="absolute top-1.5 left-1.5 bg-aji-600 text-white text-[9px] font-mono uppercase px-1.5 py-0.5 font-bold">
                      ★ Chef
                    </div>
                  )}
                  {item.spicyLevel > 0 && (
                    <div className="absolute bottom-1.5 right-1.5 bg-stone-900/90 text-aji-400 text-[10px] font-mono px-1.5 py-0.5 border border-stone-700">
                      {'🌶️'.repeat(item.spicyLevel)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-serif text-lg sm:text-xl font-bold text-ink group-hover:text-aji-700 transition-colors leading-snug">
                        {item.name}
                      </h2>
                      <span className="font-mono text-base font-bold text-aji-700 shrink-0">
                        {item.price.toFixed(2).replace('.', ',')} €
                      </span>
                    </div>

                    <p className="text-stone-600 text-xs sm:text-sm font-sans mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Badges & Allergen footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 font-mono text-[10px]">
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="uppercase text-stone-400 bg-stone-100 px-1.5 py-0.5 border border-stone-200">
                        {item.category}
                      </span>
                      {item.allergens && item.allergens.length > 0 && (
                        <span className="text-stone-500">
                          Alérgenos: {item.allergens.join(', ')}
                        </span>
                      )}
                    </div>

                    <span className="text-aji-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                      <span>Ver detalles</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                </div>
              </article>
            ))}
          </div>
        )}

      </main>

      {/* Floating Bottom Bar for Table Assistance */}
      <aside aria-label="Información de servicio en mesa" className="fixed bottom-0 left-0 right-0 z-20 bg-stone-950/95 backdrop-blur-md text-stone-200 border-t border-stone-800 py-3 px-4 shadow-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-stone-300">
              {tableNumber ? `Estás en la Mesa ${tableNumber}` : 'Servicio en Sala & Terraza'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:643567250"
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 flex items-center gap-1.5 transition-colors font-bold"
            >
              <Phone className="w-3 h-3 text-aji-400" />
              <span>Llamar al Personal</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Dish Modal */}
      <DishModal
        dish={selectedDish}
        onClose={() => setSelectedDish(null)}
        onBookTable={() => {
          setSelectedDish(null);
          // Inside NFC table menu, they are already at the table, show friendly notice
          alert('¡Ya estás en Mi Casa Perú! Puedes pedirle este plato directamente a nuestro personal de sala.');
        }}
      />

    </div>
  );
};

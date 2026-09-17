import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Flame, Sparkles, RefreshCw, AlertTriangle, Image as ImageIcon, Upload, Link, Grid3X3, X } from 'lucide-react';
import { MenuItem, DishCategory } from '../types';
import { fetchMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, seedInitialMenu } from '../services/menuService';

const ALLERGEN_OPTIONS = [
  'Pescado', 'Crustáceos', 'Moluscos', 'Gluten', 'Lácteos', 
  'Huevos', 'Soja', 'Frutos de cáscara', 'Sésamo', 'Sulfitos'
];

const PRESET_IMAGES = [
  { label: 'Ceviche Clásico', url: 'https://images.unsplash.com/photo-1535400255456-984241443b29?auto=format&fit=crop&w=800&q=80' },
  { label: 'Atún Nikkei', url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Causa Limeña', url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80' },
  { label: 'Lomo Saltado', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80' },
  { label: 'Anticuchos', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80' },
  { label: 'Postre Suspiro', url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80' },
  { label: 'Pisco Sour', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80' },
];

type ImageMode = 'upload' | 'url' | 'presets';

const CATEGORY_NAMES: Record<string, string> = {
  ceviches: 'Ceviches & Mar',
  entrantes: 'Entrantes & Causas',
  fondos: 'Fondos & Brasas',
  postres: 'Postres',
  bebidas: 'Pisco Bar',
};

export const AdminMenu: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<DishCategory>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<MenuItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'ceviches' | 'entrantes' | 'fondos' | 'postres' | 'bebidas'>('fondos');
  const [price, setPrice] = useState<number>(14.50);
  const [description, setDescription] = useState('');
  const [fusionNotes, setFusionNotes] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [spicyLevel, setSpicyLevel] = useState<0 | 1 | 2 | 3>(1);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [isChefChoice, setIsChefChoice] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // Image upload state
  const [imageMode, setImageMode] = useState<ImageMode>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process an image file: resize to max 800px, compress to JPEG, store as data URL
  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      showNotice('⚠️ El archivo seleccionado no es una imagen válida.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotice('⚠️ La imagen es demasiado grande (máx. 10 MB).');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 800px width/height
        const MAX = 800;
        let w = img.width;
        let h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImageUrl(dataUrl);
          setImagePreview(dataUrl);
        }
        setUploadingImage(false);
      };
      img.onerror = () => {
        showNotice('⚠️ No se pudo procesar la imagen.');
        setUploadingImage(false);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      showNotice('⚠️ Error al leer el archivo.');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    // Reset input so re-selecting the same file works
    if (e.target) e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  }, [processImageFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const clearUploadedImage = () => {
    setImagePreview(null);
    setImageUrl(PRESET_IMAGES[0].url);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await fetchMenuItems();
      setItems(data);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('ceviches');
    setPrice(14.00);
    setDescription('');
    setFusionNotes('');
    setIngredientsText('');
    setImageUrl(PRESET_IMAGES[0].url);
    setSpicyLevel(1);
    setAllergens([]);
    setIsChefChoice(false);
    setIsAvailable(true);
    setImageMode('upload');
    setImagePreview(null);
    setIsDragOver(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setDescription(item.description);
    setFusionNotes(item.fusionNotes || '');
    setIngredientsText(item.ingredients?.join(', ') || '');
    setImageUrl(item.imageUrl);
    setSpicyLevel(item.spicyLevel);
    setAllergens(item.allergens || []);
    setIsChefChoice(item.isChefChoice);
    setIsAvailable(item.isAvailable);
    // Detect if editing item uses a data URL (uploaded image)
    if (item.imageUrl.startsWith('data:')) {
      setImageMode('upload');
      setImagePreview(item.imageUrl);
    } else {
      setImageMode('url');
      setImagePreview(null);
    }
    setIsDragOver(false);
    setIsModalOpen(true);
  };

  const toggleAllergen = (alg: string) => {
    if (allergens.includes(alg)) {
      setAllergens(allergens.filter(a => a !== alg));
    } else {
      setAllergens([...allergens, alg]);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedIngredients = ingredientsText
      .split(',')
      .map(i => i.trim())
      .filter(Boolean);

    try {
      if (editingItem) {
        // Update
        await updateMenuItem(editingItem.id, {
          name: name.trim(),
          category,
          price: Number(price),
          description: description.trim(),
          fusionNotes: fusionNotes.trim(),
          ingredients: parsedIngredients,
          imageUrl,
          spicyLevel,
          allergens,
          isChefChoice,
          isAvailable,
        });
        showNotice(`Plato "${name}" actualizado correctamente en Firestore (menuItems).`);
      } else {
        // Create
        await addMenuItem({
          name: name.trim(),
          category,
          price: Number(price),
          description: description.trim(),
          fusionNotes: fusionNotes.trim(),
          ingredients: parsedIngredients,
          imageUrl,
          spicyLevel,
          allergens,
          isChefChoice,
          isAvailable,
        });
        showNotice(`Nuevo plato "${name}" añadido a la carta en Firestore (menuItems).`);
      }
      setIsModalOpen(false);
      await loadItems();
    } catch (err) {
      console.error('Error saving item:', err);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteCandidate) return;
    try {
      await deleteMenuItem(deleteCandidate.id);
      showNotice(`Plato "${deleteCandidate.name}" eliminado de la carta.`);
      setDeleteCandidate(null);
      await loadItems();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const newStatus = !item.isAvailable;
      await updateMenuItem(item.id, { isAvailable: newStatus });
      setItems(items.map(i => i.id === item.id ? { ...i, isAvailable: newStatus } : i));
      showNotice(`Disponibilidad de "${item.name}" actualizada a: ${newStatus ? 'Disponible' : 'Agotado'}.`);
    } catch (err) {
      console.error('Error toggling availability:', err);
    }
  };

  const handleSeedMenu = async () => {
    if (confirm('¿Restaurar toda la carta fundacional peruano-onubense en Firestore?')) {
      setLoading(true);
      await seedInitialMenu();
      await loadItems();
      showNotice('Carta fundacional restaurada con éxito en Firestore (menuItems).');
    }
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredItems = items.filter(i => {
    if (filterCategory === 'todos') return true;
    return i.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner Notice */}
      {notification && (
        <div className="bg-stone-900 text-stone-100 p-3 border-l-4 border-aji-500 font-mono text-xs flex items-center justify-between shadow-md">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Action Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h3 className="font-serif text-2xl font-bold text-ink">
            Gestión de Carta (menuItems)
          </h3>
          <p className="font-mono text-xs text-stone-500">
            Añade, edita, desactiva o elimina platos sincronizados con Firestore.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-aji-600 hover:bg-aji-700 text-white font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Nuevo Plato</span>
          </button>

          <button
            onClick={handleSeedMenu}
            className="px-3.5 py-2.5 border border-stone-300 hover:border-stone-800 bg-white text-stone-800 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            title="Poblar Firestore con la selección original si está vacía"
          >
            <Sparkles className="w-3.5 h-3.5 text-aji-600" />
            <span>Restaurar Carta Inicial</span>
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap gap-2 font-mono text-xs">
        {[
          { key: 'todos', label: 'Todos los Platos' },
          { key: 'ceviches', label: 'Ceviches & Mar' },
          { key: 'entrantes', label: 'Entrantes & Causas' },
          { key: 'fondos', label: 'Fondos & Brasas' },
          { key: 'postres', label: 'Postres' },
          { key: 'bebidas', label: 'Pisco Bar' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterCategory(tab.key as DishCategory)}
            className={`px-3 py-1.5 border transition-all ${
              filterCategory === tab.key
                ? 'bg-stone-900 text-white border-stone-900 font-bold'
                : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
            }`}
          >
            {tab.label} ({tab.key === 'todos' ? items.length : items.filter(i => i.category === tab.key).length})
          </button>
        ))}
      </div>

      {/* Mobile Card View (Todas las características visibles sin scroll horizontal) */}
      <div className="block md:hidden space-y-4">
        {loading ? (
          <div className="bg-white border border-stone-300 p-8 text-center font-mono text-stone-500 shadow-sm">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-aji-600 mb-2" />
            Cargando platos desde Firestore...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white border border-stone-300 p-8 text-center text-stone-500 font-mono shadow-sm">
            No hay platos en esta categoría.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white border transition-shadow shadow-sm overflow-hidden ${
                item.isAvailable ? 'border-stone-300' : 'border-stone-300 bg-stone-50/70 opacity-95'
              }`}
            >
              {/* Header: Foto + Datos Principales */}
              <div className="p-4 border-b border-stone-100 flex gap-3.5 items-start">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover border border-stone-300 shrink-0 bg-stone-100 shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                
                <div className="flex-1 min-w-0">
                  {/* Categoría y Distintivos */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-stone-100 text-stone-700 border border-stone-200">
                      {CATEGORY_NAMES[item.category] || item.category}
                    </span>
                    {item.isChefChoice && (
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                        ★ Chef
                      </span>
                    )}
                  </div>

                  {/* Nombre del Plato */}
                  <h4 className="font-serif text-lg font-bold text-ink leading-snug break-words">
                    {item.name}
                  </h4>

                  {/* Precio */}
                  <div className="mt-1">
                    <span className="font-mono text-base font-bold text-aji-700">
                      {item.price.toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                </div>
              </div>

              {/* Cuerpo: Todas las características sin recortar */}
              <div className="p-4 space-y-3 font-sans text-xs">
                {/* Descripción completa */}
                {item.description && (
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 block mb-0.5">
                      Descripción
                    </span>
                    <p className="text-stone-700 leading-relaxed break-words">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Toque Fusión Perú - Huelva */}
                {item.fusionNotes && (
                  <div className="bg-stone-100 border-l-2 border-aji-600 p-2.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-aji-700 font-bold block mb-0.5">
                      Toque Fusión Perú · Huelva
                    </span>
                    <p className="text-stone-700 italic font-serif text-xs break-words">
                      "{item.fusionNotes}"
                    </p>
                  </div>
                )}

                {/* Ingredientes Principales */}
                {item.ingredients && item.ingredients.length > 0 && (
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
                      Ingredientes Principales
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.ingredients.map((ing, i) => (
                        <span
                          key={i}
                          className="font-mono text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 border border-stone-200"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fila: Picante & Alérgenos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                  {/* Picante */}
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
                      Nivel de Picante
                    </span>
                    <div className="flex items-center gap-1 font-mono text-xs">
                      {item.spicyLevel === 0 ? (
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 border border-stone-200 text-[11px]">
                          🌿 Suave (Sin picante)
                        </span>
                      ) : item.spicyLevel === 1 ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold flex items-center gap-1">
                          🌶️ Suave
                        </span>
                      ) : item.spicyLevel === 2 ? (
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-800 border border-orange-200 text-[11px] font-semibold flex items-center gap-1">
                          🌶️🌶️ Medio (Ají Amarillo)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-50 text-red-800 border border-red-200 text-[11px] font-semibold flex items-center gap-1">
                          🌶️🌶️🌶️ Intenso (Rocoto)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Alérgenos */}
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
                      Alérgenos
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.allergens && item.allergens.length > 0 ? (
                        item.allergens.map((alg, i) => (
                          <span
                            key={i}
                            className="font-mono text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 border border-stone-200"
                          >
                            {alg}
                          </span>
                        ))
                      ) : (
                        <span className="font-mono text-[11px] text-stone-400 italic">
                          Sin alérgenos declarados
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pie de Tarjeta: Estado Interactivo + Botones de Acción */}
              <div className="p-3 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                {/* Conmutador de disponibilidad rápido */}
                <button
                  onClick={() => handleToggleAvailability(item)}
                  className={`font-mono text-xs px-3 py-1.5 border flex items-center gap-1.5 font-bold transition-all shadow-xs active:scale-95 ${
                    item.isAvailable
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400 hover:bg-emerald-100'
                      : 'bg-stone-200 text-stone-700 border-stone-300 hover:bg-stone-300'
                  }`}
                  title="Toca para cambiar la disponibilidad del plato"
                >
                  {item.isAvailable ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Disponible en Carta</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <span>Agotado / Desactivado</span>
                    </>
                  )}
                </button>

                {/* Acciones de Edición y Eliminación */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="px-3 py-1.5 bg-white border border-stone-300 hover:border-stone-800 text-stone-800 font-mono text-xs flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-stone-600" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => setDeleteCandidate(item)}
                    className="px-3 py-1.5 bg-white border border-red-200 hover:border-red-600 text-red-600 hover:bg-red-50 font-mono text-xs flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dishes Table (Visible en pantallas medianas y grandes) */}
      <div className="hidden md:block bg-white border border-stone-300 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-100 font-mono text-[11px] uppercase tracking-wider text-stone-600">
              <th className="py-3 px-4">Plato & Fusión</th>
              <th className="py-3 px-4">Categoría</th>
              <th className="py-3 px-4">Precio</th>
              <th className="py-3 px-4">Picante & Alérgenos</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 font-sans text-xs">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center font-mono text-stone-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-aji-600 mb-2" />
                  Cargando platos desde Firestore...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-stone-500 font-mono">
                  No hay platos en esta categoría.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                  {/* Photo & Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 object-cover border border-stone-300 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-serif text-sm font-bold text-ink">{item.name}</span>
                          {item.isChefChoice && (
                            <span className="text-[9px] bg-aji-50 text-aji-700 font-mono px-1 border border-aji-400">
                              Chef
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 line-clamp-1 max-w-xs">{item.description}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 font-mono text-xs uppercase text-stone-600">
                    {item.category}
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4 font-mono text-xs font-bold text-stone-900">
                    {item.price.toFixed(2).replace('.', ',')} €
                  </td>

                  {/* Spicy & Allergens */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {item.spicyLevel > 0 ? (
                        <span className="flex items-center text-aji-600 font-mono text-[10px]">
                          {'🌶️'.repeat(item.spicyLevel)}
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[10px]">Suave</span>
                      )}
                      {item.allergens && item.allergens.length > 0 && (
                        <span className="font-mono text-[10px] text-stone-500 truncate max-w-[120px]">
                          ({item.allergens.join(', ')})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Availability toggle */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`font-mono text-[11px] px-2 py-0.5 border flex items-center gap-1 transition-colors ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-stone-200 text-stone-600 border-stone-300'
                      }`}
                      title="Haz clic para cambiar disponibilidad"
                    >
                      {item.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Disponible</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-stone-500" />
                          <span>Agotado</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 border border-stone-300 hover:border-stone-800 text-stone-700 hover:text-stone-900 transition-colors"
                        title="Editar plato"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteCandidate(item)}
                        className="p-1.5 border border-red-200 hover:border-red-600 text-red-600 hover:text-red-800 transition-colors"
                        title="Eliminar plato"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
          <div className="bg-stone-50 border-2 border-stone-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-aji-700 block">
                  {editingItem ? 'Modificar Plato' : 'Nuevo Plato'}
                </span>
                <h3 className="font-serif text-2xl font-bold text-ink">
                  {editingItem ? editingItem.name : 'Crear Plato en la Carta'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-800 text-lg font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 font-sans text-xs">
              
              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Nombre del Plato *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Ceviche Carretillero de Corvina"
                    className="w-full px-3 py-2 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Categoría *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900"
                  >
                    <option value="ceviches">Ceviches & Mar</option>
                    <option value="entrantes">Entrantes & Causas</option>
                    <option value="fondos">Fondos & Brasas</option>
                    <option value="postres">Postres Artesanales</option>
                    <option value="bebidas">Pisco Bar & Bebidas</option>
                  </select>
                </div>
              </div>

              {/* Price & Spicy Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Precio en Euros (€) *</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Nivel de Ají / Picante</label>
                  <select
                    value={spicyLevel}
                    onChange={(e) => setSpicyLevel(parseInt(e.target.value) as any)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900"
                  >
                    <option value={0}>0 - Sin picante</option>
                    <option value={1}>1 - Suave (toque de ají amarillo)</option>
                    <option value={2}>2 - Medio (ají limo equilibrado)</option>
                    <option value={3}>3 - Intenso (rocoto tradicional)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-mono uppercase text-stone-600 mb-1">Descripción del Plato *</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalla los ingredientes y la técnica de cocinado..."
                  className="w-full px-3 py-2 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900"
                />
              </div>

              {/* Fusion Notes */}
              <div>
                <label className="block font-mono uppercase text-stone-600 mb-1">Nota de Fusión Perú · Huelva</label>
                <input
                  type="text"
                  value={fusionNotes}
                  onChange={(e) => setFusionNotes(e.target.value)}
                  placeholder="Ej. Corvina del litoral con leche de tigre al rocoto andino."
                  className="w-full px-3 py-2 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900"
                />
              </div>

              {/* Ingredients comma separated */}
              <div>
                <label className="block font-mono uppercase text-stone-600 mb-1">Ingredientes (separados por coma)</label>
                <input
                  type="text"
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  placeholder="Ej. Corvina salvaje, Leche de tigre, Choclo, Cancha, Boniato"
                  className="w-full px-3 py-2 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900"
                />
              </div>

              {/* Image Section with Upload / URL / Presets tabs */}
              <div>
                <label className="block font-mono uppercase text-stone-600 mb-2">Fotografía del Plato *</label>
                
                {/* Mode Tabs */}
                <div className="flex border border-stone-300 mb-3">
                  {[
                    { key: 'upload' as ImageMode, icon: Upload, label: 'Subir Foto' },
                    { key: 'url' as ImageMode, icon: Link, label: 'URL' },
                    { key: 'presets' as ImageMode, icon: Grid3X3, label: 'Galería' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setImageMode(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                        imageMode === tab.key
                          ? 'bg-stone-900 text-white font-bold'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Upload Mode */}
                {imageMode === 'upload' && (
                  <div className="space-y-3">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="dish-image-upload"
                    />

                    {/* Drop Zone / Preview */}
                    {imagePreview ? (
                      <div className="relative group">
                        <img
                          src={imagePreview}
                          alt="Vista previa"
                          className="w-full h-48 object-cover border-2 border-stone-300"
                        />
                        <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-white text-stone-900 font-mono text-[10px] uppercase tracking-wider border border-stone-300 hover:bg-stone-100 transition-colors"
                          >
                            Cambiar
                          </button>
                          <button
                            type="button"
                            onClick={clearUploadedImage}
                            className="px-3 py-1.5 bg-red-600 text-white font-mono text-[10px] uppercase tracking-wider hover:bg-red-700 transition-colors"
                          >
                            <X className="w-3 h-3 inline mr-1" />
                            Quitar
                          </button>
                        </div>
                        <div className="absolute top-2 right-2 bg-emerald-600 text-white px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider">
                          ✓ Foto cargada
                        </div>
                      </div>
                    ) : (
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative cursor-pointer border-2 border-dashed transition-all duration-200 h-48 flex flex-col items-center justify-center gap-3 ${
                          isDragOver
                            ? 'border-aji-500 bg-aji-50/50 scale-[1.01]'
                            : 'border-stone-300 bg-stone-50 hover:border-stone-500 hover:bg-stone-100'
                        }`}
                      >
                        {uploadingImage ? (
                          <>
                            <RefreshCw className="w-8 h-8 text-aji-600 animate-spin" />
                            <span className="font-mono text-xs text-stone-500">Procesando imagen...</span>
                          </>
                        ) : (
                          <>
                            <div className={`p-3 rounded-full transition-colors ${
                              isDragOver ? 'bg-aji-100' : 'bg-stone-200'
                            }`}>
                              <Upload className={`w-6 h-6 ${
                                isDragOver ? 'text-aji-600' : 'text-stone-500'
                              }`} />
                            </div>
                            <div className="text-center">
                              <p className="font-mono text-xs text-stone-700">
                                <span className="font-bold text-aji-700 underline">Haz clic para elegir</span> o arrastra una foto
                              </p>
                              <p className="font-mono text-[10px] text-stone-400 mt-1">
                                JPG, PNG, WebP · Máximo 10 MB
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* URL Mode */}
                {imageMode === 'url' && (
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={imageUrl.startsWith('data:') ? '' : imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(null);
                      }}
                      placeholder="https://ejemplo.com/foto-del-plato.jpg"
                      className="w-full px-3 py-2 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900"
                    />
                    {imageUrl && !imageUrl.startsWith('data:') && (
                      <div className="border border-stone-200 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt="Vista previa URL"
                          className="w-full h-36 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Presets Mode */}
                {imageMode === 'presets' && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImageUrl(preset.url);
                          setImagePreview(null);
                        }}
                        className={`relative group overflow-hidden border-2 transition-all ${
                          imageUrl === preset.url
                            ? 'border-aji-600 ring-2 ring-aji-300'
                            : 'border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-20 object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-stone-900/75 px-1 py-0.5">
                          <span className="font-mono text-[8px] text-white leading-tight block truncate">
                            {preset.label}
                          </span>
                        </div>
                        {imageUrl === preset.url && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-aji-600 flex items-center justify-center">
                            <span className="text-white text-[8px]">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Allergens selector */}
              <div>
                <label className="block font-mono uppercase text-stone-600 mb-1.5">Alérgenos Presentes</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALLERGEN_OPTIONS.map((alg) => {
                    const isSelected = allergens.includes(alg);
                    return (
                      <button
                        key={alg}
                        type="button"
                        onClick={() => toggleAllergen(alg)}
                        className={`px-2.5 py-1 font-mono text-[10px] border transition-colors ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900 font-bold'
                            : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{alg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Checkboxes: Chef Choice & Available */}
              <div className="flex items-center gap-6 pt-2 border-t border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={isChefChoice}
                    onChange={(e) => setIsChefChoice(e.target.checked)}
                    className="accent-aji-600 w-4 h-4"
                  />
                  <span>Recomendación del Chef (★)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="accent-aji-600 w-4 h-4"
                  />
                  <span>Disponible para pedir</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 hover:border-stone-800 text-stone-700 font-mono text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-aji-600 hover:bg-aji-700 text-white font-mono text-xs uppercase tracking-wider font-bold shadow-sm"
                >
                  {editingItem ? 'Guardar Cambios' : 'Crear Plato'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
          <div className="bg-stone-50 border-2 border-stone-900 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="font-serif text-lg font-bold text-ink">¿Eliminar este plato?</h4>
            </div>
            <p className="font-sans text-xs text-stone-600">
              Vas a borrar de forma permanente <strong className="text-stone-900">{deleteCandidate.name}</strong> de la colección Firestore (menuItems). Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-3 py-2 border border-stone-300 font-mono text-xs uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteItem}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase font-bold"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

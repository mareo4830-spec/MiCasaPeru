import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Phone, 
  Clock, 
  Trash2, 
  Search, 
  RefreshCw, 
  MessageSquare,
  Plus,
  Filter,
  Sun,
  Moon,
  LayoutGrid,
  List,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
  Utensils,
  MapPin,
  ChevronRight,
  User
} from 'lucide-react';
import { Reservation, ReservationStatus } from '../types';
import { 
  fetchReservations, 
  updateReservationStatus, 
  deleteReservation,
  createReservation,
  subscribeToReservationChanges,
  getSlotAvailability,
  LUNCH_SLOTS,
  DINNER_SLOTS,
  MAX_TABLES_PER_WINDOW 
} from '../services/reservationService';
import { isTelegramConfigured } from '../services/telegramService';

export const AdminReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'todas' | ReservationStatus>('todas');
  const [shiftFilter, setShiftFilter] = useState<'todos' | 'almuerzo' | 'cena'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Today / Service Filter
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [onlyToday, setOnlyToday] = useState(false);

  // Manual reservation modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mDate, setMDate] = useState(new Date().toISOString().split('T')[0]);
  const [mTime, setMTime] = useState('14:00');
  const [mShift, setMShift] = useState<'almuerzo' | 'cena'>('almuerzo');
  const [mDiners, setMDiners] = useState(2);
  const [mLocation, setMLocation] = useState<'salon' | 'terraza' | 'indiferente'>('salon');
  const [mNotes, setMNotes] = useState('');
  const [mAllergies, setMAllergies] = useState('');

  const loadReservations = async () => {
    setLoading(true);
    try {
      const data = await fetchReservations();
      setReservations(data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
    // Realtime changes listener from Supabase
    const unsubscribe = subscribeToReservationChanges(() => {
      loadReservations();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleStatusChange = async (id: string, newStatus: ReservationStatus) => {
    try {
      await updateReservationStatus(id, newStatus);
      const updated = reservations.map(r => r.id === id ? { ...r, status: newStatus } : r);
      setReservations(updated);
      if (selectedReservation && selectedReservation.id === id) {
        setSelectedReservation({ ...selectedReservation, status: newStatus });
      }
      showNotice(`Estado actualizado a: ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Error updating status:', err);
      showNotice('Error al actualizar el estado de la reserva');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (confirm(`¿Eliminar definitivamente la reserva ${code}?`)) {
      try {
        await deleteReservation(id);
        setReservations(reservations.filter(r => r.id !== id));
        if (selectedReservation?.id === id) {
          setSelectedReservation(null);
        }
        showNotice(`Reserva ${code} eliminada de la base de datos.`);
      } catch (err) {
        console.error('Error deleting reservation:', err);
        showNotice('Error al eliminar la reserva');
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateManualReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim() || !mPhone.trim()) return;

    const avail = getSlotAvailability(mDate, mTime, reservations);
    if (avail.isPast) {
      showNotice('⚠️ La fecha u hora seleccionada ya ha pasado.');
      return;
    }
    if (avail.isFull) {
      showNotice(`⚠️ Aforo completo: Límite de ${MAX_TABLES_PER_WINDOW} mesas para este tramo de hora y media.`);
      return;
    }

    try {
      const res = await createReservation({
        customerName: mName.trim(),
        customerPhone: mPhone.trim(),
        customerEmail: mEmail.trim(),
        date: mDate,
        timeSlot: mTime,
        shift: mShift,
        diners: Number(mDiners),
        locationPreference: mLocation,
        specialRequests: mNotes.trim(),
        allergies: mAllergies.trim(),
      });
      setIsManualModalOpen(false);
      setMName('');
      setMPhone('');
      setMEmail('');
      setMNotes('');
      setMAllergies('');
      showNotice(`Reserva creada con localizador ${res.ticketCode}`);
      await loadReservations();
    } catch (err: any) {
      console.error('Error creating manual reservation:', err);
      showNotice(`⚠️ Error: ${err?.message || 'No se pudo crear la reserva'}`);
    }
  };

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  // Stats calculation for the selected service date
  const serviceDateList = reservations.filter(r => r.date === selectedDate && r.status !== 'cancelada');
  const serviceTotalReservations = serviceDateList.length;
  const serviceTotalDiners = serviceDateList.reduce((sum, r) => sum + (r.diners || 0), 0);
  const serviceLunch = serviceDateList.filter(r => r.shift === 'almuerzo');
  const serviceLunchDiners = serviceLunch.reduce((sum, r) => sum + (r.diners || 0), 0);
  const serviceDinner = serviceDateList.filter(r => r.shift === 'cena');
  const serviceDinnerDiners = serviceDinner.reduce((sum, r) => sum + (r.diners || 0), 0);
  const servicePending = serviceDateList.filter(r => r.status === 'pendiente' || r.status === 'confirmada').length;
  const serviceSeated = serviceDateList.filter(r => r.status === 'completada').length;

  const isTgActive = isTelegramConfigured();

  // Filter & Search
  const filtered = reservations.filter(r => {
    if (onlyToday && r.date !== selectedDate) {
      return false;
    }
    if (statusFilter !== 'todas' && r.status !== statusFilter) {
      return false;
    }
    if (shiftFilter !== 'todos' && r.shift !== shiftFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inName = r.customerName.toLowerCase().includes(q);
      const inPhone = r.customerPhone.toLowerCase().includes(q);
      const inCode = r.ticketCode.toLowerCase().includes(q);
      return inName || inPhone || inCode;
    }
    return true;
  });

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'confirmada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Confirmada
          </span>
        );
      case 'completada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-300 font-mono text-[10px] font-bold uppercase tracking-wider rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            En Sala / Sentado
          </span>
        );
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Pendiente
          </span>
        );
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-500 border border-stone-300 font-mono text-[10px] font-medium uppercase tracking-wider rounded-sm line-through">
            Cancelada
          </span>
        );
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notice */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white font-mono text-xs px-4 py-3 border border-stone-700 shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* TOP BAR: Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-aji-700 font-bold">
              Gestión de Sala & Aforo
            </span>
            {isTgActive && (
              <span className="font-mono text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Telegram Activo
              </span>
            )}
          </div>
          <h2 className="font-serif text-3xl font-black text-ink tracking-tight">
            Reservas de Mesas
          </h2>
          <p className="font-sans text-xs text-stone-500 mt-0.5">
            Aforo controlado: máximo 5 mesas cada 90 minutos · Sincronizado en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadReservations()}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Recargar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-aji-600' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-aji-400" />
            <span>Nueva Reserva Manual</span>
          </button>
        </div>
      </div>

      {/* METRICS DASHBOARD: Pase Diario */}
      <div className="bg-stone-900 text-stone-200 border border-stone-800 p-5 rounded-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-stone-800 border border-stone-700 flex items-center justify-center text-aji-400 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-stone-400 uppercase tracking-widest block">
                Pase de Sala
              </span>
              <h3 className="font-serif text-xl font-bold text-white">
                {selectedDate === todayStr ? 'Servicio de Hoy' : `Servicio del ${formatDateDisplay(selectedDate)}`}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-stone-800 text-white border border-stone-700 px-3 py-1.5 text-xs outline-none focus:border-aji-500 rounded-sm"
            >
            </input>
            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs border border-stone-700 transition-colors rounded-sm"
              >
                Volver a Hoy
              </button>
            )}
            <button
              type="button"
              onClick={() => setOnlyToday(!onlyToday)}
              className={`px-3 py-1.5 border font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-sm ${
                onlyToday
                  ? 'bg-aji-600 text-white border-aji-500 shadow-sm'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>{onlyToday ? 'Aislado en lista' : 'Aislar este día'}</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          <div className="bg-stone-950/60 border border-stone-800 p-3.5 flex flex-col justify-between rounded-sm">
            <span className="text-stone-400 text-[10px] uppercase tracking-wider">Mesas Activas</span>
            <div className="my-1 flex items-baseline gap-2">
              <span className="text-3xl font-serif font-black text-white">{serviceTotalReservations}</span>
              <span className="text-xs text-stone-400">mesas</span>
            </div>
            <span className="text-[10px] text-stone-400">
              {servicePending} por llegar · {serviceSeated} en sala
            </span>
          </div>

          <div className="bg-stone-950/60 border border-stone-800 p-3.5 flex flex-col justify-between rounded-sm">
            <span className="text-stone-400 text-[10px] uppercase tracking-wider">Total Comensales</span>
            <div className="my-1 flex items-baseline gap-2">
              <span className="text-3xl font-serif font-black text-white">{serviceTotalDiners}</span>
              <span className="text-xs text-stone-400">personas</span>
            </div>
            <span className="text-[10px] text-stone-400">
              Capacidad total calculada
            </span>
          </div>

          <div className="bg-stone-950/60 border border-stone-800 p-3.5 flex flex-col justify-between rounded-sm">
            <span className="text-stone-400 text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Turno Almuerzo</span>
            </span>
            <div className="my-1 flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-white">{serviceLunch.length}</span>
              <span className="text-xs text-stone-400">mesas ({serviceLunchDiners} p.)</span>
            </div>
            <span className="text-[10px] text-stone-400">13:30h — 16:00h</span>
          </div>

          <div className="bg-stone-950/60 border border-stone-800 p-3.5 flex flex-col justify-between rounded-sm">
            <span className="text-stone-400 text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>Turno Cena</span>
            </span>
            <div className="my-1 flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-white">{serviceDinner.length}</span>
              <span className="text-xs text-stone-400">mesas ({serviceDinnerDiners} p.)</span>
            </div>
            <span className="text-[10px] text-stone-400">20:30h — 23:00h</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-stone-300 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            {[
              { key: 'todas', label: 'Todas' },
              { key: 'confirmada', label: 'Confirmadas' },
              { key: 'completada', label: 'En Sala' },
              { key: 'pendiente', label: 'Pendientes' },
              { key: 'cancelada', label: 'Canceladas' },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key as any)}
                className={`px-3 py-1.5 border transition-all text-xs rounded-sm ${
                  statusFilter === tab.key
                    ? 'bg-stone-900 text-white border-stone-900 font-bold shadow-sm'
                    : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center gap-2 self-end md:self-auto font-mono text-xs">
            <span className="text-stone-400 text-[11px] uppercase mr-1">Vista:</span>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-2 border transition-colors rounded-sm flex items-center gap-1.5 ${
                viewMode === 'cards' 
                  ? 'bg-stone-900 text-white border-stone-900' 
                  : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
              }`}
              title="Vista en tarjetas visuales de pase"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tarjetas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 border transition-colors rounded-sm flex items-center gap-1.5 ${
                viewMode === 'table' 
                  ? 'bg-stone-900 text-white border-stone-900' 
                  : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
              }`}
              title="Vista en tabla tradicional"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
          </div>

        </div>

        {/* Secondary Filters: Shift & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-100">
          
          {/* Shift Filter */}
          <div className="flex items-center gap-2 font-mono text-xs w-full sm:w-auto">
            <span className="text-stone-500 text-[11px] uppercase">Turno:</span>
            <div className="inline-flex border border-stone-300 rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShiftFilter('todos')}
                className={`px-2.5 py-1 text-xs transition-colors ${
                  shiftFilter === 'todos' ? 'bg-stone-900 text-white font-bold' : 'bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter('almuerzo')}
                className={`px-2.5 py-1 text-xs transition-colors border-l border-stone-200 flex items-center gap-1 ${
                  shiftFilter === 'almuerzo' ? 'bg-stone-900 text-white font-bold' : 'bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Sun className="w-3 h-3 text-amber-500" />
                <span>Almuerzo</span>
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter('cena')}
                className={`px-2.5 py-1 text-xs transition-colors border-l border-stone-200 flex items-center gap-1 ${
                  shiftFilter === 'cena' ? 'bg-stone-900 text-white font-bold' : 'bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Moon className="w-3 h-3 text-indigo-500" />
                <span>Cena</span>
              </button>
            </div>
            <span className="text-stone-400 font-mono text-[11px] ml-2">
              ({filtered.length} {filtered.length === 1 ? 'reserva' : 'reservas'})
            </span>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, teléfono o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-300 text-xs font-sans focus:outline-none focus:border-stone-900 focus:bg-white rounded-sm"
            />
          </div>

        </div>
      </div>

      {/* RESERVATIONS CONTENT */}
      {loading ? (
        <div className="bg-white border border-stone-300 p-16 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-aji-600 mb-3" />
          <p className="font-serif text-lg font-bold text-ink">Cargando reservas...</p>
          <p className="font-mono text-xs text-stone-500 mt-1">Sincronizando con base de datos en tiempo real</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 p-16 text-center space-y-3">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-lg font-bold text-ink">No hay reservas con el filtro seleccionado</h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto font-sans">
            Prueba a cambiar el estado, limpiar el buscador o pulsar en "Volver a Hoy".
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('todas');
              setShiftFilter('todos');
              setSearchQuery('');
              setOnlyToday(false);
            }}
            className="px-3.5 py-1.5 bg-stone-900 hover:bg-black text-white font-mono text-xs uppercase rounded-sm transition-colors"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        
        /* 1. VISUAL CARDS VIEW (MODO PASE DE SALA) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((res) => {
            const isToday = res.date === todayStr;
            const phoneDigits = res.customerPhone.replace(/[^0-9]/g, '');
            const waUrl = `https://wa.me/${phoneDigits}?text=Hola%20${encodeURIComponent(res.customerName)},%20te%20escribimos%20de%20Mi%20Casa%20Per%C3%BA%20sobre%20tu%20reserva%20${res.ticketCode}.`;

            return (
              <div 
                key={res.id}
                className={`bg-white border transition-all duration-200 hover:shadow-md flex flex-col justify-between rounded-sm ${
                  res.status === 'cancelada' 
                    ? 'border-stone-200 opacity-60 bg-stone-50/50' 
                    : res.status === 'completada'
                    ? 'border-blue-300 bg-blue-50/10'
                    : 'border-stone-300'
                }`}
              >
                {/* Card Header: Slot, Shift, Diners, Status */}
                <div className="p-4 border-b border-stone-100 bg-stone-50/70">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 font-mono text-base font-black text-ink bg-white px-2.5 py-1 border border-stone-300 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-aji-600" />
                        <span>{res.timeSlot}h</span>
                      </div>
                      <span className="font-mono text-[11px] px-2 py-0.5 bg-white border border-stone-200 text-stone-600 capitalize">
                        {res.shift === 'almuerzo' ? '☀️ Almuerzo' : '🌙 Cena'}
                      </span>
                    </div>

                    {getStatusBadge(res.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-stone-600 mt-2">
                    <div className="flex items-center gap-1.5 font-bold text-stone-900">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      <span>{formatDateDisplay(res.date)}</span>
                      {isToday && (
                        <span className="px-1.5 py-0.2 bg-aji-600 text-white text-[9px] uppercase font-bold rounded-2xs">
                          Hoy
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-bold text-stone-900 bg-stone-200/70 px-2 py-0.5 rounded-sm">
                        <Users className="w-3 h-3 text-aji-700" />
                        <span>{res.diners} pers.</span>
                      </span>
                      <span className="capitalize text-stone-500 text-[11px]">
                        {res.locationPreference === 'salon' ? '🛋️ Salón' : res.locationPreference === 'terraza' ? '🌿 Terraza' : 'Indiferente'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body: Customer details & Notes */}
                <div className="p-4 space-y-3 flex-1">
                  
                  {/* Customer identity */}
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-serif text-lg font-bold text-ink leading-snug">
                        {res.customerName}
                      </h4>
                      <span className="font-mono text-[11px] text-aji-700 font-bold tracking-wider shrink-0">
                        {res.ticketCode}
                      </span>
                    </div>

                    {/* Direct Contact Actions */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-100 font-mono text-xs">
                      <a
                        href={`tel:${res.customerPhone}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors rounded-sm"
                        title="Llamar por teléfono"
                      >
                        <Phone className="w-3 h-3 text-stone-500" />
                        <span>{res.customerPhone}</span>
                      </a>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors rounded-sm"
                        title="Abrir chat en WhatsApp con mensaje pre-redactado"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span className="text-[11px]">WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Medical / Allergens Warning Badge */}
                  {res.allergies && (
                    <div className="p-2.5 bg-red-50 border-l-4 border-red-600 text-xs font-sans text-red-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-red-700 block">
                          Atención Sanitaria / Alergia:
                        </span>
                        <p className="font-bold text-xs">{res.allergies}</p>
                      </div>
                    </div>
                  )}

                  {/* Special Requests Box */}
                  {res.specialRequests && (
                    <div className="p-2.5 bg-stone-50 border border-stone-200 text-xs text-stone-700 italic font-sans rounded-sm">
                      <span className="font-mono not-italic text-[10px] uppercase tracking-wider text-stone-400 block mb-0.5">
                        Petición Especial de Sala:
                      </span>
                      "{res.specialRequests}"
                    </div>
                  )}

                </div>

                {/* Card Footer: Quick Actions */}
                <div className="p-3 bg-stone-50/80 border-t border-stone-200 flex items-center justify-between gap-2 font-mono text-xs">
                  
                  <div className="flex items-center gap-1.5">
                    {res.status === 'confirmada' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(res.id, 'completada')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-2xs active:scale-95 rounded-sm"
                        title="Marcar como sentados en sala"
                      >
                        <Utensils className="w-3 h-3" />
                        <span>Sentar en Mesa</span>
                      </button>
                    )}

                    {res.status === 'pendiente' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(res.id, 'confirmada')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 rounded-sm"
                      >
                        Confirmar
                      </button>
                    )}

                    {res.status === 'completada' && (
                      <span className="font-mono text-[11px] text-blue-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Comensales en mesa</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedReservation(res)}
                      className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-xs flex items-center gap-1 transition-colors rounded-sm"
                      title="Ver ficha completa"
                    >
                      <Eye className="w-3 h-3 text-stone-500" />
                      <span>Detalle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(res.id, res.ticketCode)}
                      className="p-1.5 hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors rounded-sm"
                      title="Eliminar reserva"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* 2. REFINED EDITORIAL TABLE VIEW */
        <div className="bg-white border border-stone-300 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100 font-mono text-[11px] uppercase tracking-wider text-stone-600">
                <th className="py-3 px-4">Localizador</th>
                <th className="py-3 px-4">Cliente & Contacto</th>
                <th className="py-3 px-4">Fecha & Turno</th>
                <th className="py-3 px-4">Mesa / Personas</th>
                <th className="py-3 px-4">Alergias & Notas</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-sans text-xs">
              {filtered.map((res) => {
                const phoneDigits = res.customerPhone.replace(/[^0-9]/g, '');
                const waUrl = `https://wa.me/${phoneDigits}?text=Hola%20${encodeURIComponent(res.customerName)},%20te%20escribimos%20de%20Mi%20Casa%20Per%C3%BA%20sobre%20tu%20reserva%20${res.ticketCode}.`;

                return (
                  <tr key={res.id} className="hover:bg-stone-50 transition-colors">
                    
                    {/* Ticket */}
                    <td className="py-3.5 px-4 font-mono font-bold text-aji-700">
                      <button
                        type="button"
                        onClick={() => setSelectedReservation(res)}
                        className="hover:underline flex items-center gap-1"
                      >
                        <span>{res.ticketCode}</span>
                        <ChevronRight className="w-3 h-3 text-stone-400" />
                      </button>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-ink text-sm block">{res.customerName}</span>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-stone-600">
                          <a 
                            href={`tel:${res.customerPhone}`}
                            className="hover:text-aji-600 flex items-center gap-1"
                            title="Llamar"
                          >
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{res.customerPhone}</span>
                          </a>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:text-emerald-800"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div className="flex items-center gap-1 text-stone-900 font-bold">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>{formatDateDisplay(res.date)}</span>
                        {res.date === todayStr && (
                          <span className="ml-1 px-1 py-0.2 bg-aji-600 text-white text-[9px] uppercase">Hoy</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-stone-500 text-[11px] mt-0.5">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{res.timeSlot} h ({res.shift})</span>
                      </div>
                    </td>

                    {/* Diners & Zone */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="font-bold text-stone-900 flex items-center gap-1">
                        <Users className="w-3 h-3 text-aji-600" />
                        {res.diners} personas
                      </span>
                      <span className="text-[11px] text-stone-500 capitalize block mt-0.5">
                        Zona: {res.locationPreference === 'salon' ? 'Salón' : res.locationPreference === 'terraza' ? 'Terraza' : 'Indiferente'}
                      </span>
                    </td>

                    {/* Allergies / Notes */}
                    <td className="py-3.5 px-4 text-[11px] max-w-xs">
                      {res.allergies && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 font-mono text-[10px] font-bold mb-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>{res.allergies}</span>
                        </span>
                      )}
                      {res.specialRequests ? (
                        <p className="text-stone-600 line-clamp-1 italic">"{res.specialRequests}"</p>
                      ) : (
                        <span className="text-stone-400 font-mono text-[10px]">Sin notas</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(res.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-mono text-[11px]">
                        {res.status === 'confirmada' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(res.id, 'completada')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors rounded-sm"
                            title="Marcar sentado"
                          >
                            Sentar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedReservation(res)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition-colors rounded-sm"
                        >
                          Ficha
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(res.id, res.ticketCode)}
                          className="p-1 hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors ml-1 rounded-sm"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* RESERVATION DETAIL MODAL (FICHA COMPLETA) */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-50 border-2 border-stone-800 w-full max-w-xl shadow-2xl overflow-hidden animate-slideUp">
            
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-stone-800 border border-stone-700 flex items-center justify-center text-aji-400">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-aji-400">
                      {selectedReservation.ticketCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(selectedReservation.ticketCode)}
                      className="text-stone-400 hover:text-white transition-colors p-1"
                      title="Copiar localizador"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider block">
                    Ficha Técnica de Reserva
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReservation(null)}
                className="text-stone-400 hover:text-white p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-sans">
              
              {/* Status Header Bar */}
              <div className="flex items-center justify-between p-3 bg-white border border-stone-300">
                <span className="font-mono text-xs text-stone-600 uppercase">Estado Actual:</span>
                <div>{getStatusBadge(selectedReservation.status)}</div>
              </div>

              {/* Service Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-white border border-stone-200 p-3">
                  <span className="text-stone-400 text-[10px] uppercase block mb-1">Fecha</span>
                  <p className="font-bold text-stone-900 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    <span>{formatDateDisplay(selectedReservation.date)}</span>
                  </p>
                </div>

                <div className="bg-white border border-stone-200 p-3">
                  <span className="text-stone-400 text-[10px] uppercase block mb-1">Hora & Turno</span>
                  <p className="font-bold text-stone-900 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span>{selectedReservation.timeSlot} h</span>
                  </p>
                  <span className="text-[10px] text-stone-500 capitalize">{selectedReservation.shift}</span>
                </div>

                <div className="bg-white border border-stone-200 p-3">
                  <span className="text-stone-400 text-[10px] uppercase block mb-1">Comensales</span>
                  <p className="font-bold text-stone-900 flex items-center gap-1">
                    <Users className="w-3 h-3 text-aji-600" />
                    <span>{selectedReservation.diners} personas</span>
                  </p>
                </div>

                <div className="bg-white border border-stone-200 p-3">
                  <span className="text-stone-400 text-[10px] uppercase block mb-1">Ubicación</span>
                  <p className="font-bold text-stone-900 capitalize flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>{selectedReservation.locationPreference}</span>
                  </p>
                </div>
              </div>

              {/* Customer Contact Card */}
              <div className="bg-white border border-stone-300 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                  <User className="w-4 h-4 text-stone-400" />
                  <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-stone-800">
                    Datos del Cliente
                  </h4>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-stone-500 font-mono">Nombre:</span>
                    <span className="font-bold text-ink text-sm">{selectedReservation.customerName}</span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-stone-500 font-mono">Teléfono:</span>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <a 
                        href={`tel:${selectedReservation.customerPhone}`}
                        className="font-bold text-stone-900 hover:text-aji-600 underline"
                      >
                        {selectedReservation.customerPhone}
                      </a>
                      <a
                        href={`https://wa.me/${selectedReservation.customerPhone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(selectedReservation.customerName)},%20te%20escribimos%20de%20Mi%20Casa%20Per%C3%BA%20sobre%20tu%20reserva%20${selectedReservation.ticketCode}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] flex items-center gap-1"
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {selectedReservation.customerEmail && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-stone-500 font-mono">Email:</span>
                      <a 
                        href={`mailto:${selectedReservation.customerEmail}`} 
                        className="font-mono text-xs text-stone-700 hover:underline"
                      >
                        {selectedReservation.customerEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Allergies & Special Notes */}
              <div className="space-y-3">
                {selectedReservation.allergies ? (
                  <div className="p-3.5 bg-red-50 border-l-4 border-red-600 text-red-900 space-y-1">
                    <span className="font-mono text-[10px] uppercase font-bold text-red-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>Alerta de Alergias / Intolerancias:</span>
                    </span>
                    <p className="font-bold text-sm font-sans">{selectedReservation.allergies}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-stone-100 text-stone-500 font-mono text-xs">
                    Sin alergias alimentarias registradas.
                  </div>
                )}

                {selectedReservation.specialRequests && (
                  <div className="p-3.5 bg-stone-100 border border-stone-200 text-stone-800 space-y-1">
                    <span className="font-mono text-[10px] uppercase font-bold text-stone-500">
                      Peticiones Especiales para Cocina y Sala:
                    </span>
                    <p className="text-xs italic font-sans">"{selectedReservation.specialRequests}"</p>
                  </div>
                )}
              </div>

              {/* Status Changer Buttons */}
              <div className="space-y-2 pt-2 border-t border-stone-200 font-mono text-xs">
                <span className="uppercase text-stone-500 text-[11px] block">Cambiar Estado de la Mesa:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedReservation.id, 'confirmada')}
                    className={`py-2 px-2 border text-center transition-colors rounded-sm ${
                      selectedReservation.status === 'confirmada'
                        ? 'bg-emerald-700 text-white border-emerald-800 font-bold'
                        : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    Confirmada
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedReservation.id, 'completada')}
                    className={`py-2 px-2 border text-center transition-colors rounded-sm ${
                      selectedReservation.status === 'completada'
                        ? 'bg-blue-700 text-white border-blue-800 font-bold'
                        : 'bg-white hover:bg-blue-50 text-blue-800 border-blue-300'
                    }`}
                  >
                    Sentado
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedReservation.id, 'pendiente')}
                    className={`py-2 px-2 border text-center transition-colors rounded-sm ${
                      selectedReservation.status === 'pendiente'
                        ? 'bg-amber-700 text-white border-amber-800 font-bold'
                        : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    Pendiente
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedReservation.id, 'cancelada')}
                    className={`py-2 px-2 border text-center transition-colors rounded-sm ${
                      selectedReservation.status === 'cancelada'
                        ? 'bg-stone-700 text-white border-stone-800 font-bold'
                        : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-stone-100 p-4 border-t border-stone-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDelete(selectedReservation.id, selectedReservation.ticketCode)}
                className="font-mono text-xs text-red-600 hover:text-red-800 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Reserva</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedReservation(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-black text-white font-mono text-xs uppercase font-bold rounded-sm transition-colors"
              >
                Cerrar Ficha
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MANUAL RESERVATION MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-50 border-2 border-stone-800 w-full max-w-lg p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-aji-700 block">
                  Atención Telefónica 643 56 72 50
                </span>
                <h4 className="font-serif text-2xl font-bold text-ink">Registrar Reserva Manual</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="font-mono text-stone-400 hover:text-stone-800 p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualReservation} className="space-y-3 font-sans text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Nombre del Cliente *</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={mName}
                    onChange={(e) => setMName(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 text-sm focus:border-stone-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Teléfono Móvil *</label>
                  <input
                    type="tel"
                    required
                    maxLength={20}
                    value={mPhone}
                    onChange={(e) => setMPhone(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 text-sm focus:border-stone-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono uppercase text-stone-600 mb-1">Correo Electrónico (opcional)</label>
                <input
                  type="email"
                  maxLength={100}
                  value={mEmail}
                  onChange={(e) => setMEmail(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 text-sm focus:border-stone-900 outline-none"
                  placeholder="cliente@ejemplo.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Fecha de la Reserva *</label>
                  <input
                    type="date"
                    min={todayStr}
                    required
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 text-sm focus:border-stone-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Turno y Hora *</label>
                  <div className="flex gap-2 mb-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMShift('almuerzo');
                        setMTime('14:00');
                      }}
                      className={`flex-1 py-1 text-[11px] font-mono border ${
                        mShift === 'almuerzo' ? 'bg-stone-900 text-white font-bold' : 'bg-white text-stone-700'
                      }`}
                    >
                      Almuerzo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMShift('cena');
                        setMTime('21:00');
                      }}
                      className={`flex-1 py-1 text-[11px] font-mono border ${
                        mShift === 'cena' ? 'bg-stone-900 text-white font-bold' : 'bg-white text-stone-700'
                      }`}
                    >
                      Cena
                    </button>
                  </div>
                  <select
                    value={mTime}
                    onChange={(e) => setMTime(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 text-sm font-mono focus:border-stone-900 outline-none"
                  >
                    {(mShift === 'almuerzo' ? LUNCH_SLOTS : DINNER_SLOTS).map((slot) => {
                      const slotAvail = getSlotAvailability(mDate, slot, reservations);
                      return (
                        <option 
                          key={slot} 
                          value={slot} 
                          disabled={!slotAvail.canBook}
                        >
                          {slot} h {slotAvail.isPast ? '(Hora pasada)' : slotAvail.isFull ? '(COMPLETO 5/5 mesas)' : `(${slotAvail.occupied}/5 ocupadas)`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Comensales</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={mDiners}
                    onChange={(e) => setMDiners(parseInt(e.target.value) || 2)}
                    className="w-full p-2 bg-white border border-stone-300 text-sm focus:border-stone-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Zona</label>
                  <select
                    value={mLocation}
                    onChange={(e) => setMLocation(e.target.value as any)}
                    className="w-full p-2 bg-white border border-stone-300 text-sm focus:border-stone-900 outline-none"
                  >
                    <option value="salon">Salón</option>
                    <option value="terraza">Terraza</option>
                    <option value="indiferente">Indiferente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Alergias o Intolerancias</label>
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="Ej. Celíaco, marisco..."
                    value={mAllergies}
                    onChange={(e) => setMAllergies(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 text-sm focus:border-stone-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Peticiones Especiales</label>
                  <input
                    type="text"
                    maxLength={250}
                    placeholder="Ej. Cumpleaños, trona..."
                    value={mNotes}
                    onChange={(e) => setMNotes(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 text-sm focus:border-stone-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 uppercase hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 hover:bg-black text-white uppercase font-bold transition-all shadow-sm"
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

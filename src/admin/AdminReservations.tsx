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
  Send,
  Sun,
  Moon
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
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

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
      setReservations(reservations.map(r => r.id === id ? { ...r, status: newStatus } : r));
      showNotice(`Reserva actualizada a: ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (confirm(`¿Eliminar la reserva con localizador ${code}?`)) {
      try {
        await deleteReservation(id);
        setReservations(reservations.filter(r => r.id !== id));
        showNotice(`Reserva ${code} eliminada de Firestore.`);
      } catch (err) {
        console.error('Error deleting reservation:', err);
      }
    }
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
      showNotice(`⚠️ Aforo completo: Se ha alcanzado el límite de ${MAX_TABLES_PER_WINDOW} mesas para este tramo de hora y media.`);
      return;
    }

    try {
      const res = await createReservation({
        customerName: mName.trim(),
        customerPhone: mPhone.trim(),
        customerEmail: mEmail.trim() || `${mName.toLowerCase().replace(/\s+/g, '')}@reserva.mcp`,
        date: mDate,
        timeSlot: mTime,
        shift: mShift,
        diners: Number(mDiners),
        locationPreference: mLocation,
        specialRequests: mNotes.trim(),
        allergies: mAllergies.trim(),
      });
      setIsManualModalOpen(false);
      showNotice(`Reserva manual creada con localizador ${res.ticketCode}`);
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

  // Stats calculation for the selected service date (Hoy)
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
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[10px] font-bold">CONFIRMADA</span>;
      case 'pendiente':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 font-mono text-[10px] font-bold">PENDIENTE</span>;
      case 'completada':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 font-mono text-[10px] font-bold">SENTADO</span>;
      case 'cancelada':
        return <span className="px-2 py-0.5 bg-stone-200 text-stone-600 border border-stone-300 font-mono text-[10px]">CANCELADA</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Notice Banner */}
      {notice && (
        <div className="bg-stone-900 text-stone-100 p-3 border-l-4 border-aji-500 font-mono text-xs flex items-center justify-between shadow-md">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-stone-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h3 className="font-serif text-2xl font-bold text-ink">
            Gestión de Reservas & Servicio
          </h3>
          <p className="font-mono text-xs text-stone-500 flex items-center gap-2">
            <span>Sincronizado en tiempo real con Supabase</span>
            <span className="text-stone-300">·</span>
            <span className={isTgActive ? 'text-sky-600 font-bold flex items-center gap-1' : 'text-stone-400'}>
              <Send className="w-3 h-3" />
              {isTgActive ? 'Avisos Telegram Activos' : 'Telegram no configurado'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2 bg-aji-600 hover:bg-aji-700 text-white font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Reserva Telefónica</span>
          </button>

          <button
            onClick={loadReservations}
            disabled={loading}
            className="p-2 border border-stone-300 bg-white hover:border-stone-800 text-stone-700 transition-colors"
            title="Recargar reservas de Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-aji-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* --- APARTADO ESPECIAL: PANEL DE SERVICIO DE HOY --- */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-stone-100 p-5 sm:p-6 border border-stone-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-aji-600/30 border border-aji-500/50 text-aji-400">
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <span>Resumen del Servicio: {selectedDate === todayStr ? 'HOY' : selectedDate}</span>
                {selectedDate === todayStr && (
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-[10px] uppercase font-bold tracking-wider">
                    En Directo
                  </span>
                )}
              </h4>
              <p className="font-mono text-xs text-stone-400">
                Consulta instantánea de mesas y comensales por turno para el pase.
              </p>
            </div>
          </div>

          {/* Date Selector for service */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-stone-800 text-stone-200 border border-stone-700 px-2.5 py-1.5 text-xs outline-none focus:border-aji-500"
            />
            {selectedDate !== todayStr && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs border border-stone-700 transition-colors"
              >
                Volver a Hoy
              </button>
            )}
            <button
              onClick={() => setOnlyToday(!onlyToday)}
              className={`px-3 py-1.5 border font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                onlyToday
                  ? 'bg-aji-600 text-white border-aji-500 shadow-sm'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{onlyToday ? 'Mostrando sólo este día' : 'Filtrar sólo este día'}</span>
            </button>
          </div>
        </div>

        {/* Big Key Metrics for Selected Day */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
          {/* Card 1: Mesas Hoy */}
          <div className="bg-stone-850/80 border border-stone-800 p-3.5 flex flex-col justify-between">
            <span className="text-stone-400 text-[11px] uppercase tracking-wider block">Mesas {selectedDate === todayStr ? 'Hoy' : 'del Día'}</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white font-serif">{serviceTotalReservations}</span>
              <span className="text-xs text-stone-400">reservas</span>
            </div>
            <span className="text-[10px] text-stone-400 mt-2 block">
              {servicePending} por sentar · {serviceSeated} en sala
            </span>
          </div>

          {/* Card 2: Total Personas */}
          <div className="bg-stone-850/80 border border-stone-800 p-3.5 flex flex-col justify-between">
            <span className="text-stone-400 text-[11px] uppercase tracking-wider block">Total Comensales</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-aji-400 font-serif">{serviceTotalDiners}</span>
              <span className="text-xs text-stone-400">personas</span>
            </div>
            <span className="text-[10px] text-stone-400 mt-2 block">
              Volumen total de sala previsto
            </span>
          </div>

          {/* Card 3: Turno Almuerzo */}
          <div className="bg-stone-850/80 border border-stone-800 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-amber-300">
              <span className="uppercase tracking-wider font-bold flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" />
                Almuerzo
              </span>
              <span className="text-stone-400 font-normal">13:30 - 16:30</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-serif">{serviceLunch.length}</span>
              <span className="text-xs text-stone-400">mesas</span>
              <span className="text-sm font-bold text-amber-400 ml-auto">({serviceLunchDiners} pers.)</span>
            </div>
            <span className="text-[10px] text-stone-400 mt-2 block">
              Pase de mediodía
            </span>
          </div>

          {/* Card 4: Turno Cena */}
          <div className="bg-stone-850/80 border border-stone-800 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-sky-300">
              <span className="uppercase tracking-wider font-bold flex items-center gap-1">
                <Moon className="w-3 h-3 text-sky-400" />
                Cena
              </span>
              <span className="text-stone-400 font-normal">20:30 - 23:30</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-serif">{serviceDinner.length}</span>
              <span className="text-xs text-stone-400">mesas</span>
              <span className="text-sm font-bold text-sky-400 ml-auto">({serviceDinnerDiners} pers.)</span>
            </div>
            <span className="text-[10px] text-stone-400 mt-2 block">
              Pase de noche
            </span>
          </div>
        </div>
      </div>

      {/* Global General Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="bg-white border border-stone-300 p-3">
          <span className="text-stone-400 uppercase text-[10px] block">Histórico Total</span>
          <span className="text-lg font-bold text-ink">{reservations.length}</span>
        </div>
        <div className="bg-white border border-stone-300 p-3">
          <span className="text-stone-400 uppercase text-[10px] block">Confirmadas</span>
          <span className="text-lg font-bold text-emerald-700">
            {reservations.filter(r => r.status === 'confirmada').length}
          </span>
        </div>
        <div className="bg-white border border-stone-300 p-3">
          <span className="text-stone-400 uppercase text-[10px] block">Pendientes</span>
          <span className="text-lg font-bold text-amber-700">
            {reservations.filter(r => r.status === 'pendiente').length}
          </span>
        </div>
        <div className="bg-white border border-stone-300 p-3">
          <span className="text-stone-400 uppercase text-[10px] block">Total Comensales Histórico</span>
          <span className="text-lg font-bold text-aji-700">
            {reservations.reduce((acc, r) => acc + (r.diners || 0), 0)} personas
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5 font-mono text-xs">
          {[
            { key: 'todas', label: 'Todas' },
            { key: 'confirmada', label: 'Confirmadas' },
            { key: 'pendiente', label: 'Pendientes' },
            { key: 'completada', label: 'Sentados' },
            { key: 'cancelada', label: 'Canceladas' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as any)}
              className={`px-3 py-1.5 border transition-all ${
                statusFilter === tab.key
                  ? 'bg-stone-900 text-white border-stone-900 font-bold'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, tel o código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-300 text-xs font-sans focus:outline-none focus:border-stone-900"
          />
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white border border-stone-300 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-100 font-mono text-[11px] uppercase tracking-wider text-stone-600">
              <th className="py-3 px-4">Localizador</th>
              <th className="py-3 px-4">Cliente & Contacto</th>
              <th className="py-3 px-4">Fecha & Hora</th>
              <th className="py-3 px-4">Mesa / Personas</th>
              <th className="py-3 px-4">Peticiones & Alergias</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 font-sans text-xs">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center font-mono text-stone-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-aji-600 mb-2" />
                  Cargando reservas desde Firestore...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-stone-500 font-mono">
                  No hay reservas con el filtro actual.
                </td>
              </tr>
            ) : (
              filtered.map((res) => (
                <tr key={res.id} className="hover:bg-stone-50 transition-colors">
                  
                  {/* Code */}
                  <td className="py-3 px-4 font-mono font-bold text-aji-700">
                    {res.ticketCode}
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-4">
                    <div>
                      <span className="font-bold text-ink text-sm block">{res.customerName}</span>
                      <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-stone-600">
                        <a 
                          href={`tel:${res.customerPhone}`}
                          className="hover:text-aji-600 flex items-center gap-1"
                          title="Llamar al cliente"
                        >
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{res.customerPhone}</span>
                        </a>
                        <a
                          href={`https://wa.me/${res.customerPhone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(res.customerName)},%20te%20escribimos%20de%20Mi%20Casa%20Per%C3%BA%20sobre%20tu%20reserva%20${res.ticketCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:text-emerald-800"
                          title="Contactar por WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </td>

                  {/* Date & Slot */}
                  <td className="py-3 px-4 font-mono text-xs">
                    <div className="flex items-center gap-1 text-stone-900 font-bold">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      <span>{res.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-stone-500 text-[11px] mt-0.5">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{res.timeSlot} h ({res.shift})</span>
                    </div>
                  </td>

                  {/* Diners & Zone */}
                  <td className="py-3 px-4 font-mono text-xs">
                    <span className="font-bold text-stone-900 flex items-center gap-1">
                      <Users className="w-3 h-3 text-aji-600" />
                      {res.diners} {res.diners === 1 ? 'persona' : 'personas'}
                    </span>
                    <span className="text-[11px] text-stone-500 capitalize block mt-0.5">
                      Zona: {res.locationPreference}
                    </span>
                  </td>

                  {/* Notes / Allergens */}
                  <td className="py-3 px-4 text-[11px] max-w-xs">
                    {res.allergies && (
                      <span className="inline-block px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 font-mono text-[10px] mb-1">
                        Alergia: {res.allergies}
                      </span>
                    )}
                    {res.specialRequests ? (
                      <p className="text-stone-600 line-clamp-2">{res.specialRequests}</p>
                    ) : (
                      <span className="text-stone-400 font-mono text-[10px]">Sin notas</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    {getStatusBadge(res.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 font-mono text-[10px]">
                      {res.status !== 'confirmada' && (
                        <button
                          onClick={() => handleStatusChange(res.id, 'confirmada')}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          title="Confirmar reserva"
                        >
                          Confirmar
                        </button>
                      )}

                      {res.status !== 'completada' && (
                        <button
                          onClick={() => handleStatusChange(res.id, 'completada')}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white"
                          title="Marcar como sentados en sala"
                        >
                          Sentado
                        </button>
                      )}

                      {res.status !== 'cancelada' && (
                        <button
                          onClick={() => handleStatusChange(res.id, 'cancelada')}
                          className="px-2 py-1 border border-stone-300 hover:border-stone-800 text-stone-700"
                          title="Cancelar reserva"
                        >
                          Cancelar
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(res.id, res.ticketCode)}
                        className="p-1 border border-red-200 hover:border-red-600 text-red-600 hover:text-red-800 ml-1"
                        title="Eliminar de Firestore"
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

      {/* MANUAL RESERVATION MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
          <div className="bg-stone-50 border-2 border-stone-800 w-full max-w-lg p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-aji-700 block">
                  Atención Telefónica 643 56 72 50
                </span>
                <h4 className="font-serif text-2xl font-bold text-ink">Registrar Reserva Manual</h4>
              </div>
              <button onClick={() => setIsManualModalOpen(false)} className="font-mono text-stone-400">✕</button>
            </div>

            <form onSubmit={handleCreateManualReservation} className="space-y-3 font-sans text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Nombre del Cliente *</label>
                  <input
                    type="text"
                    required
                    value={mName}
                    onChange={(e) => setMName(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={mPhone}
                    onChange={(e) => setMPhone(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Fecha *</label>
                  <input
                    type="date"
                    min={todayStr}
                    required
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 text-sm"
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
                    className="w-full p-2 bg-white border border-stone-300 text-sm font-mono"
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
                    className="w-full p-2 bg-white border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono uppercase text-stone-600 mb-1">Zona</label>
                  <select
                    value={mLocation}
                    onChange={(e) => setMLocation(e.target.value as any)}
                    className="w-full p-2 bg-white border border-stone-300 text-sm"
                  >
                    <option value="salon">Salón</option>
                    <option value="terraza">Terraza</option>
                    <option value="indiferente">Indiferente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono uppercase text-stone-600 mb-1">Alergias o Notas</label>
                <input
                  type="text"
                  placeholder="Ej. Celíaco, mesa para niños..."
                  value={mNotes}
                  onChange={(e) => setMNotes(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3 py-2 border border-stone-300 font-mono text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 text-white font-mono text-xs uppercase font-bold"
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

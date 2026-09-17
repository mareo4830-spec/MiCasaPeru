import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Utensils, 
  ExternalLink, 
  MessageCircle,
  AlertTriangle
} from 'lucide-react';
import { Reservation, ShiftType, LocationPreference, ReservationStatus } from '../types';
import { 
  fetchReservations, 
  createReservation, 
  getSlotAvailability, 
  getTodayDateString, 
  LUNCH_SLOTS, 
  DINNER_SLOTS,
  isTimeSlotInPast
} from '../services/reservationService';
import { 
  createGoogleCalendarUrl, 
  downloadIcsFile, 
  createWhatsAppConfirmationUrl 
} from '../utils/calendar';

interface ReservationsPageProps {
  onBackToHome: () => void;
  onGoToMenu: () => void;
}

const COMMON_ALLERGIES = [
  'Sin Gluten (Celíaco)',
  'Marisco / Crustáceos',
  'Lactosa',
  'Frutos Secos',
  'Pescado',
  'Huevo',
  'Soja',
];

export const ReservationsPage: React.FC<ReservationsPageProps> = ({ onBackToHome, onGoToMenu }) => {
  // Wizard steps: 1 = Fecha & Comensales, 2 = Horario & Zona, 3 = Datos & Alergias, 4 = Confirmado
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [date, setDate] = useState<string>(getTodayDateString());
  const [shift, setShift] = useState<ShiftType>('almuerzo');
  const [diners, setDiners] = useState<number>(2);
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [locationPreference, setLocationPreference] = useState<LocationPreference>('salon');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [otherAllergies, setOtherAllergies] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // Process State
  const [existingReservations, setExistingReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Load existing reservations for availability calculation
  useEffect(() => {
    loadReservations();
  }, [date]);

  const loadReservations = async () => {
    try {
      const list = await fetchReservations();
      setExistingReservations(list);
    } catch {
      // ignore
    }
  };

  // Date Quick Selectors
  const getQuickDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    const formatISO = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const formatLabel = (d: Date) => {
      return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    return [
      { id: 'today', label: 'Hoy', dateStr: formatISO(today), sub: formatLabel(today) },
      { id: 'tomorrow', label: 'Mañana', dateStr: formatISO(tomorrow), sub: formatLabel(tomorrow) },
      { id: 'dayAfter', label: 'Pasado mañana', dateStr: formatISO(dayAfter), sub: formatLabel(dayAfter) },
    ];
  };

  const quickDates = getQuickDates();
  const currentSlots = shift === 'almuerzo' ? LUNCH_SLOTS : DINNER_SLOTS;

  // Toggle allergy pill
  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  // Submit Reservation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!acceptPrivacy) {
      setErrorMsg('Debes aceptar la Política de Privacidad para poder tramitar la reserva.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Por favor completa tu nombre y número de teléfono.');
      return;
    }

    if (!timeSlot) {
      setErrorMsg('Por favor selecciona una hora disponible para tu reserva.');
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      // Build allergies text
      const allAllergies = [...selectedAllergies];
      if (otherAllergies.trim()) {
        allAllergies.push(otherAllergies.trim());
      }
      const allergiesText = allAllergies.join(', ');

      const newRes = await createReservation({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        date,
        timeSlot,
        shift,
        diners,
        locationPreference,
        specialRequests: specialRequests.trim(),
        allergies: allergiesText,
      });

      setConfirmedReservation(newRes);
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err?.message || 'No fue posible completar la reserva. Por favor intenta otro horario.');
    } finally {
      setLoading(false);
    }
  };

  const copyTicketCode = () => {
    if (confirmedReservation) {
      navigator.clipboard.writeText(confirmedReservation.ticketCode);
      setCopiedTicket(true);
      setTimeout(() => setCopiedTicket(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-24 selection:bg-aji-600 selection:text-white">
      
      {/* Top Header */}
      <header className="bg-stone-950 text-stone-200 border-b border-stone-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 text-stone-400 hover:text-white font-mono text-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-aji-400" />
            <span>Volver a la Web</span>
          </button>

          <div className="text-center">
            <span className="font-serif text-lg sm:text-xl font-black tracking-tight text-white block">
              Mi Casa Perú
            </span>
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">
              Reservas Online
            </span>
          </div>

          <a
            href="tel:643567250"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 border border-stone-800 text-aji-400 font-mono text-xs font-bold hover:bg-stone-850 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">643 56 72 50</span>
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 space-y-8">
        
        {/* Step Progress Indicator */}
        {step < 4 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between font-mono text-xs text-stone-500 uppercase tracking-wider">
              <span className={step >= 1 ? 'text-ink font-bold' : ''}>1. Fecha & Personas</span>
              <span className={step >= 2 ? 'text-ink font-bold' : ''}>2. Horario & Zona</span>
              <span className={step >= 3 ? 'text-ink font-bold' : ''}>3. Datos & Alergias</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className={`h-1.5 rounded-none transition-colors ${step >= 1 ? 'bg-aji-600' : 'bg-stone-200'}`} />
              <div className={`h-1.5 rounded-none transition-colors ${step >= 2 ? 'bg-aji-600' : 'bg-stone-200'}`} />
              <div className={`h-1.5 rounded-none transition-colors ${step >= 3 ? 'bg-aji-600' : 'bg-stone-200'}`} />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-300 text-red-900 flex items-start gap-2.5 font-mono text-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-sans font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 1: CUÁNDO Y CUÁNTOS SOIS */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-8 shadow-sm">
            <div>
              <span className="px-2.5 py-1 bg-aji-50 text-aji-700 font-mono text-[10px] font-bold uppercase tracking-widest border border-aji-200">
                Paso 1 de 3
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink mt-2">
                ¿Cuándo y cuántos comensales sois?
              </h1>
              <p className="font-mono text-xs text-stone-500 mt-1">
                Servicio exclusivo con aforo limitado a 5 mesas cada 90 minutos para garantizar la máxima calidad.
              </p>
            </div>

            {/* Selector de Comensales */}
            <div className="space-y-3">
              <label className="block font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                Número de Comensales
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDiners(num)}
                    className={`py-3 text-center border font-mono transition-all ${
                      diners === num
                        ? 'bg-aji-600 text-white border-aji-600 font-bold shadow-sm'
                        : 'bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-400 hover:bg-white'
                    }`}
                  >
                    <span className="text-lg block font-bold">{num}</span>
                    <span className="text-[10px] uppercase opacity-75">{num === 1 ? 'pers.' : 'pers.'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector Rápido de Fecha */}
            <div className="space-y-3">
              <label className="block font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                Elige el Día
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {quickDates.map((qd) => (
                  <button
                    key={qd.id}
                    type="button"
                    onClick={() => setDate(qd.dateStr)}
                    className={`p-3.5 text-left border transition-all ${
                      date === qd.dateStr
                        ? 'bg-ink text-white border-ink shadow-sm'
                        : 'bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-400 hover:bg-white'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold uppercase block">{qd.label}</span>
                    <span className={`text-xs capitalize block mt-0.5 ${date === qd.dateStr ? 'text-stone-300' : 'text-stone-500'}`}>
                      {qd.sub}
                    </span>
                  </button>
                ))}
              </div>

              {/* Selector de calendario tradicional */}
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-stone-500">O elige otra fecha:</span>
                  <input
                    type="date"
                    min={getTodayDateString()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-white border border-stone-300 px-3 py-1.5 font-mono text-xs text-stone-800 focus:outline-none focus:border-ink"
                  />
                </div>
              </div>
            </div>

            {/* Selector de Turno */}
            <div className="space-y-3">
              <label className="block font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                Turno de Servicio
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShift('almuerzo');
                    setTimeSlot('');
                  }}
                  className={`p-4 text-left border transition-all flex items-start gap-3 ${
                    shift === 'almuerzo'
                      ? 'bg-amber-500/10 border-amber-500 text-stone-900 ring-1 ring-amber-500'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <span className="text-2xl">☀️</span>
                  <div>
                    <span className="font-serif font-bold text-base block text-ink">Almuerzo / Comida</span>
                    <span className="font-mono text-xs text-stone-500 block mt-0.5">Pases entre 13:30h y 15:30h</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShift('cena');
                    setTimeSlot('');
                  }}
                  className={`p-4 text-left border transition-all flex items-start gap-3 ${
                    shift === 'cena'
                      ? 'bg-sky-500/10 border-sky-500 text-stone-900 ring-1 ring-sky-500'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <span className="text-2xl">🌙</span>
                  <div>
                    <span className="font-serif font-bold text-base block text-ink">Cena / Noche</span>
                    <span className="font-mono text-xs text-stone-500 block mt-0.5">Pases entre 20:30h y 22:30h</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Botón de Paso 1 a Paso 2 */}
            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <span>Siguiente: Elegir Horario</span>
                <ArrowRight className="w-4 h-4 text-aji-400" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: HORARIO Y ZONA */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-8 shadow-sm">
            <div>
              <span className="px-2.5 py-1 bg-aji-50 text-aji-700 font-mono text-[10px] font-bold uppercase tracking-widest border border-aji-200">
                Paso 2 de 3
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink mt-2">
                Selecciona tu Hora y Preferencia de Mesa
              </h2>
              <p className="font-mono text-xs text-stone-500 mt-1">
                Mostrando disponibilidad para {diners} comensales el {date} ({shift === 'almuerzo' ? 'Almuerzo' : 'Cena'}).
              </p>
            </div>

            {/* Horarios Disponibles */}
            <div className="space-y-3">
              <label className="block font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                Horas Disponibles (Turno de {shift === 'almuerzo' ? 'Almuerzo' : 'Cena'})
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentSlots.map((slot) => {
                  const isPast = isTimeSlotInPast(date, slot);
                  const avail = getSlotAvailability(date, slot, existingReservations);
                  const isSelected = timeSlot === slot;

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isPast || !avail.canBook}
                      onClick={() => setTimeSlot(slot)}
                      className={`p-4 text-center border font-mono transition-all relative ${
                        isSelected
                          ? 'bg-aji-600 text-white border-aji-600 shadow-md ring-2 ring-aji-500 ring-offset-2'
                          : isPast
                          ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60'
                          : !avail.canBook
                          ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60'
                          : 'bg-white text-stone-900 border-stone-300 hover:border-aji-500 hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-xl font-bold block">{slot}h</span>
                      <span className="text-[11px] block mt-1">
                        {isPast
                          ? '⏰ Pasada'
                          : !avail.canBook
                          ? '🔴 Completo'
                          : isSelected
                          ? '✓ Seleccionado'
                          : `🟢 ${avail.remaining} mesas disp.`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferencia de Zona */}
            <div className="space-y-3">
              <label className="block font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                Preferencia de Ubicación
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'salon', label: 'Salón Principal', icon: '🛋️', desc: 'Climatizado y exclusivo' },
                  { id: 'terraza', label: 'Terraza Exterior', icon: '🌿', desc: 'Ambiente fresco y abierto' },
                  { id: 'indiferente', label: 'Indiferente', icon: '✨', desc: 'Primera mesa libre' },
                ].map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setLocationPreference(loc.id as LocationPreference)}
                    className={`p-3.5 text-left border transition-all ${
                      locationPreference === loc.id
                        ? 'bg-ink text-white border-ink shadow-sm'
                        : 'bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-300 hover:bg-white'
                    }`}
                  >
                    <span className="text-xl block mb-1">{loc.icon}</span>
                    <span className="font-serif font-bold text-sm block">{loc.label}</span>
                    <span className={`font-mono text-[10px] block mt-0.5 ${locationPreference === loc.id ? 'text-stone-300' : 'text-stone-500'}`}>
                      {loc.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navegación Paso 2 */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 border border-stone-300 text-stone-700 hover:bg-stone-100 font-mono text-xs uppercase tracking-wider font-bold transition-colors"
              >
                ← Cambiar Fecha
              </button>

              <button
                type="button"
                disabled={!timeSlot}
                onClick={() => setStep(3)}
                className="px-8 py-3.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2 shadow-sm transition-colors"
              >
                <span>Siguiente: Mis Datos</span>
                <ArrowRight className="w-4 h-4 text-aji-400" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: DATOS DEL COMENSAL Y ALERGIAS */}
        {/* ========================================================================= */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="bg-white border border-stone-200 p-6 sm:p-8 space-y-8 shadow-sm">
            <div>
              <span className="px-2.5 py-1 bg-aji-50 text-aji-700 font-mono text-[10px] font-bold uppercase tracking-widest border border-aji-200">
                Paso 3 de 3
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink mt-2">
                Datos de Contacto y Seguridad Alimentaria
              </h2>
              <p className="font-mono text-xs text-stone-500 mt-1">
                Reserva para: <strong className="text-stone-900">{diners} personas</strong> el <strong className="text-stone-900">{date} a las {timeSlot}h</strong> ({locationPreference}).
              </p>
            </div>

            {/* Datos Personales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-mono text-xs uppercase tracking-wider text-stone-700 font-bold mb-1.5">
                  Nombre y Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: Mario García"
                  className="w-full bg-stone-50 border border-stone-300 px-3.5 py-2.5 text-base sm:text-sm text-stone-900 focus:outline-none focus:border-ink font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-stone-700 font-bold mb-1.5">
                  Teléfono Móvil (WhatsApp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej: 600 000 000"
                  className="w-full bg-stone-50 border border-stone-300 px-3.5 py-2.5 text-base sm:text-sm text-stone-900 focus:outline-none focus:border-ink font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-stone-700 font-bold mb-1.5">
                  Correo Electrónico (Para Calendario)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="tuemail@ejemplo.com"
                  className="w-full bg-stone-50 border border-stone-300 px-3.5 py-2.5 text-base sm:text-sm text-stone-900 focus:outline-none focus:border-ink font-mono"
                />
              </div>
            </div>

            {/* Selector de Alergias */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <label className="font-mono text-xs uppercase tracking-wider text-stone-900 font-bold">
                  Alergias o Intolerancias en tu mesa (Opcional)
                </label>
              </div>
              <p className="font-mono text-[11px] text-stone-500">
                Selecciona si algún comensal tiene necesidades dietéticas para que la cocina prepare sus platos con máxima seguridad:
              </p>

              <div className="flex flex-wrap gap-2">
                {COMMON_ALLERGIES.map((allergy) => {
                  const isSel = selectedAllergies.includes(allergy);
                  return (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => toggleAllergy(allergy)}
                      className={`px-3 py-1.5 font-mono text-xs transition-colors border ${
                        isSel
                          ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      {isSel ? `✓ ${allergy}` : `+ ${allergy}`}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={otherAllergies}
                onChange={(e) => setOtherAllergies(e.target.value)}
                placeholder="Otras alergias no listadas (opcional)..."
                className="w-full bg-stone-50 border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-ink font-mono mt-2"
              />
            </div>

            {/* Peticiones Especiales */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="block font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                Peticiones Especiales (Opcional)
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Trona para bebé, celebración de cumpleaños, mesa tranquila..."
                rows={2}
                className="w-full bg-stone-50 border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-ink font-mono"
              />
            </div>

            {/* Checkbox RGPD Obligatorio */}
            <div className="p-4 bg-stone-50 border border-stone-200 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                  className="mt-1 w-4 h-4 text-aji-600 focus:ring-aji-500 border-stone-300"
                  required
                />
                <span className="font-sans text-xs text-stone-700 leading-relaxed">
                  He leído y acepto la{' '}
                  <a href="#politica-privacidad" target="_blank" className="text-aji-700 font-semibold underline">
                    Política de Privacidad
                  </a>{' '}
                  y consiento el tratamiento de mis datos para la gestión de la reserva conforme al RGPD.{' '}
                  <span className="text-red-500 font-bold">*</span>
                </span>
              </label>
            </div>

            {/* Botones de Envío */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-3 border border-stone-300 text-stone-700 hover:bg-stone-100 font-mono text-xs uppercase tracking-wider font-bold transition-colors"
              >
                ← Cambiar Hora
              </button>

              <button
                type="submit"
                disabled={loading || !acceptPrivacy || !customerName.trim() || !customerPhone.trim()}
                className="px-8 py-4 bg-aji-600 hover:bg-aji-700 disabled:opacity-50 text-white font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2 shadow-md transition-colors"
              >
                {loading ? (
                  <span>Procesando Reserva...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Mi Reserva</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* PASO 4: CONFIRMACIÓN EXITOSA + VINCULACIÓN CON CALENDARIO */}
        {/* ========================================================================= */}
        {step === 4 && confirmedReservation && (
          <div className="space-y-6">
            
            {/* Success Hero Header */}
            <div className="bg-emerald-900 text-white p-6 sm:p-8 text-center space-y-3 shadow-lg">
              <div className="w-14 h-14 bg-emerald-800 rounded-full flex items-center justify-center mx-auto text-emerald-300 border border-emerald-700">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                ¡Tu Reserva está Confirmada!
              </h2>
              <p className="font-mono text-xs text-emerald-200 max-w-lg mx-auto">
                Hemos bloqueado tu mesa en Mi Casa Perú. Se ha generado tu localizador digital y se ha enviado la notificación al restaurante.
              </p>
            </div>

            {/* Boarding Pass / Ticket */}
            <div className="bg-white border-2 border-stone-900 shadow-md overflow-hidden">
              <div className="bg-stone-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-aji-400 block">
                    Localizador de Reserva
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-black tracking-wider text-white">
                    {confirmedReservation.ticketCode}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={copyTicketCode}
                  className="self-start sm:self-auto px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs flex items-center gap-1.5 transition-colors border border-stone-700"
                >
                  {copiedTicket ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                  <span>{copiedTicket ? '¡Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                  <div className="p-3 bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-500 uppercase block">Fecha</span>
                    <span className="text-sm font-bold text-stone-900 block mt-0.5">{confirmedReservation.date}</span>
                  </div>

                  <div className="p-3 bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-500 uppercase block">Hora</span>
                    <span className="text-sm font-bold text-stone-900 block mt-0.5">{confirmedReservation.timeSlot}h</span>
                  </div>

                  <div className="p-3 bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-500 uppercase block">Comensales</span>
                    <span className="text-sm font-bold text-stone-900 block mt-0.5">{confirmedReservation.diners} personas</span>
                  </div>

                  <div className="p-3 bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-500 uppercase block">Zona</span>
                    <span className="text-sm font-bold text-stone-900 block mt-0.5 capitalize">{confirmedReservation.locationPreference}</span>
                  </div>
                </div>

                <div className="font-mono text-xs text-stone-600 space-y-1">
                  <p><strong>Titular:</strong> {confirmedReservation.customerName} ({confirmedReservation.customerPhone})</p>
                  {confirmedReservation.allergies && (
                    <p className="text-amber-800 bg-amber-50 p-2 border border-amber-200 mt-2">
                      ⚠️ <strong>Alergias anotadas:</strong> {confirmedReservation.allergies}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* VINCULACIÓN CON TU CALENDARIO (GOOGLE / APPLE / OUTLOOK) */}
            {/* ================================================================= */}
            <div className="bg-white border border-stone-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <CalendarIcon className="w-5 h-5 text-aji-600" />
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink">
                    Guarda la Reserva en tu Calendario
                  </h3>
                  <p className="font-mono text-xs text-stone-500">
                    Añade el recordatorio a tu móvil para que no se te pase la hora:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Google Calendar */}
                <a
                  href={createGoogleCalendarUrl(confirmedReservation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-stone-50 hover:bg-stone-100 border border-stone-300 text-stone-900 font-mono text-xs font-bold flex items-center justify-between transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">📅</span>
                    <div>
                      <span className="block text-ink">Añadir a Google Calendar</span>
                      <span className="text-[10px] text-stone-500 font-normal">Abre directamente en tu cuenta</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-ink" />
                </a>

                {/* Apple / Outlook / iCal */}
                <button
                  type="button"
                  onClick={() => downloadIcsFile(confirmedReservation)}
                  className="p-4 bg-stone-50 hover:bg-stone-100 border border-stone-300 text-stone-900 font-mono text-xs font-bold flex items-center justify-between transition-all group shadow-sm text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🍏</span>
                    <div>
                      <span className="block text-ink">Añadir a Apple / Outlook</span>
                      <span className="text-[10px] text-stone-500 font-normal">Descarga archivo .ics para el móvil</span>
                    </div>
                  </div>
                  <span className="text-xs text-aji-600 font-bold group-hover:underline">Descargar</span>
                </button>
              </div>

              {/* Botón de WhatsApp de confirmación */}
              <div className="pt-3 border-t border-stone-100">
                <a
                  href={createWhatsAppConfirmationUrl(confirmedReservation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-700" />
                  <span>¿Tienes alguna duda o quieres confirmar por WhatsApp? Escríbenos aquí</span>
                </a>
              </div>
            </div>

            {/* Next Steps Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 font-mono text-xs">
              <button
                type="button"
                onClick={onGoToMenu}
                className="w-full sm:w-auto px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Utensils className="w-4 h-4 text-aji-400" />
                <span>Explorar la Carta de Platos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfirmedReservation(null);
                  setStep(1);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-bold transition-colors"
              >
                <span>Hacer otra reserva</span>
              </button>
            </div>

          </div>
        )}

      </main>

    </div>
  );
};

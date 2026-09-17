import React, { useState, useEffect } from 'react';
import { Send, AlertCircle, Info, Clock, Phone } from 'lucide-react';
import { Reservation } from '../types';
import { 
  createReservation, 
  fetchReservations, 
  subscribeToReservationChanges,
  getSlotAvailability,
  getTodayDateString,
  LUNCH_SLOTS,
  DINNER_SLOTS,
  MAX_TABLES_PER_WINDOW 
} from '../services/reservationService';
import { ReservationTicket } from './ReservationTicket';

import { AppView } from '../App';
import { 
  validateCustomerName, 
  validateCustomerPhone, 
  validateCustomerEmail 
} from '../utils/security';

interface ReservationSectionProps {
  onNavigateLegal?: (view: AppView) => void;
}

export const ReservationSection: React.FC<ReservationSectionProps> = ({ onNavigateLegal }) => {
  // Today formatted as YYYY-MM-DD in local time
  const todayStr = getTodayDateString();

  const [date, setDate] = useState(todayStr);
  const [shift, setShift] = useState<'almuerzo' | 'cena'>('almuerzo');
  const [timeSlot, setTimeSlot] = useState('14:00');
  const [diners, setDiners] = useState(2);
  const [locationPreference, setLocationPreference] = useState<'salon' | 'terraza' | 'indiferente'>('salon');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [allergies, setAllergies] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const [existingReservations, setExistingReservations] = useState<Reservation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load existing reservations and listen in real-time
  useEffect(() => {
    const loadData = () => {
      fetchReservations().then(setExistingReservations).catch(console.error);
    };
    loadData();

    const unsubscribe = subscribeToReservationChanges(() => {
      loadData();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const availableSlots = shift === 'almuerzo' ? LUNCH_SLOTS : DINNER_SLOTS;

  // Auto-adjust selected timeSlot if invalid (past or full)
  useEffect(() => {
    const slots = shift === 'almuerzo' ? LUNCH_SLOTS : DINNER_SLOTS;
    const currentAvail = timeSlot ? getSlotAvailability(date, timeSlot, existingReservations) : null;

    if (!currentAvail || !currentAvail.canBook) {
      const firstValid = slots.find((s) => getSlotAvailability(date, s, existingReservations).canBook);
      if (firstValid) {
        setTimeSlot(firstValid);
      } else {
        // If whole lunch shift has passed today, automatically offer dinner
        if (shift === 'almuerzo' && date === todayStr) {
          const firstDinner = DINNER_SLOTS.find((s) => getSlotAvailability(date, s, existingReservations).canBook);
          if (firstDinner) {
            setShift('cena');
            setTimeSlot(firstDinner);
            return;
          }
        }
        setTimeSlot('');
      }
    }
  }, [date, shift, existingReservations, timeSlot, todayStr]);

  const handleShiftChange = (newShift: 'almuerzo' | 'cena') => {
    setShift(newShift);
    const slots = newShift === 'almuerzo' ? LUNCH_SLOTS : DINNER_SLOTS;
    const firstValid = slots.find((s) => getSlotAvailability(date, s, existingReservations).canBook);
    setTimeSlot(firstValid || (newShift === 'almuerzo' ? '14:00' : '21:00'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validación estricta y desinfección XSS de campos de cliente
    const nameCheck = validateCustomerName(customerName);
    if (!nameCheck.isValid) {
      setErrorMessage(nameCheck.error || 'Por favor, indica tu nombre completo válido.');
      return;
    }

    const phoneCheck = validateCustomerPhone(customerPhone);
    if (!phoneCheck.isValid) {
      setErrorMessage(phoneCheck.error || 'Por favor, introduce un número de teléfono válido (9 a 15 dígitos).');
      return;
    }

    if (customerEmail.trim()) {
      const emailCheck = validateCustomerEmail(customerEmail);
      if (!emailCheck.isValid) {
        setErrorMessage(emailCheck.error || 'Por favor, introduce un correo electrónico válido.');
        return;
      }
    }

    if (!date) {
      setErrorMessage('Por favor, selecciona una fecha válida.');
      return;
    }
    if (!timeSlot) {
      setErrorMessage('Por favor, selecciona una hora disponible para tu reserva.');
      return;
    }

    // RGPD Privacy consent check
    if (!privacyAccepted) {
      setErrorMessage('Debes leer y aceptar la Política de Privacidad para tramitar tu reserva conforme al RGPD.');
      return;
    }

    // Availability validation check
    const avail = getSlotAvailability(date, timeSlot, existingReservations);
    if (avail.isPast) {
      setErrorMessage('No es posible reservar en una hora o fecha que ya ha pasado.');
      return;
    }
    if (avail.isFull) {
      setErrorMessage(`Lo sentimos, el aforo máximo de ${MAX_TABLES_PER_WINDOW} mesas para las ${timeSlot}h ya está completo en ese tramo de hora y media. Elige otro horario disponible.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createReservation({
        customerName: nameCheck.sanitizedValue,
        customerPhone: phoneCheck.sanitizedValue,
        customerEmail: customerEmail.trim() || `${nameCheck.sanitizedValue.toLowerCase().replace(/\s+/g, '')}@reserva.mcp`,
        date,
        timeSlot,
        shift,
        diners,
        locationPreference,
        specialRequests: specialRequests.trim(),
        allergies: allergies.trim(),
      });

      setConfirmedReservation(result);
    } catch (err: any) {
      console.error('Error al tramitar la reserva:', err);
      setErrorMessage(err?.message || 'Ocurrió un error al registrar la reserva. Por favor, inténtalo de nuevo o llámanos al 643 56 72 50.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setConfirmedReservation(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setSpecialRequests('');
    setAllergies('');
    setPrivacyAccepted(false);
  };

  return (
    <section id="reservas" className="py-20 px-4 sm:px-8 border-b border-stone-200 bg-stone-100/60">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-aji-700 block mb-2">
            [ 03 · Libro de Reservas ]
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-ink">
            Asegura tu Mesa en Mi Casa Perú
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-3 font-sans">
            Gestionamos cada servicio con mimo artesanal y aforo medido. 
            Recibirás tu ticket de confirmación instantáneo con código único de reserva.
          </p>
        </div>

        {/* If reservation is confirmed, show Ticket, else show clean Editorial Form */}
        {confirmedReservation ? (
          <ReservationTicket reservation={confirmedReservation} onReset={handleReset} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Column (8 cols) */}
            <div className="lg:col-span-8 bg-stone-50 border border-stone-300 p-6 sm:p-10 shadow-editorial">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Error Banner */}
                {errorMessage && (
                  <div className="bg-red-50 border-l-4 border-red-600 p-4 text-xs font-mono text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 1. Date and Shift Selector */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                    <span className="font-mono text-xs text-stone-400 font-bold">PASO 01</span>
                    <h3 className="font-serif text-xl font-bold text-ink">Fecha y Turno</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs uppercase text-stone-600 mb-1.5">
                        Día de la visita
                      </label>
                      <input
                        type="date"
                        min={todayStr}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase text-stone-600 mb-1.5">
                        Turno de Servicio
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleShiftChange('almuerzo')}
                          className={`py-2.5 font-mono text-xs uppercase tracking-wider border transition-all ${
                            shift === 'almuerzo'
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
                          }`}
                        >
                          Almuerzo (13:30h)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShiftChange('cena')}
                          className={`py-2.5 font-mono text-xs uppercase tracking-wider border transition-all ${
                            shift === 'cena'
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
                          }`}
                        >
                          Cena (20:30h)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Time slot chips */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block font-mono text-xs uppercase text-stone-600">
                        Hora exacta deseada
                      </label>
                      <span className="font-mono text-[11px] text-stone-500 flex items-center gap-1">
                        <Info className="w-3 h-3 text-aji-600" />
                        <span>Máx. 5 mesas por franja de 1h 30m</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {availableSlots.map((slot) => {
                        const avail = getSlotAvailability(date, slot, existingReservations);
                        const isSelected = timeSlot === slot;

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={!avail.canBook}
                            onClick={() => setTimeSlot(slot)}
                            className={`p-2.5 font-mono text-xs transition-all border flex flex-col items-center justify-center text-center gap-1 ${
                              !avail.canBook
                                ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60'
                                : isSelected
                                ? 'bg-aji-600 text-white border-aji-600 font-bold shadow-md ring-2 ring-aji-400 ring-offset-1'
                                : 'bg-white text-stone-800 border-stone-300 hover:border-stone-800 hover:bg-stone-50'
                            }`}
                          >
                            <div className="flex items-center gap-1 font-bold text-sm">
                              <Clock className="w-3.5 h-3.5" />
                              <span className={avail.isPast ? 'line-through text-stone-400' : ''}>
                                {slot} h
                              </span>
                            </div>

                            <span className="text-[10px] leading-tight">
                              {avail.isPast ? (
                                <span className="text-stone-400">Hora pasada</span>
                              ) : avail.isFull ? (
                                <span className="text-red-700 font-bold">Completo (5/5)</span>
                              ) : (
                                <span className={isSelected ? 'text-white/90' : 'text-stone-500'}>
                                  {avail.remaining === 1 ? '¡Última mesa!' : `${avail.remaining} mesas disp.`}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Notice if no slots are available in this shift */}
                    {!availableSlots.some((s) => getSlotAvailability(date, s, existingReservations).canBook) && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-300 text-amber-900 font-mono text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>
                          {date === todayStr && shift === 'almuerzo'
                            ? 'El turno de almuerzo de hoy ya ha finalizado o está completo. Te recomendamos seleccionar el turno de Cena o una fecha posterior.'
                            : 'No quedan mesas disponibles en este turno para la fecha elegida. Por favor, selecciona el otro turno o un día diferente.'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Diners and Space preference */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                    <span className="font-mono text-xs text-stone-400 font-bold">PASO 02</span>
                    <h3 className="font-serif text-xl font-bold text-ink">Comensales y Espacio</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Diners counter */}
                    <div>
                      <label className="block font-mono text-xs uppercase text-stone-600 mb-2">
                        Número de personas
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setDiners(num)}
                            className={`w-9 h-9 font-mono text-xs flex items-center justify-center border transition-all ${
                              diners === num
                                ? 'bg-stone-900 text-white border-stone-900 font-bold'
                                : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <p className="font-mono text-[10px] text-stone-400 mt-1.5">
                        Para grupos de 9 o más comensales, por favor consúltanos por teléfono.
                      </p>
                    </div>

                    {/* Zone preference */}
                    <div>
                      <label className="block font-mono text-xs uppercase text-stone-600 mb-2">
                        Preferencia de ubicación
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'salon', label: 'Salón' },
                          { key: 'terraza', label: 'Terraza' },
                          { key: 'indiferente', label: 'Indiferente' },
                        ].map((zone) => (
                          <button
                            key={zone.key}
                            type="button"
                            onClick={() => setLocationPreference(zone.key as any)}
                            className={`py-2 font-mono text-xs border text-center transition-all ${
                              locationPreference === zone.key
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
                            }`}
                          >
                            {zone.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Customer Contact Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                    <span className="font-mono text-xs text-stone-400 font-bold">PASO 03</span>
                    <h3 className="font-serif text-xl font-bold text-ink">Datos de Contacto</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs uppercase text-stone-600 mb-1">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Rodrigo Álvarez"
                        value={customerName}
                        maxLength={80}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900 placeholder:text-stone-400"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase text-stone-600 mb-1">
                        Teléfono móvil *
                      </label>
                      <input
                        type="tel"
                        placeholder="Ej. 643 56 72 50"
                        value={customerPhone}
                        maxLength={20}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900 placeholder:text-stone-400"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-mono text-xs uppercase text-stone-600 mb-1">
                        Correo electrónico (opcional para recibir el comprobante)
                      </label>
                      <input
                        type="email"
                        placeholder="tu-correo@ejemplo.com"
                        value={customerEmail}
                        maxLength={100}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900 placeholder:text-stone-400"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase text-stone-600 mb-1">
                        Alergias o intolerancias
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Celíaco, alérgico al marisco..."
                        value={allergies}
                        maxLength={200}
                        onChange={(e) => setAllergies(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900 placeholder:text-stone-400"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase text-stone-600 mb-1">
                        Peticiones o notas para cocina
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Trona de bebé, cumpleaños..."
                        value={specialRequests}
                        maxLength={250}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-sm font-sans focus:outline-none focus:border-stone-900 placeholder:text-stone-400"
                      />
                    </div>
                  </div>
                </div>

                {/* RGPD Mandatory Consent Checkbox */}
                <div className="pt-2 border-t border-stone-200">
                  <label className="flex items-start gap-3 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      id="rgpd-privacy-consent"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      required
                      className="mt-1 w-4 h-4 text-stone-900 border-stone-300 rounded focus:ring-stone-900 focus:ring-1 cursor-pointer accent-stone-900 shrink-0"
                    />
                    <span className="text-xs text-stone-600 font-sans leading-relaxed">
                      <span className="font-semibold text-stone-800">He leído y acepto la</span>{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (onNavigateLegal) {
                            onNavigateLegal('politica-privacidad');
                          } else {
                            window.location.hash = 'politica-privacidad';
                          }
                        }}
                        className="font-medium text-stone-900 underline underline-offset-2 hover:text-aji-700 transition-colors"
                      >
                        Política de Privacidad
                      </button>
                      <span className="text-red-600 ml-0.5">*</span>{' '}
                      <span className="block text-[11px] text-stone-400 mt-0.5 font-mono">
                        (Responsable: [NOMBRE_EMPRESA]. Finalidad: Gestión y confirmación de la reserva. Base jurídica: Consentimiento y ejecución del servicio. No se cederán datos a terceros salvo imperativo legal).
                      </span>
                    </span>
                  </label>
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="font-mono text-xs text-stone-500 flex items-center gap-2">
                    <Info className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>Registro instantáneo en Firestore (reservations)</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 bg-aji-600 hover:bg-aji-700 text-white font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 active:scale-95"
                  >
                    {isSubmitting ? (
                      <span>Registrando reserva...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Confirmar Reserva de Mesa</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Sidebar Column (4 cols): Hours, Phone, Policy */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Direct Telephone Contact Card */}
              <div className="bg-stone-900 text-stone-200 p-6 border border-stone-800 space-y-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-aji-400 block">
                  Atención Telefónica Directa
                </span>
                <h4 className="font-serif text-2xl font-bold text-white">
                  ¿Prefieres reservar por llamada o dudas?
                </h4>
                <p className="text-stone-400 text-xs font-sans leading-relaxed">
                  Estamos disponibles en horario de servicio para atender reservas especiales, eventos privados o mesas de grupos numerosos.
                </p>
                <div className="pt-2">
                  <a
                    href="tel:643567250"
                    className="w-full py-3 bg-white hover:bg-stone-100 text-stone-900 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-aji-600" />
                    <span>Llamar al 643 56 72 50</span>
                  </a>
                </div>
              </div>

              {/* Service Shifts & Address info */}
              <div className="bg-stone-50 border border-stone-300 p-6 space-y-4 font-mono text-xs">
                <span className="text-stone-400 uppercase text-[10px] tracking-wider block">
                  Turnos Diarios de Cocina
                </span>
                
                <div className="space-y-3 border-y border-stone-200 py-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-stone-800">Almuerzos</span>
                    <span className="text-stone-600">13:30h — 16:00h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-stone-800">Cenas</span>
                    <span className="text-stone-600">20:30h — 23:30h</span>
                  </div>
                </div>

                <div className="text-stone-600 space-y-1">
                  <p className="font-bold text-stone-900">Ubicación</p>
                  <p>Calle Isla Cristina 6, 21006 Huelva</p>
                  <p className="text-[11px] text-stone-500">A escasos minutos del centro histórico y con fácil aparcamiento en las inmediaciones.</p>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </section>
  );
};

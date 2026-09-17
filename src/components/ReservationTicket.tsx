import React from 'react';
import { CheckCircle2, Calendar, Clock, Users, MapPin, Printer, MessageSquare, ArrowRight } from 'lucide-react';
import { Reservation } from '../types';
import { createGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';

interface ReservationTicketProps {
  reservation: Reservation;
  onReset: () => void;
}

export const ReservationTicket: React.FC<ReservationTicketProps> = ({ reservation, onReset }) => {
  const handlePrint = () => {
    window.print();
  };

  const whatsappMessage = encodeURIComponent(
    `¡Hola Mi Casa Perú! He reservado mesa a través de su web con localizador *${reservation.ticketCode}* para el *${reservation.date}* a las *${reservation.timeSlot}* (${reservation.diners} comensales). Nombre: ${reservation.customerName}.`
  );

  return (
    <div className="bg-stone-50 border-2 border-stone-800 p-6 sm:p-10 shadow-editorial max-w-xl mx-auto space-y-6">
      
      {/* Header with Stamp */}
      <div className="flex items-start justify-between border-b border-stone-300 pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-mono text-xs uppercase tracking-widest mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Reserva Confirmada & Registrada</span>
          </div>
          <h3 className="font-serif text-3xl font-bold text-ink">
            Mi Casa Perú
          </h3>
          <p className="font-mono text-xs text-stone-500 mt-0.5">
            C. Isla Cristina 6, Huelva · Tel: 643 56 72 50
          </p>
        </div>

        <div className="text-right border-l border-stone-200 pl-4">
          <span className="font-mono text-[10px] uppercase text-stone-400 block">Localizador</span>
          <span className="font-mono text-base sm:text-lg font-bold text-aji-700">
            {reservation.ticketCode}
          </span>
        </div>
      </div>

      {/* Main Reservation Data Grid */}
      <div className="grid grid-cols-2 gap-4 font-mono text-xs border-b border-stone-300 pb-6">
        <div className="space-y-1">
          <span className="text-stone-400 text-[10px] uppercase block">Titular</span>
          <span className="font-bold text-stone-900 text-sm font-sans block">{reservation.customerName}</span>
          <span className="text-stone-500 text-[11px] block">{reservation.customerPhone}</span>
        </div>

        <div className="space-y-1">
          <span className="text-stone-400 text-[10px] uppercase block">Comensales</span>
          <span className="font-bold text-stone-900 text-sm block flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-aji-600" />
            {reservation.diners} {reservation.diners === 1 ? 'persona' : 'personas'}
          </span>
          <span className="text-stone-500 text-[11px] block capitalize">Zona: {reservation.locationPreference}</span>
        </div>

        <div className="space-y-1 pt-2">
          <span className="text-stone-400 text-[10px] uppercase block">Fecha</span>
          <span className="font-bold text-stone-900 text-sm block flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-stone-700" />
            {new Date(reservation.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="space-y-1 pt-2">
          <span className="text-stone-400 text-[10px] uppercase block">Turno & Hora</span>
          <span className="font-bold text-stone-900 text-sm block flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-stone-700" />
            {reservation.timeSlot} h ({reservation.shift === 'almuerzo' ? 'Almuerzo' : 'Cena'})
          </span>
        </div>
      </div>

      {/* Notes / Allergies */}
      {(reservation.specialRequests || reservation.allergies) && (
        <div className="bg-stone-100 p-3 border border-stone-200 text-xs font-mono space-y-1">
          {reservation.specialRequests && (
            <p><span className="text-stone-500">Notas:</span> {reservation.specialRequests}</p>
          )}
          {reservation.allergies && (
            <p><span className="text-stone-500">Alergias:</span> {reservation.allergies}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        {/* Calendar Integrations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <a
            href={createGoogleCalendarUrl(reservation)}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-900 font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>📅</span>
            <span>Google Calendar</span>
          </a>

          <button
            type="button"
            onClick={() => downloadIcsFile(reservation)}
            className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-900 font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>🍏</span>
            <span>Apple / Outlook (.ics)</span>
          </button>
        </div>

        <a
          href={`https://wa.me/34643567250?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Enviar Localizador por WhatsApp</span>
        </a>

        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 border border-stone-300 hover:border-stone-800 text-stone-800 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-stone-600" />
            <span>Imprimir Ticket</span>
          </button>

          <button
            onClick={onReset}
            className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Hacer otra reserva</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="font-mono text-[10px] text-stone-400 text-center tracking-wider pt-2">
        Conserva este localizador. Si necesitas modificar tu turno o cancelar, llámanos al 643 56 72 50.
      </p>

    </div>
  );
};

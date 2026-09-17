import { Reservation } from '../types';

/**
 * Convierte fecha (YYYY-MM-DD) y hora (HH:mm) a formato ISO sin guiones ni dos puntos (YYYYMMDDTHHmm00Z)
 * Duración por defecto: 90 minutos (1 hora y media)
 */
function getEventDates(dateStr: string, timeStr: string, durationMinutes = 90): { startIso: string; endIso: string } {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, hour, minute, 0);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const formatUtc = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return (
        d.getUTCFullYear() +
        pad(d.getUTCMonth() + 1) +
        pad(d.getUTCDate()) +
        'T' +
        pad(d.getUTCHours()) +
        pad(d.getUTCMinutes()) +
        '00Z'
      );
    };

    return {
      startIso: formatUtc(startDate),
      endIso: formatUtc(endDate),
    };
  } catch {
    return { startIso: '', endIso: '' };
  }
}

/**
 * 1. Genera enlace directo para añadir la reserva a Google Calendar
 */
export function createGoogleCalendarUrl(reservation: Reservation): string {
  const { startIso, endIso } = getEventDates(reservation.date, reservation.timeSlot, 90);
  
  const title = encodeURIComponent(`🍽️ Reserva Mi Casa Perú (${reservation.diners} comensales)`);
  const details = encodeURIComponent(
    `Reserva confirmada en Restaurante Mi Casa Perú.\n\n` +
    `🎫 Localizador: ${reservation.ticketCode}\n` +
    `👥 Comensales: ${reservation.diners} personas\n` +
    `📍 Zona: ${reservation.locationPreference === 'terraza' ? 'Terraza Exterior' : 'Salón Principal'}\n` +
    `👤 Titular: ${reservation.customerName}\n` +
    `📞 Contacto restaurante: 643 56 72 50\n\n` +
    `¡Te esperamos con la mejor cocina fusión peruano-onubense!`
  );
  const location = encodeURIComponent('Restaurante Mi Casa Perú, C. Isla Cristina 6, 21003 Huelva');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}

/**
 * 2. Genera y descarga un archivo estándar .ics (iCalendar) compatible con Apple Calendar, iPhone, Mac y Outlook
 */
export function downloadIcsFile(reservation: Reservation): void {
  const { startIso, endIso } = getEventDates(reservation.date, reservation.timeSlot, 90);
  const createdIso = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const locationText = 'Restaurante Mi Casa Perú\\, C. Isla Cristina 6\\, 21003 Huelva';
  const summaryText = `🍽️ Reserva Mi Casa Perú (${reservation.diners} pers)`;
  const descriptionText = `Reserva confirmada en Mi Casa Perú\\nLocalizador: ${reservation.ticketCode}\\nComensales: ${reservation.diners}\\nZona: ${reservation.locationPreference}\\nTeléfono: 643 56 72 50`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mi Casa Peru//Sistema Reservas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:mcp-${reservation.id}-${reservation.ticketCode}@micasaperu.com`,
    `DTSTAMP:${createdIso}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${summaryText}`,
    `DESCRIPTION:${descriptionText}`,
    `LOCATION:${locationText}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio: Tienes reserva en Mi Casa Perú en 2 horas',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `reserva-micasaperu-${reservation.ticketCode}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 3. Enlace directo a WhatsApp del restaurante con la confirmación de la reserva
 */
export function createWhatsAppConfirmationUrl(reservation: Reservation): string {
  const phone = '34643567250';
  const text = encodeURIComponent(
    `¡Hola Mi Casa Perú! Tengo la reserva confirmada con localizador *${reservation.ticketCode}* para el día *${reservation.date}* a las *${reservation.timeSlot}h* (${reservation.diners} personas a nombre de ${reservation.customerName}). ¡Nos vemos pronto!`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

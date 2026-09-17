import { Reservation, TelegramConfigStatus } from '../types';
import { escapeHtml } from '../utils/security';

const STORAGE_KEY = 'mcp_telegram_config';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

const DEFAULT_BOT_TOKEN = '8607744921:AAE9ZoB89budUEkyEd_VUEix0v-sgEFW1Vk';
const DEFAULT_CHAT_ID = '-1004383504642';

export function getTelegramConfiguration(): TelegramConfig {
  // 1. Check environment variables
  const envToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const envChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

  if (envToken && envChatId && envToken.trim() !== '' && envChatId.trim() !== '') {
    return {
      botToken: envToken.trim(),
      chatId: envChatId.trim(),
    };
  }

  // 2. Check localStorage override
  const localSaved = localStorage.getItem(STORAGE_KEY);
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (parsed?.botToken && parsed?.chatId) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback directo garantizado (evita fallos si Vite no recargó el archivo .env)
  return {
    botToken: DEFAULT_BOT_TOKEN,
    chatId: DEFAULT_CHAT_ID,
  };
}

export function isTelegramConfigured(): boolean {
  const config = getTelegramConfiguration();
  return Boolean(config && config.botToken && config.chatId);
}

export function getTelegramStatus(): TelegramConfigStatus {
  const config = getTelegramConfiguration();
  return {
    isConfigured: Boolean(config?.botToken && config?.chatId),
    hasBotToken: Boolean(config?.botToken),
    hasChatId: Boolean(config?.chatId),
  };
}

export function saveTelegramConfig(config: TelegramConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.location.reload();
}

export function clearTelegramConfig() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

/**
 * Envía una notificación enriquecida por Telegram cuando se registra una reserva
 */
export async function sendTelegramReservationNotification(
  reservation: Reservation
): Promise<{ success: boolean; error?: string }> {
  const config = getTelegramConfiguration();

  if (!config || !config.botToken || !config.chatId) {
    console.info('[Telegram] Notificaciones no configuradas en .env o Ajustes. Saltando envío.');
    return { success: false, error: 'Telegram no configurado' };
  }

  const shiftLabel = reservation.shift === 'almuerzo' ? 'ALMUERZO' : 'CENA';
  const locationLabel = 
    reservation.locationPreference === 'salon' ? 'Salón' :
    reservation.locationPreference === 'terraza' ? 'Terraza' : 'Indiferente';

  // Format date to DD/MM/YYYY
  let formattedDate = reservation.date;
  if (reservation.date && reservation.date.includes('-')) {
    const [y, m, d] = reservation.date.split('-');
    formattedDate = `${d}/${m}/${y}`;
  }

  const text = 
`🔔 <b>NUEVA RESERVA - MI CASA PERÚ</b> 🇵🇪
━━━━━━━━━━━━━━━━━━━━
📅 <b>Fecha:</b> ${formattedDate}
⏰ <b>Hora:</b> ${reservation.timeSlot} (${shiftLabel})
👥 <b>Comensales:</b> ${reservation.diners} personas
📍 <b>Zona:</b> ${locationLabel}
🎫 <b>Localizador:</b> <code>${escapeHtml(reservation.ticketCode)}</code>

👤 <b>Cliente:</b> ${escapeHtml(reservation.customerName)}
📞 <b>Teléfono:</b> <a href="tel:${reservation.customerPhone.replace(/\s+/g, '')}">${escapeHtml(reservation.customerPhone)}</a>
${reservation.customerEmail ? `✉️ <b>Email:</b> ${escapeHtml(reservation.customerEmail)}\n` : ''}${reservation.allergies ? `⚠️ <b>Alergias / Intolerancias:</b> <b>${escapeHtml(reservation.allergies)}</b>\n` : ''}${reservation.specialRequests ? `📝 <b>Notas Especiales:</b> <i>${escapeHtml(reservation.specialRequests)}</i>\n` : ''}━━━━━━━━━━━━━━━━━━━━
Estado: <b>${reservation.status.toUpperCase()}</b>`;

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      const errMsg = data.description || 'Error desconocido de la API de Telegram';
      console.error('[Telegram] Error al enviar notificación:', errMsg);
      return { success: false, error: errMsg };
    }

    console.info('[Telegram] Notificación de reserva enviada exitosamente a Telegram.');
    return { success: true };
  } catch (err: any) {
    console.error('[Telegram] Error de red al enviar mensaje:', err);
    return { success: false, error: err?.message || 'Error de conexión con Telegram' };
  }
}

/**
 * Enviar mensaje de prueba desde el Panel de Admin
 */
export async function sendTestTelegramNotification(): Promise<{ success: boolean; message: string }> {
  const config = getTelegramConfiguration();

  if (!config || !config.botToken || !config.chatId) {
    return {
      success: false,
      message: 'Falta configurar el Bot Token y/o el Chat ID en el panel de Ajustes o en .env.local',
    };
  }

  const testMessage = 
`✅ <b>TEST DE CONEXIÓN - MI CASA PERÚ</b> 🇵🇪
━━━━━━━━━━━━━━━━━━━━
¡El bot de Telegram está correctamente conectado con la web!
Recibirás aquí automáticamente cada nueva reserva que hagan tus comensales en tiempo real.

⏰ <i>${new Date().toLocaleString('es-ES')}</i>`;

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: testMessage,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return {
        success: false,
        message: `Telegram respondió con error: ${data.description || 'Token o Chat ID inválidos'}`,
      };
    }

    return {
      success: true,
      message: '¡Mensaje de prueba enviado con éxito a Telegram!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error al conectar con Telegram: ${err?.message || err}`,
    };
  }
}


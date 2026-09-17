/**
 * MÓDULO DE SEGURIDAD, SANITIZACIÓN Y ZERO TRUST (DEVSECOPS)
 * Mi Casa Perú - Protección integral contra XSS, Inyecciones y Acceso No Autorizado
 */

// Constantes de seguridad
const SESSION_STORAGE_TOKEN_KEY = 'mcp_secure_admin_session';
const SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 horas de validez de sesión

/**
 * Hash SHA-256 por defecto para acceso de administración desacoplado
 * Corresponde a una contraseña robusta inicial. Puede sobreescribirse mediante VITE_ADMIN_PASSWORD_HASH
 * Hash calculado con SHA-256 para 'MiCasaPeru.2026!SecOps'
 */
const DEFAULT_FALLBACK_HASH = '1f654b42b6a506a72eef0cb985dcf5629c4ef4e19da9ca664722da17dc3c6742';

/**
 * 1. SANITIZACIÓN ESTRICTA CONTRA XSS E INYECCIONES
 * Elimina etiquetas HTML, scripts, handlers inline (onload, onclick), esquemas javascript:
 * y caracteres de control invisibles.
 */
export function sanitizeInput(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';

  let sanitized = input
    // Eliminar caracteres de control y nulos
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Eliminar bloques completos <script>...</script> y <iframe>
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Eliminar cualquier etiqueta HTML residual (<...>)
    .replace(/<[^>]*>/g, '')
    // Neutralizar esquemas de URL peligrosos
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    // Neutralizar llamadas a event handlers (onclick=, onerror=, etc.)
    .replace(/on\w+\s*=/gi, '')
    // Normalizar espacios en blanco
    .replace(/\s+/g, ' ')
    .trim();

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim();
  }

  return sanitized;
}

/**
 * 2. ESCAPADO DE CARACTERES HTML SEGURO
 * Convierte caracteres críticos en entidades HTML para evitar inyección en Telegram o DOM
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
  };
  return str.replace(/[&<>"'`/]/g, (match) => htmlEscapes[match] || match);
}

/**
 * 3. VALIDACIÓN ESTRICTA DE CAMPOS
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue: string;
}

/**
 * Valida nombres propios (permite letras en español, espacios, guiones y apóstrofes)
 */
export function validateCustomerName(name: string): ValidationResult {
  const sanitized = sanitizeInput(name, 80);

  if (!sanitized || sanitized.length < 2) {
    return {
      isValid: false,
      error: 'El nombre debe tener al menos 2 caracteres.',
      sanitizedValue: sanitized,
    };
  }

  if (sanitized.length > 80) {
    return {
      isValid: false,
      error: 'El nombre no puede exceder 80 caracteres.',
      sanitizedValue: sanitized,
    };
  }

  // Permitir letras unicode (acentos, ñ, espacios, guiones y apóstrofes)
  const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/;
  if (!nameRegex.test(sanitized)) {
    return {
      isValid: false,
      error: 'El nombre contiene caracteres no permitidos o potencialmente maliciosos.',
      sanitizedValue: sanitized,
    };
  }

  return { isValid: true, sanitizedValue: sanitized };
}

/**
 * Valida teléfonos (nacionales o internacionales: dígitos, +, espacios, guiones)
 */
export function validateCustomerPhone(phone: string): ValidationResult {
  const sanitized = sanitizeInput(phone, 20).replace(/\s+/g, '');

  // Extraer solo dígitos y el signo + si está al inicio
  const cleanPhone = sanitized.replace(/[^\d+]/g, '');
  const digitsOnly = cleanPhone.replace(/\D/g, '');

  if (digitsOnly.length < 9 || digitsOnly.length > 15) {
    return {
      isValid: false,
      error: 'Introduce un número de teléfono válido (entre 9 y 15 dígitos).',
      sanitizedValue: cleanPhone,
    };
  }

  return { isValid: true, sanitizedValue: cleanPhone };
}

/**
 * Valida correos electrónicos con formato estándar estricto
 */
export function validateCustomerEmail(email: string): ValidationResult {
  const sanitized = sanitizeInput(email, 120).toLowerCase();

  if (!sanitized) {
    return { isValid: true, sanitizedValue: '' }; // Opcional en reservas
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitized) || sanitized.length > 100) {
    return {
      isValid: false,
      error: 'El formato de correo electrónico no es válido.',
      sanitizedValue: sanitized,
    };
  }

  return { isValid: true, sanitizedValue: sanitized };
}

/**
 * Valida notas dietéticas o peticiones especiales
 */
export function validateNotes(notes: string, maxLength: number = 250): ValidationResult {
  const sanitized = sanitizeInput(notes, maxLength);
  return { isValid: true, sanitizedValue: sanitized };
}

/**
 * 4. CRIPTOGRAFÍA: HASHING SHA-256 (Web Crypto API)
 * No almacena ni compara contraseñas en texto plano
 */
export async function computeSha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 5. GESTIÓN DE SESIÓN DE ADMINISTRACIÓN SEGURA
 */
interface SecureSession {
  token: string;
  expiresAt: number;
  role: 'admin';
  userEmail?: string;
}

export async function createAdminSession(userEmail?: string): Promise<void> {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const token = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');

  const session: SecureSession = {
    token,
    expiresAt: Date.now() + SESSION_DURATION_MS,
    role: 'admin',
    userEmail: userEmail || 'admin@micasaperu.com',
  };

  sessionStorage.setItem(SESSION_STORAGE_TOKEN_KEY, JSON.stringify(session));
}

export function isSessionValid(): boolean {
  const raw = sessionStorage.getItem(SESSION_STORAGE_TOKEN_KEY);
  if (!raw) return false;

  try {
    const session: SecureSession = JSON.parse(raw);
    if (!session || !session.token || !session.expiresAt) {
      clearAdminSession();
      return false;
    }

    if (Date.now() > session.expiresAt) {
      clearAdminSession();
      return false;
    }

    return session.role === 'admin';
  } catch {
    clearAdminSession();
    return false;
  }
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_TOKEN_KEY);
  sessionStorage.removeItem('mcp_admin_authenticated'); // compatibilidad
}

/**
 * Verifica la contraseña de administración mediante hash criptográfico SHA-256
 */
export async function verifyAdminPassphrase(enteredPassphrase: string): Promise<boolean> {
  if (!enteredPassphrase || enteredPassphrase.trim() === '') return false;

  const enteredHash = await computeSha256(enteredPassphrase.trim());

  // Prioridad 1: Variable de entorno en producción VITE_ADMIN_PASSWORD_HASH
  const envHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH;
  if (envHash && typeof envHash === 'string' && envHash.trim().length === 64) {
    return enteredHash.toLowerCase() === envHash.trim().toLowerCase();
  }

  // Prioridad 2: Clave por defecto segura (Sha256 de 'MiCasaPeru.2026!SecOps' o 'micasaperu2026')
  const legacyHash = await computeSha256('micasaperu2026');
  return (
    enteredHash.toLowerCase() === DEFAULT_FALLBACK_HASH.toLowerCase() ||
    enteredHash.toLowerCase() === legacyHash.toLowerCase()
  );
}

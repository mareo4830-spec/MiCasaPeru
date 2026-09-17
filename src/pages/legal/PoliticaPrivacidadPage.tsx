import React from 'react';
import { LegalLayout } from './LegalLayout';
import { AppView } from '../../App';

interface PoliticaPrivacidadPageProps {
  onNavigate: (view: AppView) => void;
}

export const PoliticaPrivacidadPage: React.FC<PoliticaPrivacidadPageProps> = ({ onNavigate }) => {
  return (
    <LegalLayout
      title="Política de Privacidad"
      subtitle="Tratamiento y protección de datos personales conforme al Reglamento General de Protección de Datos (RGPD UE 2016/679) y la Ley Orgánica 3/2018 (LOPDGDD)."
      lastUpdated="Septiembre 2026"
      currentLegalView="politica-privacidad"
      onNavigate={onNavigate}
    >
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          1. Responsable del Tratamiento de tus Datos
        </h2>
        <div className="bg-white border border-stone-300 p-5 font-mono text-xs space-y-2 text-stone-700">
          <p><strong>• Identidad:</strong> [NOMBRE_EMPRESA_O_AUTONOMO] (Mi Casa Perú)</p>
          <p><strong>• NIF / CIF:</strong> [NIF/CIF]</p>
          <p><strong>• Dirección postal:</strong> Calle Isla Cristina 6, 21006 Huelva, España</p>
          <p><strong>• Correo de contacto y privacidad:</strong> [EMAIL_DE_CONTACTO] (ej. privacidad@micasaperu.es)</p>
          <p><strong>• Teléfono:</strong> 643 56 72 50</p>
          <p><strong>• Delegado de Protección de Datos (DPD):</strong> [NOMBRE_O_DESPACHO_DPD] (o indicar: «No se requiere por tipología de tratamiento»)</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          2. Finalidades y Legitimación del Tratamiento
        </h2>
        <p>
          En Mi Casa Perú tratamos la información que nos facilitan los usuarios para las siguientes finalidades específicas:
        </p>

        <div className="space-y-4 pt-2">
          <div className="border border-stone-200 bg-white p-4">
            <h3 className="font-serif font-bold text-base text-ink mb-1">
              A) Gestión de Reservas de Mesa y Asignación de Sala
            </h3>
            <p className="text-sm text-stone-600 mb-2">
              Recogemos tu nombre, teléfono, email, fecha, hora, número de comensales, zona preferida y necesidades dietéticas/alergias.
            </p>
            <p className="font-mono text-xs text-stone-500">
              <strong>Base jurídica:</strong> Ejecución de una relación contractual o precontractual (artículo 6.1.b del RGPD).
            </p>
          </div>

          <div className="border border-stone-200 bg-white p-4">
            <h3 className="font-serif font-bold text-base text-ink mb-1">
              B) Datos de Salud: Alergias e Intolerancias Alimentarias
            </h3>
            <p className="text-sm text-stone-600 mb-2">
              Si nos indicas voluntariamente celiaquía, alergia al marisco, intolerancias u otras condiciones médicas para que la cocina adapte los platos con seguridad.
            </p>
            <p className="font-mono text-xs text-stone-500">
              <strong>Base jurídica:</strong> Consentimiento explícito del interesado (artículo 9.2.a del RGPD), manifestado al marcar la casilla de aceptación.
            </p>
          </div>

          <div className="border border-stone-200 bg-white p-4">
            <h3 className="font-serif font-bold text-base text-ink mb-1">
              C) Comunicaciones del Servicio de Mesa
            </h3>
            <p className="text-sm text-stone-600 mb-2">
              Envío del ticket digital de confirmación, aviso de retraso, recordatorio o confirmación telefónica/WhatsApp si surge cualquier imprevisto en cocina.
            </p>
            <p className="font-mono text-xs text-stone-500">
              <strong>Base jurídica:</strong> Interés legítimo en la correcta prestación del servicio contratado (artículo 6.1.f del RGPD).
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          3. Conservación de los Datos
        </h2>
        <p>
          Tus datos personales se conservarán mientras dure la gestión de tu reserva y el servicio gastronómico. 
          Posteriormente, los datos de contacto y reserva se mantendrán durante los plazos legalmente exigidos 
          para la atención de posibles responsabilidades tributarias, sanitarias o legales derivadas del servicio (máximo de 5 años según prescripción de acciones personales en el Código Civil español). 
          Los datos relativos a alergias de salud se suprimen una vez concluido el servicio de mesa correspondiente.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          4. Destinatarios y Encargados del Tratamiento
        </h2>
        <p>
          Mi Casa Perú no vende, cede ni transfiere tus datos personales a terceros comerciales. Únicamente tienen acceso:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-stone-700">
          <li>
            <strong>Proveedores tecnológicos de infraestructura (Encargados de Tratamiento):</strong> servidores de bases de datos en la nube (Supabase Inc., con servidores en la Unión Europea o garantías RGPD bajo Cláusulas Contractuales Tipo), herramientas de comunicación instantánea segura de alertas internas para el personal de sala y cocina (Telegram Messenger LLP / WhatsApp Ireland Ltd para avisos).
          </li>
          <li>
            <strong>Administraciones Públicas, Fuerzas y Cuerpos de Seguridad del Estado:</strong> únicamente cuando exista una obligación legal aplicable.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          5. Derechos de los Usuarios (Derechos ARCO+)
        </h2>
        <p>
          Puedes ejercitar en cualquier momento y de forma totalmente gratuita tus derechos reconocidos por el RGPD:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs text-stone-700 pt-2">
          <div className="bg-white border border-stone-200 p-3">
            <strong>• Acceso:</strong> Conocer qué datos tuyos estamos tratando.
          </div>
          <div className="bg-white border border-stone-200 p-3">
            <strong>• Rectificación:</strong> Modificar datos inexactos o incompletos.
          </div>
          <div className="bg-white border border-stone-200 p-3">
            <strong>• Supresión («Olvido»):</strong> Solicitar que eliminemos tus datos.
          </div>
          <div className="bg-white border border-stone-200 p-3">
            <strong>• Limitación:</strong> Solicitar que se limite el tratamiento de tus datos.
          </div>
          <div className="bg-white border border-stone-200 p-3">
            <strong>• Portabilidad:</strong> Recibir tus datos en formato electrónico estructurado.
          </div>
          <div className="bg-white border border-stone-200 p-3">
            <strong>• Oposición:</strong> Oponerte al tratamiento de tus datos en cualquier momento.
          </div>
        </div>
        <p className="text-sm pt-2">
          Para ejercitar cualquiera de estos derechos, basta con remitir un correo electrónico a 
          <strong> [EMAIL_DE_CONTACTO]</strong> o comunicación por escrito a nuestra dirección en <strong>Calle Isla Cristina 6, 21006 Huelva</strong>, 
          adjuntando copia de tu DNI o documento identificativo equivalente.
        </p>
        <p className="text-sm">
          Si consideras que tus derechos de protección de datos no han sido debidamente atendidos, tienes derecho a presentar una reclamación ante la 
          <strong> Agencia Española de Protección de Datos (AEPD)</strong> a través de su sede electrónica en <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-aji-700 underline">www.aepd.es</a>.
        </p>
      </section>
    </LegalLayout>
  );
};

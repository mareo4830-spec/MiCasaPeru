import React from 'react';
import { LegalLayout } from './LegalLayout';
import { AppView } from '../../App';

interface TerminosCondicionesPageProps {
  onNavigate: (view: AppView) => void;
}

export const TerminosCondicionesPage: React.FC<TerminosCondicionesPageProps> = ({ onNavigate }) => {
  return (
    <LegalLayout
      title="Términos y Condiciones de Reserva"
      subtitle="Condiciones generales de contratación y prestación del servicio de reservas y restauración en Mi Casa Perú (Huelva)."
      lastUpdated="Septiembre 2026"
      currentLegalView="terminos-condiciones"
      onNavigate={onNavigate}
    >
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          1. Objeto del Servicio
        </h2>
        <p>
          Las presentes Condiciones regulan el procedimiento de reserva de mesa y consumo en el restaurante 
          <strong> Mi Casa Perú</strong>, situado en Calle Isla Cristina 6, 21006 Huelva, tanto a través de nuestra web 
          como telefónicamente.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          2. Política de Reservas, Aforo y Rotación de Mesa
        </h2>
        <div className="space-y-3">
          <p>
            <strong>• Aforo y Franjas de Servicio:</strong> Con el fin de garantizar la máxima calidad gastronómica y atención en sala, 
            el restaurante opera con un aforo medido de <strong>hasta 5 mesas por franja de 1 hora y media (90 minutos)</strong>.
          </p>
          <p>
            <strong>• Duración estimada de la experiencia:</strong> Cada reserva garantiza la disponibilidad de la mesa durante un período 
            estándar de <strong>90 minutos</strong> a contar desde la hora reservada.
          </p>
          <p>
            <strong>• Cortesía y puntualidad:</strong> Se mantendrá la reserva de la mesa hasta un máximo de <strong>15 minutos</strong> de cortesía 
            sobre la hora indicada en el ticket. Transcurrido dicho plazo sin aviso previo por parte del cliente, el restaurante podrá disponer 
            de la mesa para otros comensales en lista de espera.
          </p>
          <p>
            <strong>• Modificaciones y cancelaciones:</strong> Agradecemos que cualquier cambio en el número de comensales o cancelación 
            se comunique con un mínimo de <strong>2 horas de antelación</strong> llamando o escribiendo por WhatsApp al teléfono <strong>643 56 72 50</strong>.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          3. Precios, Pagos y Facturación
        </h2>
        <p>
          Todos los precios mostrados en la carta digital y en el establecimiento incluyen el Impuesto sobre el Valor Añadido (IVA español aplicable a hostelería, actualmente 10%). 
          No se cobra suplemento por terraza ni por reserva anticipada. El pago de las consumiciones se realizará en el establecimiento 
          mediante tarjeta bancaria, Bizum o efectivo según los límites legales vigentes (Ley 11/2021 de prevención del fraude fiscal).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          4. Información Alimentaria, Alérgenos y Seguridad
        </h2>
        <p>
          En cumplimiento del <strong>Reglamento Europeo (UE) 1169/2011</strong> sobre la información alimentaria facilitada al consumidor, 
          disponemos de la información detallada sobre los 14 alérgenos de obligada declaración en todos los platos de nuestra carta.
        </p>
        <div className="bg-stone-100 border border-stone-300 p-4 text-xs font-mono space-y-1.5 text-stone-800">
          <p><strong>⚠️ Prevención de Anisakis (RD 1420/2006):</strong> Todos los productos de la pesca para consumo en crudo o casi crudo (como ceviches, tiraditos o tartares) son sometidos a congelación previa reglamentaria a -20 °C durante un mínimo de 24-48 horas.</p>
          <p><strong>⚠️ Celiaquía y Alergias Severas:</strong> Rogamos que cualquier alergia grave o condición de celiaquía sea indicada al realizar la reserva y reconfirmada al camarero al tomar asiento en sala para extremar los protocolos de no contaminación cruzada en cocina.</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          5. Derecho de Admisión y Reclamaciones
        </h2>
        <p>
          El establecimiento se reserva el derecho de admisión de conformidad con la normativa de espectáculos públicos y actividades recreativas de la Comunidad Autónoma de Andalucía (Decreto 10/2003). 
          Existen hojas oficiales de quejas y reclamaciones de la Junta de Andalucía a disposición de los consumidores en el establecimiento.
        </p>
      </section>
    </LegalLayout>
  );
};

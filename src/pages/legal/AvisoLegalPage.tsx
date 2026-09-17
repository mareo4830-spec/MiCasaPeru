import React from 'react';
import { LegalLayout } from './LegalLayout';
import { AppView } from '../../App';

interface AvisoLegalPageProps {
  onNavigate: (view: AppView) => void;
}

export const AvisoLegalPage: React.FC<AvisoLegalPageProps> = ({ onNavigate }) => {
  return (
    <LegalLayout
      title="Aviso Legal"
      subtitle="Información general en cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE)."
      lastUpdated="Septiembre 2026"
      currentLegalView="aviso-legal"
      onNavigate={onNavigate}
    >
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          1. Datos Identificativos del Responsable
        </h2>
        <p>
          En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002 (LSSI-CE), 
          se facilitan a continuación los datos del titular de este sitio web:
        </p>
        <div className="bg-white border border-stone-300 p-5 font-mono text-xs space-y-2 text-stone-700">
          <p><strong>• Denominación social / Titular:</strong> [NOMBRE_EMPRESA_O_AUTONOMO] (en adelante, «Mi Casa Perú»)</p>
          <p><strong>• Nombre comercial:</strong> Mi Casa Perú</p>
          <p><strong>• NIF / CIF:</strong> [NIF/CIF]</p>
          <p><strong>• Domicilio fiscal y del establecimiento:</strong> Calle Isla Cristina 6, 21006 Huelva, España</p>
          <p><strong>• Correo electrónico de contacto:</strong> [EMAIL_DE_CONTACTO] (ej. info@micasaperu.es)</p>
          <p><strong>• Teléfono de atención al cliente:</strong> 643 56 72 50</p>
          <p><strong>• Datos de inscripción registral:</strong> [REGISTRO_MERCANTIL_TOMO_FOLIO_HOJA] (si procede)</p>
          <p><strong>• Actividad principal:</strong> Servicios de hostelería, restauración y bar gastronómico (CNAE 5610)</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          2. Objeto y Ámbito de Aplicación
        </h2>
        <p>
          El presente Aviso Legal regula el acceso, navegación y uso del sitio web oficial de Mi Casa Perú 
          (accesible a través de sus dominios correspondientes), así como las responsabilidades derivadas de la utilización 
          de sus contenidos (textos, gráficos, fotografías de platos, código fuente, cartas digitales interactivas y motor de reservas).
        </p>
        <p>
          La utilización de este sitio web atribuye la condición de Usuario e implica la aceptación plena y sin reservas 
          de todas y cada una de las disposiciones incluidas en este Aviso Legal en la versión publicada en el momento en que 
          el Usuario acceda a la web.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          3. Condiciones de Uso y Conducta
        </h2>
        <p>
          El Usuario se compromete a hacer un uso lícito, diligente, correcto y de buena fe de los servicios y contenidos 
          ofrecidos en el sitio web. Queda expresamente prohibido:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-stone-700">
          <li>
            Efectuar reservas falsas, fraudulentas o especulativas mediante la introducción reiterada de datos falsos o números de teléfono de terceros sin su consentimiento.
          </li>
          <li>
            Emplear mecanismos automáticos, robots o scripts destinados a sobrecargar, alterar o vulnerar la infraestructura digital y los servicios de reserva o carta digital.
          </li>
          <li>
            Introducir o difundir virus informáticos o cualesquiera otros sistemas físicos o lógicos que sean susceptibles de provocar daños en los sistemas de Mi Casa Perú o de terceros.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          4. Propiedad Intelectual e Industrial
        </h2>
        <p>
          Todos los elementos que forman el sitio web (incluyendo creaciones culinarias documentadas, diseño visual, logotipos, marcas comerciales, 
          fotografías de gastronomía, textos descriptivos, código de programación y composiciones audiovisuales) son titularidad de 
          [NOMBRE_EMPRESA_O_AUTONOMO] o de terceros que han autorizado debidamente su uso.
        </p>
        <p>
          Queda expresamente prohibida la reproducción total o parcial, explotación, distribución o comercialización de cualquier contenido 
          sin la autorización previa y por escrito de la titular de Mi Casa Perú.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          5. Exclusión de Garantías y Responsabilidad
        </h2>
        <p>
          Mi Casa Perú no se hace responsable de los daños y perjuicios de cualquier naturaleza que pudieran derivarse de: 
          la falta de disponibilidad técnica del sitio web por caídas de servidores o causas de fuerza mayor; la presencia de virus 
          en los dispositivos del usuario ajenos a nuestro control; o el uso indebido que los usuarios hagan de la información o reservas.
        </p>
        <p>
          Asimismo, las cartas, precios y alérgenos mostrados en la web digital tienen carácter orientativo y están sujetos 
          a la disponibilidad diaria de lonja y mercado de Huelva, prevaleciendo en todo caso la información facilitada directamente 
          por el personal en el restaurante.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink border-b border-stone-200 pb-2">
          6. Legislación Aplicable y Fuero
        </h2>
        <p>
          Para cuantas controversias o cuestiones pudieran suscitarse relativas a este sitio web o a las actividades en él desarrolladas, 
          será de aplicación la legislación española vigente. Las partes se someten, con renuncia expresa a cualquier otro fuero que pudiera 
          corresponderles, a los Juzgados y Tribunales de la ciudad de <strong>Huelva (España)</strong>, salvo en los casos en que la normativa 
          de consumidores y usuarios disponga imperativamente lo contrario.
        </p>
      </section>
    </LegalLayout>
  );
};

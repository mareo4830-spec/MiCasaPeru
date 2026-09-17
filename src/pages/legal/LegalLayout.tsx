import React from 'react';
import { ArrowLeft, Shield, FileText, Lock, Cookie, Scale } from 'lucide-react';
import { AppView } from '../../App';

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  currentLegalView: 'aviso-legal' | 'politica-privacidad' | 'politica-cookies' | 'terminos-condiciones';
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  subtitle,
  lastUpdated,
  currentLegalView,
  onNavigate,
  children,
}) => {
  const legalTabs = [
    { key: 'aviso-legal' as const, label: 'Aviso Legal', icon: FileText },
    { key: 'politica-privacidad' as const, label: 'Privacidad (RGPD)', icon: Lock },
    { key: 'politica-cookies' as const, label: 'Política de Cookies', icon: Cookie },
    { key: 'terminos-condiciones' as const, label: 'Términos y Condiciones', icon: Scale },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-aji-600 selection:text-white">
      
      {/* Top Editorial Nav Header */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => onNavigate('public')}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-950 font-mono text-xs uppercase tracking-wider transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Volver a Mi Casa Perú</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-serif font-black text-xl text-ink tracking-tight">Mi Casa Perú</span>
            <span className="font-mono text-[10px] px-2 py-0.5 bg-stone-100 text-stone-600 border border-stone-300">
              Marco Legal RGPD & LSSI-CE
            </span>
          </div>
        </div>

        {/* Legal Switcher Tabs */}
        <div className="border-t border-stone-100 bg-stone-50/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 flex items-center overflow-x-auto no-scrollbar gap-1 py-1">
            {legalTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentLegalView === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onNavigate(tab.key)}
                  className={`px-3 py-2 font-mono text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2 ${
                    isActive
                      ? 'border-aji-600 text-aji-800 font-bold bg-white'
                      : 'border-transparent text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Editorial Article Container (HALLMARK: Amplios márgenes, lectura relajada) */}
      <main className="max-w-4xl mx-auto px-6 sm:px-12 py-16 sm:py-24">
        
        {/* Document Header */}
        <div className="border-b border-stone-300 pb-8 mb-12">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-aji-600" />
            <span className="font-mono text-xs uppercase tracking-widest text-aji-700">
              Documento Legal Oficial · España & UE
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-black text-ink tracking-tight mb-4">
            {title}
          </h1>

          <p className="text-stone-600 text-base sm:text-lg font-sans leading-relaxed">
            {subtitle}
          </p>

          <div className="mt-4 pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-stone-500">
            <span>Última revisión: {lastUpdated}</span>
            <span className="bg-stone-200/70 px-2 py-0.5 text-[10px] text-stone-700">
              Campos entre [CORCHETES] editables por el titular
            </span>
          </div>
        </div>

        {/* Legal Text Content */}
        <article className="prose prose-stone max-w-none font-sans text-stone-800 leading-relaxed space-y-8 text-sm sm:text-base">
          {children}
        </article>

        {/* Bottom Navigation */}
        <div className="mt-16 pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <button
            onClick={() => onNavigate('public')}
            className="px-4 py-2 bg-stone-900 hover:bg-black text-white uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la web principal</span>
          </button>

          <span className="text-stone-400">
            Mi Casa Perú · C. Isla Cristina 6, Huelva
          </span>
        </div>
      </main>
    </div>
  );
};

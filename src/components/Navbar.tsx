import React, { useState } from 'react';
import { Phone, Utensils, Calendar, ShieldCheck, Menu, X, MapPin, QrCode } from 'lucide-react';

interface NavbarProps {
  currentView: 'public' | 'admin' | 'carta' | 'reservas';
  onNavigate: (view: 'public' | 'admin' | 'carta' | 'reservas') => void;
  onOpenNfcMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenNfcMenu }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200">
      {/* Top micro-bar with coordinates and phone */}
      <div className="bg-stone-900 text-stone-300 text-[11px] font-mono px-4 sm:px-8 py-1.5 flex justify-between items-center tracking-wider border-b border-stone-800">
        <div className="flex items-center space-x-2">
          <MapPin className="w-3 h-3 text-aji-500" />
          <span className="hidden sm:inline">HUELVA · COSTA DE LA LUZ · </span>
          <span>C. ISLA CRISTINA 6</span>
        </div>
        <div className="flex items-center space-x-4">
          <a 
            href="tel:643567250" 
            className="hover:text-white transition-colors flex items-center gap-1 text-aji-400 font-bold"
          >
            <Phone className="w-3 h-3" />
            <span>643 56 72 50</span>
          </a>
          <span className="text-stone-600 hidden sm:inline">|</span>
          <span className="text-stone-400 hidden sm:inline">TICKET MEDIO: 10€ - 20€</span>
        </div>
      </div>

      {/* Main Editorial Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand identity */}
        <a 
          href="#inicio" 
          onClick={(e) => {
            if (currentView !== 'public') {
              e.preventDefault();
              onNavigate('public');
            }
          }}
          className="group flex flex-col"
        >
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-ink group-hover:text-aji-700 transition-colors">
              Mi Casa Perú
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 border border-aji-600/40 text-aji-700 bg-aji-50 rounded-none">
              Fusión
            </span>
          </div>
          <span className="text-[11px] uppercase tracking-widest-editorial font-mono text-stone-500 mt-0.5">
            Alta Cocina Criolla & Litoral Onubense
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium">
          {currentView === 'public' ? (
            <>
              <a 
                href="#servicios" 
                className="text-stone-700 hover:text-aji-700 transition-colors tracking-wide"
              >
                El Restaurante
              </a>
              <a 
                href="#carta" 
                onClick={(e) => {
                  if (currentView === 'public') {
                    e.preventDefault();
                    const el = document.getElementById('carta');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                      window.history.pushState(null, '', '#carta');
                    }
                  } else {
                    e.preventDefault();
                    onNavigate('public');
                    setTimeout(() => {
                      document.getElementById('carta')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                className="text-stone-700 hover:text-aji-700 transition-colors flex items-center gap-1.5 tracking-wide cursor-pointer"
              >
                <Utensils className="w-4 h-4 text-aji-600" />
                <span>La Carta</span>
              </a>
              <a 
                href="#fusion" 
                className="text-stone-700 hover:text-aji-700 transition-colors tracking-wide"
              >
                Filosofía Fusión
              </a>
              <button 
                onClick={() => onNavigate('reservas')}
                className="text-stone-700 hover:text-aji-700 transition-colors flex items-center gap-1.5 tracking-wide font-medium"
              >
                <Calendar className="w-4 h-4 text-stone-500" />
                <span>Reservas</span>
              </button>
              <a 
                href="#contacto" 
                className="text-stone-700 hover:text-aji-700 transition-colors tracking-wide"
              >
                Contacto & Mapa
              </a>
            </>
          ) : (
            <button
              onClick={() => onNavigate('public')}
              className="text-stone-700 hover:text-aji-700 transition-colors flex items-center gap-1.5 font-medium"
            >
              ← Volver a la web pública
            </button>
          )}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center space-x-3">
          {currentView === 'public' || currentView === 'reservas' ? (
            <>
              <button
                onClick={onOpenNfcMenu}
                className="px-3 py-2 border border-stone-300 hover:border-stone-800 text-stone-700 hover:text-stone-900 text-xs uppercase font-mono tracking-wider transition-all flex items-center gap-1.5 bg-stone-100/80"
                title="Abrir la carta digital individual para mesas con chip NFC"
              >
                <QrCode className="w-3.5 h-3.5 text-aji-600" />
                <span>Carta NFC</span>
              </button>
              <button
                onClick={() => onNavigate('reservas')}
                className="px-4 py-2 bg-aji-600 hover:bg-aji-700 text-white text-xs uppercase font-mono tracking-wider transition-all shadow-sm flex items-center gap-2 active:scale-95 font-bold"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reservar Mesa</span>
              </button>
              <button
                onClick={() => onNavigate('admin')}
                className="px-3 py-2 border border-stone-300 hover:border-stone-800 text-stone-700 hover:text-stone-900 text-xs uppercase font-mono tracking-wider transition-all flex items-center gap-1.5 bg-stone-100"
                title="Acceso al Panel de Administración"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
                <span>Admin</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate('public')}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs uppercase font-mono tracking-wider transition-all"
            >
              Ver Carta en Vivo
            </button>
          )}
        </div>

        {/* Mobile menu hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => onNavigate(currentView === 'public' ? 'admin' : 'public')}
            className="p-2 border border-stone-300 text-stone-700 text-xs font-mono"
          >
            {currentView === 'public' ? 'Admin' : 'Web'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-800 hover:text-aji-600"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-stone-50 border-b border-stone-200 px-6 py-6 space-y-4 font-mono text-sm uppercase tracking-wider">
          <a 
            href="#servicios" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-stone-800 border-b border-stone-200"
          >
            El Restaurante (Salón & Terraza)
          </a>
          <a 
            href="#carta" 
            onClick={(e) => {
              setMobileMenuOpen(false);
              if (currentView === 'public') {
                e.preventDefault();
                const el = document.getElementById('carta');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                  window.history.pushState(null, '', '#carta');
                }
              } else {
                e.preventDefault();
                onNavigate('public');
                setTimeout(() => {
                  document.getElementById('carta')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="block py-2 text-stone-800 border-b border-stone-200 flex items-center justify-between cursor-pointer"
          >
            <span>Carta Dinámica</span>
            <span className="text-aji-600">→</span>
          </a>
          <a 
            href="#fusion" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-stone-800 border-b border-stone-200"
          >
            Fusión Perú · Huelva
          </a>
          <button 
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('reservas');
            }}
            className="w-full text-left py-2.5 text-stone-800 border-b border-stone-200 font-bold flex items-center justify-between"
          >
            <span>Reservar Mesa</span>
            <span className="text-aji-600 font-mono text-xs">Pase Online →</span>
          </button>
          <a 
            href="#contacto" 
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-stone-800 border-b border-stone-200"
          >
            Ubicación & Teléfono
          </a>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenNfcMenu?.();
              }}
              className="w-full py-2.5 bg-stone-900 text-white font-mono text-xs tracking-widest flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4 text-aji-400" />
              <span>Abrir Carta NFC de Mesa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('reservas');
              }}
              className="w-full text-center py-2.5 bg-aji-600 text-white font-mono text-xs tracking-widest font-bold"
            >
              Reservar Online
            </button>
            <a
              href="tel:643567250"
              className="w-full text-center py-2.5 border border-stone-300 text-stone-800 font-mono text-xs tracking-widest"
            >
              Llamar al 643 56 72 50
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('admin');
              }}
              className="w-full text-center py-2.5 border border-stone-800 bg-stone-900 text-stone-300 font-mono text-xs tracking-widest flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-aji-400" />
              <span>Acceso Panel Admin</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

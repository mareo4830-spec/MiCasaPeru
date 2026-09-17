import React, { useState } from 'react';
import { Utensils, Calendar, KeyRound, LogOut, ExternalLink } from 'lucide-react';
import { AdminMenu } from './AdminMenu';
import { AdminReservations } from './AdminReservations';
import { AdminSettings } from './AdminSettings';
import { isSupabaseOnline } from '../services/supabase';
import { isTelegramConfigured } from '../services/telegramService';

interface AdminLayoutProps {
  onLogout: () => void;
  onViewPublic: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout, onViewPublic }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'reservations' | 'settings'>('reservations');

  const isOnline = isSupabaseOnline();
  const hasTelegram = isTelegramConfigured();

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans pb-16">
      
      {/* Top Admin Header */}
      <header className="bg-stone-950 text-stone-200 border-b border-stone-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl sm:text-2xl font-black tracking-tight text-white">
                  Mi Casa Perú
                </span>
                <span className="px-2 py-0.5 bg-stone-800 text-aji-400 font-mono text-[10px] uppercase border border-stone-700">
                  Panel de Control
                </span>
              </div>
              <span className="font-mono text-[10px] text-stone-400">
                C. Isla Cristina 6, Huelva · Tel: 643 56 72 50
              </span>
            </div>

            {/* Live indicators */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900 border border-stone-800 font-mono text-[10px]">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <span className="text-stone-300">
                  {isOnline ? 'Supabase Conectado' : 'Modo Local Seguro'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900 border border-stone-800 font-mono text-[10px]">
                <span className={`w-2 h-2 rounded-full ${hasTelegram ? 'bg-sky-400' : 'bg-stone-600'}`}></span>
                <span className="text-stone-300">
                  {hasTelegram ? 'Telegram Activo' : 'Telegram Off'}
                </span>
              </div>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`px-3.5 py-2 border transition-colors flex items-center gap-1.5 ${
                activeTab === 'reservations'
                  ? 'bg-aji-600 text-white border-aji-600 font-bold'
                  : 'bg-stone-900 text-stone-300 border-stone-800 hover:text-white hover:bg-stone-850'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Reservas & Hoy</span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3.5 py-2 border transition-colors flex items-center gap-1.5 ${
                activeTab === 'menu'
                  ? 'bg-aji-600 text-white border-aji-600 font-bold'
                  : 'bg-stone-900 text-stone-300 border-stone-800 hover:text-white hover:bg-stone-850'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Carta & Platos</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 border transition-colors flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-aji-600 text-white border-aji-600 font-bold'
                  : 'bg-stone-900 text-stone-300 border-stone-800 hover:text-white hover:bg-stone-850'
              }`}
              title="Cambiar contraseña de administración"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Contraseña</span>
            </button>
          </nav>

          {/* Quick Exit Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onViewPublic}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-mono text-xs border border-stone-700 flex items-center gap-1 transition-colors"
            >
              <span>Ver Web</span>
              <ExternalLink className="w-3 h-3 text-aji-400" />
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 border border-red-900/60 bg-red-950/30 hover:bg-red-900 text-red-300 hover:text-white font-mono text-xs flex items-center gap-1 transition-colors"
              title="Cerrar sesión de administración"
            >
              <LogOut className="w-3 h-3" />
              <span>Salir</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Admin Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {activeTab === 'menu' && <AdminMenu />}
        {activeTab === 'reservations' && <AdminReservations />}
        {activeTab === 'settings' && <AdminSettings />}
      </main>

    </div>
  );
};

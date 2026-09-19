import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ServiceHighlights } from './components/ServiceHighlights';
import { MenuSection } from './components/MenuSection';
import { StoryFusion } from './components/StoryFusion';
import { ReservationSection } from './components/ReservationSection';
import { LocationContact } from './components/LocationContact';
import { Footer } from './components/Footer';
import { AdminLayout } from './admin/AdminLayout';
import { AdminLogin } from './admin/AdminLogin';
import { DigitalMenuPage } from './pages/DigitalMenuPage';
import { CookieConsent } from './components/CookieConsent';
import { AvisoLegalPage } from './pages/legal/AvisoLegalPage';
import { PoliticaPrivacidadPage } from './pages/legal/PoliticaPrivacidadPage';
import { PoliticaCookiesPage } from './pages/legal/PoliticaCookiesPage';
import { TerminosCondicionesPage } from './pages/legal/TerminosCondicionesPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { isSessionValid, clearAdminSession } from './utils/security';
import { getSupabaseClient } from './services/supabase';

export type AppView = 
  | 'public' 
  | 'admin' 
  | 'carta' 
  | 'reservas'
  | 'aviso-legal' 
  | 'politica-privacidad' 
  | 'politica-cookies' 
  | 'terminos-condiciones';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('public');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // Sync pathname & hash routing with active session verification
  useEffect(() => {
    const routeCheck = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const validSession = isSessionValid();
      setIsAdminAuthenticated(validSession);

      if (
        path.startsWith('/admin') || 
        hash === '#admin' || 
        hash.startsWith('#admin-') || 
        hash.startsWith('#admin/')
      ) {
        setCurrentView('admin');
      } else if (
        path === '/carta' || 
        path === '/carta/' || 
        path.startsWith('/carta') || 
        hash === '#carta-digital' || 
        hash.startsWith('#carta-digital') ||
        hash === '#menu' ||
        window.location.search.includes('mesa=')
      ) {
        setCurrentView('carta');
      } else if (
        path === '/reservas' ||
        path === '/reservas/' ||
        path.startsWith('/reservas') ||
        hash === '#reservas' ||
        hash === '#reservar' ||
        hash === '#reservas-online'
      ) {
        setCurrentView('reservas');
      } else if (path.startsWith('/aviso-legal') || hash === '#aviso-legal') {
        setCurrentView('aviso-legal');
      } else if (path.startsWith('/politica-privacidad') || hash === '#politica-privacidad' || hash === '#privacidad') {
        setCurrentView('politica-privacidad');
      } else if (path.startsWith('/politica-cookies') || hash === '#politica-cookies' || hash === '#cookies') {
        setCurrentView('politica-cookies');
      } else if (path.startsWith('/terminos-condiciones') || hash === '#terminos-condiciones' || hash === '#terminos') {
        setCurrentView('terminos-condiciones');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } else {
        // Public homepage or in-page anchor (#carta, #servicios, #fusion, #contacto)
        const wasDifferentView = currentView !== 'public';
        setCurrentView('public');

        if (hash && hash.startsWith('#') && hash.length > 1) {
          const targetId = hash.substring(1);
          const scrollAction = () => {
            const el = document.getElementById(targetId);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          };
          if (wasDifferentView) {
            setTimeout(scrollAction, 100);
          } else {
            scrollAction();
          }
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
      }
    };

    routeCheck();
    window.addEventListener('hashchange', routeCheck);
    window.addEventListener('popstate', routeCheck);
    return () => {
      window.removeEventListener('hashchange', routeCheck);
      window.removeEventListener('popstate', routeCheck);
    };
  }, [currentView]);

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    if (view === 'admin') {
      window.location.hash = '#admin';
    } else if (view === 'carta') {
      window.location.hash = '#carta-digital';
    } else if (view === 'reservas') {
      window.location.hash = '#reservas';
    } else if (view === 'aviso-legal') {
      window.location.hash = '#aviso-legal';
    } else if (view === 'politica-privacidad') {
      window.location.hash = '#politica-privacidad';
    } else if (view === 'politica-cookies') {
      window.location.hash = '#politica-cookies';
    } else if (view === 'terminos-condiciones') {
      window.location.hash = '#terminos-condiciones';
    } else {
      const specialHashes = [
        '#admin', 
        '#carta-digital', 
        '#reservas',
        '#reservar',
        '#reservas-online',
        '#aviso-legal', 
        '#politica-privacidad', 
        '#privacidad', 
        '#politica-cookies', 
        '#cookies', 
        '#terminos-condiciones', 
        '#terminos'
      ];
      if (specialHashes.some(h => window.location.hash.startsWith(h))) {
        window.location.hash = '';
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
  };

  const handleLogout = async () => {
    clearAdminSession();
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setIsAdminAuthenticated(false);
    handleNavigate('public');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-aji-600 selection:text-white">
      {/* Floating RGPD Cookie Banner & Settings Modal */}
      <CookieConsent onNavigateLegal={handleNavigate} />

      {currentView === 'carta' ? (
        <DigitalMenuPage onGoToFullWeb={() => handleNavigate('public')} />
      ) : currentView === 'reservas' ? (
        <ReservationsPage 
          onBackToHome={() => handleNavigate('public')} 
          onGoToMenu={() => handleNavigate('carta')} 
        />
      ) : currentView === 'admin' ? (
        isAdminAuthenticated ? (
          <AdminLayout 
            onLogout={handleLogout} 
            onViewPublic={() => handleNavigate('public')} 
          />
        ) : (
          <AdminLogin 
            onLoginSuccess={handleLoginSuccess} 
            onCancel={() => handleNavigate('public')} 
          />
        )
      ) : currentView === 'aviso-legal' ? (
        <AvisoLegalPage onNavigate={handleNavigate} />
      ) : currentView === 'politica-privacidad' ? (
        <PoliticaPrivacidadPage onNavigate={handleNavigate} />
      ) : currentView === 'politica-cookies' ? (
        <PoliticaCookiesPage onNavigate={handleNavigate} />
      ) : currentView === 'terminos-condiciones' ? (
        <TerminosCondicionesPage onNavigate={handleNavigate} />
      ) : (
        <>
          <Navbar 
            currentView="public" 
            onNavigate={(v) => handleNavigate(v as AppView)}
            onOpenNfcMenu={() => handleNavigate('carta')} 
          />
          <main>
            <Hero 
              onNavigateReservas={() => handleNavigate('reservas')} 
              onNavigateCarta={() => {
                const el = document.getElementById('carta');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
            <ServiceHighlights onNavigateReservas={() => handleNavigate('reservas')} />
            <MenuSection onNavigateReservas={() => handleNavigate('reservas')} />
            <StoryFusion />
            <ReservationSection onNavigateLegal={handleNavigate} />
            <LocationContact />
          </main>
          <Footer 
            onNavigateAdmin={() => handleNavigate('admin')} 
            onNavigateLegal={handleNavigate} 
          />
        </>
      )}
    </div>
  );
}

export default App;

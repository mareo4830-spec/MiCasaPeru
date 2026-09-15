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

export type AppView = 'public' | 'admin' | 'carta';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('public');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // Sync pathname & hash routing
  useEffect(() => {
    const routeCheck = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (path.startsWith('/admin') || hash === '#admin') {
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
      } else {
        // If hash is an anchor like #reservas or #contacto, stay in public view
        if (currentView !== 'carta' && currentView !== 'admin') {
          setCurrentView('public');
        }
      }
    };

    const isAuth = sessionStorage.getItem('mcp_admin_authenticated') === 'true';
    setIsAdminAuthenticated(isAuth);

    routeCheck();
    window.addEventListener('hashchange', routeCheck);
    window.addEventListener('popstate', routeCheck);
    return () => {
      window.removeEventListener('hashchange', routeCheck);
      window.removeEventListener('popstate', routeCheck);
    };
  }, []);

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    if (view === 'admin') {
      window.location.hash = '#admin';
    } else if (view === 'carta') {
      window.location.hash = '#carta-digital';
    } else {
      if (window.location.hash === '#admin' || window.location.hash.startsWith('#carta-digital')) {
        window.location.hash = '';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('mcp_admin_authenticated');
    setIsAdminAuthenticated(false);
    handleNavigate('public');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-aji-600 selection:text-white">
      {currentView === 'carta' ? (
        <DigitalMenuPage onGoToFullWeb={() => handleNavigate('public')} />
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
      ) : (
        <>
          <Navbar 
            currentView="public" 
            onNavigate={(v) => handleNavigate(v as AppView)}
            onOpenNfcMenu={() => handleNavigate('carta')} 
          />
          <main>
            <Hero />
            <ServiceHighlights />
            <MenuSection />
            <StoryFusion />
            <ReservationSection />
            <LocationContact />
          </main>
          <Footer onNavigateAdmin={() => handleNavigate('admin')} />
        </>
      )}
    </div>
  );
}

export default App;

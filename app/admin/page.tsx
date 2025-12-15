"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import OperatorRankings from '@/components/operadores/operator-rankings';
import ActiveUsersSection from '@/components/users/ActiveUsers';
import ConfigPage from '@/components/config/page';
import { Loader2, ShieldAlert } from 'lucide-react';

// Admin users list
const ADMIN_USERS = [
  'ADMIN001', 'JaiderMafla', 'CarlosSalas', 'DanielArboleda', 
  'StefannyHernandez', 'JorgeMoreno', 'AntonioRubiano', 'NelsonUrrea',
  'ManuelLopez', 'LuisFajardo', 'OliverBarbosa', 'JuanFlorez',
  'Sharitha', 'MaritzaCano', 'WandaSanchez', 'MarthaGarcia',
  'ValentinaGonzalez', 'RicardoMontoya', 'HelierGallego', 
  'CristinaCorrea', 'MayrengSalguedo'
];

function App() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Verificar autenticación y autorización
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userStr = localStorage.getItem('user');
        
        if (!userStr) {
          console.log('🚫 No user found in localStorage');
          router.push('/?error=no-auth');
          return;
        }

        const user = JSON.parse(userStr);
        const isAdmin = user.isAdmin === true || ADMIN_USERS.includes(user.codigo);

        if (!isAdmin) {
          console.log('🚫 User is not admin:', user.codigo);
          router.push('/?error=not-admin');
          return;
        }

        console.log('✅ Admin access granted:', user.codigo);
        setIsAuthorized(true);
        
        // Set cookie for middleware
        document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; samesite=strict`;
        
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/?error=auth-error');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  // Cargar estado guardado al inicializar (solo si está autorizado)
  useEffect(() => {
    if (!isAuthorized) return;

    const savedActiveView = localStorage.getItem('adminActiveView');
    const savedShowWelcome = localStorage.getItem('adminShowWelcome');
    const savedSidebarCollapsed = localStorage.getItem('adminSidebarCollapsed');
    
    if (savedActiveView) {
      setActiveView(savedActiveView);
    }
    
    if (savedShowWelcome !== null) {
      setShowWelcome(savedShowWelcome === 'true');
    }
    
    if (savedSidebarCollapsed !== null) {
      setSidebarCollapsed(savedSidebarCollapsed === 'true');
    }
  }, [isAuthorized]);

  // Función para actualizar el estado y guardarlo en localStorage
  const updateActiveView = (view: string) => {
    setActiveView(view);
    setShowWelcome(false);
    localStorage.setItem('adminActiveView', view);
    localStorage.setItem('adminShowWelcome', 'false');
  };

  // Función para actualizar el estado del sidebar
  const updateSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('adminSidebarCollapsed', collapsed.toString());
  };

  const renderContent = () => {
    if (showWelcome || !activeView) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full text-center border border-emerald-100">
            <h2 className="text-3xl font-bold text-emerald-700 mb-4">¡Bienvenido/a!</h2>
            <p className="text-lg text-gray-700 mb-8">¿Qué deseas hacer hoy?</p>
            <div className="flex flex-col gap-4">
              <button
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold text-lg shadow hover:scale-105 transition"
                onClick={() => updateActiveView('rankings')}
              >
                Ver Rankings de Operadores
              </button>
              <button
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-lg shadow hover:scale-105 transition"
                onClick={() => updateActiveView('bonuses')}
              >
                Gestión de Bonos
              </button>
              <button
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-white font-semibold text-lg shadow hover:scale-105 transition"
                onClick={() => updateActiveView('kilometers')}
              >
                Seguimiento de Kilómetros
              </button>
            </div>
          </div>
        </div>
      );
    }
    switch (activeView) {
      case 'users':
        return <ActiveUsersSection />;
      case 'rankings':
        return <OperatorRankings />;
      case 'config':
        return <ConfigPage />;
      default:
        return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'users':
        return 'Usuarios Activos';
      case 'bonuses':
        return 'Gestión de Bonos';
      case 'kilometers':
        return 'Seguimiento de Kilómetros';
      case 'rankings':
        return 'Rankings de Operadores';
      case 'config':
        return 'Configuración';
      default:
        return 'Dashboard Analytics';
    }
  };

  const getPageSubtitle = () => {
    switch (activeView) {
      case 'users':
        return 'Monitoreo en tiempo real de la actividad y productividad del equipo';
      case 'bonuses':
        return 'Administra y consulta los bonos y afectaciones del personal';
      case 'kilometers':
        return 'Monitoreo de kilómetros programados vs ejecutados con análisis de confiabilidad';
      case 'rankings':
        return 'Clasificación de operadores basada en rendimiento de bonos y kilómetros';
      case 'config':
        return 'Configuración y administración del sistema';
      default:
        return 'Monitorea el rendimiento y actividad de usuarios en tiempo real';
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verificando acceso...</h2>
          <p className="text-gray-600">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6">
            No tienes permisos de administrador para acceder a este panel.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-25">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => updateSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView || ''}
        onViewChange={updateActiveView}
      />

      {/* Main Content */}
      <div className={`
        transition-all duration-500 ease-out
        ${sidebarCollapsed ? 'ml-20' : 'ml-80'}
      `}>
        <main className="p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import Bonos from '@/components/bonos/bonos';
import { KmTracking } from '@/components/kilometros/km-tracking';
import OperatorRankings from '@/components/operadores/operator-rankings';
import ActiveUsersSection from '@/components/users/ActiveUsers';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  const renderContent = () => {
    switch (activeView) {
      case 'users':
        return <ActiveUsersSection />;
      case 'bonuses':
        return <Bonos />;
      case 'kilometers':
        return <KmTracking />;
      case 'rankings':
        return <OperatorRankings />;
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
      default:
        return 'Monitorea el rendimiento y actividad de usuarios en tiempo real';
    }
  };

  return (
    <div className="min-h-screen bg-gray-25">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Main Content */}
      <div className={`
        transition-all duration-500 ease-out
        ${sidebarCollapsed ? 'ml-20' : 'ml-80'}
      `}>
        {/* Sin header */}

        {/* Dashboard Content */}
        <main className="p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
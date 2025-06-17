
import React from 'react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, activeView, onViewChange }) => {
  const menuItems = [
    { 
      id: 'rankings', 
      label: 'Rankings', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      category: 'main' 
    },
    { 
      id: 'kilometers', 
      label: 'Seguimiento KM', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      category: 'main' 
    },
    { 
      id: 'bonuses', 
      label: 'Bonos', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      category: 'main' 
    },
  ];

  const mainItems = menuItems.filter(item => item.category === 'main');

  const renderMenuSection = (items: typeof menuItems, title?: string) => (
    <div className="space-y-2">
      {!collapsed && title && (
        <div className="px-4 mb-6">
          <h4 className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest">
            {title}
          </h4>
          <div className="mt-2 h-px bg-gradient-to-r from-emerald-200 to-transparent"></div>
        </div>
      )}
      {items.map((item) => {
        const isActive = activeView === item.id;
        
        return (
          <div key={item.id} className="relative px-3">
            <button
              onClick={() => onViewChange(item.id)}
              className={`
                w-full flex items-center space-x-4 px-4 py-4 rounded-2xl
                transition-all duration-300 ease-out group relative overflow-hidden
                ${isActive 
                  ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 text-white shadow-2xl shadow-emerald-500/30 transform scale-[1.02]' 
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-lg hover:shadow-emerald-100/50'
                }
              `}
            >
              {/* Background Pattern for Active State */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
              )}
              
              {/* Icon Container */}
              <div className={`
                relative z-10 flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300
                ${isActive 
                  ? 'bg-white/20 backdrop-blur-sm shadow-lg' 
                  : 'bg-white group-hover:bg-emerald-100 group-hover:shadow-md border border-emerald-100/50'
                }
              `}>
                <div className={`
                  transition-colors duration-300
                  ${isActive ? 'text-white' : 'text-emerald-600 group-hover:text-emerald-700'}
                `}>
                  {item.icon}
                </div>
              </div>
              
              {!collapsed && (
                <>
                  <span className={`
                    font-semibold transition-all duration-300 text-sm relative z-10
                    ${isActive ? 'text-white' : 'text-slate-700 group-hover:text-emerald-800'}
                  `}>
                    {item.label}
                  </span>
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="ml-auto relative z-10">
                      <div className="w-2 h-2 bg-white rounded-full shadow-lg animate-pulse"></div>
                    </div>
                  )}
                </>
              )}
              
              {/* Hover Effect Background */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={`
      fixed left-0 top-0 h-full bg-white/98 backdrop-blur-xl
      transition-all duration-500 ease-out z-50 
      border-r border-emerald-100/60 shadow-2xl shadow-emerald-900/5
      ${collapsed ? 'w-20' : 'w-80'}
    `}>
      {/* Decorative Top Gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-emerald-50/80">
        {!collapsed && (
          <div className="flex items-center space-x-4">
            {/* Logo Container */}
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
                {/* Dashboard Icon */}
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl blur opacity-30"></div>
            </div>
            
            <div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-slate-800 to-emerald-700 bg-clip-text text-transparent">
                AdminPro
              </h1>
              <p className="text-xs text-emerald-600/70 mt-1 font-medium">
                Dashboard Profesional
              </p>
            </div>
          </div>
        )}
        
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-all duration-300 hover:scale-110 hover:shadow-lg group border border-emerald-100/50"
        >
          <div className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-emerald-600 group-hover:text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Menu Items */}
      <nav className="p-4 space-y-8 overflow-y-auto h-full pb-32">
        {renderMenuSection(mainItems, 'Principal')}
      </nav>

      {/* Bottom User Section */}
      {!collapsed && (
        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-gradient-to-br from-white via-emerald-50/30 to-white rounded-2xl p-5 border border-emerald-100/60 shadow-xl shadow-emerald-900/5 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              {/* User Avatar */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <span className="text-white font-bold text-sm">MV</span>
                </div>
                {/* Online Status */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm">
                  <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">Mario Valle</p>
                <p className="text-xs text-emerald-600/70 truncate mb-1">Coordionador de operaciones</p>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs text-green-600 font-semibold">En línea</span>
                </div>
              </div>
            </div>
            
            {/* Bottom Accent Line */}
            <div className="mt-4 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

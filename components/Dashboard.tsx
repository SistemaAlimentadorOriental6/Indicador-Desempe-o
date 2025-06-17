import React from 'react';
import { Users, MapPin, Trophy, Gift, TrendingUp, Activity, Calendar, Target } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import UserRankings from '@/components/UsersRankings';
import KilometersTracker from '@/components/KilometersTracker';
import ActiveUsers from '@/components/ActiveUsers';
import FilterBar from '@/components/FilterBar';

const Dashboard: React.FC = () => {
  const trendData = [65, 78, 82, 88, 95, 92, 98];
  
  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <FilterBar />

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Usuarios Activos"
          value="2,847"
          change="+12.5%"
          changeType="positive"
          icon={Users}
          gradient="bg-gradient-to-br from-primary-500 to-primary-600"
          subtitle="En línea ahora: 1,234"
          trend={trendData}
        />
        <StatsCard
          title="Distancia Total"
          value="45,234 km"
          change="+8.3%"
          changeType="positive"
          icon={MapPin}
          gradient="bg-gradient-to-br from-primary-500 to-primary-600"
          subtitle="Este mes: 12,456 km"
          trend={[45, 52, 48, 61, 55, 67, 72]}
        />
        <StatsCard
          title="Top Performers"
          value="156"
          change="+15.7%"
          changeType="positive"
          icon={Trophy}
          gradient="bg-gradient-to-br from-primary-500 to-primary-600"
          subtitle="Alcanzaron objetivos"
          trend={[23, 34, 28, 45, 38, 52, 48]}
        />
        <StatsCard
          title="Bonos Otorgados"
          value="3,429"
          change="-2.1%"
          changeType="negative"
          icon={Gift}
          gradient="bg-gradient-to-br from-primary-500 to-primary-600"
          subtitle="Valor total: $34,290"
          trend={[89, 76, 82, 78, 85, 79, 73]}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Users */}
        <div className="lg:col-span-1">
          <ActiveUsers />
        </div>

        {/* User Rankings */}
        <div className="lg:col-span-1">
          <UserRankings />
        </div>

        {/* Kilometers Tracker */}
        <div className="lg:col-span-1">
          <KilometersTracker />
        </div>
      </div>

      {/* Additional Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Chart */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-green">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Análisis de Rendimiento</h3>
                <p className="text-sm text-gray-500 font-medium">Tendencias de actividad semanal</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 text-sm font-semibold text-primary-600 hover:text-white hover:bg-gradient-to-r hover:from-primary-500 hover:to-primary-600 rounded-2xl transition-all duration-300 border border-primary-200 hover:border-transparent">
                Ver Detalles
              </button>
            </div>
          </div>
          
          {/* Enhanced Chart Area */}
          <div className="h-72 bg-gradient-to-br from-gray-25 to-gray-50 rounded-3xl flex items-center justify-center border border-gray-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-primary-600/5"></div>
            <div className="text-center relative z-10">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold text-lg">Área de Gráfico Interactivo</p>
              <p className="text-sm text-gray-500 mt-2 font-medium">Visualización de analíticas en tiempo real</p>
              <div className="flex items-center justify-center space-x-4 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-medium">Rendimiento</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary-400 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-medium">Objetivos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-primary-600">94.2%</p>
              <p className="text-xs text-gray-500 font-medium">Eficiencia</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary-600">+23%</p>
              <p className="text-xs text-gray-500 font-medium">Crecimiento</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary-600">156</p>
              <p className="text-xs text-gray-500 font-medium">Hitos</p>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-green">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Actividad Reciente</h3>
                <p className="text-sm text-gray-500 font-medium">Últimos eventos del sistema</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 text-sm font-semibold text-primary-600 hover:text-white hover:bg-gradient-to-r hover:from-primary-500 hover:to-primary-600 rounded-2xl transition-all duration-300 border border-primary-200 hover:border-transparent">
                Ver Todo
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { event: 'Aumento de registros de usuarios', time: 'hace 2 horas', type: 'success', icon: Users, details: '+47 nuevos usuarios' },
              { event: 'Tabla de clasificación actualizada', time: 'hace 4 horas', type: 'info', icon: Trophy, details: 'Rankings actualizados' },
              { event: 'Hito de rendimiento alcanzado', time: 'hace 6 horas', type: 'success', icon: Target, details: 'Meta de 10K distancia total' },
              { event: 'Mantenimiento del sistema completado', time: 'hace 8 horas', type: 'neutral', icon: Calendar, details: 'Todos los sistemas operativos' },
              { event: 'Distribución de bonos mensual', time: 'hace 1 día', type: 'success', icon: Gift, details: '$12,450 distribuidos' },
            ].map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-25 transition-all duration-300 group border border-transparent hover:border-gray-100">
                  <div className={`
                    w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-soft
                    ${activity.type === 'success' ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 
                      activity.type === 'info' ? 'bg-gradient-to-br from-primary-400 to-primary-500' : 
                      'bg-gradient-to-br from-gray-400 to-gray-500'}
                  `}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {activity.event}
                      </p>
                      <span className="text-xs text-gray-500 font-medium">{activity.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{activity.details}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Goals & Achievements Section */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-green">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Objetivos y Logros</h3>
              <p className="text-sm text-gray-500 font-medium">Seguimiento de progreso e hitos</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-to-br from-primary-25 to-primary-50 rounded-3xl border border-primary-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-2xl flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-semibold text-primary-800">Objetivos Mensuales</h4>
            </div>
            <p className="text-3xl font-bold text-primary-700 mb-2">89%</p>
            <p className="text-sm text-primary-600 font-medium">156 de 175 usuarios alcanzaron objetivos</p>
            <div className="w-full bg-primary-200 rounded-full h-2 mt-4">
              <div className="bg-primary-500 h-2 rounded-full transition-all duration-500" style={{ width: '89%' }}></div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-primary-25 to-primary-50 rounded-3xl border border-primary-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-2xl flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-semibold text-primary-800">Desafío de Distancia</h4>
            </div>
            <p className="text-3xl font-bold text-primary-700 mb-2">76%</p>
            <p className="text-sm text-primary-600 font-medium">45.2K de 60K km objetivo</p>
            <div className="w-full bg-primary-200 rounded-full h-2 mt-4">
              <div className="bg-primary-500 h-2 rounded-full transition-all duration-500" style={{ width: '76%' }}></div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-primary-25 to-primary-50 rounded-3xl border border-primary-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-2xl flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-semibold text-primary-800">Participación de Usuarios</h4>
            </div>
            <p className="text-3xl font-bold text-primary-700 mb-2">94%</p>
            <p className="text-sm text-primary-600 font-medium">Tasa de usuarios activos diarios</p>
            <div className="w-full bg-primary-200 rounded-full h-2 mt-4">
              <div className="bg-primary-500 h-2 rounded-full transition-all duration-500" style={{ width: '94%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
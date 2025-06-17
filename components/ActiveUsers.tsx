import React, { useState } from 'react';
import { Users, Activity, MapPin, Clock } from 'lucide-react';

interface ActiveUser {
  id: number;
  name: string;
  status: 'online' | 'away' | 'busy';
  activity: string;
  time: string;
  avatar: string;
  location: string;
  duration: string;
  activityType: 'running' | 'cycling' | 'walking' | 'gym' | 'yoga' | 'swimming';
}

const ActiveUsers: React.FC = () => {
  const [filter, setFilter] = useState('all');
  
  const activeUsers: ActiveUser[] = [
    { id: 1, name: 'Emily Johnson', status: 'online', activity: 'Corriendo Ruta Maratón', time: 'hace 2 min', avatar: 'EJ', location: 'Parque Central', duration: '45 min', activityType: 'running' },
    { id: 2, name: 'Michael Chen', status: 'online', activity: 'Ciclismo Centro', time: 'hace 5 min', avatar: 'MC', location: 'Centro', duration: '1h 20m', activityType: 'cycling' },
    { id: 3, name: 'Sarah Davis', status: 'online', activity: 'Caminando en Parque', time: 'hace 8 min', avatar: 'SD', location: 'Parque Riverside', duration: '30 min', activityType: 'walking' },
    { id: 4, name: 'Robert Wilson', status: 'away', activity: 'Sesión de Gimnasio', time: 'hace 15 min', avatar: 'RW', location: 'Gimnasio FitLife', duration: '1h 15m', activityType: 'gym' },
    { id: 5, name: 'Lisa Anderson', status: 'online', activity: 'Clase de Yoga', time: 'hace 18 min', avatar: 'LA', location: 'Estudio Zen', duration: '1h', activityType: 'yoga' },
    { id: 6, name: 'John Martinez', status: 'busy', activity: 'Nadando Vueltas', time: 'hace 22 min', avatar: 'JM', location: 'Centro Acuático', duration: '50 min', activityType: 'swimming' },
  ];

  const getActivityIcon = (type: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'running': return <Activity className={`${iconClass} text-red-500`} />;
      case 'cycling': return <Activity className={`${iconClass} text-blue-500`} />;
      case 'walking': return <Activity className={`${iconClass} text-primary-500`} />;
      case 'gym': return <Activity className={`${iconClass} text-purple-500`} />;
      case 'yoga': return <Activity className={`${iconClass} text-pink-500`} />;
      case 'swimming': return <Activity className={`${iconClass} text-cyan-500`} />;
      default: return <Activity className={`${iconClass} text-gray-500`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-primary-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredUsers = filter === 'all' ? activeUsers : activeUsers.filter(user => user.status === filter);

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-green">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Usuarios Activos</h3>
            <p className="text-sm text-gray-500 font-medium">Feed de actividad en tiempo real</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-primary-600">En Vivo</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 p-1 bg-gray-50 rounded-2xl">
        {['all', 'online', 'away', 'busy'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`
              flex-1 py-2.5 px-3 text-sm font-semibold rounded-xl transition-all duration-300
              ${filter === status 
                ? 'bg-white text-gray-900 shadow-soft' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {status === 'all' ? 'Todos' : 
             status === 'online' ? 'En línea' :
             status === 'away' ? 'Ausente' : 'Ocupado'}
          </button>
        ))}
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gradient-to-r from-gray-25 to-gray-50 rounded-2xl border border-gray-100">
        <div className="text-center">
          <p className="text-xl font-bold text-primary-600">{activeUsers.filter(u => u.status === 'online').length}</p>
          <p className="text-xs text-gray-500 font-medium">En línea</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-primary-600">{activeUsers.length}</p>
          <p className="text-xs text-gray-500 font-medium">Total Activos</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-primary-600">6</p>
          <p className="text-xs text-gray-500 font-medium">Actividades</p>
        </div>
      </div>

      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-25 transition-all duration-300 group hover:shadow-soft border border-transparent hover:border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-semibold shadow-green group-hover:scale-105 transition-transform duration-300">
                  {user.avatar}
                </div>
                <div className={`
                  absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-soft
                  ${getStatusColor(user.status)}
                `}></div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {user.name}
                  </h4>
                  <span className={`
                    text-xs font-semibold px-2 py-1 rounded-full
                    ${user.status === 'online' ? 'bg-primary-50 text-primary-700 border border-primary-200' :
                      user.status === 'away' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                      'bg-red-50 text-red-700 border border-red-200'}
                  `}>
                    {user.status === 'online' ? 'En línea' :
                     user.status === 'away' ? 'Ausente' : 'Ocupado'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    {getActivityIcon(user.activityType)}
                    <span className="font-medium">{user.activity}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span className="font-medium">{user.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span className="font-medium">{user.duration}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium">{user.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="w-full py-3 text-sm font-semibold text-primary-600 hover:text-white hover:bg-gradient-to-r hover:from-primary-500 hover:to-primary-600 rounded-2xl transition-all duration-300 border border-primary-200 hover:border-transparent">
          Ver Toda la Actividad
        </button>
      </div>
    </div>
  );
};

export default ActiveUsers;
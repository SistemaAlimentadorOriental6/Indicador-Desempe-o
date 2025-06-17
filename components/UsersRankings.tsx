import React from 'react';
import { Trophy, Crown, Medal, Award, Star, TrendingUp } from 'lucide-react';

interface User {
  id: number;
  name: string;
  level: number;
  score: number;
  avatar: string;
  rank: number;
  badge: string;
  progress: number;
  lastActivity: string;
}

const UserRankings: React.FC = () => {
  const users: User[] = [
    { id: 1, name: 'Sarah Chen', level: 98, score: 15420, avatar: 'SC', rank: 1, badge: 'Campeón', progress: 95, lastActivity: 'hace 2 min' },
    { id: 2, name: 'Marcus Johnson', level: 95, score: 14850, avatar: 'MJ', rank: 2, badge: 'Elite', progress: 88, lastActivity: 'hace 5 min' },
    { id: 3, name: 'Elena Rodriguez', level: 92, score: 13990, avatar: 'ER', rank: 3, badge: 'Experto', progress: 82, lastActivity: 'hace 8 min' },
    { id: 4, name: 'David Kim', level: 89, score: 13200, avatar: 'DK', rank: 4, badge: 'Avanzado', progress: 76, lastActivity: 'hace 12 min' },
    { id: 5, name: 'Ana Silva', level: 87, score: 12750, avatar: 'AS', rank: 5, badge: 'Avanzado', progress: 71, lastActivity: 'hace 15 min' },
    { id: 6, name: 'Tom Wilson', level: 84, score: 12100, avatar: 'TW', rank: 6, badge: 'Hábil', progress: 68, lastActivity: 'hace 18 min' },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <Award className="w-5 h-5 text-gray-300" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-400 to-gray-600';
      case 3:
        return 'from-amber-400 to-amber-600';
      default:
        return 'from-primary-400 to-primary-600';
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Campeón':
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200';
      case 'Elite':
        return 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border-purple-200';
      case 'Experto':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200';
      case 'Avanzado':
        return 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-800 border-primary-200';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-green">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Rankings de Usuarios</h3>
            <p className="text-sm text-gray-500 font-medium">Mejores rendimientos este mes</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-sm text-primary-600 font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>Actualizaciones en Vivo</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {users.map((user, index) => (
          <div
            key={user.id}
            className="relative p-4 rounded-2xl hover:bg-gray-25 transition-all duration-300 group hover:shadow-soft border border-transparent hover:border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg
                    bg-gradient-to-br ${getRankColor(user.rank)} shadow-green group-hover:scale-105 transition-transform duration-300
                  `}>
                    {user.avatar}
                  </div>
                  <div className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-soft border border-gray-100">
                    {getRankIcon(user.rank)}
                  </div>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <span className="bg-white text-xs font-bold text-gray-700 px-2 py-1 rounded-full shadow-soft border border-gray-200">
                      #{user.rank}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors text-lg">
                      {user.name}
                    </h4>
                    <span className={`
                      text-xs font-semibold px-3 py-1 rounded-full border
                      ${getBadgeColor(user.badge)}
                    `}>
                      {user.badge}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                    <span className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">Nivel {user.level}</span>
                    </span>
                    <span className="font-medium">Última actividad: {user.lastActivity}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${user.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-2xl text-gray-900">{user.score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
                <p className="text-sm text-gray-500 font-medium">puntos</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="w-full py-3 text-sm font-semibold text-primary-600 hover:text-white hover:bg-gradient-to-r hover:from-primary-500 hover:to-primary-600 rounded-2xl transition-all duration-300 border border-primary-200 hover:border-transparent">
          Ver Tabla de Clasificación Completa
        </button>
      </div>
    </div>
  );
};

export default UserRankings;
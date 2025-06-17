import React from 'react';
import { MapPin, TrendingUp, Target, Award } from 'lucide-react';
import { formatNumber, formatPercentage } from '@/utils/format-utils';

interface KilometerData {
  id: number;
  name: string;
  kilometers: number;
  bonuses: number;
  avatar: string;
  growth: number;
  weeklyGoal: number;
  completedGoal: boolean;
  streak: number;
}

const KilometersTracker: React.FC = () => {
  const data: KilometerData[] = [
    { id: 1, name: 'Alex Thompson', kilometers: 2847, bonuses: 145, avatar: 'AT', growth: 12.5, weeklyGoal: 50, completedGoal: true, streak: 7 },
    { id: 2, name: 'Maria Garcia', kilometers: 2634, bonuses: 132, avatar: 'MG', growth: 8.3, weeklyGoal: 45, completedGoal: true, streak: 5 },
    { id: 3, name: 'James Lee', kilometers: 2401, bonuses: 120, avatar: 'JL', growth: 15.7, weeklyGoal: 40, completedGoal: false, streak: 3 },
    { id: 4, name: 'Sophie Brown', kilometers: 2298, bonuses: 115, avatar: 'SB', growth: -2.1, weeklyGoal: 35, completedGoal: true, streak: 12 },
    { id: 5, name: 'Carlos Ruiz', kilometers: 2156, bonuses: 108, avatar: 'CR', growth: 6.9, weeklyGoal: 30, completedGoal: false, streak: 2 },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-green">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Líderes en Distancia</h3>
            <p className="text-sm text-gray-500 font-medium">Más kilómetros recorridos</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 text-sm font-semibold text-primary-600 hover:text-white hover:bg-gradient-to-r hover:from-primary-500 hover:to-primary-600 rounded-2xl transition-all duration-300 border border-primary-200 hover:border-transparent">
            Ver Todo
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-r from-gray-25 to-gray-50 rounded-2xl border border-gray-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">45200</p>
          <p className="text-xs text-gray-500 font-medium">Total KM</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-600">620</p>
          <p className="text-xs text-gray-500 font-medium">Total Bonos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-600">{formatPercentage(89)}</p>
          <p className="text-xs text-gray-500 font-medium">Tasa de Objetivos</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((person, index) => (
          <div
            key={person.id}
            className="relative p-4 rounded-2xl hover:bg-gray-25 transition-all duration-300 group hover:shadow-soft border border-transparent hover:border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-green group-hover:scale-105 transition-transform duration-300">
                    {person.avatar}
                  </div>
                  <div className="absolute -top-1 -right-1 bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-700 shadow-soft border border-gray-200">
                    {index + 1}
                  </div>
                  {person.completedGoal && (
                    <div className="absolute -bottom-1 -right-1 bg-primary-500 rounded-full p-1 shadow-soft">
                      <Target className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors text-lg">
                      {person.name}
                    </h4>
                    {person.streak >= 5 && (
                      <div className="flex items-center space-x-1 bg-orange-50 text-orange-800 px-2 py-1 rounded-full text-xs font-semibold border border-orange-200">
                        <Award className="w-3 h-3" />
                        <span>{person.streak} días seguidos</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                    <span className="font-semibold">{formatNumber(person.kilometers)} km</span>
                    <span className="flex items-center space-x-1">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{person.bonuses} bonos</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          person.completedGoal 
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600' 
                            : 'bg-gradient-to-r from-primary-400 to-primary-500'
                        }`}
                        style={{ width: `${Math.min((person.kilometers % 100) / person.weeklyGoal * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {person.weeklyGoal}km objetivo
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`
                  flex items-center space-x-1 text-sm font-bold mb-1
                  ${person.growth >= 0 ? 'text-primary-600' : 'text-red-600'}
                `}>
                  <TrendingUp className={`w-4 h-4 ${person.growth < 0 ? 'rotate-180' : ''}`} />
                  <span>{formatPercentage(Math.abs(person.growth))}</span>
                </div>
                <p className="text-xs text-gray-500 font-medium">vs mes pasado</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-3">
          <button className="py-3 text-sm font-semibold text-primary-600 hover:text-white hover:bg-gradient-to-r hover:from-primary-500 hover:to-primary-600 rounded-2xl transition-all duration-300 border border-primary-200 hover:border-transparent">
            Exportar Datos
          </button>
          <button className="py-3 text-sm font-semibold text-primary-600 hover:text-white hover:bg-gradient-to-r hover:from-primary-500 hover:to-primary-600 rounded-2xl transition-all duration-300 border border-primary-200 hover:border-transparent">
            Establecer Objetivos
          </button>
        </div>
      </div>
    </div>
  );
};

export default KilometersTracker;
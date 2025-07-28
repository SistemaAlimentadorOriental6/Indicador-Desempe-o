import React from 'react';
import { Users, MapPin, Hash, TrendingUp, Database, Activity } from 'lucide-react';

interface StatsCardsProps {
  data: any[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ data }) => {
  const totalRecords = data.length;
  const uniqueZones = new Set(data.map(item => item.ZONA || item.zona || item.Zone)).size;
  const uniqueCodes = new Set(data.map(item => item.CODIGO || item.codigo || item.Code)).size;
  const completionRate = Math.round((data.filter(item => 
    Object.values(item).every(val => val !== null && val !== undefined && val !== '')
  ).length / totalRecords) * 100);

  const avgRecordsPerZone = Math.round(totalRecords / uniqueZones);
  const dataQuality = Math.round(((totalRecords - data.filter(item => 
    Object.values(item).some(val => val === null || val === undefined || val === '')
  ).length) / totalRecords) * 100);

  const stats = [
    {
      title: 'Total de Registros',
      value: totalRecords.toLocaleString(),
      icon: Database,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Zonas Identificadas',
      value: uniqueZones.toString(),
      icon: MapPin,
      gradient: 'from-teal-500 to-cyan-600',
      bgGradient: 'from-teal-50 to-cyan-50',
      change: `${avgRecordsPerZone} prom/zona`,
      changeType: 'neutral'
    },
    {
      title: 'Códigos Únicos',
      value: uniqueCodes.toString(),
      icon: Hash,
      gradient: 'from-cyan-500 to-blue-600',
      bgGradient: 'from-cyan-50 to-blue-50',
      change: '100% únicos',
      changeType: 'positive'
    },
    {
      title: 'Calidad de Datos',
      value: `${dataQuality}%`,
      icon: Activity,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      change: dataQuality > 90 ? 'Excelente' : dataQuality > 70 ? 'Buena' : 'Regular',
      changeType: dataQuality > 90 ? 'positive' : dataQuality > 70 ? 'neutral' : 'negative'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className={`
            relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} 
            rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 
            border border-white/50 hover:-translate-y-1 group
          `}
        >
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
          </div>

          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1 tracking-wide uppercase">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-800 leading-none">
                  {stat.value}
                </p>
              </div>
              <div className={`
                p-3 rounded-xl bg-gradient-to-br ${stat.gradient} 
                shadow-lg group-hover:scale-110 transition-transform duration-300
              `}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`
                text-sm font-medium px-3 py-1 rounded-full
                ${stat.changeType === 'positive' 
                  ? 'text-emerald-700 bg-emerald-100' 
                  : stat.changeType === 'negative' 
                  ? 'text-red-700 bg-red-100' 
                  : 'text-gray-700 bg-gray-100'
                }
              `}>
                {stat.change}
              </span>
              <div className="w-12 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
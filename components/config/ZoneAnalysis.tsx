import React from 'react';
import { BarChart3, TrendingUp, Users, MapPin, Target, PieChart } from 'lucide-react';

interface ZoneAnalysisProps {
  data: any[];
}

const ZoneAnalysis: React.FC<ZoneAnalysisProps> = ({ data }) => {
  const zoneAnalysis = React.useMemo(() => {
    const zones = data.reduce((acc, item) => {
      const zone = item.ZONA || item.zona || item.Zone || 'Sin zona';
      acc[zone] = (acc[zone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(zones)
      .map(([zone, count]) => ({
        zone,
        count: count as number,
        percentage: Math.round((count as number / data.length) * 100)
      }))
      .sort((a, b) => (b.count as number) - (a.count as number));
  }, [data]);

  const maxCount = Math.max(...zoneAnalysis.map(item => item.count as number));
  const totalZones = zoneAnalysis.length;
  const avgRecordsPerZone = Math.round(data.length / totalZones);
  const topZone = zoneAnalysis[0];
  const diversityIndex = Math.round((1 - (zoneAnalysis.reduce((acc, item) => acc + Math.pow(item.percentage / 100, 2), 0))) * 100);

  const getZoneColor = (index: number) => {
    const colors = [
      'from-emerald-500 to-teal-600',
      'from-teal-500 to-cyan-600', 
      'from-cyan-500 to-blue-600',
      'from-blue-500 to-indigo-600',
      'from-indigo-500 to-purple-600',
      'from-purple-500 to-pink-600'
    ];
    return colors[index % colors.length];
  };

  const getBarColor = (index: number) => {
    const colors = [
      'bg-gradient-to-r from-emerald-400 to-emerald-600',
      'bg-gradient-to-r from-teal-400 to-teal-600',
      'bg-gradient-to-r from-cyan-400 to-cyan-600',
      'bg-gradient-to-r from-blue-400 to-blue-600',
      'bg-gradient-to-r from-indigo-400 to-indigo-600',
      'bg-gradient-to-r from-purple-400 to-purple-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 mb-2 uppercase tracking-wider">Total Zonas</p>
              <p className="text-4xl font-extrabold text-gray-800 group-hover:scale-105 transition-transform duration-300">{totalZones}</p>
              <p className="text-sm text-emerald-600 font-semibold mt-1">Cobertura completa</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <MapPin className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl p-6 border border-teal-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 mb-2 uppercase tracking-wider">Promedio</p>
              <p className="text-4xl font-extrabold text-gray-800 group-hover:scale-105 transition-transform duration-300">{avgRecordsPerZone}</p>
              <p className="text-sm text-teal-600 font-semibold mt-1">Por zona</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Cards */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-6 border border-cyan-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-gray-800">{topZone?.zone}</p>
              <p className="text-sm text-cyan-600 font-bold">Zona líder</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 font-semibold">{topZone?.count} registros ({topZone?.percentage}%)</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <PieChart className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-gray-800">{diversityIndex}%</p>
              <p className="text-sm text-blue-600 font-bold">Diversidad</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 font-semibold">Índice de distribución</p>
        </div>
      </div>

      {/* Main Analysis Card */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-8 border-b border-gray-100">
          <div className="flex items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-2xl blur opacity-30"></div>
              <div className="relative p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="ml-6">
              <h3 className="text-3xl font-bold text-gray-800 mb-2">Análisis Territorial</h3>
              <p className="text-gray-600 font-semibold text-lg">Distribución inteligente de datos</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            {zoneAnalysis.map((item, index) => (
              <div 
                key={index} 
                className="group relative overflow-hidden bg-gradient-to-r from-gray-50/90 to-white rounded-3xl p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01]"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'slideInUp 0.6s ease-out forwards'
                }}
              >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500">
                  <div className={`absolute inset-0 bg-gradient-to-br ${getZoneColor(index)} rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700`}></div>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getZoneColor(index)} mr-6 group-hover:scale-125 transition-transform duration-300`}></div>
                      <div>
                        <span className="font-extrabold text-gray-800 text-2xl group-hover:text-3xl transition-all duration-300">{item.zone}</span>
                        <p className="text-sm text-gray-500 font-semibold mt-2">
                          {item.percentage > 30 ? 'Zona principal' : 
                           item.percentage > 20 ? 'Zona importante' : 
                           item.percentage > 10 ? 'Zona secundaria' : 'Zona menor'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-extrabold text-gray-800 group-hover:scale-110 transition-transform duration-300">{item.count}</span>
                      <span className="text-xl text-gray-500 ml-3 font-semibold">registros</span>
                      <p className="text-sm text-gray-400 font-semibold mt-2">
                        {((item.count / data.length) * 100).toFixed(1)}% del total
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Progress Bar */}
                  <div className="relative mb-6">
                    <div className="w-full bg-gray-200/80 rounded-full h-4 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-1500 ease-out ${getBarColor(index)} shadow-lg relative`}
                        style={{ 
                          width: `${(item.count / maxCount) * 100}%`,
                          animationDelay: `${index * 150 + 500}ms`
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-white/30 animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* Percentage Badge */}
                    <div className="absolute right-0 -top-10">
                      <span className={`
                        inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold
                        bg-gradient-to-r ${getZoneColor(index)} text-white shadow-xl
                        group-hover:scale-110 transition-transform duration-300
                      `}>
                        {item.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-6">
                      <span className="text-gray-600 font-semibold">
                        Densidad: {Math.round((item.count / avgRecordsPerZone) * 100)}%
                      </span>
                      <span className="text-gray-600 font-semibold">
                        Ranking: #{index + 1}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-3 text-emerald-500" />
                      <span className="text-emerald-600 font-bold text-base">
                        {item.percentage > 25 ? 'Alto impacto' : 
                         item.percentage > 15 ? 'Medio impacto' : 
                         'Bajo impacto'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getZoneColor(index)} rounded-3xl opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500 blur-xl`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneAnalysis;
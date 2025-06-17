import React from 'react';
import {TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  gradient: string;
  subtitle?: string;
  trend?: number[];
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  gradient,
  subtitle,
  trend
}) => {
  const renderMiniChart = () => {
    if (!trend) return null;
    
    const max = Math.max(...trend);
    const min = Math.min(...trend);
    const range = max - min || 1;
    
    return (
      <div className="flex items-end space-x-1 h-8 mt-3">
        {trend.map((value, index) => {
          const height = ((value - min) / range) * 100;
          return (
            <div
              key={index}
              className={`w-1.5 bg-gradient-to-t rounded-full transition-all duration-500 ${
                changeType === 'positive' 
                  ? 'from-primary-200 to-primary-500' 
                  : changeType === 'negative'
                  ? 'from-red-200 to-red-500'
                  : 'from-gray-200 to-gray-500'
              }`}
              style={{ height: `${Math.max(height, 15)}%` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-medium transition-all duration-500 group hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <p className="text-sm font-semibold text-gray-600">{title}</p>
            {change && (
              <div className={`
                flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full
                ${changeType === 'positive' 
                  ? 'text-primary-700 bg-primary-50 border border-primary-200' 
                  : changeType === 'negative'
                  ? 'text-red-700 bg-red-50 border border-red-200'
                  : 'text-gray-700 bg-gray-50 border border-gray-200'
                }
              `}>
                {changeType === 'positive' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : changeType === 'negative' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                <span>{change}</span>
              </div>
            )}
          </div>
          
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          
          {subtitle && (
            <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
          )}
          
          {renderMiniChart()}
        </div>
        
        <div className={`
          w-14 h-14 rounded-2xl flex items-center justify-center
          ${gradient} group-hover:scale-110 transition-all duration-500 shadow-green
        `}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
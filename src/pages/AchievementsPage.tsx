import React from 'react';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';
import * as Icons from 'lucide-react';

export const AchievementsPage: React.FC = () => {
  const { achievements, activeThemeId, themes } = useApp();
  const activeTheme = themes.find(t => t.id === activeThemeId) || themes[0];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Erfolge</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {achievements.map(achievement => {
          const Icon = (Icons as any)[achievement.icon] || Icons.Trophy;
          
          return (
            <div
              key={achievement.id}
              className={clsx(
                "p-4 rounded-xl border flex items-center gap-4 transition-all",
                achievement.unlocked 
                  ? "bg-white border-green-200 shadow-sm" 
                  : "bg-gray-50 border-gray-200 opacity-60 grayscale"
              )}
            >
              <div className={clsx(
                "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                achievement.unlocked ? "bg-yellow-100 text-yellow-600" : "bg-gray-200 text-gray-400"
              )}>
                <Icon size={24} />
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">
                  {achievement.title}
                </h3>
                <p className="text-sm text-gray-500">{achievement.description}</p>
              </div>

              {achievement.unlocked && (
                <div className={clsx("w-3 h-3 rounded-full", activeTheme.colors.primary)}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

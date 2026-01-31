import React from 'react';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';
import * as Icons from 'lucide-react';
import { Coins, Check, Gift } from 'lucide-react';

export const AchievementsPage: React.FC = () => {
  const { achievements, claimAchievement } = useApp();

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-center text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Erfolge</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {achievements.map(achievement => {
          const Icon = (Icons as any)[achievement.icon] || Icons.Trophy;
          const canClaim = achievement.unlocked && !achievement.claimed;
          
          return (
            <div
              key={achievement.id}
              className={clsx(
                "p-4 rounded-xl border-2 flex flex-col gap-3 transition-all relative overflow-hidden",
                achievement.unlocked 
                  ? "bg-white border-green-400 shadow-md transform hover:scale-[1.02]" 
                  : "bg-gray-100 border-gray-200 opacity-70 grayscale",
                achievement.claimed && "border-yellow-400 bg-yellow-50/50"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={clsx(
                  "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                  achievement.unlocked ? "bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-600 border border-yellow-200" : "bg-gray-200 text-gray-400"
                )}>
                  <Icon size={28} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={clsx("font-bold text-lg truncate", achievement.unlocked ? "text-gray-900" : "text-gray-500")}>
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-tight">{achievement.description}</p>
                </div>

                {/* Reward Badge */}
                <div className="flex flex-col items-end gap-1">
                   <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Coins size={12} />
                      +{achievement.rewardPoints}
                   </div>
                </div>
              </div>

              {/* Action Area */}
              {achievement.unlocked && (
                <div className="mt-2 flex justify-end">
                   {canClaim ? (
                     <button 
                        onClick={() => claimAchievement(achievement.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg animate-bounce hover:animate-none transition-colors"
                     >
                        <Gift size={16} />
                        Belohnung abholen
                     </button>
                   ) : (
                     <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full border border-green-200">
                        <Check size={16} />
                        Eingesammelt
                     </div>
                   )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

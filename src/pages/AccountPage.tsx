import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const AccountPage: React.FC = () => {
  const { points, totalPointsEarned, achievements, tasks, addPoints } = useApp();
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Dein Account</h2>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center relative overflow-hidden">
        {/* Simple Profile Picture Selection Mockup */}
        <div className="relative inline-block group">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl border-4 border-white shadow-md overflow-hidden cursor-pointer hover:scale-105 transition-transform">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="w-full h-full" />
          </div>
          <div className="absolute bottom-4 right-0 bg-blue-500 rounded-full p-1 text-white text-xs shadow-sm cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
            ✏️
          </div>
        </div>
        
        <h3 className="text-xl font-bold">Benutzer</h3>
        <p className="text-gray-500">Level {Math.floor(totalPointsEarned / 50) + 1}</p>
        
        {/* Dev Tool */}
        <button 
          onClick={() => addPoints(10000)}
          className="mt-4 text-xs text-gray-300 hover:text-gray-500 transition-colors"
        >
          (Dev: +10.000 Coins)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Gesamtpunkte</p>
          <p className="text-2xl font-bold">{totalPointsEarned}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Aktuelle Punkte</p>
          <p className="text-2xl font-bold">{points}</p>
        </div>
        
        <Link to="/achievements" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors block">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Erfolge</p>
              <p className="text-2xl font-bold">{unlockedAchievements} / {achievements.length}</p>
            </div>
            <span className="text-xl">🏆</span>
          </div>
        </Link>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Erledigt</p>
          <p className="text-2xl font-bold">{completedTasks}</p>
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-400 mt-8 bg-white/50 inline-block px-4 py-1 rounded-full backdrop-blur-sm mx-auto w-full">
        Version 1.0.0
      </div>
    </div>
  );
};

import React from 'react';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';
import { Check, Lock } from 'lucide-react';

export const PointsPage: React.FC = () => {
  const { themes, activeThemeId, points, unlockTheme, setTheme } = useApp();
  const activeTheme = themes.find(t => t.id === activeThemeId) || themes[0];

  return (
    <div className="space-y-6">
      <h2 className={clsx("text-2xl font-bold text-center drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]", activeTheme.colors.text)}>Punkte einlösen</h2>
      <div className="text-center">
        <p className="text-gray-900 text-center bg-white/80 backdrop-blur-sm rounded-full py-1 px-4 inline-block mx-auto shadow-sm border border-gray-200">
          Tausche deine gesammelten Punkte gegen neue Designs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {themes.map(theme => {
          const isActive = theme.id === activeThemeId;
          const canAfford = points >= theme.cost;
          const borderClass = isActive ? theme.colors.border : 'border-transparent';

          return (
            <div
              key={theme.id}
              className={clsx(
                "p-4 rounded-xl border-2 transition-all flex items-center justify-between bg-white shadow-sm text-gray-900",
                borderClass
              )}
            >
              <div className="flex items-center gap-4">
                <div className={clsx("w-12 h-12 rounded-full shadow-inner flex-shrink-0", theme.colors.primary)}></div>
                <div>
                  <h3 className="font-bold">{theme.name}</h3>
                  <p className="text-sm text-gray-900">{theme.description}</p>
                </div>
              </div>

              <div className="flex flex-col items-end">
                {theme.unlocked ? (
                  isActive ? (
                    <span className="flex items-center gap-1 text-green-600 font-medium px-3 py-1 bg-green-50 rounded-full text-sm">
                      <Check size={14} /> Aktiv
                    </span>
                  ) : (
                    <button
                      onClick={() => setTheme(theme.id)}
                      className="text-sm font-medium px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 text-gray-900"
                    >
                      Anwenden
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => unlockTheme(theme.id)}
                    disabled={!canAfford}
                    className={clsx(
                      "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors",
                      canAfford ? activeTheme.colors.primary : "bg-gray-400 cursor-not-allowed"
                    )}
                  >
                    {canAfford ? (
                      <>Kaufen ({theme.cost})</>
                    ) : (
                      <><Lock size={14} /> {theme.cost}</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

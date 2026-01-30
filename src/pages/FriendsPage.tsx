import React, { useState } from 'react';
import { Users, Trophy, UserPlus, Crown, Search, Share2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '../context/AppContext';

type TimeFrame = 'daily' | 'weekly' | 'monthly';

// Mock Data for UI demonstration
const MOCK_LEADERBOARD = [
  { id: '1', username: 'MaxPower', points: 1250, tasks: 15, avatar: 'MP' },
  { id: '2', username: 'SarahConnor', points: 980, tasks: 12, avatar: 'SC' },
  { id: '3', username: 'JohnDoe', points: 850, tasks: 10, avatar: 'JD' },
  { id: '4', username: 'JaneSmith', points: 720, tasks: 8, avatar: 'JS' },
  { id: '5', username: 'AlexW', points: 650, tasks: 8, avatar: 'AW' },
  { id: '6', username: 'LisaM', points: 400, tasks: 5, avatar: 'LM' },
];

const MOCK_FRIENDS = [
  { id: '2', username: 'SarahConnor', status: 'online' },
  { id: '3', username: 'JohnDoe', status: 'offline' },
];

export const FriendsPage: React.FC = () => {
  const { themes, activeThemeId } = useApp();
  const activeTheme = themes.find(t => t.id === activeThemeId) || themes[0];
  
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'friends'>('leaderboard');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');
  const [searchQuery, setSearchQuery] = useState('');

  const getTimeFrameLabel = (tf: TimeFrame) => {
    switch (tf) {
      case 'daily': return 'Heute';
      case 'weekly': return 'Diese Woche';
      case 'monthly': return 'Diesen Monat';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className={clsx("text-2xl font-bold", activeTheme.colors.text)}>Social Hub</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              activeTab === 'leaderboard' ? activeTheme.colors.primary + " text-white" : "bg-gray-200 text-gray-600"
            )}
          >
            <Trophy size={20} />
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              activeTab === 'friends' ? activeTheme.colors.primary + " text-white" : "bg-gray-200 text-gray-600"
            )}
          >
            <Users size={20} />
          </button>
        </div>
      </div>

      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex justify-center">
            <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
              {(['daily', 'weekly', 'monthly'] as TimeFrame[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf)}
                  className={clsx(
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                    timeFrame === tf 
                      ? "bg-white text-gray-900 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {getTimeFrameLabel(tf)}
                </button>
              ))}
            </div>
          </div>

          {/* Podium */}
          <div className="flex justify-center items-end gap-4 py-4 min-h-[200px]">
            {/* 2nd Place */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-gray-300 border-4 border-gray-400 flex items-center justify-center text-xl font-bold text-gray-600">
                {MOCK_LEADERBOARD[1].avatar}
              </div>
              <div className="flex flex-col items-center bg-gray-200/50 p-3 rounded-t-lg w-24 h-28 justify-end relative">
                <div className="absolute -top-3 bg-gray-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">#2</div>
                <span className="font-bold text-gray-700 truncate w-full text-center">{MOCK_LEADERBOARD[1].username}</span>
                <span className="text-xs text-gray-500">{MOCK_LEADERBOARD[1].points} Pkt</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center gap-2 z-10">
              <Crown className="text-yellow-500 animate-bounce" size={24} />
              <div className="w-20 h-20 rounded-full bg-yellow-100 border-4 border-yellow-400 flex items-center justify-center text-2xl font-bold text-yellow-700 shadow-lg">
                {MOCK_LEADERBOARD[0].avatar}
              </div>
              <div className="flex flex-col items-center bg-gradient-to-b from-yellow-100 to-yellow-50/50 p-3 rounded-t-lg w-28 h-36 justify-end relative shadow-sm">
                <div className="absolute -top-3 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">#1</div>
                <span className="font-bold text-gray-800 truncate w-full text-center">{MOCK_LEADERBOARD[0].username}</span>
                <span className="text-sm text-yellow-700 font-bold">{MOCK_LEADERBOARD[0].points} Pkt</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-orange-100 border-4 border-orange-300 flex items-center justify-center text-xl font-bold text-orange-700">
                {MOCK_LEADERBOARD[2].avatar}
              </div>
              <div className="flex flex-col items-center bg-orange-50/50 p-3 rounded-t-lg w-24 h-20 justify-end relative">
                <div className="absolute -top-3 bg-orange-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">#3</div>
                <span className="font-bold text-gray-700 truncate w-full text-center">{MOCK_LEADERBOARD[2].username}</span>
                <span className="text-xs text-gray-500">{MOCK_LEADERBOARD[2].points} Pkt</span>
              </div>
            </div>
          </div>

          {/* List View */}
          <div className="bg-white/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm border border-gray-100">
            {MOCK_LEADERBOARD.slice(3).map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-white/80 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-mono w-6 text-center">{index + 4}</span>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                    {user.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.username}</div>
                    <div className="text-xs text-gray-500">{user.tasks} Aufgaben erledigt</div>
                  </div>
                </div>
                <div className="font-bold text-gray-700">{user.points} Pkt</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="space-y-6">
          {/* Add Friend */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <UserPlus size={18} />
              Freund hinzufügen
            </h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Benutzername oder Code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <button className={clsx("px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors", activeTheme.colors.primary)}>
                Adden
              </button>
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-2">Dein Einladungs-Code</div>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 border-dashed">
                <code className="flex-1 text-center font-mono text-lg font-bold tracking-wider text-gray-700">LOBBY-X792</code>
                <button className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500 transition-colors">
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Friend List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 px-1">Deine Freunde</h3>
            {MOCK_FRIENDS.map(friend => (
              <div key={friend.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                      {friend.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className={clsx(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                      friend.status === 'online' ? 'bg-green-500' : 'bg-gray-300'
                    )} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{friend.username}</div>
                    <div className="text-xs text-gray-500">{friend.status === 'online' ? 'Online' : 'Zuletzt gesehen: Heute'}</div>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <Users size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

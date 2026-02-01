import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

interface Friend {
  id: string;
  username: string;
  avatar_url?: string;
}

export const GameLobbyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const gameType = searchParams.get('type') || 'tictactoe';
  const { user } = useAuth();
  const { themes, activeThemeId } = useApp();
  const navigate = useNavigate();
  const activeTheme = themes.find(t => t.id === activeThemeId) || themes[0];
  const allowedTypes = ['tictactoe', 'rps'] as const;
  const normalizedGameType = allowedTypes.includes(gameType as (typeof allowedTypes)[number]) ? gameType : 'tictactoe';

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState<string | null>(null);
  const [pendingInvite, setPendingInvite] = useState<{ id: string; friendName: string } | null>(null);

  useEffect(() => {
    if (user) fetchFriends();
  }, [user]);

  useEffect(() => {
    if (!user || !pendingInvite) return;

    const channel = supabase
      .channel(`game_invite:${pendingInvite.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_invites',
          filter: `id=eq.${pendingInvite.id}`
        },
        (payload) => {
          const updatedInvite = payload.new as any;
          if (updatedInvite.status === 'accepted' && updatedInvite.game_id) {
            navigate(`/game/${updatedInvite.game_id}`);
            return;
          }
          if (updatedInvite.status === 'declined') {
            setPendingInvite(null);
            alert('Einladung abgelehnt.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, pendingInvite, user]);

  const fetchFriends = async () => {
    try {
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('friend_id, user_id')
        .or(`user_id.eq.${user!.id},friend_id.eq.${user!.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      const friendIds = friendships.map(f => f.user_id === user!.id ? f.friend_id : f.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', friendIds);

      if (profilesError) throw profilesError;
      setFriends(profiles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (friend: Friend) => {
    setInviteLoading(friend.id);
    try {
      const { data, error } = await supabase
        .from('game_invites')
        .insert({
          sender_id: user!.id,
          receiver_id: friend.id,
          game_type: normalizedGameType
        })
        .select()
        .single();

      if (error) throw error;
      setPendingInvite({ id: data.id, friendName: friend.username });
    } catch (err) {
      console.error(err);
      alert('Fehler beim Senden.');
    } finally {
      setInviteLoading(null);
    }
  };

  const getGameName = () => {
    switch(normalizedGameType) {
      case 'tictactoe': return 'Tic-Tac-Toe';
      case 'rps': return 'Schere Stein Papier';
      default: return 'Spiel';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/games')}
          className={clsx("p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-colors", activeTheme.colors.text)}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className={clsx("text-2xl font-bold drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]", activeTheme.colors.text)}>
          {getGameName()} - Gegner wählen
        </h2>
      </div>

      {pendingInvite && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2 text-gray-900">
          <div className="font-semibold">Warten auf Bestätigung</div>
          <div className="text-sm">Einladung an {pendingInvite.friendName} gesendet.</div>
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="animate-spin" size={16} />
            <span>Wird automatisch gestartet, sobald angenommen.</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-gray-900">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-gray-900" /></div>
        ) : friends.length === 0 ? (
          <div className="p-10 text-center text-gray-900">
            Du hast noch keine Freunde. Füge erst jemanden im Social Hub hinzu!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {friends.map(friend => (
              <div key={friend.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold uppercase overflow-hidden">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      friend.username.substring(0, 2)
                    )}
                  </div>
                  <span className="font-medium">{friend.username}</span>
                </div>
                <button
                  onClick={() => sendInvite(friend)}
                  disabled={inviteLoading === friend.id || !!pendingInvite}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {inviteLoading === friend.id ? <Loader2 className="animate-spin" size={16} /> : 'Einladen'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

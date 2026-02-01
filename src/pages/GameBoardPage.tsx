import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

// Sub-components for specific games
import { TicTacToeGame } from '../components/games/TicTacToeGame';
import { RPSGame } from '../components/games/RPSGame';
import { GameChat } from '../components/GameChat';

export const GameBoardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { themes, activeThemeId } = useApp();
  const navigate = useNavigate();
  const activeTheme = themes.find(t => t.id === activeThemeId) || themes[0];

  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    
    fetchGame();

    const channel = supabase
      .channel(`game:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${id}`
        },
        (payload) => {
          setGame(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user]);

  const fetchGame = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setGame(data);
    } catch (err) {
      console.error(err);
      alert('Spiel nicht gefunden.');
      navigate('/games');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-white" /></div>;
  if (!game) return null;

  const isSupportedGame = game.game_type === 'tictactoe' || game.game_type === 'rps';
  const isPlayer1 = user?.id === game.player1_id;
  const isMyTurn = game.current_turn === user?.id;

  const handleUpdateGameState = async (newState: any, nextTurnId?: string, winnerId?: string) => {
    const updates: any = {
      state: newState,
      updated_at: new Date().toISOString()
    };

    if (nextTurnId !== undefined) updates.current_turn = nextTurnId;
    if (winnerId !== undefined) {
      updates.winner_id = winnerId;
      updates.status = 'finished';
    }

    await supabase.from('games').update(updates).eq('id', id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/games')}
          className={clsx("p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-colors", activeTheme.colors.text)}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className={clsx("text-xl font-bold drop-shadow-md uppercase tracking-wider", activeTheme.colors.text)}>
            {game.game_type === 'tictactoe' && 'Tic-Tac-Toe'}
            {game.game_type === 'rps' && 'Schere Stein Papier'}
          </h2>
          <p className={clsx("text-xs opacity-80", activeTheme.colors.text)}>
            {game.status === 'finished'
              ? (game.winner_id ? (game.winner_id === user?.id ? 'Du hast gewonnen!' : 'Verloren!') : 'Unentschieden!') 
              : (isMyTurn ? 'Du bist dran!' : 'Gegner ist dran...')}
          </p>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex-1 bg-white/90 text-gray-900 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden flex items-center justify-center p-4 relative">
        <GameChat gameId={id || ''} />
        
        {!isSupportedGame && (
          <div className="text-center">
            <h3 className="text-lg font-bold mb-2">Spiel nicht verfügbar</h3>
            <p className="text-sm text-gray-900">Dieses Spiel wurde entfernt.</p>
          </div>
        )}

        {game.game_type === 'tictactoe' && (
          <TicTacToeGame 
            gameState={game.state} 
            isMyTurn={isMyTurn} 
            onMove={(newState, winner) => {
              // Switch turn
              const nextTurn = isPlayer1 ? game.player2_id : game.player1_id;
              handleUpdateGameState(newState, winner ? undefined : nextTurn, winner);
            }}
            myPlayerId={user!.id}
          />
        )}
        
        {game.game_type === 'rps' && (
           <RPSGame 
           gameState={game.state} 
           isMyTurn={true} // RPS is simultaneous mostly, or state based
           myPlayerId={user!.id}
           onMove={(newState, winnerId) => {
             // For RPS, we don't switch turns immediately, we wait for both. 
             // Logic will be inside RPSGame component.
             handleUpdateGameState(newState, undefined, winnerId);
           }}
         />
        )}
      </div>
    </div>
  );
};

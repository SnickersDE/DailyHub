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
  const [rematchSecondsLeft, setRematchSecondsLeft] = useState<number | null>(null);

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

  useEffect(() => {
    if (!game?.state?.rematch?.expiresAt) {
      setRematchSecondsLeft(null);
      return;
    }

    const expiresAt = new Date(game.state.rematch.expiresAt).getTime();
    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setRematchSecondsLeft(remaining);
    };

    updateRemaining();
    const interval = window.setInterval(updateRemaining, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [game?.state?.rematch?.expiresAt]);

  useEffect(() => {
    if (!game || game.game_type !== 'tictactoe' || game.status !== 'finished') return;
    const rematch = game.state?.rematch;
    if (!rematch?.requests || !rematch?.expiresAt) return;
    const hasBoth = rematch.requests[game.player1_id] && rematch.requests[game.player2_id];
    if (!hasBoth) return;
    if (new Date(rematch.expiresAt).getTime() < Date.now()) return;
    if (rematch.gameId) {
      if (rematch.gameId !== id) {
        navigate(`/game/${rematch.gameId}`);
      }
      return;
    }
    if (user?.id !== game.player1_id) return;
    void createRematchGame(rematch);
  }, [game, id, navigate, user?.id]);

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

  const createRematchGame = async (rematch: any) => {
    try {
      const { data: newGame, error } = await supabase
        .from('games')
        .insert({
          game_type: 'tictactoe',
          player1_id: game.player1_id,
          player2_id: game.player2_id,
          status: 'playing',
          current_turn: game.player1_id,
          state: { board: Array(9).fill(null) }
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('games')
        .update({ state: { ...game.state, rematch: { ...rematch, gameId: newGame.id } } })
        .eq('id', game.id);

      navigate(`/game/${newGame.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestRematch = async () => {
    if (!game || game.game_type !== 'tictactoe' || game.status !== 'finished' || !user) return;
    const now = new Date();
    const existing = game.state?.rematch;
    const existingExpiresAt = existing?.expiresAt ? new Date(existing.expiresAt).getTime() : 0;
    const isExpired = existingExpiresAt && existingExpiresAt < now.getTime();
    const expiresAt = isExpired || !existingExpiresAt ? new Date(now.getTime() + 30000) : new Date(existingExpiresAt);
    const requests = isExpired ? {} : (existing?.requests || {});
    const nextRematch = {
      requests: { ...requests, [user.id]: now.toISOString() },
      expiresAt: expiresAt.toISOString(),
      gameId: existing?.gameId
    };

    await supabase
      .from('games')
      .update({ state: { ...game.state, rematch: nextRematch } })
      .eq('id', game.id);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-white" /></div>;
  if (!game) return null;

  const isSupportedGame = game.game_type === 'tictactoe' || game.game_type === 'rps';
  const isPlayer1 = user?.id === game.player1_id;
  const isMyTurn = game.current_turn === user?.id;
  const rematchRequests = game.state?.rematch?.requests || {};
  const rematchExpiresAt = game.state?.rematch?.expiresAt ? new Date(game.state.rematch.expiresAt).getTime() : null;
  const rematchExpired = rematchExpiresAt ? rematchExpiresAt < Date.now() : false;
  const hasRequestedRematch = !!(user?.id && rematchRequests[user.id]);

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

      {game.game_type === 'tictactoe' && game.status === 'finished' && (
        <div className="flex flex-col items-center gap-2 text-gray-900">
          <button
            onClick={handleRequestRematch}
            disabled={hasRequestedRematch || rematchExpired}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {hasRequestedRematch ? 'Revanche angefragt' : 'Revanche fordern'}
          </button>
          {rematchSecondsLeft !== null && !rematchExpired && (
            <div className="text-xs">Bestätigung läuft: {rematchSecondsLeft}s</div>
          )}
          {rematchExpired && (
            <div className="text-xs">Revanche-Zeit abgelaufen.</div>
          )}
        </div>
      )}
    </div>
  );
};

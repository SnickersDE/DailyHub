import React from 'react';
import { clsx } from 'clsx';
import { X, Circle } from 'lucide-react';

interface Props {
  gameState: any; // { board: string[] }
  isMyTurn: boolean;
  onMove: (newState: any, winnerId?: string) => void;
  myPlayerId: string;
}

export const TicTacToeGame: React.FC<Props> = ({ gameState, isMyTurn, onMove, myPlayerId }) => {
  const board = gameState?.board || Array(9).fill(null);
  
  // Determine my symbol based on who started?
  // We need to know who is 'X' and who is 'O'.
  // Convention: Player 1 (creator) is X, Player 2 is O.
  // But we don't have that info easily here unless passed down.
  // For simplicity: If board has even number of moves, next is X. 
  const xIsNext = board.filter((s: any) => s !== null).length % 2 === 0;
  const nextSymbol = xIsNext ? 'X' : 'O';

  const handleClick = (index: number) => {
    if (!isMyTurn || board[index] || calculateWinner(board)) return;

    const newBoard = [...board];
    newBoard[index] = nextSymbol;

    const winnerSymbol = calculateWinner(newBoard);
    let winnerId = undefined;
    
    // If there is a winner, we need to return the ID of the winner.
    // Since *I* just made the move that won, *I* am the winner.
    if (winnerSymbol) {
      winnerId = myPlayerId;
    } else if (!newBoard.includes(null)) {
      // Draw
      winnerId = undefined; // handled as finished but no winner in parent if we want? 
      // Actually parent expects winnerId or undefined. 
      // If draw, we might need a special flag or just set status to finished without winner.
      // For now let's just update state.
    }

    onMove({ board: newBoard }, winnerId);
  };

  const winner = calculateWinner(board);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="grid grid-cols-3 gap-3 bg-gray-200 p-3 rounded-xl shadow-inner">
        {board.map((square: string | null, i: number) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={!isMyTurn || square !== null || !!winner}
            className={clsx(
              "w-20 h-20 bg-white rounded-lg flex items-center justify-center text-4xl shadow-sm transition-all",
              !square && isMyTurn && !winner && "hover:bg-blue-50 cursor-pointer",
              (square || !isMyTurn || winner) && "cursor-default"
            )}
          >
            {square === 'X' && <X size={48} className="text-blue-500" />}
            {square === 'O' && <Circle size={40} className="text-red-500" />}
          </button>
        ))}
      </div>
      
      {winner && (
        <div className="animate-bounce text-2xl font-bold text-gray-900 drop-shadow-sm">
          {winner} hat gewonnen!
        </div>
      )}
      {!winner && !board.includes(null) && (
         <div className="text-xl font-bold text-gray-900">Unentschieden!</div>
      )}
    </div>
  );
};

function calculateWinner(squares: any[]) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

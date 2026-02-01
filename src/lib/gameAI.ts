export type Difficulty = 'easy' | 'medium' | 'hard';

// --- Tic-Tac-Toe AI ---

const checkWinner = (board: (string | null)[]): string | null => {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

// Minimax for TTT
const minimaxTTT = (board: (string | null)[], depth: number, isMaximizing: boolean, aiSymbol: string, playerSymbol: string): number => {
  const winner = checkWinner(board);
  if (winner === aiSymbol) return 10 - depth;
  if (winner === playerSymbol) return depth - 10;
  if (!board.includes(null)) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiSymbol;
        const score = minimaxTTT(board, depth + 1, false, aiSymbol, playerSymbol);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = playerSymbol;
        const score = minimaxTTT(board, depth + 1, true, aiSymbol, playerSymbol);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
};

export const getTicTacToeMove = (board: (string | null)[], difficulty: Difficulty = 'medium'): number => {
  const emptyIndices = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
  if (emptyIndices.length === 0) return -1;

  if (difficulty === 'easy') {
    // Random
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  // AI is always 'O' in our logic for now, Player is 'X'
  const aiSymbol = 'O';
  const playerSymbol = 'X';

  // Medium: 30% chance to make a random mistake, otherwise optimal
  if (difficulty === 'medium' && Math.random() < 0.3) {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  // Hard: Minimax
  let bestScore = -Infinity;
  let move = -1;
  
  // Optimization: If empty board or first move, pick center or corner to save calc
  if (emptyIndices.length >= 8) {
      if (board[4] === null) return 4;
      return 0; 
  }

  for (let i = 0; i < emptyIndices.length; i++) {
    const idx = emptyIndices[i];
    const newBoard = [...board];
    newBoard[idx] = aiSymbol;
    const score = minimaxTTT(newBoard, 0, false, aiSymbol, playerSymbol);
    if (score > bestScore) {
      bestScore = score;
      move = idx;
    }
  }
  return move;
};

// --- RPS AI ---

export const getRPSMove = (history: string[], difficulty: Difficulty = 'medium'): string => {
  const moves = ['rock', 'paper', 'scissors'];
  
  if (difficulty === 'easy' || history.length === 0) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  if (difficulty === 'medium') {
    // Beat the player's last move (assuming they repeat it)
    // Or if they just won, they might keep it. If they lost, they might switch.
    // Simple Heuristic: Assume player repeats last move.
    const lastPlayerMove = history[history.length - 1]; // We need player history actually
    // History here is mixed? We need specific player moves.
    // Let's assume input history is just last moves of *player*.
    // Counter last move:
    if (lastPlayerMove === 'rock') return 'paper';
    if (lastPlayerMove === 'paper') return 'scissors';
    if (lastPlayerMove === 'scissors') return 'rock';
  }

  if (difficulty === 'hard') {
    // Beat the move that beats the player's last move (assuming they switch to what beat them? No that's too complex)
    // Nash Equilibrium: Random is actually best.
    // But let's try to detect frequency.
    // Count player moves
    const counts: Record<string, number> = { rock: 0, paper: 0, scissors: 0 };
    history.forEach(m => { if (counts[m] !== undefined) counts[m]++ });
    
    // Predict player will choose their most frequent move
    const mostFrequent = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    
    // Counter it
    if (mostFrequent === 'rock') return 'paper';
    if (mostFrequent === 'paper') return 'scissors';
    return 'rock';
  }

  return moves[Math.floor(Math.random() * moves.length)];
};

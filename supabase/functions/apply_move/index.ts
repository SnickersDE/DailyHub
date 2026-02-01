import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

const getClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

const parsePosition = (value: unknown) => {
  if (Array.isArray(value) && value.length === 2) {
    const [row, col] = value;
    if (Number.isInteger(row) && Number.isInteger(col)) return [row, col] as [number, number];
  }
  if (typeof value === "string") {
    const parts = value.split(",").map((v) => Number(v.trim()));
    if (parts.length === 2 && parts.every((v) => Number.isInteger(v))) {
      return [parts[0], parts[1]] as [number, number];
    }
  }
  return null;
};

const emptyBoard = () =>
  Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null));

const cloneBoard = (board: Array<Array<Record<string, any> | null>>) =>
  board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));

const resolveBattle = (
  attacker: string,
  defender: string,
  attackerPiece?: Record<string, any> | null,
  defenderPiece?: Record<string, any> | null,
) => {
  if (attackerPiece?.type === "d" && (attackerPiece.swordLives ?? 0) <= 0) return "defender";
  if (defenderPiece?.type === "d" && (defenderPiece.swordLives ?? 0) <= 0) return "attacker";
  if (attacker === defender) return "duel";

  if (attacker === "d" && ["a", "b", "c"].includes(defender)) return "attacker";
  if (defender === "d" && ["a", "b", "c"].includes(attacker)) return "defender";

  if (attacker === "a" && defender === "c") return "attacker";
  if (defender === "a" && attacker === "c") return "defender";

  if (attacker === "b" && defender === "a") return "attacker";
  if (defender === "b" && attacker === "a") return "defender";

  if (attacker === "c" && defender === "b") return "attacker";
  if (defender === "c" && attacker === "b") return "defender";

  if (defender === "e") return "attacker";
  if (attacker === "e") return "defender";

  return "defender";
};

const resolveDuel = () => {
  const choices = ["a", "b", "c"];
  const attackerChoice = choices[Math.floor(Math.random() * 3)];
  let defenderChoice = choices[Math.floor(Math.random() * 3)];
  while (defenderChoice === attackerChoice) {
    defenderChoice = choices[Math.floor(Math.random() * 3)];
  }
  return { attackerChoice, defenderChoice };
};

const applySwordLifeLoss = (
  winnerPiece: Record<string, any> | null,
  loserPiece: Record<string, any> | null,
) => {
  if (!winnerPiece || winnerPiece.type !== "d") return;
  if (!loserPiece || !["a", "b", "c"].includes(loserPiece.type)) return;
  if ((winnerPiece.swordLives ?? 0) > 0) {
    winnerPiece.swordLives = (winnerPiece.swordLives ?? 0) - 1;
  }
};

const toPlayerNumber = (userId: string, game: Record<string, any>) =>
  userId === game.player1_id ? 1 : userId === game.player2_id ? 2 : null;

const isValidStep = (from: [number, number], to: [number, number]) => {
  const rowDiff = Math.abs(to[0] - from[0]);
  const colDiff = Math.abs(to[1] - from[1]);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
};

export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = getClient();
  const { lobbyId, from, to, turnIndex, userId } = await req.json();

  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("lobby_id", lobbyId)
    .single();

  if (!game) return json({ error: "game_not_found" }, 404);

  const state = (game.state_json ?? {}) as Record<string, any>;
  if (game.status !== "playing") return json({ error: "not_playing" }, 409);
  if (game.turn_index !== turnIndex) return json({ error: "stale_turn" }, 409);
  if (state.currentPlayerUserId !== userId) return json({ error: "not_your_turn" }, 403);
  if (state.setupPhase) return json({ error: "setup_phase" }, 409);

  const fromPos = parsePosition(from);
  const toPos = parsePosition(to);
  if (!fromPos || !toPos) return json({ error: "invalid_move" }, 400);
  if (fromPos[0] === toPos[0] && fromPos[1] === toPos[1]) {
    return json({ error: "invalid_move" }, 400);
  }
  if (!isValidStep(fromPos, toPos)) return json({ error: "invalid_move" }, 400);

  const currentPlayerUserId = state.currentPlayerUserId;
  const nextPlayerUserId =
    state.nextPlayerUserId ??
    (currentPlayerUserId === game.player1_id ? game.player2_id : game.player1_id);
  const currentPlayerNumber = toPlayerNumber(currentPlayerUserId, game);
  const nextPlayerNumber = toPlayerNumber(nextPlayerUserId, game);
  if (!currentPlayerNumber || !nextPlayerNumber) return json({ error: "invalid_players" }, 400);

  const board = Array.isArray(state.board) ? state.board : emptyBoard();
  const nextBoard = cloneBoard(board);
  const movingPiece = nextBoard[fromPos[0]]?.[fromPos[1]];
  if (!movingPiece) return json({ error: "invalid_move" }, 400);
  if (movingPiece.player !== currentPlayerNumber) return json({ error: "invalid_move" }, 403);

  const targetPiece = nextBoard[toPos[0]]?.[toPos[1]];
  if (targetPiece && targetPiece.player === movingPiece.player) {
    return json({ error: "invalid_move" }, 400);
  }

  let gameOver = Boolean(state.gameOver);
  let winner = state.winner ?? null;
  let duelResult: Record<string, string> | null = null;

  if (!targetPiece) {
    nextBoard[toPos[0]][toPos[1]] = movingPiece;
    nextBoard[fromPos[0]][fromPos[1]] = null;
  } else {
    let result = resolveBattle(movingPiece.type, targetPiece.type, movingPiece, targetPiece);
    if (result === "duel") {
      duelResult = resolveDuel();
      result = resolveBattle(duelResult.attackerChoice, duelResult.defenderChoice);
    }
    if (result === "attacker") {
      if (targetPiece.type === "e") {
        gameOver = true;
        winner = movingPiece.player;
      }
      applySwordLifeLoss(movingPiece, targetPiece);
      nextBoard[toPos[0]][toPos[1]] = movingPiece;
      nextBoard[fromPos[0]][fromPos[1]] = null;
    } else {
      if (movingPiece.type === "e") {
        gameOver = true;
        winner = targetPiece.player;
      }
      applySwordLifeLoss(targetPiece, movingPiece);
      nextBoard[fromPos[0]][fromPos[1]] = null;
    }
  }

  const moves = Array.isArray(state.moves) ? state.moves : [];
  const moveEntry: Record<string, any> = {
    from: fromPos,
    to: toPos,
    at: Date.now(),
    result: targetPiece ? "battle" : "move",
  };
  if (duelResult) moveEntry.duelResult = duelResult;

  const nextState: Record<string, any> = {
    ...state,
    board: nextBoard,
    moves: [...moves, moveEntry],
    gameOver,
    winner,
  };

  const now = new Date();
  const nextTurnEnds = gameOver ? null : new Date(now.getTime() + 30000).toISOString();
  nextState.currentPlayerUserId = gameOver ? null : nextPlayerUserId;
  nextState.nextPlayerUserId = gameOver ? null : currentPlayerUserId;
  nextState.currentPlayer = gameOver ? null : nextPlayerNumber;
  nextState.turnIndex = (state.turnIndex ?? game.turn_index ?? 0) + 1;
  nextState.turnEndsAt = nextTurnEnds;

  await supabase
    .from("games")
    .update({
      state_json: nextState,
      turn_index: game.turn_index + 1,
      turn_ends_at: nextTurnEnds,
      current_turn: gameOver ? null : nextPlayerUserId,
      p1_penalties: nextState.p1Penalties ?? game.p1_penalties ?? 0,
      p2_penalties: nextState.p2Penalties ?? game.p2_penalties ?? 0,
      winner: winner ?? null,
      winner_id: winner === 1 ? game.player1_id : winner === 2 ? game.player2_id : null,
      status: gameOver ? "finished" : game.status,
      updated_at: now.toISOString(),
    })
    .eq("id", game.id);

  return json({ ok: true });
};

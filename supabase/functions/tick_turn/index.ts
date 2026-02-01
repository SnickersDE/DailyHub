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

type Board = Array<Array<Record<string, any> | null>>;

const emptyBoard = (): Board =>
  Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null));

const applySetupToBoard = (
  board: Board,
  playerNumber: number,
  setup: Record<string, any>,
) => {
  const next = board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
  next[setup.flagPos.row][setup.flagPos.col] = { player: playerNumber, type: "e" };
  for (const [key, type] of Object.entries(setup.assignments)) {
    const [row, col] = key.split("-").map(Number);
    const piece: Record<string, any> = { player: playerNumber, type };
    if (type === "d") piece.swordLives = 3;
    next[row][col] = piece;
  }
  return next;
};

const generateRandomSetup = (playerNumber: number) => {
  const rows = playerNumber === 1 ? [0, 1] : [4, 5];
  const cells: Array<{ row: number; col: number }> = [];
  rows.forEach((row) => {
    for (let col = 0; col < 7; col += 1) {
      cells.push({ row, col });
    }
  });
  const flagIndex = Math.floor(Math.random() * cells.length);
  const flagPos = cells.splice(flagIndex, 1)[0];
  const pool = [
    ...Array(4).fill("a"),
    ...Array(4).fill("b"),
    ...Array(4).fill("c"),
    ...Array(1).fill("d"),
  ];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const assignments: Record<string, string> = {};
  cells.forEach((cell, idx) => {
    assignments[`${cell.row}-${cell.col}`] = pool[idx];
  });
  return { flagPos, assignments };
};

const toPlayerNumber = (userId: string | null, game: Record<string, any>) =>
  userId === game.player1_id ? 1 : userId === game.player2_id ? 2 : null;

export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = getClient();

  const now = new Date();
  const { data: games } = await supabase
    .from("games")
    .select("*")
    .eq("status", "playing")
    .lt("turn_ends_at", now.toISOString());

  const updated = [];

  for (const game of games || []) {
    const state = (game.state_json ?? {}) as Record<string, any>;
    const currentPlayer = state.currentPlayerUserId;
    const nextPlayer = state.nextPlayerUserId;
    const p1 = (game.p1_penalties ?? 0) + (currentPlayer === game.player1_id ? 1 : 0);
    const p2 = (game.p2_penalties ?? 0) + (currentPlayer === game.player2_id ? 1 : 0);
    const winnerNumber = p1 >= 2 ? 2 : p2 >= 2 ? 1 : null;
    const winnerId =
      winnerNumber === 1 ? game.player1_id : winnerNumber === 2 ? game.player2_id : null;

    const turnEndsAt = new Date(now.getTime() + 30000).toISOString();
    const nextPlayerUserId =
      nextPlayer ?? (currentPlayer === game.player1_id ? game.player2_id : game.player1_id);
    const nextPlayerNumber = toPlayerNumber(nextPlayerUserId, game);

    await supabase
      .from("games")
      .update({
        p1_penalties: p1,
        p2_penalties: p2,
        current_turn: winnerNumber ? null : nextPlayerUserId,
        state_json: {
          ...state,
          currentPlayerUserId: winnerNumber ? null : nextPlayerUserId,
          nextPlayerUserId: currentPlayer,
          currentPlayer: winnerNumber ? null : nextPlayerNumber,
          turnIndex: (state.turnIndex ?? game.turn_index ?? 0) + 1,
          turnEndsAt: winnerNumber ? null : turnEndsAt,
          p1Penalties: p1,
          p2Penalties: p2,
          gameOver: Boolean(winnerNumber),
          winner: winnerNumber,
        },
        turn_index: (game.turn_index ?? 0) + 1,
        turn_ends_at: winnerNumber ? null : turnEndsAt,
        winner: winnerNumber,
        winner_id: winnerId,
        status: winnerNumber ? "finished" : game.status,
        updated_at: now.toISOString(),
      })
      .eq("id", game.id);

    updated.push(game.id);
  }

  const { data: setupLobbies } = await supabase
    .from("lobbies")
    .select("id, status, setup_ends_at")
    .eq("status", "setup")
    .lt("setup_ends_at", now.toISOString());

  const setupUpdated = [];

  for (const lobby of setupLobbies || []) {
    const { data: membersData } = await supabase
      .from("lobby_members")
      .select("user_id, team")
      .eq("lobby_id", lobby.id);

    const members = (membersData || []) as Array<{ user_id: string; team?: number | null }>;
    if (members.length !== 2) continue;

    const { data: game } = await supabase
      .from("games")
      .select("*")
      .eq("lobby_id", lobby.id)
      .single();
    if (!game) continue;

    const memberA = members[0];
    const memberB = members[1];
    const player1 =
      game.player1_id ??
      (memberA?.team === 2 ? memberB?.user_id : memberA?.user_id);
    const player2 =
      game.player2_id ??
      (memberA?.team === 2 ? memberA?.user_id : memberB?.user_id);
    if (!player1 || !player2) continue;

    const state = (game.state_json ?? {}) as Record<string, any>;
    const setups = { ...(state.setups ?? {}) } as Record<string, any>;
    const setupConfirmed = { ...(state.setupConfirmed ?? {}) } as Record<string, boolean>;

    if (!setupConfirmed[player1]) {
      setups[player1] = generateRandomSetup(1);
      setupConfirmed[player1] = true;
    }
    if (!setupConfirmed[player2]) {
      setups[player2] = generateRandomSetup(2);
      setupConfirmed[player2] = true;
    }

    let board = emptyBoard();
    board = applySetupToBoard(board, 1, setups[player1]);
    board = applySetupToBoard(board, 2, setups[player2]);

    const turnEndsAt = new Date(now.getTime() + 30000).toISOString();
    const nextState = {
      ...state,
      setups,
      setupConfirmed,
      board,
      setupPhase: false,
      currentPlayerUserId: player1,
      nextPlayerUserId: player2,
      currentPlayer: 1,
      turnIndex: 1,
      turnEndsAt,
      p1Penalties: state.p1Penalties ?? 0,
      p2Penalties: state.p2Penalties ?? 0,
      winner: null,
      gameOver: false,
    };

    await supabase
      .from("lobbies")
      .update({ status: "playing", setup_ends_at: null })
      .eq("id", lobby.id);

    await supabase
      .from("games")
      .update({
        status: "playing",
        turn_index: 1,
        turn_ends_at: turnEndsAt,
        setup_ends_at: null,
        current_turn: player1,
        state_json: nextState,
        updated_at: now.toISOString(),
      })
      .eq("id", game.id);

    setupUpdated.push(game.id);
  }

  return json({ ok: true, updated, setupUpdated });
};

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

const isAllowedSetupCell = (playerNumber: number, row: number) =>
  playerNumber === 1 ? row === 0 || row === 1 : row === 4 || row === 5;

const validateSetup = (setup: any) => {
  if (!setup?.flagPos || !setup?.assignments) return { ok: false, error: "invalid_payload" };
  const { flagPos, assignments } = setup;

  if (!Number.isInteger(flagPos.row) || !Number.isInteger(flagPos.col)) {
    return { ok: false, error: "flag_invalid" };
  }

  const counts: Record<"a" | "b" | "c" | "d", number> = { a: 0, b: 0, c: 0, d: 0 };
  const keys = Object.keys(assignments);
  if (keys.length !== 13) return { ok: false, error: "needs_13_assignments" };

  for (const [key, type] of Object.entries(assignments)) {
    const normalized = String(type);
    if (!["a", "b", "c", "d"].includes(normalized)) {
      return { ok: false, error: "invalid_piece" };
    }
    counts[normalized as "a" | "b" | "c" | "d"] += 1;
    const [r, c] = key.split("-").map(Number);
    if (!Number.isInteger(r) || !Number.isInteger(c)) {
      return { ok: false, error: "invalid_cell" };
    }
  }

  if (counts.a !== 4 || counts.b !== 4 || counts.c !== 4 || counts.d !== 1) {
    return { ok: false, error: "wrong_counts" };
  }

  return { ok: true };
};

export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = getClient();
  const { lobbyId, userId, setup } = await req.json();

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("lobby_id", lobbyId)
    .single();

  if (gameError || !game) return json({ error: "game_not_found" }, 404);

  const { data: membersData } = await supabase
    .from("lobby_members")
    .select("user_id")
    .eq("lobby_id", lobbyId);

  const members = (membersData || []) as Array<{ user_id: string }>;
  if (!members.some((m) => m.user_id === userId)) return json({ error: "not_in_lobby" }, 403);
  const playerNumber =
    userId === game.player1_id ? 1 : userId === game.player2_id ? 2 : null;
  if (!playerNumber) return json({ error: "invalid_player" }, 403);

  const validation = validateSetup(setup);
  if (!validation.ok) return json({ error: validation.error }, 400);
  if (!isAllowedSetupCell(playerNumber, setup.flagPos.row)) {
    return json({ error: "invalid_flag_position" }, 400);
  }
  for (const key of Object.keys(setup.assignments)) {
    const [row] = key.split("-").map(Number);
    if (!isAllowedSetupCell(playerNumber, row)) {
      return json({ error: "invalid_assignment_position" }, 400);
    }
  }

  const state = (game.state_json ?? {}) as Record<string, any>;
  const setups = { ...(state.setups ?? {}) } as Record<string, any>;
  const setupConfirmed = { ...(state.setupConfirmed ?? {}) } as Record<string, boolean>;
  setups[userId] = setup;
  setupConfirmed[userId] = true;

  const nextState = { ...state, setups, setupConfirmed } as Record<string, any>;
  const allReady = members.length === 2 && members.every((m) => setupConfirmed[m.user_id]);

  const now = new Date();
  const turnEndsAt = new Date(now.getTime() + 30000).toISOString();
  const updates: Record<string, any> = {
    state_json: nextState,
    updated_at: now.toISOString(),
  };

  if (allReady) {
    const currentPlayerUserId = game.player1_id ?? members[0]?.user_id ?? null;
    const nextPlayerUserId =
      currentPlayerUserId === game.player1_id ? game.player2_id : game.player1_id;
    let board = emptyBoard();
    const p1Setup = setups[game.player1_id];
    const p2Setup = setups[game.player2_id];
    if (p1Setup) {
      board = applySetupToBoard(board, 1, p1Setup);
    }
    if (p2Setup) {
      board = applySetupToBoard(board, 2, p2Setup);
    }
    updates.status = "playing";
    updates.turn_index = 1;
    updates.turn_ends_at = turnEndsAt;
    updates.setup_ends_at = null;
    updates.current_turn = currentPlayerUserId;
    updates.state_json = {
      ...nextState,
      board,
      setupPhase: false,
      currentPlayer: currentPlayerUserId === game.player1_id ? 1 : 2,
      currentPlayerUserId,
      nextPlayerUserId,
      turnIndex: 1,
      turnEndsAt: turnEndsAt,
      p1Penalties: nextState.p1Penalties ?? 0,
      p2Penalties: nextState.p2Penalties ?? 0,
      winner: null,
      gameOver: false,
    };
    await supabase
      .from("lobbies")
      .update({ status: "playing", setup_ends_at: null })
      .eq("id", lobbyId);
  }

  await supabase.from("games").update(updates).eq("id", game.id);

  return json({ ok: true, allReady });
};

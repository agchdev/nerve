const { createServer } = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config();

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase env vars for ruleta server.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const port = Number(process.env.RULETA_PORT || process.env.ROULETA_PORT) || 8000;
const origin =
  process.env.RULETA_ORIGIN ||
  process.env.ROULETA_ORIGIN ||
  "http://localhost:3000";
const gameSlug =
  process.env.RULETA_GAME_SLUG || process.env.ROULETA_GAME_SLUG || "ruleta";
const openSeconds =
  Number(process.env.RULETA_OPEN_SECONDS || process.env.ROULETA_OPEN_SECONDS) ||
  25;
const closedSeconds =
  Number(
    process.env.RULETA_CLOSED_SECONDS || process.env.ROULETA_CLOSED_SECONDS
  ) || 8;
const resolveSeconds =
  Number(
    process.env.RULETA_RESOLVE_SECONDS || process.env.ROULETA_RESOLVE_SECONDS
  ) || 6;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin,
    methods: ["GET", "POST"],
  },
});

const PURPLE_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

let gameId = null;
let currentRound = null;
let ticker = null;

const getRange = (number) => {
  if (number === 0 || number === null || number === undefined) return null;
  return number <= 18 ? "1-18" : "19-36";
};

const getParity = (number) => {
  if (number === 0 || number === null || number === undefined) return null;
  return number % 2 === 0 ? "par" : "impar";
};

const getColor = (number) => {
  if (number === 0) return "verde";
  return PURPLE_NUMBERS.has(number) ? "morado" : "azul";
};

const nowIso = () => new Date().toISOString();
const offsetIso = (ms) => new Date(Date.now() + ms).toISOString();

const buildPayload = () => {
  if (!currentRound) {
    return {
      roundId: null,
      estado: "sin_ronda",
      secondsRemaining: 0,
      numero_ganador: null,
      color_ganador: null,
      paridad_ganadora: null,
      rango_ganador: null,
    };
  }

  const now = Date.now();
  let secondsRemaining = 0;
  if (currentRound.estado === "abierta") {
    secondsRemaining = Math.max(
      0,
      Math.ceil((currentRound.closesAt - now) / 1000)
    );
  } else if (currentRound.estado === "cerrada") {
    secondsRemaining = Math.max(
      0,
      Math.ceil((currentRound.resolvesAt - now) / 1000)
    );
  } else if (currentRound.estado === "resuelta") {
    secondsRemaining = Math.max(
      0,
      Math.ceil((currentRound.endsAt - now) / 1000)
    );
  }

  return {
    roundId: currentRound.id,
    estado: currentRound.estado,
    secondsRemaining,
    numero_ganador: currentRound.numero_ganador ?? null,
    color_ganador: currentRound.color_ganador ?? null,
    paridad_ganadora: currentRound.paridad_ganadora ?? null,
    rango_ganador: currentRound.rango_ganador ?? null,
  };
};

const emitRoundUpdate = () => {
  io.emit("round:update", buildPayload());
};

const ensureGameId = async () => {
  if (gameId) return gameId;
  const { data, error } = await supabase
    .from("juegos")
    .select("id")
    .eq("slug", gameSlug)
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error("Unable to resolve ruleta game id.");
  }

  gameId = data.id;
  return gameId;
};

const createRound = async () => {
  const now = Date.now();
  const closesAt = now + openSeconds * 1000;
  const resolvesAt = now + (openSeconds + closedSeconds) * 1000;
  const endsAt = now + (openSeconds + closedSeconds + resolveSeconds) * 1000;

  const { data, error } = await supabase
    .from("ruleta_rondas")
    .insert({
      id_juego: gameId,
      estado: "abierta",
      inicio_en: nowIso(),
      cierre_en: offsetIso(openSeconds * 1000),
      resuelta_en: offsetIso((openSeconds + closedSeconds) * 1000),
    })
    .select(
      "id, estado, numero_ganador, color_ganador, paridad_ganadora, rango_ganador"
    )
    .single();

  if (error) {
    throw new Error("Failed to create ruleta round.");
  }

  currentRound = {
    id: data.id,
    estado: "abierta",
    numero_ganador: null,
    color_ganador: null,
    paridad_ganadora: null,
    rango_ganador: null,
    opensAt: now,
    closesAt,
    resolvesAt,
    endsAt,
  };
};

const updateRoundState = async (estado) => {
  if (!currentRound) return;
  const payload = { estado };
  if (estado === "cerrada") {
    payload.cierre_en = nowIso();
  }
  if (estado === "resuelta") {
    payload.resuelta_en = nowIso();
  }

  const { error } = await supabase
    .from("ruleta_rondas")
    .update(payload)
    .eq("id", currentRound.id);

  if (error) {
    console.error("Failed to update ruleta round state.");
  }
};

const resolveRound = async () => {
  if (!currentRound) return;
  const winner = Math.floor(Math.random() * 37);
  const color = getColor(winner);
  const parity = getParity(winner);
  const range = getRange(winner);

  const { error } = await supabase
    .from("ruleta_rondas")
    .update({
      estado: "resuelta",
      numero_ganador: winner,
      color_ganador: color,
      paridad_ganadora: parity,
      rango_ganador: range,
      resuelta_en: nowIso(),
    })
    .eq("id", currentRound.id);

  if (error) {
    console.error("Failed to resolve ruleta round.");
  }

  currentRound = {
    ...currentRound,
    estado: "resuelta",
    numero_ganador: winner,
    color_ganador: color,
    paridad_ganadora: parity,
    rango_ganador: range,
  };
};

const tick = async () => {
  if (!currentRound) return;
  const now = Date.now();

  if (currentRound.estado === "abierta" && now >= currentRound.closesAt) {
    currentRound.estado = "cerrada";
    await updateRoundState("cerrada");
    emitRoundUpdate();
    return;
  }

  if (currentRound.estado === "cerrada" && now >= currentRound.resolvesAt) {
    await resolveRound();
    emitRoundUpdate();
    return;
  }

  if (currentRound.estado === "resuelta" && now >= currentRound.endsAt) {
    await createRound();
    emitRoundUpdate();
    return;
  }

  emitRoundUpdate();
};

const startLoop = () => {
  if (ticker) clearInterval(ticker);
  ticker = setInterval(() => {
    tick().catch((error) => console.error(error));
  }, 1000);
};

const startServer = async () => {
  await ensureGameId();
  await createRound();
  emitRoundUpdate();
  startLoop();
};

io.on("connection", (socket) => {
  socket.emit("round:update", buildPayload());
});

httpServer.listen(port, () => {
  console.log(`Ruleta server running on port ${port}`);
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
});

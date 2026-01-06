"use client";

import { useEffect, useRef, useState } from "react";
import { RouletteNumberTicker } from "./RouletteNumberTicker";

const STAGE_LABELS = {
  abierta: "Apuestas abiertas",
  cerrada: "No mas apuestas",
  resuelta: "Resultado",
};

const PURPLE_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);
const HISTORY_LIMIT = 12;

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);


const formatResult = (data) => {
  if (
    !data ||
    data.numero_ganador === null ||
    data.numero_ganador === undefined
  ) {
    return "Esperando resultado...";
  }
  const parts = [
    `Numero ${data.numero_ganador}`,
    data.color_ganador ? data.color_ganador : null,
    data.paridad_ganadora ? data.paridad_ganadora : null,
    data.rango_ganador ? data.rango_ganador : null,
  ].filter(Boolean);
  return parts.join(" · ");
};

const DEFAULT_STATUS = {
  estado: "sin_ronda",
  numero_ganador: null,
  color_ganador: null,
  paridad_ganadora: null,
  rango_ganador: null,
  inicio_en: null,
  cierre_en: null,
  resuelta_en: null,
};

const roundToStatus = (round) =>
  round
    ? {
      estado: round?.estado ?? "sin_ronda",
      numero_ganador:
        round?.numero_ganador !== null && round?.numero_ganador !== undefined
          ? Number(round.numero_ganador)
          : null,
      color_ganador: round?.color_ganador ?? null,
      paridad_ganadora: round?.paridad_ganadora ?? null,
      rango_ganador: round?.rango_ganador ?? null,
      inicio_en: round?.inicio_en ?? null,
      cierre_en: round?.cierre_en ?? null,
      resuelta_en: round?.resuelta_en ?? null,
    }
    : DEFAULT_STATUS;

const getSecondsRemaining = (round, now) => {
  if (!round || !round.estado || round.estado === "sin_ronda") return null;
  const time =
    round.estado === "abierta"
      ? round.cierre_en
      : round.estado === "cerrada"
        ? round.resuelta_en
        : null;
  if (!time) return 0;
  const ms = new Date(time).getTime() - now;
  return Math.max(0, Math.floor(ms / 1000));
};

export function RouletteRoundStatus({ gameId }) {
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  const [loadError, setLoadError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const lastNumberRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [oldNumber, setOldNumber] = useState(null);

  useEffect(() => {
    setModalOpen(!modalOpen);
  }, [status])

  useEffect(() => {
    let isMounted = true;
    let inFlight = false;

    const fetchState = async () => {
      if (inFlight) return;
      inFlight = true;
      const params = new URLSearchParams();
      if (gameId) {
        params.set("gameId", gameId);
      }
      const query = params.toString();
      const url = query ? `/api/ruleta/estado?${query}` : "/api/ruleta/estado";

      try {
        const response = await fetch(url, { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!isMounted) return;

        if (!response.ok) {
          setConnected(false);
          setLoadError("No se pudo cargar la ronda.");
          setHistoryError("No se pudo cargar el historial.");
          return;
        }

        setConnected(true);
        setLoadError(payload?.roundError ? "No se pudo cargar la ronda." : "");
        setHistoryError(
          payload?.historyError ? "No se pudo cargar el historial." : ""
        );

        if (payload?.round) {
          setStatus(roundToStatus(payload.round));
        } else if (!payload?.roundError) {
          setStatus(DEFAULT_STATUS);
        }

        if (Array.isArray(payload?.history)) {
          const normalized = payload.history
            .map((value) => clampNumber(Number(value), 0, 36))
            .filter((value) => !Number.isNaN(value))
            .slice(0, HISTORY_LIMIT);
          setHistory(normalized);
          lastNumberRef.current = normalized[0] ?? null;
        }
      } catch (error) {
        if (!isMounted) return;
        setConnected(false);
        setLoadError("No se pudo cargar la ronda.");
        setHistoryError("No se pudo cargar el historial.");
      } finally {
        inFlight = false;
      }
    };

    fetchState();
    const interval = window.setInterval(fetchState, 2000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [gameId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status.estado !== "resuelta") {
      lastNumberRef.current = null;
      return;
    }

    if (
      status.numero_ganador === null ||
      status.numero_ganador === undefined ||
      Number.isNaN(Number(status.numero_ganador))
    ) {
      return;
    }

    const normalized = clampNumber(
      Math.round(Number(status.numero_ganador)),
      0,
      36
    );

    if (lastNumberRef.current === normalized) return;
    lastNumberRef.current = normalized;
    setHistory((prev) => {
      if (prev[0] === normalized) return prev;
      return [normalized, ...prev].slice(0, HISTORY_LIMIT);
    });
  }, [status.estado, status.numero_ganador]);

  const label = STAGE_LABELS[status.estado] || "Sin ronda activa";
  const isSpinning = status.estado === "cerrada";
  const secondsRemaining = getSecondsRemaining(status, now);
  const countdown =
    typeof secondsRemaining === "number" ? `${secondsRemaining}s` : "--";
  const historyTone = (value) => {
    if (value === 0) return "green";
    return PURPLE_NUMBERS.has(value) ? "purple" : "blue";
  };
  const historyClass = (tone) => {
    if (tone === "green") {
      return "border-[#7ef3b2]/70 text-[#7ef3b2] shadow-[0_0_16px_rgba(126,243,178,0.45)] bg-[rgba(8,24,18,0.8)]";
    }
    if (tone === "purple") {
      return "border-[#ff9ffc]/70 text-[#ff9ffc] shadow-[0_0_14px_rgba(255,159,252,0.45)] bg-[rgba(32,10,46,0.85)]";
    }
    return "border-[#6fd6ff]/70 text-[#6fd6ff] shadow-[0_0_14px_rgba(111,214,255,0.45)] bg-[rgba(8,18,36,0.85)]";
  };
  const latestNumber = history[0];
  const previousNumbers = history.slice(1, 4);
  const previousCount = Math.max(0, Math.min(history.length - 1, 3));
  const emptyClass =
    "border-white/15 text-white/40 shadow-[0_0_10px_rgba(255,255,255,0.08)] bg-[rgba(8,12,22,0.6)]";

  return (
    <>
    <div>
      {modalOpen && (<div className="modal">
        <div className="modal-content">
          <span className="close" onClick={() => setModalOpen(false)}>&times;</span>
          <p>Modal is open!</p>
        </div>
      </div>
      )}
    </div>
    <div className="mt-4 w-full p-5 text-left ">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
                Estado de la ronda
              </p>
              <p className="mt-2 text-lg text-white/90">{label}</p>
              <p className="mt-1 text-sm text-white/60">
                {connected ? "Datos en vivo" : "Conectando..."}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                Tiempo
              </p>
              <p className="mt-2 text-2xl text-[#7ef3b2]">{countdown}</p>
            </div>
          </div>

          <RouletteNumberTicker
            targetNumber={status.numero_ganador}
            isSpinning={isSpinning}
          />

          <p className="mt-3 text-sm text-white/70">{formatResult(status)}</p>
          {loadError ? (
            <p className="mt-2 text-xs text-[#ff8f90]">{loadError}</p>
          ) : null}
        </div>

        <div className="w-full lg:w-[240px] lg:flex-shrink-0">

          <div className="mt-3 rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.55)] px-4 py-4">
            <p className="text-[10px] text-center uppercase tracking-[0.2em] text-white/50">
              Ultimo numero
            </p>
            <div className="mt-3 flex justify-center">
              {typeof latestNumber === "number" ? (
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-lg border text-[16px] font-semibold uppercase tracking-[0.12em] ${historyClass(
                    historyTone(latestNumber)
                  )}`}
                >
                  {latestNumber}
                </div>
              ) : (
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-lg border text-[16px] font-semibold uppercase tracking-[0.12em] ${emptyClass}`}
                >
                  --
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                Anteriores
              </p>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                Ultimos {previousCount}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              {previousNumbers.length ? (
                previousNumbers.map((value, index) => (
                  <div
                    key={`${value}-${index}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-md border text-[11px] font-semibold uppercase tracking-[0.16em] ${historyClass(
                      historyTone(value)
                    )}`}
                  >
                    {value}
                  </div>
                ))
              ) : (
                <div
                  className={`flex h-9 w-24 items-center justify-center rounded-md border text-[11px] uppercase tracking-[0.2em] ${emptyClass}`}
                >
                  --
                </div>
              )}
            </div>
            {historyError ? (
              <p className="mt-3 text-center text-[11px] text-[#ff8f90]">
                {historyError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

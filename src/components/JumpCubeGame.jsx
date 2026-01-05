"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "agch_jumpcube_best";
const BASE_PIPE_INTERVAL = 1750;
const PIPE_SPEED = 220;
const PIPE_WIDTH = 56;
const PIPE_GAP = 140;
const GRAVITY = 1600;
const JUMP_VELOCITY = -470;
const COUNTDOWN_SECONDS = 3;
const COIN_POPUP_VALUE = 5;
const POPUP_DURATION = 900;
const POPUP_RISE = 26;
const POPUP_COLORS = {
  coin: { fill: [255, 247, 179], stroke: [6, 8, 16] },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const rgba = (rgb, alpha) =>
  `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
const randomBetween = (min, max) => min + Math.random() * (max - min);

export function JumpCubeGame({
  onGameOver,
  startSignal = 0,
  controlsLocked = false,
  fullScreen = false,
}) {
  const canvasRef = useRef(null);
  const boardRef = useRef({ width: 0, height: 0 });
  const cubeRef = useRef({ x: 0, y: 0, size: 24 });
  const velocityRef = useRef(0);
  const obstaclesRef = useRef([]);
  const spawnTimerRef = useRef(0);
  const statusRef = useRef("idle");
  const lastSentScoreRef = useRef(null);
  const scoreRef = useRef(0);
  const startTimeRef = useRef(null);
  const popupsRef = useRef([]);

  const [status, setStatus] = useState("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const addPopup = useCallback((x, y, text, type = "coin") => {
    popupsRef.current.push({
      x,
      y,
      text,
      type,
      spawnedAt: performance.now(),
    });
  }, []);

  const addCoinPopup = useCallback(
    (x, y) => {
      const { width, height } = boardRef.current;
      if (!width || !height) return;
      const label = COIN_POPUP_VALUE === 1 ? "moneda" : "monedas";
      addPopup(
        clamp(x, 14, width - 14),
        clamp(y, 14, height - 14),
        `+${COIN_POPUP_VALUE} ${label}`,
        "coin"
      );
    },
    [addPopup]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { width, height } = boardRef.current;
    if (!width || !height) return;
    const now = performance.now();

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(6, 8, 16, 0.78)";
    ctx.fillRect(0, 0, width, height);

    obstaclesRef.current.forEach((pipe) => {
      const gapTop = pipe.gapY - PIPE_GAP / 2;
      const gapBottom = pipe.gapY + PIPE_GAP / 2;

      ctx.fillStyle = "rgba(111, 214, 255, 0.9)";
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, gapTop);
      ctx.fillRect(pipe.x, gapBottom, PIPE_WIDTH, height - gapBottom);
    });

    const cube = cubeRef.current;
    ctx.fillStyle = "#f5f0ff";
    ctx.fillRect(cube.x, cube.y, cube.size, cube.size);

    const popups = popupsRef.current;
    if (popups.length) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "600 12px 'Press Start 2P', sans-serif";
      popups.forEach((popup) => {
        const palette = POPUP_COLORS[popup.type] || POPUP_COLORS.coin;
        const age = clamp(
          (now - popup.spawnedAt) / POPUP_DURATION,
          0,
          1
        );
        const rise = POPUP_RISE * age;
        const alpha = 1 - age;
        const y = popup.y - rise;

        ctx.strokeStyle = rgba(palette.stroke, 0.7 * alpha);
        ctx.fillStyle = rgba(palette.fill, 0.95 * alpha);
        ctx.lineWidth = 3;
        ctx.strokeText(popup.text, popup.x, y);
        ctx.fillText(popup.text, popup.x, y);
      });
      ctx.restore();
    }
  }, []);

  const resetBoard = useCallback(() => {
    const { width, height } = boardRef.current;
    if (!width || !height) return;

    const size = clamp(width * 0.08, 22, 32);
    cubeRef.current = {
      x: width * 0.2,
      y: height * 0.5 - size / 2,
      size,
    };
    velocityRef.current = 0;
    obstaclesRef.current = [];
    spawnTimerRef.current = BASE_PIPE_INTERVAL;
    scoreRef.current = 0;
    popupsRef.current = [];
    setScore(0);
    draw();
  }, [draw]);

  const startGame = useCallback(
    (options = {}) => {
      if (!options.skipReset) {
        resetBoard();
      }
      setCountdown(0);
      lastSentScoreRef.current = null;
      startTimeRef.current = Date.now();
      setStatus("running");
    },
    [resetBoard]
  );

  const beginCountdown = useCallback(() => {
    if (statusRef.current === "running") return;
    resetBoard();
    setStatus("countdown");
    setCountdown(COUNTDOWN_SECONDS);
  }, [resetBoard]);

  const finishGame = useCallback(() => {
    setStatus("gameover");
    if (typeof onGameOver === "function") {
      const finalScore = scoreRef.current;
      const startedAt = startTimeRef.current;
      const elapsedMs =
        typeof startedAt === "number" ? Date.now() - startedAt : 0;
      const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

      if (lastSentScoreRef.current !== finalScore) {
        lastSentScoreRef.current = finalScore;
        onGameOver(finalScore, elapsedSeconds);
      }
    }
  }, [onGameOver]);

  const spawnObstacle = useCallback(() => {
    const { width, height } = boardRef.current;
    if (!width || !height) return;

    const gapHalf = PIPE_GAP / 2;
    const topMargin = Math.max(48, height * 0.18);
    const bottomMargin = Math.max(32, height * 0.1);
    const minY = topMargin + gapHalf;
    const maxY = Math.max(minY, height - bottomMargin - gapHalf);
    const gapY = randomBetween(minY, maxY);

    obstaclesRef.current.push({
      x: width + PIPE_WIDTH,
      gapY,
      passed: false,
    });
  }, []);

  const stepGame = useCallback(
    (deltaSeconds) => {
      const { width, height } = boardRef.current;
      if (!width || !height) return;
      const now = performance.now();

      const cube = cubeRef.current;
      velocityRef.current += GRAVITY * deltaSeconds;
      cube.y += velocityRef.current * deltaSeconds;

      spawnTimerRef.current += deltaSeconds * 1000;
      if (spawnTimerRef.current >= BASE_PIPE_INTERVAL) {
        spawnTimerRef.current -= BASE_PIPE_INTERVAL;
        spawnObstacle();
      }

      obstaclesRef.current.forEach((pipe) => {
        pipe.x -= PIPE_SPEED * deltaSeconds;
      });

      obstaclesRef.current = obstaclesRef.current.filter(
        (pipe) => pipe.x + PIPE_WIDTH > -40
      );

      const cubeRight = cube.x + cube.size;
      const cubeBottom = cube.y + cube.size;

      for (const pipe of obstaclesRef.current) {
        if (cubeRight > pipe.x && cube.x < pipe.x + PIPE_WIDTH) {
          const gapTop = pipe.gapY - PIPE_GAP / 2;
          const gapBottom = pipe.gapY + PIPE_GAP / 2;
          if (cube.y < gapTop || cubeBottom > gapBottom) {
            draw();
            finishGame();
            return;
          }
        }

        if (!pipe.passed && pipe.x + PIPE_WIDTH < cube.x) {
          pipe.passed = true;
          addCoinPopup(cube.x + cube.size / 2, cube.y);
          setScore((prev) => {
            const next = prev + 1;
            scoreRef.current = next;
            return next;
          });
        }
      }

      if (cube.y < 0 || cubeBottom > height) {
        draw();
        finishGame();
        return;
      }

      if (popupsRef.current.length) {
        popupsRef.current = popupsRef.current.filter(
          (popup) => now - popup.spawnedAt < POPUP_DURATION
        );
      }

      draw();
    },
    [addCoinPopup, draw, finishGame, spawnObstacle]
  );

  const jump = useCallback(() => {
    if (controlsLocked || countdown > 0) return;
    if (statusRef.current !== "running") return;
    velocityRef.current = JUMP_VELOCITY;
  }, [controlsLocked, countdown]);

  const handleKeyDown = useCallback(
    (event) => {
      if (controlsLocked) return;
      const key = event.key.toLowerCase();
      if (key === " " || key === "arrowup" || key === "w") {
        event.preventDefault();
        jump();
      }
    },
    [controlsLocked, jump]
  );

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
    const parsed = stored ? Number(stored) : 0;
    if (!Number.isNaN(parsed) && parsed > 0) {
      setBestScore(parsed);
    }
  }, []);

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, String(score));
      }
    }
  }, [score, bestScore]);

  useEffect(() => {
    if (status !== "running") return undefined;
    let frameId = 0;
    let lastTime = performance.now();

    const loop = (time) => {
      const deltaSeconds = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      stepGame(deltaSeconds);
      frameId = window.requestAnimationFrame(loop);
    };

    frameId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frameId);
  }, [status, stepGame]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timeout = window.setTimeout(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [countdown]);

  useEffect(() => {
    if (countdown !== 0 || status !== "countdown") return;
    startGame({ skipReset: true });
  }, [countdown, startGame, status]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      boardRef.current = { width: rect.width, height: rect.height };
      resetBoard();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [resetBoard]);

  useEffect(() => {
    resetBoard();
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, resetBoard]);

  useEffect(() => {
    if (!startSignal) return;
    beginCountdown();
  }, [beginCountdown, startSignal]);

  const wrapperClassName = fullScreen
    ? "flex h-full w-full flex-col"
    : "mt-4 flex w-full flex-col items-center";
  const scoreRowClassName = fullScreen
    ? "pointer-events-none absolute left-4 top-16 flex flex-col gap-1 rounded-xl border border-white/15 bg-[rgba(6,8,16,0.65)] px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-white/70 sm:top-20"
    : "flex w-full max-w-[560px] items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/60 lg:max-w-[720px]";
  const boardWrapperClassName = fullScreen
    ? "relative flex w-full flex-1 min-h-0 p-4"
    : "mt-3 w-full max-w-[560px] lg:max-w-[720px]";
  const canvasWrapperClassName = fullScreen
    ? "relative h-full w-full touch-none"
    : "relative touch-none";
  const canvasClassName = fullScreen
    ? "h-full w-full border border-white/15 box-border"
    : "h-[320px] w-full rounded-2xl border border-white/15 sm:h-[380px] lg:h-[520px]";
  const overlayClassName = fullScreen
    ? "pointer-events-none absolute inset-0 flex items-center justify-center bg-[rgba(4,6,12,0.55)] text-sm uppercase tracking-[0.2em] text-white/80"
    : "pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-[rgba(4,6,12,0.55)] text-sm uppercase tracking-[0.2em] text-white/80";
  const overlayLabel =
    status === "countdown"
      ? countdown > 0
        ? String(countdown)
        : "YA"
      : status === "gameover"
        ? "Game Over"
        : "Listo";

  return (
    <div className={wrapperClassName}>
      {!fullScreen ? (
        <div className={scoreRowClassName}>
          <span>Puntuacion: {score}</span>
          <span>Record: {bestScore}</span>
        </div>
      ) : null}

      <div className={boardWrapperClassName}>
        <div
          className={canvasWrapperClassName}
          onPointerDown={jump}
          role="button"
          tabIndex={0}
          aria-label="Saltar"
        >
          {fullScreen ? (
            <div className={scoreRowClassName}>
              <span>Puntuacion: {score}</span>
              <span>Record: {bestScore}</span>
            </div>
          ) : null}

          <canvas className={canvasClassName} ref={canvasRef} />
          {status !== "running" ? (
            <div className={overlayClassName}>
              {overlayLabel}
            </div>
          ) : null}

          {fullScreen ? (
            <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-[10px] uppercase tracking-[0.2em] text-white/60">
              Toca o usa espacio para saltar.
            </p>
          ) : null}
        </div>
      </div>

      {!fullScreen ? (
        <p className="mt-3 text-xs text-white/60">
          Toca o usa espacio para saltar.
        </p>
      ) : null}
    </div>
  );
}

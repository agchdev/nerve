"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GRID_SIZE = 20;
const TICK_MS = 160;
const STORAGE_KEY = "agch_snake_best";
const COUNTDOWN_SECONDS = 3;

const createInitialSnake = () => {
  const mid = Math.floor(GRID_SIZE / 2);
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
};

const spawnFood = (snake) => {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  let x = 0;
  let y = 0;
  let guard = 0;

  do {
    x = Math.floor(Math.random() * GRID_SIZE);
    y = Math.floor(Math.random() * GRID_SIZE);
    guard += 1;
  } while (occupied.has(`${x},${y}`) && guard < 200);

  return { x, y };
};

export function SnakeGame({
  onGameOver,
  startSignal = 0,
  controlsLocked = false,
}) {
  const canvasRef = useRef(null);
  const boardSizeRef = useRef(0);
  const cellSizeRef = useRef(0);
  const snakeRef = useRef(createInitialSnake());
  const foodRef = useRef(spawnFood(snakeRef.current));
  const directionRef = useRef({ x: 1, y: 0 });
  const nextDirectionRef = useRef({ x: 1, y: 0 });
  const statusRef = useRef("idle");
  const pendingDirectionRef = useRef(null);
  const touchStartRef = useRef(null);
  const lastSentScoreRef = useRef(null);
  const scoreRef = useRef(0);
  const startTimeRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = boardSizeRef.current;
    if (!size) return;
    const ctx = canvas.getContext("2d");
    const cellSize = cellSizeRef.current || size / GRID_SIZE;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "rgba(6, 8, 16, 0.72)";
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i += 1) {
      const pos = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }

    const food = foodRef.current;
    if (food) {
      ctx.fillStyle = "#ff9ffc";
      ctx.fillRect(
        food.x * cellSize + 2,
        food.y * cellSize + 2,
        cellSize - 4,
        cellSize - 4
      );
    }

    const snake = snakeRef.current;
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? "#f5f0ff" : "#6fd6ff";
      ctx.fillRect(
        segment.x * cellSize + 1,
        segment.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });
  }, []);

  const resetBoard = useCallback(() => {
    const initialSnake = createInitialSnake();
    snakeRef.current = initialSnake;
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };
    foodRef.current = spawnFood(initialSnake);
    scoreRef.current = 0;
    setScore(0);
    draw();
  }, [draw]);

  const startGame = useCallback(
    (options = {}) => {
      const { initialDirection, skipReset = false } = options;
      if (!skipReset) {
        resetBoard();
      }
      setCountdown(0);
      lastSentScoreRef.current = null;
      startTimeRef.current = Date.now();
      if (initialDirection) {
        directionRef.current = initialDirection;
        nextDirectionRef.current = initialDirection;
      }
      setStatus("running");
    },
    [resetBoard]
  );

  const beginCountdown = useCallback(
    (initialDirection = null) => {
      if (statusRef.current === "running") return;
      pendingDirectionRef.current = initialDirection;
      resetBoard();
      setStatus("countdown");
      setCountdown(COUNTDOWN_SECONDS);
    },
    [resetBoard]
  );

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

  const queueDirection = useCallback(
    (next) => {
      if (controlsLocked || !next) return;
      const current = directionRef.current;
      if (current.x + next.x === 0 && current.y + next.y === 0) {
        return;
      }

      if (statusRef.current === "running") {
        nextDirectionRef.current = next;
        return;
      }

      pendingDirectionRef.current = next;
      if (countdown > 0) return;
      beginCountdown(next);
    },
    [beginCountdown, controlsLocked, countdown]
  );

  const stepGame = useCallback(() => {
    const direction = nextDirectionRef.current;
    directionRef.current = direction;
    const snake = snakeRef.current;
    const head = snake[0];
    const nextHead = { x: head.x + direction.x, y: head.y + direction.y };

    if (
      nextHead.x < 0 ||
      nextHead.x >= GRID_SIZE ||
      nextHead.y < 0 ||
      nextHead.y >= GRID_SIZE
    ) {
      draw();
      finishGame();
      return;
    }

    const hitsSelf = snake.some(
      (segment, index) =>
        index !== 0 && segment.x === nextHead.x && segment.y === nextHead.y
    );
    if (hitsSelf) {
      draw();
      finishGame();
      return;
    }

    const newSnake = [nextHead, ...snake];
    const food = foodRef.current;
    if (food && food.x === nextHead.x && food.y === nextHead.y) {
      setScore((prev) => {
        const next = prev + 1;
        scoreRef.current = next;
        return next;
      });
      foodRef.current = spawnFood(newSnake);
    } else {
      newSnake.pop();
    }

    snakeRef.current = newSnake;
    draw();
  }, [draw, finishGame]);

  const handleKeyDown = useCallback(
    (event) => {
      if (controlsLocked) return;
      const key = event.key.toLowerCase();
      let next = null;

      if (key === "arrowup" || key === "w") next = { x: 0, y: -1 };
      if (key === "arrowdown" || key === "s") next = { x: 0, y: 1 };
      if (key === "arrowleft" || key === "a") next = { x: -1, y: 0 };
      if (key === "arrowright" || key === "d") next = { x: 1, y: 0 };

      if (key === " " || key === "enter") {
        if (statusRef.current !== "running") {
          if (countdown === 0) {
            beginCountdown();
          }
        }
        return;
      }

      if (!next) return;
      event.preventDefault();
      queueDirection(next);
    },
    [beginCountdown, controlsLocked, countdown, queueDirection]
  );

  const handleTouchStart = useCallback(
    (event) => {
      if (controlsLocked) return;
      const touch = event.touches[0];
      if (!touch) return;
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    },
    [controlsLocked]
  );

  const handleTouchEnd = useCallback(
    (event) => {
      if (controlsLocked) return;
      const start = touchStartRef.current;
      const touch = event.changedTouches[0];
      if (!start || !touch) return;

      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) < 18) return;

      if (absX > absY) {
        queueDirection({ x: dx > 0 ? 1 : -1, y: 0 });
      } else {
        queueDirection({ x: 0, y: dy > 0 ? 1 : -1 });
      }
    },
    [controlsLocked, queueDirection]
  );

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
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
    const interval = window.setInterval(stepGame, TICK_MS);
    return () => window.clearInterval(interval);
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
    const initialDirection = pendingDirectionRef.current;
    pendingDirectionRef.current = null;
    startGame({ initialDirection, skipReset: true });
  }, [countdown, startGame, status]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      const dpr = window.devicePixelRatio || 1;

      canvas.width = size * dpr;
      canvas.height = size * dpr;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      boardSizeRef.current = size;
      cellSizeRef.current = size / GRID_SIZE;
      draw();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  useEffect(() => {
    resetBoard();
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, resetBoard]);

  useEffect(() => {
    if (!startSignal) return;
    beginCountdown();
  }, [beginCountdown, startSignal]);

  const actionLabel =
    status === "running"
      ? "Jugando..."
      : status === "countdown"
        ? countdown > 0
          ? `Empieza en ${countdown}`
          : "Empieza ya"
        : status === "gameover"
          ? "Reintentar"
          : "Empezar";
  const isActionDisabled =
    controlsLocked || status === "running" || status === "countdown";

  const controlButtonClass =
    "flex h-20 w-full items-center justify-center rounded-2xl border border-white/25 bg-[linear-gradient(135deg,rgba(17,24,39,0.9),rgba(10,18,32,0.8))] text-3xl font-semibold text-white/90 shadow-[0_10px_22px_rgba(111,214,255,0.35)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff9ffc] hover:text-white hover:shadow-[0_16px_28px_rgba(255,159,252,0.45)] active:scale-[0.98] touch-manipulation";

  const overlayLabel =
    status === "countdown"
      ? countdown > 0
        ? String(countdown)
        : "YA"
      : status === "gameover"
        ? "Game Over"
        : "Listo";

  return (
    <div className="mt-4 flex w-full flex-col items-center">
      <div className="flex w-full max-w-[520px] items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/60">
        <span>Puntuacion: {score}</span>
        <span>Record: {bestScore}</span>
      </div>

      <div className="mt-3 w-full max-w-[520px]">
        <div
          className="relative touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            className="aspect-square w-full rounded-2xl border border-white/15"
            ref={canvasRef}
          />
          {status !== "running" ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-[rgba(4,6,12,0.55)] text-sm uppercase tracking-[0.2em] text-white/80">
              {overlayLabel}
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!isActionDisabled) beginCountdown();
        }}
        disabled={isActionDisabled}
        className="mt-4 rounded-full bg-gradient-to-r from-[#ff9ffc] via-[#9fe3ff] to-[#7ef3b2] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#05020c] shadow-[0_16px_30px_rgba(255,159,252,0.45)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(111,214,255,0.55)] hover:from-[#ffd1ff] hover:via-[#bfeeff] hover:to-[#b7f7d9] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {actionLabel}
      </button>

      <div className="mt-6 grid w-full grid-cols-3 gap-2 px-2 md:hidden">
        <button
          type="button"
          onClick={() => queueDirection({ x: 0, y: -1 })}
          className={`${controlButtonClass} col-start-2`}
        >
          &uarr;
        </button>
        <button
          type="button"
          onClick={() => queueDirection({ x: -1, y: 0 })}
          className={`${controlButtonClass} col-start-1 row-start-2`}
        >
          &larr;
        </button>
        <button
          type="button"
          onClick={() => queueDirection({ x: 0, y: 1 })}
          className={`${controlButtonClass} col-start-2 row-start-2`}
        >
          &darr;
        </button>
        <button
          type="button"
          onClick={() => queueDirection({ x: 1, y: 0 })}
          className={`${controlButtonClass} col-start-3 row-start-2`}
        >
          &rarr;
        </button>
      </div>

      <p className="mt-3 text-xs text-white/60 md:hidden">
        Desliza o usa botones para moverte.
      </p>
      <p className="mt-3 hidden text-xs text-white/60 md:block">
        Flechas o WASD para moverte. Enter para empezar.
      </p>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "agch_shotcube_best";
const MAX_MISSES = 10;
const SPAWN_INTERVAL = 1200;
const SPAWN_SIDES = ["top", "left", "right"];
const MIN_LIFETIME = 1100;
const MAX_LIFETIME = 1700;
const MAX_CUBES = 4;
const MOBILE_WIDTH = 520;
const MOBILE_MAX_CUBES = 6;
const MOBILE_SPAWN_INTERVAL = 900;
const SIZE_SCALE_DESKTOP = 0.08;
const SIZE_SCALE_MOBILE = 0.11;
const SIZE_MIN_DESKTOP = 24;
const SIZE_MAX_DESKTOP = 52;
const SIZE_MIN_MOBILE = 28;
const SIZE_MAX_MOBILE = 72;
const GRAVITY_MIN = 950;
const GRAVITY_MAX = 1800;
const GRAVITY_SCALE = 1.2;
const LAUNCH_SPEED_MIN = 520;
const LAUNCH_SPEED_MAX = 980;
const DRIFT_RATIO = 0.25;
const COIN_POPUP_VALUE = 5;
const POPUP_DURATION = 900;
const POPUP_RISE = 26;
const COUNTDOWN_SECONDS = 3;
const POPUP_COLORS = {
  coin: { fill: [255, 247, 179], stroke: [6, 8, 16] },
  life: { fill: [255, 82, 82], stroke: [6, 8, 16] },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const rgba = (rgb, alpha) =>
  `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
const isMobileWidth = (width) => width <= MOBILE_WIDTH;
const maxCubesForWidth = (width) =>
  isMobileWidth(width) ? MOBILE_MAX_CUBES : MAX_CUBES;
const spawnIntervalForWidth = (width) =>
  isMobileWidth(width) ? MOBILE_SPAWN_INTERVAL : SPAWN_INTERVAL;

const randomBetween = (min, max) => min + Math.random() * (max - min);
const gravityForLength = (length) =>
  clamp(length * GRAVITY_SCALE, GRAVITY_MIN, GRAVITY_MAX);
const pickSpawnSide = (sides) =>
  sides[Math.floor(Math.random() * sides.length)];
const randomEdgePosition = (length, padding, size) =>
  padding + Math.random() * Math.max(0, length - padding * 2 - size);
const timeToExit = (distance, speed, acceleration) => {
  if (distance <= 0) return 0;
  if (acceleration <= 0.001) {
    return distance / Math.max(speed, 1);
  }
  const discriminant = speed * speed + 2 * acceleration * distance;
  return (-speed + Math.sqrt(discriminant)) / acceleration;
};

export function ShotCubeGame({
  onGameOver,
  startSignal = 0,
  controlsLocked = false,
  fullScreen = false,
}) {
  const canvasRef = useRef(null);
  const boardRef = useRef({ width: 0, height: 0 });
  const cubesRef = useRef([]);
  const spawnTimerRef = useRef(0);
  const statusRef = useRef("idle");
  const lastSentScoreRef = useRef(null);
  const scoreRef = useRef(0);
  const missesRef = useRef(0);
  const startTimeRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const popupsRef = useRef([]);

  const [status, setStatus] = useState("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const addPopup = useCallback((x, y, text, type) => {
    popupsRef.current.push({
      x,
      y,
      text,
      type,
      spawnedAt: performance.now(),
    });
  }, []);

  const addLifePopup = useCallback(
    (x, y) => {
      const { width, height } = boardRef.current;
      if (!width || !height) return;
      addPopup(
        clamp(x, 14, width - 14),
        clamp(y, 14, height - 14),
        "-1 vida",
        "life"
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

    cubesRef.current.forEach((cube) => {
      const life = Math.max(1, cube.expiresAt - cube.spawnedAt);
      const age = clamp((now - cube.spawnedAt) / life, 0, 1);
      const alpha = 0.9 - age * 0.35;
      const pulse = 1 + Math.sin(age * Math.PI * 2) * 0.03;
      const size = cube.size * pulse;
      const offset = (cube.size - size) / 2;
      const x = cube.x + offset;
      const y = cube.y + offset;

      ctx.fillStyle = `rgba(255, 159, 252, ${alpha})`;
      ctx.strokeStyle = `rgba(111, 214, 255, ${0.85 * alpha})`;
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, size, size);
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * alpha})`;
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 2);
      ctx.lineTo(x + size - 2, y + 2);
      ctx.lineTo(x + size - 2, y + size - 2);
      ctx.stroke();
    });

    const pointer = pointerRef.current;
    if (pointer.active) {
      const crossSize = 14;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pointer.x - crossSize, pointer.y);
      ctx.lineTo(pointer.x + crossSize, pointer.y);
      ctx.moveTo(pointer.x, pointer.y - crossSize);
      ctx.lineTo(pointer.x, pointer.y + crossSize);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 159, 252, 0.6)";
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

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

  const spawnCube = useCallback(() => {
    const { width, height } = boardRef.current;
    if (!width || !height) return;

    const now = performance.now();
    const isMobile = isMobileWidth(width);
    const sizeScale = isMobile ? SIZE_SCALE_MOBILE : SIZE_SCALE_DESKTOP;
    const sizeMin = isMobile ? SIZE_MIN_MOBILE : SIZE_MIN_DESKTOP;
    const sizeMax = isMobile ? SIZE_MAX_MOBILE : SIZE_MAX_DESKTOP;
    const baseSize = clamp(Math.min(width, height) * sizeScale, sizeMin, sizeMax);
    const size = clamp(
      baseSize + randomBetween(-baseSize * 0.35, baseSize * 0.35),
      sizeMin - 4,
      sizeMax + 12
    );
    const padding = Math.max(12, size * 0.3);
    const spawnSide = pickSpawnSide(SPAWN_SIDES);
    const axisLength = spawnSide === "top" ? height : width;
    const gravity = gravityForLength(axisLength);
    const launchBase = clamp(
      axisLength * 1.15,
      LAUNCH_SPEED_MIN,
      LAUNCH_SPEED_MAX
    );
    const launchSpeed = randomBetween(launchBase * 0.85, launchBase * 1.05);
    const driftSpeed = randomBetween(
      -launchSpeed * DRIFT_RATIO,
      launchSpeed * DRIFT_RATIO
    );

    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    let ax = 0;
    let ay = 0;
    let axisDistance = 0;

    if (spawnSide === "top") {
      x = randomEdgePosition(width, padding, size);
      y = padding;
      vx = driftSpeed;
      vy = launchSpeed;
      ax = 0;
      ay = gravity;
      axisDistance = height + size - y;
    } else if (spawnSide === "left") {
      x = padding;
      y = randomEdgePosition(height, padding, size);
      vx = launchSpeed;
      vy = driftSpeed;
      ax = gravity;
      ay = 0;
      axisDistance = width + size - x;
    } else {
      x = width - padding - size;
      y = randomEdgePosition(height, padding, size);
      vx = -launchSpeed;
      vy = driftSpeed;
      ax = -gravity;
      ay = 0;
      axisDistance = x + size;
    }

    const minLifetime =
      timeToExit(axisDistance, launchSpeed, gravity) * 1000;
    const lifetime = Math.max(
      randomBetween(MIN_LIFETIME, MAX_LIFETIME),
      minLifetime
    );

    cubesRef.current.push({
      x,
      y,
      size,
      vx,
      vy,
      ax,
      ay,
      spawnedAt: now,
      expiresAt: now + lifetime,
    });
  }, []);

  const resetBoard = useCallback((options = {}) => {
    const { width, height } = boardRef.current;
    if (!width || !height) return;

    cubesRef.current = [];
    spawnTimerRef.current = spawnIntervalForWidth(width);
    scoreRef.current = 0;
    missesRef.current = 0;
    pointerRef.current.active = false;
    popupsRef.current = [];
    setScore(0);
    setMisses(0);
    if (!options.skipSpawn) {
      spawnCube();
    }
    draw();
  }, [draw, spawnCube]);

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
    resetBoard({ skipSpawn: true });
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

  const registerMiss = useCallback((position) => {
    if (position) {
      addLifePopup(position.x, position.y);
    }
    const nextMisses = missesRef.current + 1;
    missesRef.current = nextMisses;
    setMisses(nextMisses);
    if (nextMisses >= MAX_MISSES) {
      draw();
      finishGame();
    }
  }, [addLifePopup, draw, finishGame]);

  const stepGame = useCallback(
    (deltaSeconds) => {
      const { width, height } = boardRef.current;
      if (!width || !height) return;

      const spawnInterval = spawnIntervalForWidth(width);
      const maxCubes = maxCubesForWidth(width);
      spawnTimerRef.current += deltaSeconds * 1000;
      if (spawnTimerRef.current >= spawnInterval) {
        spawnTimerRef.current -= spawnInterval;
        if (cubesRef.current.length < maxCubes) {
          spawnCube();
        }
      }

      const now = performance.now();
      if (cubesRef.current.length) {
        const nextCubes = [];
        let missesTotal = missesRef.current;

        for (const cube of cubesRef.current) {
          cube.vx += cube.ax * deltaSeconds;
          cube.vy += cube.ay * deltaSeconds;
          cube.x += cube.vx * deltaSeconds;
          cube.y += cube.vy * deltaSeconds;

          const outOfBounds =
            cube.x < -cube.size ||
            cube.x > width + cube.size ||
            cube.y < -cube.size ||
            cube.y > height + cube.size;
          if (now >= cube.expiresAt || outOfBounds) {
            missesTotal += 1;
            addLifePopup(cube.x + cube.size / 2, cube.y + cube.size / 2);
          } else {
            nextCubes.push(cube);
          }
        }

        if (missesTotal !== missesRef.current) {
          missesRef.current = missesTotal;
          setMisses(missesTotal);
          if (missesTotal >= MAX_MISSES) {
            cubesRef.current = nextCubes;
            draw();
            finishGame();
            return;
          }
        }

        cubesRef.current = nextCubes;
      }

      if (popupsRef.current.length) {
        popupsRef.current = popupsRef.current.filter(
          (popup) => now - popup.spawnedAt < POPUP_DURATION
        );
      }

      draw();
    },
    [addLifePopup, draw, finishGame, spawnCube]
  );

  const updatePointer = useCallback(
    (event) => {
      if (controlsLocked) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: true,
      };
      if (statusRef.current !== "running") {
        draw();
      }
    },
    [controlsLocked, draw]
  );

  const clearPointer = useCallback(() => {
    pointerRef.current.active = false;
    if (statusRef.current !== "running") {
      draw();
    }
  }, [draw]);

  const handleShot = useCallback(
    (event) => {
      if (controlsLocked || countdown > 0) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      pointerRef.current = { x, y, active: true };

      if (statusRef.current !== "running") {
        draw();
        return;
      }

      const cubes = cubesRef.current;
      let hitIndex = -1;
      for (let i = cubes.length - 1; i >= 0; i -= 1) {
        const cube = cubes[i];
        if (
          x >= cube.x &&
          x <= cube.x + cube.size &&
          y >= cube.y &&
          y <= cube.y + cube.size
        ) {
          hitIndex = i;
          break;
        }
      }

      if (hitIndex >= 0) {
        const hitCube = cubes[hitIndex];
        const popupY = Math.max(14, hitCube.y - 6);
        addPopup(
          hitCube.x + hitCube.size / 2,
          popupY,
          `+${COIN_POPUP_VALUE} monedas`,
          "coin"
        );
        cubes.splice(hitIndex, 1);
        setScore((prev) => {
          const next = prev + 1;
          scoreRef.current = next;
          return next;
        });
      } else if (cubes.length) {
        registerMiss({ x, y });
      }

      draw();
    },
    [addPopup, controlsLocked, countdown, draw, registerMiss]
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
      resetBoard({ skipSpawn: statusRef.current === "countdown" });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [resetBoard]);

  useEffect(() => {
    if (!startSignal) return;
    beginCountdown();
  }, [beginCountdown, startSignal]);

  const livesLeft = Math.max(0, MAX_MISSES - misses);
  const wrapperClassName = fullScreen
    ? "flex h-full w-full flex-col"
    : "mt-4 flex w-full flex-col items-center";
  const scoreTextClassName =
    "text-[14px] font-semibold tracking-[0.16em] text-[#7cff7a] drop-shadow-[0_0_10px_rgba(124,255,122,0.85)] sm:text-[16px]";
  const livesTextClassName =
    "text-[14px] font-semibold tracking-[0.16em] text-[#ff5a5a] drop-shadow-[0_0_10px_rgba(255,90,90,0.85)] sm:text-[16px]";
  const recordTextClassName = "text-[10px] tracking-[0.18em] text-white/70";
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
    ? "h-full w-full border border-white/15 box-border cursor-crosshair"
    : "h-[320px] w-full rounded-2xl border border-white/15 sm:h-[380px] lg:h-[520px] cursor-crosshair";
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
          <span className={scoreTextClassName}>Puntuacion: {score}</span>
          <span className={livesTextClassName}>
            Vidas: {livesLeft}/{MAX_MISSES}
          </span>
          <span className={recordTextClassName}>Record: {bestScore}</span>
        </div>
      ) : null}

      <div className={boardWrapperClassName}>
        <div
          className={canvasWrapperClassName}
          onPointerDown={(event) => {
            event.preventDefault();
            handleShot(event);
          }}
          onPointerMove={updatePointer}
          onPointerLeave={clearPointer}
          role="button"
          tabIndex={0}
          aria-label="Disparar"
        >
          {fullScreen ? (
            <div className={scoreRowClassName}>
              <span className={scoreTextClassName}>Puntuacion: {score}</span>
              <span className={livesTextClassName}>
                Vidas: {livesLeft}/{MAX_MISSES}
              </span>
              <span className={recordTextClassName}>Record: {bestScore}</span>
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
              Click o toca para disparar.
            </p>
          ) : null}
        </div>
      </div>

      {!fullScreen ? (
        <p className="mt-3 text-xs text-white/60">
          Click o toca para disparar.
        </p>
      ) : null}
    </div>
  );
}

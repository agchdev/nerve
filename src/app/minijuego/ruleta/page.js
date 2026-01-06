"use client";

import { initialStatus } from "@/constantes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CoinsBadge } from "@/components/CoinsBadge";
import { GridScan } from "@/components/GridScan";
import { SnakeIntro } from "@/components/SnakeIntro";
import { RouletteBettingTable } from "@/components/roulette/RouletteBettingTable";
import { RouletteRoundStatus } from "@/components/roulette/RouletteRoundStatus";

export default function RuletaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [game, setGame] = useState(null);
  const [gameStatus, setGameStatus] = useState(initialStatus);
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifLoading, setIsVerifLoading] = useState(false);
  const [isVerifChecked, setIsVerifChecked] = useState(false);
  const [playStatus, setPlayStatus] = useState(initialStatus);
  const [showGame, setShowGame] = useState(false);

  const priceValue = Number(game?.preciopartida);
  const priceLabel =
    Number.isFinite(priceValue) && Math.trunc(priceValue) > 0
      ? `Jugar ${Math.trunc(priceValue)} monedas`
      : "Continuar";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("agch_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.id) {
          setUser(parsed);
        }
      } catch {
        window.localStorage.removeItem("agch_user");
      }
    }
    setIsAuthReady(true);
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user || !isVerified) return;
    let isMounted = true;

    const fetchGame = async () => {
      setIsGameLoading(true);
      setGameStatus(initialStatus);
      try {
        const response = await fetch("/api/juegos/ruleta");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (isMounted) {
            setGame(null);
            setGameStatus({
              type: "error",
              message: "No se pudo cargar el minijuego.",
            });
          }
          return;
        }

        if (isMounted) {
          setGame(data?.game ?? null);
          if (!data?.game) {
            setGameStatus({
              type: "error",
              message: "No se encontro el minijuego.",
            });
          }
        }
      } catch (error) {
        if (isMounted) {
          setGame(null);
          setGameStatus({
            type: "error",
            message: "No se pudo cargar el minijuego.",
          });
        }
      } finally {
        if (isMounted) {
          setIsGameLoading(false);
        }
      }
    };

    fetchGame();
    return () => {
      isMounted = false;
    };
  }, [isAuthReady, isVerified, user]);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    let isMounted = true;

    const fetchVerification = async () => {
      setIsVerifLoading(true);
      try {
        const response = await fetch(
          `/api/telefono/estado?userId=${encodeURIComponent(user.id)}`
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (isMounted) {
            setIsVerified(false);
            router.replace(
              `/verificacion?next=${encodeURIComponent("/minijuego/ruleta")}`
            );
          }
          return;
        }

        if (isMounted) {
          const verified = Boolean(data?.verified);
          setIsVerified(verified);
          if (!verified) {
            router.replace(
              `/verificacion?next=${encodeURIComponent("/minijuego/ruleta")}`
            );
          }
        }
      } catch (error) {
        if (isMounted) {
          setIsVerified(false);
          router.replace(
            `/verificacion?next=${encodeURIComponent("/minijuego/ruleta")}`
          );
        }
      } finally {
        if (isMounted) {
          setIsVerifLoading(false);
          setIsVerifChecked(true);
        }
      }
    };

    fetchVerification();
    return () => {
      isMounted = false;
    };
  }, [isAuthReady, router, user]);

  const handleContinue = useCallback(() => {
    setPlayStatus(initialStatus);
    setShowGame(true);
  }, []);

  const handleBack = useCallback(() => {
    setShowGame(false);
    setPlayStatus(initialStatus);
  }, []);

  const handleBackHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleLogout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("agch_user");
    }
    setUser(null);
    router.push("/");
  }, [router]);

  if (user && (!isVerifChecked || isVerifLoading || !isVerified)) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07040f] px-6 py-12 text-[#f5f0ff]">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <GridScan
            sensitivity={0.005}
            lineThickness={1}
            linesColor="#392e4e"
            gridScale={0.1}
            scanColor="#FF9FFC"
            scanOpacity={0.4}
            enablePost
            bloomIntensity={0.6}
            chromaticAberration={0.002}
            noiseIntensity={0.01}
            className="h-full w-full"
          />
        </div>
        <main className="relative z-10 flex w-full max-w-[420px] flex-col items-center text-center">
          <p className="text-sm text-white/70">
            Verificando tu cuenta...
          </p>
          <Link
            href="/minijuegos"
            className="mt-6 rounded-full border border-white/25 bg-[rgba(8,12,22,0.85)] px-4 py-2.5 text-[12px] uppercase tracking-[0.18em] text-white/90 shadow-[0_10px_22px_rgba(111,214,255,0.3)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff9ffc] hover:text-white hover:shadow-[0_16px_28px_rgba(255,159,252,0.45)]"
          >
            Volver a minijuegos
          </Link>
        </main>
      </div>
    );
  }

  if (!isAuthReady) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07040f] px-6 py-12 text-[#f5f0ff]">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <GridScan
            sensitivity={0.005}
            lineThickness={1}
            linesColor="#392e4e"
            gridScale={0.1}
            scanColor="#FF9FFC"
            scanOpacity={0.4}
            enablePost
            bloomIntensity={0.6}
            chromaticAberration={0.002}
            noiseIntensity={0.01}
            className="h-full w-full"
          />
        </div>
        <main className="relative z-10 flex w-full max-w-[420px] flex-col items-center text-center">
          <p className="text-sm text-white/70">Cargando...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07040f] px-6 py-12 text-[#f5f0ff]">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <GridScan
            sensitivity={0.005}
            lineThickness={1}
            linesColor="#392e4e"
            gridScale={0.1}
            scanColor="#FF9FFC"
            scanOpacity={0.4}
            enablePost
            bloomIntensity={0.6}
            chromaticAberration={0.002}
            noiseIntensity={0.01}
            className="h-full w-full"
          />
        </div>
        <main className="relative z-10 flex w-full max-w-[420px] flex-col items-center text-center">
          <h1 className="font-[var(--font-press-start)] text-[28px] uppercase tracking-[0.18em] text-[#f5f0ff] sm:text-[36px]">
            ALEX GAMES
          </h1>
          <p className="mt-4 text-sm text-white/70">
            Inicia sesion para ver la ruleta.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-full border border-white/25 bg-[rgba(8,12,22,0.85)] px-4 py-2.5 text-[12px] uppercase tracking-[0.18em] text-white/90 shadow-[0_10px_22px_rgba(111,214,255,0.3)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff9ffc] hover:text-white hover:shadow-[0_16px_28px_rgba(255,159,252,0.45)]"
          >
            Volver al inicio
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-start justify-center overflow-hidden bg-[#07040f] px-4 pb-12 pt-6 text-[#f5f0ff] sm:px-6">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <GridScan
          sensitivity={0.005}
          lineThickness={1}
          linesColor="#392e4e"
          gridScale={0.1}
          scanColor="#FF9FFC"
          scanOpacity={0.4}
          enablePost
          bloomIntensity={0.6}
          chromaticAberration={0.002}
          noiseIntensity={0.01}
          className="h-full w-full"
        />
      </div>

      <CoinsBadge userId={user?.id} />

      <main className="relative z-10 flex w-full max-w-[760px] flex-col items-center text-center lg:max-w-[1120px]">
        {showGame ? (
          <>
            <div className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/60">
              <span className="font-[var(--font-press-start)] text-[18px] uppercase tracking-[0.2em] text-[#f5f0ff] sm:text-[22px]">
                ALEX GAMES
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-full border border-white/25 bg-[rgba(8,12,22,0.8)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/90 shadow-[0_8px_18px_rgba(111,214,255,0.3)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff9ffc] hover:text-white hover:shadow-[0_14px_26px_rgba(255,159,252,0.45)]"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-white/25 bg-[rgba(8,12,22,0.85)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/90 shadow-[0_8px_18px_rgba(111,214,255,0.3)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#6fd6ff] hover:text-white hover:shadow-[0_14px_26px_rgba(111,214,255,0.45)]"
                >
                  Cerrar sesion
                </button>
              </div>
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/60">
              Ruleta
            </p>
            <RouletteRoundStatus gameId={game?.id} />
            
            <RouletteBettingTable />
          </>
        ) : (
          <>
            <div className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/60">
              <span className="font-[var(--font-press-start)] text-[18px] uppercase tracking-[0.2em] text-[#f5f0ff] sm:text-[22px]">
                ALEX GAMES
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/25 bg-[rgba(8,12,22,0.85)] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white/90 shadow-[0_8px_18px_rgba(111,214,255,0.3)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#6fd6ff] hover:text-white hover:shadow-[0_14px_26px_rgba(111,214,255,0.45)]"
              >
                Cerrar sesion
              </button>
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/60">
              Ruleta
            </p>
            <SnakeIntro
              game={game}
              isLoading={isGameLoading}
              error={gameStatus.message || playStatus.message}
              onContinue={handleContinue}
              onBack={handleBackHome}
              actionLabel={priceLabel}
            />
          </>
        )}
      </main>
    </div>
  );
}

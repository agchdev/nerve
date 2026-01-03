"use client";

import { MINIGAMES } from "@/constantes";
import { CoinsBadge } from "@/components/CoinsBadge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GridScan } from "@/components/GridScan";

export default function MinijuegosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifLoading, setIsVerifLoading] = useState(false);
  const [isVerifChecked, setIsVerifChecked] = useState(false);
  const [gamePrices, setGamePrices] = useState({});
  const [gameImages, setGameImages] = useState({});
  const [isMetaLoading, setIsMetaLoading] = useState(false);

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
              `/verificacion?next=${encodeURIComponent("/minijuegos")}`
            );
          }
          return;
        }

        if (isMounted) {
          const verified = Boolean(data?.verified);
          setIsVerified(verified);
          if (!verified) {
            router.replace(
              `/verificacion?next=${encodeURIComponent("/minijuegos")}`
            );
          }
        }
      } catch (error) {
        if (isMounted) {
          setIsVerified(false);
          router.replace(
            `/verificacion?next=${encodeURIComponent("/minijuegos")}`
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

  useEffect(() => {
    if (!isVerifChecked || !isVerified) return;
    let isMounted = true;

    const fetchMeta = async () => {
      setIsMetaLoading(true);
      try {
        const response = await fetch("/api/juegos/snake");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) return;

        const priceValue = Number(data?.game?.preciopartida);
        const imageValue =
          typeof data?.game?.image_url === "string"
            ? data.game.image_url.trim()
            : "";
        if (isMounted) {
          setGamePrices((prev) => ({
            ...prev,
            snake: Number.isFinite(priceValue) ? priceValue : null,
          }));
          setGameImages((prev) => ({
            ...prev,
            snake: imageValue ? imageValue : null,
          }));
        }
      } catch (error) {
        // ignore, fallback to "Sin precio"
      } finally {
        if (isMounted) {
          setIsMetaLoading(false);
        }
      }
    };

    fetchMeta();
    return () => {
      isMounted = false;
    };
  }, [isVerifChecked, isVerified]);


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
            Inicia sesion para ver los minijuegos.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-4 py-2.5 text-[12px] uppercase tracking-[0.16em] text-white/80 transition hover:border-[#6fd6ff] hover:text-white"
          >
            Volver al inicio
          </Link>
        </main>
      </div>
    );
  }

  if (!isVerifChecked || isVerifLoading || !isVerified) {
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
        <CoinsBadge userId={user?.id} />
        <main className="relative z-10 flex w-full max-w-[420px] flex-col items-center text-center">
          <h1 className="font-[var(--font-press-start)] text-[28px] uppercase tracking-[0.18em] text-[#f5f0ff] sm:text-[36px]">
            ALEX GAMES
          </h1>
          <p className="mt-4 text-sm text-white/70">Redirigiendo...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07040f] px-4 py-12 text-[#f5f0ff] sm:px-6">
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

      <main className="relative z-10 flex w-full max-w-[720px] flex-col items-center text-center">
        <div className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/60">
          <span className="font-[var(--font-press-start)] text-[18px] uppercase tracking-[0.2em] text-[#f5f0ff] sm:text-[22px]">
            ALEX GAMES
          </span>
          <Link
            href="/"
            className="rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/80 transition duration-200 ease-out hover:border-[#6fd6ff] hover:text-white"
          >
            Volver
          </Link>
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/60">
          Minijuegos
        </p>

        <div className="mt-6 grid w-full gap-4 sm:grid-cols-2">
          {MINIGAMES.map((game) => {
            const imageUrl = gameImages[game.id];
            const priceValue = gamePrices[game.id];
            const priceLabel = Number.isFinite(priceValue)
              ? `${priceValue} monedas`
              : isMetaLoading
              ? "Cargando..."
              : "Sin precio";

            return (
              <div
                key={game.id}
                className="group flex h-full flex-col justify-between rounded-2xl border border-white/15 bg-[rgba(8,10,18,0.85)] p-5 text-left text-white/80 transition duration-200 ease-out hover:-translate-y-1 hover:border-[#ff9ffc] hover:text-white"
              >
                <div>
                  {imageUrl ? (
                    <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-[rgba(6,8,16,0.6)]">
                      <img
                        src={imageUrl}
                        alt={`Imagen de ${game.name}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <p className="truncate text-[12px] uppercase tracking-[0.18em] text-white/70">
                    {game.name}
                  </p>
                  <p className="mt-2 truncate text-sm text-white/60">
                    {game.description}
                  </p>
                  <p className="mt-3 truncate text-[10px] uppercase tracking-[0.2em] text-white/50">
                    Precio: <span className="text-[#ff9ffc]">{priceLabel}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(game.href)}
                  className="mt-4 w-full truncate rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[#ff9ffc] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff9ffc] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {priceLabel}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

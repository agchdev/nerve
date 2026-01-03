"use client";

import {
  COUNTRY_PREFIXES,
  MIN_PASSWORD_LENGTH,
  initialStatus,
  passwordChecksFor,
  passwordStrengthLabel,
} from "@/constantes";
import { CoinsBadge } from "@/components/CoinsBadge";
import { GridScan } from "@/components/GridScan";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState("register");
  const [nombre, setNombre] = useState("");
  const [prefijo, setPrefijo] = useState("34");
  const [telefonoLocal, setTelefonoLocal] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showRanking, setShowRanking] = useState(false);
  const [ranking, setRanking] = useState([]);
  const [rankingStatus, setRankingStatus] = useState(initialStatus);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const isLogin = mode === "login";

  const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setStatus(initialStatus);
    setShowRanking(false);
    setRanking([]);
    setRankingStatus(initialStatus);
    if (nextMode === "register") {
      setCurrentUser(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("agch_user");
      }
    }
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleShowRanking = async () => {
    setShowRanking(true);
    if (isRankingLoading || ranking.length) return;

    setIsRankingLoading(true);
    setRankingStatus(initialStatus);

    try {
      const response = await fetch("/api/clasificacion");
      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        setRankingStatus({
          type: "error",
          message: "No se pudo cargar la clasificación.",
        });
        setRanking([]);
        return;
      }

      const items = Array.isArray(responseData?.items)
        ? responseData.items
        : [];
      setRanking(items);

      if (!items.length) {
        setRankingStatus({
          type: "info",
          message: "Aún no hay puntuaciones.",
        });
      }
    } catch (error) {
      setRankingStatus({
        type: "error",
        message: "No se pudo cargar la clasificación.",
      });
      setRanking([]);
    } finally {
      setIsRankingLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("agch_user");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (parsed?.id) {
        setCurrentUser(parsed);
        setMode("login");
        if (parsed?.prefijo) setPrefijo(parsed.prefijo);
        if (parsed?.telefono_local) setTelefonoLocal(parsed.telefono_local);
      }
    } catch {
      window.localStorage.removeItem("agch_user");
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    let isMounted = true;

    const checkVerification = async () => {
      try {
        const response = await fetch(
          `/api/telefono/estado?userId=${encodeURIComponent(currentUser.id)}`
        );
        const data = await response.json().catch(() => ({}));
        if (!isMounted) return;
        if (!response.ok || !data?.verified) {
          router.replace(
            `/verificacion?next=${encodeURIComponent("/")}`
          );
        }
      } catch (error) {
        if (isMounted) {
          router.replace(
            `/verificacion?next=${encodeURIComponent("/")}`
          );
        }
      }
    };

    checkVerification();
    return () => {
      isMounted = false;
    };
  }, [currentUser, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(initialStatus);

    const trimmedNombre = nombre.trim();
    const prefixDigits = normalizeDigits(prefijo);
    const phoneDigits = normalizeDigits(telefonoLocal);
    const fullTelefono = `${prefixDigits}${phoneDigits}`;
    const rawPassword = password;

    if (
      !prefixDigits ||
      !phoneDigits ||
      !rawPassword.trim() ||
      (!isLogin && !trimmedNombre)
    ) {
      setStatus({
        type: "error",
        message: "Completa todos los campos antes de continuar.",
      });
      return;
    }

    if (!isLogin) {
      const checks = passwordChecksFor(rawPassword);
      const isStrong = checks.every((item) => item.ok);
      if (!isStrong) {
        setStatus({
          type: "error",
          message:
            "Minimo 8 caracteres y usar mayuscula, minuscula, numero y simbolo.",
        });
        return;
      }
    }

    if (!isLogin && rawPassword !== confirmPassword) {
      setStatus({
        type: "error",
        message: "Las contraseñas no coinciden.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/login" : "/api/usuarios";
      const requestPayload = isLogin
        ? {
            telefono: fullTelefono,
            password: rawPassword,
          }
        : {
            nombre: trimmedNombre,
            telefono: fullTelefono,
            password: rawPassword,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          responseData?.code === "DUPLICATE_PHONE"
            ? "Ese teléfono ya está registrado."
            : responseData?.code === "WEAK_PASSWORD"
            ? "Minimo 8 caracteres y usar mayuscula, minuscula, numero y simbolo."
            : responseData?.code === "MISSING_FIELDS"
            ? "Completa todos los campos antes de continuar."
            : responseData?.code === "INVALID_CREDENTIALS"
            ? "Teléfono o contraseña incorrectos."
            : "No se pudo completar la solicitud. Intenta de nuevo.";

        setStatus({ type: "error", message });
        if (isLogin) {
          setCurrentUser(null);
        }
      } else {
        setStatus({
          type: "success",
          message: isLogin
            ? "Sesión iniciada correctamente."
            : "Jugador registrado con éxito.",
        });
        if (isLogin) {
          const userData = responseData?.usuario ?? null;
          const enrichedUser = userData
            ? {
                ...userData,
                telefono: userData.telefono ?? fullTelefono,
                prefijo: prefixDigits,
                telefono_local: phoneDigits,
              }
            : null;
          setCurrentUser(enrichedUser);
          setShowRanking(false);
          setRanking([]);
          setRankingStatus(initialStatus);
          if (enrichedUser && typeof window !== "undefined") {
            window.localStorage.setItem(
              "agch_user",
              JSON.stringify(enrichedUser)
            );
          }
        } else {
          setMode("login");
        }
        setNombre("");
        setTelefonoLocal("");
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
      }
    } catch (error) {
      setStatus({ type: "error", message: "Error de red. Intenta de nuevo." });
    } finally {
      setIsLoading(false);
    }
  };


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

      <CoinsBadge userId={currentUser?.id} />

      <main className="relative z-10 flex w-full max-w-[520px] flex-col items-center text-center">
        {isLogin && currentUser ? (
          <>
            <h1 className="font-[var(--font-press-start)] text-[40px] uppercase tracking-[0.2em] text-[#f5f0ff] drop-shadow-[0_0_26px_rgba(255,159,252,0.55)] sm:text-[52px]">
              ALEX GAMES
            </h1>
            {showRanking ? (
              <div className="mt-8 w-full max-w-[420px] text-center">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/60">
                  <span>Clasificación</span>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/ajustes"
                      className="rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/80 transition duration-200 ease-out hover:border-[#6fd6ff] hover:text-white"
                    >
                      Ajustes
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowRanking(false)}
                      className="transition duration-200 ease-out hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.65)]"
                    >
                      Volver
                    </button>
                  </div>
                </div>

                {isRankingLoading ? (
                  <p className="mt-4 text-sm text-white/70">
                    Cargando clasificación...
                  </p>
                ) : ranking.length ? (
                  <ol className="mt-4 space-y-2 text-left">
                    {ranking.map((item, index) => (
                      <li
                        key={item.id}
                        className={`flex items-center justify-between rounded-xl border bg-[rgba(6,8,16,0.6)] px-4 py-3 text-sm ${
                          index === 0
                            ? "border-[#d4af37]"
                            : index === 1
                            ? "border-[#c0c0c0]"
                            : index === 2
                            ? "border-[#cd7f32]"
                            : "border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white/50">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-white/90">
                            {item.nombre || "Jugador"}
                          </span>
                        </div>
                        <span className="text-[#ff9ffc]">
                          {item.puntuacion}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-4 text-sm text-white/70">
                    {rankingStatus.message || "Aún no hay puntuaciones."}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-8 w-full max-w-[360px] space-y-3">
                <button
                  type="button"
                  onClick={handleShowRanking}
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-4 py-2.5 text-[12px] uppercase tracking-[0.16em] text-white/80 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#6fd6ff] hover:bg-[rgba(14,22,38,0.85)] hover:text-white hover:shadow-[0_12px_28px_rgba(111,214,255,0.4)]"
                >
                  Ver clasificación
                </button>
                <Link
                  href="/minijuegos"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-4 py-2.5 text-[12px] uppercase tracking-[0.16em] text-white/80 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff9ffc] hover:bg-[rgba(24,14,30,0.85)] hover:text-white hover:shadow-[0_12px_28px_rgba(255,159,252,0.4)]"
                >
                  Jugar minijuego
                </Link>
                <Link
                  href="/ajustes"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-4 py-2.5 text-[12px] uppercase tracking-[0.16em] text-white/80 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#6fd6ff] hover:bg-[rgba(14,22,38,0.85)] hover:text-white hover:shadow-[0_12px_28px_rgba(111,214,255,0.35)]"
                >
                  Ajustes de cuenta
                </Link>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
              {isLogin ? "Bienvenido de vuelta" : "Registro de jugadores"}
            </p>
            <h1 className="mt-3 font-[var(--font-press-start)] text-[40px] uppercase tracking-[0.2em] text-[#f5f0ff] drop-shadow-[0_0_26px_rgba(255,159,252,0.55)] sm:text-[52px]">
              ALEX GAMES
            </h1>
            <p className="mt-2 max-w-[420px] text-sm leading-6 text-white/70">
              {isLogin
                ? "Ingresa con tu teléfono y contraseña."
                : "Completa los datos básicos para crear un jugador."}
            </p>

            <div className="mt-6 flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.22em] text-white/60">
              <button
                type="button"
                onClick={() => handleModeChange("register")}
                className={`transition duration-200 ease-out hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,159,252,0.5)] ${
                  isLogin ? "text-white/50" : "text-white"
                }`}
                aria-pressed={!isLogin}
              >
                Registro
              </button>
              <span className="h-px w-10 bg-white/30" />
              <button
                type="button"
                onClick={() => handleModeChange("login")}
                className={`transition duration-200 ease-out hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,159,252,0.5)] ${
                  isLogin ? "text-white" : "text-white/50"
                }`}
                aria-pressed={isLogin}
              >
                Login
              </button>
            </div>

            <form
              className="mt-8 w-full max-w-[360px] space-y-4 text-left"
              onSubmit={handleSubmit}
            >
              {!isLogin ? (
                <div className="space-y-2">
                  <label
                    className="text-[11px] uppercase tracking-[0.12em] text-white/70"
                    htmlFor="nombre"
                  >
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    className="w-full rounded-xl border border-white/20 bg-[rgba(6,8,16,0.7)] px-3.5 py-3 text-[15px] text-[#f5f0ff] transition focus:border-[#6fd6ff] focus:outline-none focus:ring-1 focus:ring-[#6fd6ff]"
                    value={nombre}
                    onChange={(event) => setNombre(event.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <label
                  className="text-[11px] uppercase tracking-[0.12em] text-white/70"
                  htmlFor="telefono"
                >
                  Teléfono
                </label>
                <div className="grid grid-cols-[88px_1fr] gap-3 sm:grid-cols-[120px_1fr]">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-white/60">
                      Prefijo
                    </span>
                    <div className="mt-2 flex items-center rounded-xl border border-white/20 bg-[rgba(6,8,16,0.7)] px-2">
                      <span className="text-sm text-white/60">+</span>
                      <select
                        id="prefijo"
                        name="prefijo"
                        className="w-full bg-transparent py-3 pl-2 text-[13px] text-[#f5f0ff] outline-none"
                        value={prefijo}
                        onChange={(event) => setPrefijo(event.target.value)}
                        required
                      >
                        {COUNTRY_PREFIXES.map((country) => (
                          <option
                            key={`${country.name}-${country.code}`}
                            value={country.code}
                          >
                            {country.name} (+{country.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-white/60">
                      Numero
                    </span>
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      inputMode="numeric"
                      className="mt-2 w-full rounded-xl border border-white/20 bg-[rgba(6,8,16,0.7)] px-3.5 py-3 text-[15px] text-[#f5f0ff] transition focus:border-[#6fd6ff] focus:outline-none focus:ring-1 focus:ring-[#6fd6ff]"
                      value={telefonoLocal}
                      onChange={(event) => setTelefonoLocal(event.target.value)}
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="text-[11px] uppercase tracking-[0.12em] text-white/70"
                  htmlFor="password"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-xl border border-white/20 bg-[rgba(6,8,16,0.7)] px-3.5 py-3 pr-20 text-[15px] text-[#f5f0ff] transition focus:border-[#6fd6ff] focus:outline-none focus:ring-1 focus:ring-[#6fd6ff]"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-[0.12em] text-white/60 transition hover:text-white"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {!isLogin ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/60">
                    <span>Requisitos</span>
                    <span>
                      Seguridad:{" "}
                      {
                        passwordStrengthLabel(
                          passwordChecksFor(password).filter((item) => item.ok)
                            .length
                        )
                      }
                    </span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-white/60">
                    {passwordChecksFor(password).map((item) => (
                      <li
                        key={item.id}
                        className={`flex items-center gap-2 ${
                          item.ok ? "text-[#7ef3b2]" : "text-white/50"
                        }`}
                      >
                        <span>{item.ok ? "✓" : "•"}</span>
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                  <label
                    className="text-[11px] uppercase tracking-[0.12em] text-white/70"
                    htmlFor="confirmPassword"
                  >
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full rounded-xl border border-white/20 bg-[rgba(6,8,16,0.7)] px-3.5 py-3 pr-20 text-[15px] text-[#f5f0ff] transition focus:border-[#6fd6ff] focus:outline-none focus:ring-1 focus:ring-[#6fd6ff]"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-[0.12em] text-white/60 transition hover:text-white"
                    >
                      {showConfirmPassword ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>
              ) : null}

              <button
                className="w-full rounded-full bg-gradient-to-br from-[#ff9ffc] to-[#6fd6ff] px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#05020c] shadow-[0_14px_30px_rgba(111,214,255,0.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:from-[#ffd0ff] hover:to-[#9fe3ff] hover:shadow-[0_20px_40px_rgba(255,159,252,0.5)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                type="submit"
                disabled={isLoading}
              >
                {isLoading
                  ? isLogin
                    ? "Ingresando..."
                    : "Registrando..."
                  : isLogin
                  ? "Iniciar sesión"
                  : "Registrar"}
              </button>
            </form>

            {status.message ? (
              <p
                role="status"
                aria-live="polite"
                className={`mt-5 w-full max-w-[360px] rounded-xl border border-white/15 bg-[rgba(8,10,18,0.7)] px-3 py-2 text-center text-sm text-[#f5f0ff] ${
                  status.type === "success"
                    ? "border-[#7ef3b2]/45 text-[#7ef3b2]"
                    : status.type === "error"
                    ? "border-[#ff8f90]/45 text-[#ff8f90]"
                    : ""
                }`}
              >
                {status.message}
              </p>
            ) : null}
          </>
        )}
      </main>

    </div>
  );
}

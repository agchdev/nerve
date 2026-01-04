"use client";

const formatRules = (rules) => {
  if (!rules) return [];
  const normalized = rules.replace(/\\n/g, "\n");
  return normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
};

export function SnakeIntro({
  game,
  isLoading,
  error,
  onContinue,
  onBack,
  actionLabel = "Continuar",
}) {
  const rules = formatRules(game?.reglas);
  const title = game?.slug || "Snake";
  const priceValue = game?.preciopartida;
  const priceLabel =
    typeof priceValue === "number" ? `${priceValue} monedas` : "-";

  return (
    <div className="mt-6 w-full max-w-[560px] text-center">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/60">
        <span>Datos del minijuego</span>
        <div className="flex items-center gap-3">
          {game?.tipo ? (
            <span className="rounded-full border border-white/15 px-2 py-1 text-[10px] text-white/70">
              {game.tipo}
            </span>
          ) : null}
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-white/20 bg-[rgba(8,12,22,0.8)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/90 shadow-[0_8px_18px_rgba(111,214,255,0.3)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff9ffc] hover:text-white hover:shadow-[0_14px_26px_rgba(255,159,252,0.45)]"
            >
              Volver
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/15 bg-[rgba(10,12,22,0.75)] px-6 py-5 text-left shadow-[0_18px_40px_rgba(5,8,18,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
              {title}
            </p>
            <p className="mt-1 text-sm text-white/70">
              Prepárate para el reto.
            </p>
          </div>
          {game?.esta_activo ? (
            <span className="rounded-full border border-[#7ef3b2]/40 bg-[rgba(10,24,18,0.6)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#7ef3b2]">
              Activo
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[rgba(6,8,16,0.6)] px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
              Intentos
            </p>
            <p className="mt-1 text-lg text-white/90">
              {game?.max_intentos === null || game?.max_intentos === undefined
                ? "Sin limite"
                : game.max_intentos}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[rgba(6,8,16,0.6)] px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
              Precio
            </p>
            <p className="mt-1 text-lg text-white/90">{priceLabel}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[rgba(6,8,16,0.6)] px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
              Tipo
            </p>
            <p className="mt-1 text-lg text-white/90">
              {game?.tipo ?? "-"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-[rgba(6,8,16,0.7)] px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
            Reglas
          </p>
          {rules.length ? (
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              {rules.map((rule, index) => (
                <li key={`${rule}-${index}`} className="flex gap-3">
                  <span className="text-[#ff9ffc]">-</span>
                  <span className="leading-6">{rule}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-white/70">
              Reglas no disponibles.
            </p>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-[#ff8f90]">{error}</p>
      ) : null}

      <button
        type="button"
        onClick={onContinue}
        disabled={isLoading || !game}
        className="mt-6 w-full rounded-full bg-gradient-to-r from-[#ff9ffc] via-[#9fe3ff] to-[#7ef3b2] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#05020c] shadow-[0_16px_30px_rgba(255,159,252,0.45)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(111,214,255,0.55)] hover:from-[#ffd1ff] hover:via-[#bfeeff] hover:to-[#b7f7d9] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Cargando..." : actionLabel}
      </button>
    </div>
  );
}

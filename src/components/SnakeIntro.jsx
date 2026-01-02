"use client";

const formatRules = (rules) => {
  if (!rules) return [];
  return rules
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
};

export function SnakeIntro({ game, isLoading, error, onContinue, onBack }) {
  const rules = formatRules(game?.reglas);
  const title = game?.slug || "Snake";

  return (
    <div className="mt-6 w-full max-w-[520px] text-center">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/60">
        <span>Datos del minijuego</span>
        <div className="flex items-center gap-3">
          {game?.tipo ? <span>{game.tipo}</span> : null}
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="transition hover:text-white"
            >
              Volver
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-[rgba(6,8,16,0.6)] px-5 py-4 text-left text-sm text-white/80">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
          {title}
        </p>
        <div className="mt-3 space-y-1 text-xs text-white/60">
          <p>Nivel: {game?.nivel ?? "-"}</p>
          <p>
            Intentos:{" "}
            {game?.max_intentos === null || game?.max_intentos === undefined
              ? "Sin limite"
              : game.max_intentos}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/60">
            Reglas
          </p>
          {rules.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/80">
              {rules.map((rule, index) => (
                <li key={`${rule}-${index}`}>{rule}</li>
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
        className="mt-6 w-full rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-4 py-2.5 text-[12px] uppercase tracking-[0.16em] text-white/80 transition hover:border-[#6fd6ff] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Cargando..." : "Continuar"}
      </button>
    </div>
  );
}

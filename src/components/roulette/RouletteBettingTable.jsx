"use client";

import { useMemo, useState } from "react";

const PURPLE_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const ROWS = [
  Array.from({ length: 12 }, (_, index) => (index + 1) * 3),
  Array.from({ length: 12 }, (_, index) => index * 3 + 2),
  Array.from({ length: 12 }, (_, index) => index * 3 + 1),
];

const DOZENS = [
  { label: "1ra docena", range: "1-12" },
  { label: "2da docena", range: "13-24" },
  { label: "3ra docena", range: "25-36" },
];

const OUTSIDE_BETS = [
  { label: "1-18", tone: "blue" },
  { label: "Par", tone: "neutral" },
  { label: "Azul neon", tone: "blue" },
  { label: "Morado neon", tone: "purple" },
  { label: "Impar", tone: "neutral" },
  { label: "19-36", tone: "purple" },
];

const CHIP_VALUES = [
  { value: 1, tone: "green" },
  { value: 5, tone: "blue" },
  { value: 10, tone: "purple" },
  { value: 25, tone: "neutral" },
  { value: 50, tone: "blue" },
  { value: 100, tone: "purple" },
  { value: 250, tone: "neutral" },
  { value: 500, tone: "green" },
];

const toneClass = (tone) => {
  if (tone === "blue") {
    return "border-[#6fd6ff]/70 text-[#6fd6ff] shadow-[0_0_18px_rgba(111,214,255,0.45)] bg-[rgba(8,18,36,0.85)]";
  }
  if (tone === "purple") {
    return "border-[#ff9ffc]/70 text-[#ff9ffc] shadow-[0_0_18px_rgba(255,159,252,0.45)] bg-[rgba(32,10,46,0.85)]";
  }
  return "border-white/20 text-white/80 shadow-[0_0_16px_rgba(255,255,255,0.12)] bg-[rgba(8,12,22,0.75)]";
};

const chipToneClass = (tone) => {
  if (tone === "green") {
    return "border-[#7ef3b2]/70 text-[#7ef3b2] shadow-[0_0_16px_rgba(126,243,178,0.45)] bg-[radial-gradient(circle_at_30%_30%,rgba(126,243,178,0.9),rgba(8,24,18,0.9))]";
  }
  if (tone === "purple") {
    return "border-[#ff9ffc]/70 text-[#ff9ffc] shadow-[0_0_16px_rgba(255,159,252,0.45)] bg-[radial-gradient(circle_at_30%_30%,rgba(255,159,252,0.9),rgba(32,10,46,0.9))]";
  }
  if (tone === "blue") {
    return "border-[#6fd6ff]/70 text-[#6fd6ff] shadow-[0_0_16px_rgba(111,214,255,0.45)] bg-[radial-gradient(circle_at_30%_30%,rgba(111,214,255,0.9),rgba(8,18,36,0.9))]";
  }
  return "border-white/30 text-white/80 shadow-[0_0_14px_rgba(255,255,255,0.2)] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.7),rgba(10,12,22,0.9))]";
};

export function RouletteBettingTable() {
  const [selectedChip, setSelectedChip] = useState(CHIP_VALUES[0]);
  const [bets, setBets] = useState({});
  const [betStatus, setBetStatus] = useState("");
  const splitIndex = Math.ceil(CHIP_VALUES.length / 2);
  const chipBlocks = [
    CHIP_VALUES.slice(0, splitIndex),
    CHIP_VALUES.slice(splitIndex),
  ];

  const totalBet = useMemo(
    () =>
      Object.values(bets).reduce(
        (sum, bet) => sum + (Number(bet?.total) || 0),
        0
      ),
    [bets]
  );
  const hasBets = totalBet > 0;

  const placeBet = (id, label) => {
    if (!selectedChip) {
      setBetStatus("Selecciona una ficha.");
      return;
    }
    setBets((prev) => {
      const next = { ...prev };
      const current = next[id] || {
        id,
        label,
        total: 0,
        tone: selectedChip.tone,
      };
      next[id] = {
        ...current,
        total: current.total + selectedChip.value,
        tone: selectedChip.tone,
      };
      return next;
    });
    setBetStatus("");
  };

  const clearBets = () => {
    setBets({});
    setBetStatus("");
  };

  const submitBets = () => {
    if (!hasBets) {
      setBetStatus("No hay apuestas.");
      return;
    }
    setBetStatus(`Apuesta preparada: ${totalBet} monedas.`);
  };

  const baseCell =
    "select-none rounded-lg border px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-xs";
  const numberCell =
    "min-w-[32px] h-9 sm:h-10 sm:min-w-[40px] text-[11px] sm:text-xs";
  const betChipClass =
    "pointer-events-none absolute -right-2 -top-2 flex h-6 min-w-[24px] items-center justify-center rounded-full border px-1 text-[8px] font-semibold uppercase tracking-[0.12em]";

  return (
    <section className="mt-4 w-full text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
            Mesa de apuestas
          </p>
          <p className="mt-1 text-sm text-white/70">
            Tablero base con colores neon azul y morado.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-white/60">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#6fd6ff] shadow-[0_0_10px_rgba(111,214,255,0.8)]"></span>
            Azul
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff9ffc] shadow-[0_0_10px_rgba(255,159,252,0.8)]"></span>
            Morado
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <div className="order-2 lg:order-1 lg:w-[170px] lg:self-start">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
            Fichas
          </p>
          <div className="mt-3 flex flex-wrap items-start gap-2 lg:flex-row lg:gap-4">
            {chipBlocks.map((block, blockIndex) => (
              <div
                key={`chip-block-${blockIndex}`}
                className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-center lg:gap-3"
              >
                {block.map((chip) => {
                  const isSelected = selectedChip?.value === chip.value;
                  return (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => {
                        setSelectedChip(chip);
                        setBetStatus("");
                      }}
                      aria-pressed={isSelected}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border text-[10px] font-semibold uppercase tracking-[0.16em] transition duration-200 ease-out hover:-translate-y-0.5 ${chipToneClass(
                        chip.tone
                      )} ${isSelected ? "ring-2 ring-white/70" : "opacity-80 hover:opacity-100"}`}
                    >
                      {chip.value}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 flex-1 overflow-x-auto lg:order-2">
          <table className="w-full min-w-[680px] border-separate border-spacing-[4px] text-center text-xs text-white/80">
            <tbody>
              {ROWS.map((row, rowIndex) => (
                <tr key={`row_${rowIndex}`}>
                  {rowIndex === 0 ? (
                    <td rowSpan={3} className="align-middle">
                      <button
                        type="button"
                        onClick={() => placeBet("num-0", "Numero 0")}
                        className={`${baseCell} ${numberCell} relative w-full border-[#7ef3b2]/70 text-[#7ef3b2] shadow-[0_0_16px_rgba(126,243,178,0.45)] bg-[rgba(8,24,18,0.8)] hover:-translate-y-0.5 transition`}
                      >
                        0
                        {bets["num-0"] ? (
                          <span
                            className={`${betChipClass} ${chipToneClass(
                              bets["num-0"].tone
                            )}`}
                          >
                            {bets["num-0"].total}
                          </span>
                        ) : null}
                      </button>
                    </td>
                  ) : null}

                  {row.map((number) => {
                    const tone = PURPLE_NUMBERS.has(number) ? "purple" : "blue";
                    const betId = `num-${number}`;
                    const bet = bets[betId];
                    return (
                      <td key={`num_${number}`}>
                        <button
                          type="button"
                          onClick={() => placeBet(betId, `Numero ${number}`)}
                          className={`${baseCell} ${numberCell} ${toneClass(
                            tone
                          )} relative w-full transition hover:-translate-y-0.5 ${
                            bet ? "ring-2 ring-white/30" : ""
                          }`}
                        >
                          {number}
                          {bet ? (
                            <span
                              className={`${betChipClass} ${chipToneClass(
                                bet.tone
                              )}`}
                            >
                              {bet.total}
                            </span>
                          ) : null}
                        </button>
                      </td>
                    );
                  })}

                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        placeBet(`row-${rowIndex}-2x1`, `2:1 fila ${rowIndex + 1}`)
                      }
                      className={`${baseCell} ${numberCell} relative w-full border-white/20 text-white/70 bg-[rgba(8,12,22,0.65)] transition hover:-translate-y-0.5 ${
                        bets[`row-${rowIndex}-2x1`] ? "ring-2 ring-white/30" : ""
                      }`}
                    >
                      2:1
                      {bets[`row-${rowIndex}-2x1`] ? (
                        <span
                          className={`${betChipClass} ${chipToneClass(
                            bets[`row-${rowIndex}-2x1`].tone
                          )}`}
                        >
                          {bets[`row-${rowIndex}-2x1`].total}
                        </span>
                      ) : null}
                    </button>
                  </td>
                </tr>
              ))}

              <tr>
                <td></td>
                {DOZENS.map((dozen, index) => {
                  const betId = `dozen-${index + 1}`;
                  const bet = bets[betId];
                  return (
                    <td key={dozen.label} colSpan={4}>
                      <button
                        type="button"
                        onClick={() => placeBet(betId, dozen.label)}
                        className={`${baseCell} relative w-full border-[#9fe3ff]/30 bg-[rgba(8,12,22,0.65)] text-white/80 transition hover:-translate-y-0.5 ${
                          bet ? "ring-2 ring-white/30" : ""
                        }`}
                      >
                        {dozen.label} ({dozen.range})
                        {bet ? (
                          <span
                            className={`${betChipClass} ${chipToneClass(
                              bet.tone
                            )}`}
                          >
                            {bet.total}
                          </span>
                        ) : null}
                      </button>
                    </td>
                  );
                })}
                <td></td>
              </tr>

              <tr>
                <td></td>
                {OUTSIDE_BETS.map((bet, index) => {
                  const betId = `outside-${index}`;
                  const placed = bets[betId];
                  return (
                    <td key={bet.label} colSpan={2}>
                      <button
                        type="button"
                        onClick={() => placeBet(betId, bet.label)}
                        className={`${baseCell} ${toneClass(
                          bet.tone
                        )} relative w-full text-[10px] sm:text-xs transition hover:-translate-y-0.5 ${
                          placed ? "ring-2 ring-white/30" : ""
                        }`}
                      >
                        {bet.label}
                        {placed ? (
                          <span
                            className={`${betChipClass} ${chipToneClass(
                              placed.tone
                            )}`}
                          >
                            {placed.total}
                          </span>
                        ) : null}
                      </button>
                    </td>
                  );
                })}
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="order-3 flex flex-col gap-3 lg:order-3 lg:w-[220px] lg:self-stretch lg:items-end lg:justify-end">
          <div className="w-full rounded-xl border border-white/15 bg-[rgba(8,12,22,0.6)] px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-white/60">
            Total: {totalBet} monedas
          </div>
          <button
            type="button"
            onClick={submitBets}
            disabled={!hasBets}
            className="rounded-full bg-gradient-to-r from-[#ff9ffc] via-[#9fe3ff] to-[#7ef3b2] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#05020c] shadow-[0_16px_30px_rgba(255,159,252,0.45)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(111,214,255,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hacer apuesta
          </button>
          <button
            type="button"
            onClick={clearBets}
            disabled={!hasBets}
            className="rounded-full border border-white/25 bg-[rgba(8,12,22,0.65)] px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-white/90 shadow-[0_8px_18px_rgba(111,214,255,0.25)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#6fd6ff] hover:text-white hover:shadow-[0_14px_26px_rgba(111,214,255,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Limpiar apuesta
          </button>
          {betStatus ? (
            <p className="text-right text-[11px] text-white/60">{betStatus}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

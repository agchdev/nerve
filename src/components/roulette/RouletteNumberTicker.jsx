"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const BASE_NUMBERS = Array.from({ length: 37 }, (_, index) => index);
const PURPLE_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);
const SPIN_SPEED = 520;
const STOP_EASE_MS = 2200;

export function RouletteNumberTicker({ targetNumber, isSpinning = false }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const firstCellRef = useRef(null);
  const [step, setStep] = useState(56);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [offset, setOffset] = useState(0);
  const [finalIndex, setFinalIndex] = useState(null);
  const spinOffsetRef = useRef(0);
  const trackLengthRef = useRef(0);

  const cycleCount = 8;
  const numbers = useMemo(
    () =>
      Array.from({ length: cycleCount }, (_, cycle) =>
        BASE_NUMBERS.map((value) => ({
          value,
          key: `${cycle}-${value}`,
        }))
      ).flat(),
    []
  );

  useEffect(() => {
    const measure = () => {
      if (!viewportRef.current || !trackRef.current || !firstCellRef.current) {
        return;
      }
      const cellWidth = firstCellRef.current.getBoundingClientRect().width;
      const trackStyle = window.getComputedStyle(trackRef.current);
      const gapValue = trackStyle.columnGap || trackStyle.gap || "0";
      const gap = Number.parseFloat(gapValue) || 0;
      const nextStep = cellWidth + gap;
      const viewport = viewportRef.current.getBoundingClientRect().width;
      setStep(nextStep);
      setViewportWidth(viewport);
      trackLengthRef.current = nextStep * numbers.length;
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [numbers.length]);

  useEffect(() => {
    if (
      targetNumber === null ||
      targetNumber === undefined ||
      Number.isNaN(Number(targetNumber)) ||
      viewportWidth === 0
    ) {
      setFinalIndex(null);
      return;
    }

    const target = clampNumber(Math.round(Number(targetNumber)), 0, 36);
    const baseIndex = BASE_NUMBERS.indexOf(target);
    if (baseIndex < 0) return;

    const targetIndex = (cycleCount - 2) * BASE_NUMBERS.length + baseIndex;
    const centerOffset = targetIndex * step - (viewportWidth - step) / 2;
    setFinalIndex(targetIndex);
    setOffset(Math.max(0, centerOffset));
  }, [step, targetNumber, viewportWidth]);

  useEffect(() => {
    if (isSpinning) return;
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = `transform ${STOP_EASE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
    track.style.transform = `translateX(-${offset}px)`;
    spinOffsetRef.current = offset;
  }, [isSpinning, offset]);

  useEffect(() => {
    if (!isSpinning) return undefined;
    const track = trackRef.current;
    if (!track) return undefined;
    const trackLength = trackLengthRef.current;
    if (!trackLength) return undefined;
    track.style.transition = "none";
    let rafId = 0;
    let lastTime = performance.now();

    const loop = (time) => {
      const delta = time - lastTime;
      lastTime = time;
      const next =
        (spinOffsetRef.current + (delta * SPIN_SPEED) / 1000) % trackLength;
      spinOffsetRef.current = next;
      track.style.transform = `translateX(-${next}px)`;
      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [isSpinning, step, viewportWidth]);

  return (
    <div
      ref={viewportRef}
      className="relative mx-auto mt-3 w-full max-w-[260px] overflow-hidden px-2 py-2  sm:max-w-[750px]"
    >
      <div ref={trackRef} className="flex items-center gap-1">
        {numbers.map((item, index) => {
          const tone = PURPLE_NUMBERS.has(item.value) ? "purple" : "blue";
          const isActive = index === finalIndex;
          const baseClass =
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-[11px] sm:text-[30px] font-semibold uppercase tracking-[0.16em] sm:h-30 sm:w-30 sm:text-xs";
          const toneClass =
            tone === "purple"
              ? "border-[#ff9ffc]/70 text-[#ff9ffc] bg-[rgba(32,10,46,0.85)]"
              : "border-[#6fd6ff]/70 text-[#6fd6ff] bg-[rgba(8,18,36,0.85)]";
          const activeClass =
            !isSpinning && isActive ? "ring-2 ring-white/70" : "";

          return (
            <div
              key={item.key}
              ref={index === 0 ? firstCellRef : null}
              className={`${baseClass} ${toneClass} ${activeClass} transition-transform duration-300`}
            >
              {item.value}
            </div>
          );
        })}
      </div>
      {/*
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#07040f] via-[rgba(7,4,15,0.85)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#07040f] via-[rgba(7,4,15,0.85)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.55)]" />
      */}
    </div>
  );
}

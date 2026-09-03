"use client";

import { motion, useReducedMotion } from "motion/react";

export type AutonomyOption<Value extends string> = {
  readonly value: Value;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
};

export function AutonomySlider<Value extends string>({
  label = "Agent access",
  value,
  options,
  onChange,
  className = "",
}: {
  readonly label?: string;
  readonly value: Value;
  readonly options: ReadonlyArray<AutonomyOption<Value>>;
  readonly onChange: (value: Value) => void;
  readonly className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  const selected = options[index];
  const positions = options.map((_, optionIndex) =>
    `${(optionIndex / Math.max(1, options.length - 1)) * 100}%`,
  );
  const transition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 38, mass: 0.7 };

  return (
    <div className={`autonomy-slider ${className}`} data-autonomy-value={selected.value}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-semibold text-[var(--ink)]">{label}</span>
        <span className="text-xs font-semibold text-[var(--ink-soft)]">
          {selected.label}
        </span>
      </div>

      <div className="autonomy-slider__control">
        <div className="autonomy-slider__rail" aria-hidden="true">
          <motion.span
            className="autonomy-slider__fill"
            animate={{ width: positions[index] }}
            transition={transition}
          />
          {options.map((option, optionIndex) => (
            <span
              key={option.value}
              className="autonomy-slider__stop"
              data-active={optionIndex <= index}
              style={{ left: positions[optionIndex] }}
            />
          ))}
          <motion.span
            className="autonomy-slider__thumb"
            animate={{ left: positions[index] }}
            transition={transition}
          />
        </div>
        <input
          aria-label={label}
          aria-valuetext={selected.label}
          type="range"
          min={0}
          max={options.length - 1}
          step={1}
          value={index}
          onChange={(event) => onChange(options[Number(event.target.value)].value)}
          className="autonomy-slider__input"
        />
      </div>

      <div className="autonomy-slider__labels">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={option.value === value}
            className="autonomy-slider__label"
          >
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden">{option.shortLabel}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 min-h-5 text-xs leading-5 text-[var(--muted)]">
        {selected.description}
      </p>
    </div>
  );
}

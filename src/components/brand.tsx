import Link from "next/link";

export function RemyMark({
  compact = false,
  tone = "dark",
}: {
  compact?: boolean;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 ${
        tone === "light" ? "text-[#f4f1e8]" : "text-[#111510]"
      }`}
      aria-label="Remy home"
    >
      <svg
        viewBox="0 0 30 26"
        aria-hidden="true"
        className="h-[22px] w-[26px] overflow-visible"
      >
        <path
          d="M5 2h20l-5.2 8H0L5 2Z"
          fill="currentColor"
          className="transition-transform duration-300 group-hover:-translate-y-0.5"
        />
        <path
          d="M10 14h20l-5.2 8H5l5-8Z"
          fill="#ff6b43"
          className="transition-transform duration-300 group-hover:translate-y-0.5"
        />
      </svg>
      {!compact && (
        <span className="text-[18px] font-semibold tracking-[-0.045em]">
          remy
        </span>
      )}
    </Link>
  );
}

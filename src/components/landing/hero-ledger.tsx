"use client";

import {
  ArrowRight,
  Check,
  CircleAlert,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

const changes = [
  ["Return started", "Both items"],
  ["Pickup changed", "22 New Road"],
  ["Collection booked", "Next Friday"],
];

export function HeroLedger() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: 0.4 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="w-full border-2 border-[#17342b] bg-[#fffaf0] text-[#17221d]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#17342b]/18 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center bg-[#17342b] text-white">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#76817b]">
              Browser assistant
            </p>
            <p className="text-xs font-bold">Working on Morrow</p>
          </div>
        </div>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#17634b]">
          WebMCP connected
        </span>
      </div>

      <div className="bg-[#e3eadf] px-4 py-5 sm:px-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#65746d]">
          Customer asks
        </p>
        <p className="mt-2 max-w-[620px] text-sm font-semibold leading-6 sm:text-base">
          “Return both items. Collect them next Friday and refund my card.”
        </p>
      </div>

      <div className="flex items-center gap-3 bg-[#17342b] px-4 py-3 text-white sm:px-5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.09em] text-[#8dd8b5]">
          WebMCP
        </span>
        <span className="h-px flex-1 bg-white/18" />
        <p className="text-[10px] text-white/65">
          The assistant uses real website actions
        </p>
      </div>

      <div className="px-4 py-2 sm:px-5">
        {changes.map(([title, detail], index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              stiffness: 330,
              damping: 25,
              delay: 0.3 + index * 0.12,
            }}
            className="grid grid-cols-[28px_1fr_auto] items-center border-b border-[#17342b]/12 py-3.5 last:border-b-0"
          >
            <span className="grid size-5 place-items-center bg-[#cfe7d9] text-[#17634b]">
              <Check className="size-3" strokeWidth={3} />
            </span>
            <p className="text-xs font-bold">{title}</p>
            <p className="text-[10px] text-[#727c76]">{detail}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 28, delay: 0.7 }}
        className="border-y-2 border-[#17342b] bg-[#ff805f] px-4 py-4 sm:px-5"
      >
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-black tracking-[-0.025em]">
              Refund £84?
            </p>
            <p className="mt-1 text-xs leading-5 text-[#633629]">
              Money cannot be taken back, so Remy waits for the customer.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-between gap-4 bg-[#fffaf0] p-3 pl-4 sm:pl-5">
        <div className="flex items-center gap-3">
          <span className="relative grid size-9 place-items-center bg-[#17342b] text-white">
            <Sparkles className="size-4" />
            <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center bg-[#f4c95d] font-mono text-[8px] font-black text-[#17221d]">
              !
            </span>
          </span>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#76817b]">
              Remy
            </p>
            <p className="text-xs font-bold">1 decision waiting</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#17634b]">
          Open <ArrowRight className="size-3" />
        </span>
      </div>
    </motion.div>
  );
}

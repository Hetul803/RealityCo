"use client";

import { motion } from "framer-motion";

export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="ambient-grid absolute inset-0 opacity-30" />
      <motion.div
        className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl"
        animate={{ x: [0, 40, -10, 0], y: [0, -18, 24, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 top-40 h-80 w-80 rounded-full bg-mint/20 blur-3xl"
        animate={{ x: [0, -30, 20, 0], y: [0, 22, -14, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl"
        animate={{ x: [0, -20, 10, 0], y: [0, -24, 12, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowRight, Camera, Mic, ScanSearch, Sparkles } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 pb-20 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-mint">
          <Sparkles className="h-3.5 w-3.5" /> Gemini Live Agent Challenge
        </p>
        <h1 className="mt-5 text-4xl font-semibold leading-[1.08] md:text-6xl">
          Show the world to your AI.
          <br />
          <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">A live copilot for voice + vision.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base text-white/70 md:text-lg">
          Reality Copilot turns your camera into the center of the experience. Speak naturally, freeze any frame, and get grounded guidance with lightweight visual highlights.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/app"
            className="group rounded-full bg-gradient-to-r from-accent to-indigo-500 px-6 py-3 text-sm font-medium text-white shadow-xl shadow-accent/30 transition hover:scale-[1.02]"
          >
            Start Live Session <ArrowRight className="ml-1 inline h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <p className="text-sm text-white/55">Judge-ready in under 30 seconds.</p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            [Mic, "Natural voice", "Interruptible, fast, conversational"],
            [Camera, "Camera-first", "The live scene is always the hero"],
            [ScanSearch, "Freeze + explain", "Precise grounded visual analysis"]
          ].map(([Icon, title, copy]) => (
            <div key={title} className="glass rounded-2xl p-4">
              <Icon className="h-4 w-4 text-mint" />
              <p className="mt-3 text-sm font-medium">{title}</p>
              <p className="mt-1 text-xs text-white/55">{copy}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="glass panel-glow relative overflow-hidden rounded-3xl p-4"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-[#0e162a] to-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_30%,rgba(122,139,255,0.22),transparent_35%)]" />
          <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs">Live session preview</div>
          <div className="absolute bottom-4 left-4 right-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-white/15 bg-black/35 p-3 text-xs">
              <p className="text-white/60">Agent status</p>
              <p className="mt-1 font-medium text-mint">Listening · Camera grounded</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/35 p-3 text-xs">
              <p className="text-white/60">Last insight</p>
              <p className="mt-1 font-medium">Focus on the top-left connector.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

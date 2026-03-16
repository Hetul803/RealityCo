import { AmbientBackground } from "@/components/AmbientBackground";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  return (
    <main className="min-h-screen pb-12">
      <AmbientBackground />
      <Navbar />
      <Hero />
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="glass rounded-2xl p-4 md:p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-mint/70">Getting Started</p>
          <h2 className="mt-2 text-lg font-semibold md:text-xl">Talk. Point. Freeze. Understand.</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Open <span className="text-white/80">/app</span>, grant camera and microphone, ask "What do you see?", then press Analyze Frame to explore your environment with AI guidance.
          </p>
        </div>
      </section>
    </main>
  );
}

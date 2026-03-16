import { AmbientBackground } from "@/components/AmbientBackground";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  return (
    <main className="min-h-screen pb-12">
      <AmbientBackground />
      <Navbar />
      <Hero />
      <section className="mx-auto max-w-7xl px-6">
        <div className="glass rounded-3xl p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-mint/80">Demo framing</p>
          <h2 className="mt-3 text-2xl font-semibold md:text-3xl">Talk. Point. Freeze. Explain.</h2>
          <p className="mt-3 max-w-3xl text-sm text-white/65 md:text-base">
            Open <span className="text-white">/app</span>, grant camera and microphone, ask “What do you see?”, then press Analyze Current Frame.
            Judges instantly see a live multimodal flow with grounded overlays.
          </p>
        </div>
      </section>
    </main>
  );
}

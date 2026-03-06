import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#070b16]/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent/90 to-mint/80 text-xs font-bold text-black">
            RC
          </span>
          Reality <span className="text-accent">Copilot</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm text-white/80">
          <span className="hidden rounded-full border border-white/15 bg-white/[0.02] px-3 py-1 text-xs md:inline-flex">Live voice + vision</span>
          <Link
            href="/app"
            className="rounded-full bg-gradient-to-r from-accent/90 to-indigo-500 px-4 py-2 font-medium text-white shadow-lg shadow-accent/25 transition hover:scale-[1.02]"
          >
            Launch Demo
          </Link>
        </nav>
      </div>
    </header>
  );
}

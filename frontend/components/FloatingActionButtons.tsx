import Link from "next/link";

export function FloatingActionButtons() {
  return (
    <div className="fixed bottom-6 right-6 z-30 flex gap-3">
      <Link
        href="/"
        className="glass rounded-full border-white/20 px-4 py-2 text-xs text-white/85 transition hover:-translate-y-0.5 hover:bg-white/10"
      >
        Back to landing
      </Link>
    </div>
  );
}

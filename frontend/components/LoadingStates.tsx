export function LoadingStates({ text, tone = "info" }: { text: string; tone?: "info" | "error" }) {
  const dotClass = tone === "error" ? "bg-red-300" : "bg-mint";
  const panelClass = tone === "error" ? "border-red-300/30 text-red-100" : "text-white/65";

  return (
    <div className={`glass rounded-xl px-3 py-2 text-sm ${panelClass}`}>
      <span className={`mr-2 inline-block h-2 w-2 animate-pulse rounded-full ${dotClass}`} />
      {text}
    </div>
  );
}

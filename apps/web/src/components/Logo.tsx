import { cn } from "@/lib/utils";

/** Marca do produto: selo + carimbo, aludindo ao deferimento de um alvara. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="AlvaraFlow" className={cn("size-8", className)}>
      <rect x="1" y="1" width="30" height="30" rx="9" className="fill-primary" />
      <path
        d="M10 9.5h9.2L23 13.2V22a1.8 1.8 0 0 1-1.8 1.8H10A1.8 1.8 0 0 1 8.2 22V11.3A1.8 1.8 0 0 1 10 9.5Z"
        className="fill-primary-foreground"
        opacity="0.9"
      />
      <path
        d="m12.2 16.6 2.6 2.7 5-5.4"
        fill="none"
        className="stroke-primary"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight">
        Alvara<span className="text-primary">Flow</span>
      </span>
    </div>
  );
}

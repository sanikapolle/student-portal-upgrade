import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  withText?: boolean;
  className?: string;
}

/**
 * Crisp SVG logo — a flowing "B" mark with brand gradient.
 * Replaces the previous low-resolution PNG so it stays sharp at every size.
 */
export function Logo({ size = 40, withText = true, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <div
        className="relative flex items-center justify-center rounded-xl glow shrink-0"
        style={{ width: size, height: size, background: "var(--gradient-brand)" }}
      >
        <svg
          width={size * 0.62}
          height={size * 0.62}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M7 4.5h10.5c3.6 0 6.3 2.4 6.3 5.7 0 2.2-1.2 4-3.1 4.9 2.6.7 4.3 2.7 4.3 5.4 0 3.7-3 6.5-7 6.5H7V4.5Z"
            fill="hsl(0 0% 100%)"
            opacity="0.95"
          />
          <path
            d="M11.5 9.2v4.5h5.4c1.5 0 2.5-.9 2.5-2.3 0-1.4-1-2.2-2.5-2.2h-5.4Zm0 8.7v4.9h6c1.6 0 2.7-1 2.7-2.5s-1.1-2.4-2.7-2.4h-6Z"
            fill="hsl(250 75% 65%)"
          />
        </svg>
      </div>
      {withText && (
        <span className="text-lg font-bold tracking-tight">
          Batch<span className="gradient-text">Flow</span>
        </span>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";

/**
 * Site-wide custom cursor inspired by the reference video:
 * a glowing SVG shape that follows the pointer and fully changes design
 * (shape + color) on every click. Cycles through 5 distinctive variants.
 * Disabled on touch devices via CSS.
 */
const VARIANTS = ["pulse", "diamond", "crosshair", "sparkle", "scope"] as const;
type Variant = typeof VARIANTS[number];

const COLORS: Record<Variant, string> = {
  pulse: "hsl(48 100% 55%)",      // yellow
  diamond: "hsl(20 100% 58%)",    // orange
  crosshair: "hsl(188 95% 60%)",  // cyan
  sparkle: "hsl(340 90% 60%)",    // pink/red
  scope: "hsl(152 80% 55%)",      // green
};

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: -100, y: -100 });
  const current = useRef({ x: -100, y: -100 });
  const variantIndex = useRef(0);
  const [variant, setVariant] = useState<Variant>("pulse");
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;

    let raf = 0;
    const animate = () => {
      current.current.x += (target.current.x - current.current.x) * 0.28;
      current.current.y += (target.current.y - current.current.y) * 0.28;
      el.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const move = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };

    const isInteractive = (node: Element | null): boolean => {
      while (node && node !== document.body) {
        const tag = node.tagName;
        if (
          tag === "A" || tag === "BUTTON" || tag === "INPUT" ||
          tag === "TEXTAREA" || tag === "SELECT" || tag === "LABEL" ||
          node.getAttribute("role") === "button" ||
          node.hasAttribute("data-cursor-hover")
        ) return true;
        node = node.parentElement;
      }
      return false;
    };

    const over = (e: MouseEvent) => {
      const node = e.target as Element | null;
      if (isInteractive(node)) el.classList.add("is-hover");
      else el.classList.remove("is-hover");
    };

    const down = (e: MouseEvent) => {
      el.classList.add("is-down");

      // Cycle to next shape on every click — the cursor itself transforms.
      variantIndex.current = (variantIndex.current + 1) % VARIANTS.length;
      const next = VARIANTS[variantIndex.current];
      setVariant(next);
      setPulseKey((k) => k + 1);

      // Soft expanding ring at click point in the variant's color
      const ring = document.createElement("span");
      ring.className = "bf-click-ring";
      ring.style.left = `${e.clientX}px`;
      ring.style.top = `${e.clientY}px`;
      ring.style.borderColor = COLORS[next];
      ring.style.boxShadow = `0 0 24px ${COLORS[next]}`;
      document.body.appendChild(ring);
      window.setTimeout(() => ring.remove(), 700);
    };

    const up = () => el.classList.remove("is-down");
    const leave = () => {
      target.current.x = -100;
      target.current.y = -100;
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    window.addEventListener("mouseleave", leave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("mouseleave", leave);
    };
  }, []);

  const color = COLORS[variant];

  return (
    <div
      ref={cursorRef}
      className="bf-cursor"
      aria-hidden
      style={{ ["--cursor-color" as never]: color }}
    >
      <svg
        key={pulseKey}
        className="bf-cursor__svg"
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
      >
        {variant === "pulse" && (
          <g stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#bfGlow)">
            <circle cx="32" cy="32" r="14" />
            <path d="M20 32 H25 L28 26 L32 38 L36 28 L39 32 H44" />
          </g>
        )}
        {variant === "diamond" && (
          <g stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" filter="url(#bfGlow)">
            <path d="M32 14 L50 32 L32 50 L14 32 Z" />
            <line x1="32" y1="6" x2="32" y2="20" />
            <line x1="32" y1="44" x2="32" y2="58" />
            <line x1="6" y1="32" x2="20" y2="32" />
            <line x1="44" y1="32" x2="58" y2="32" />
            <circle cx="32" cy="32" r="2" fill={color} />
          </g>
        )}
        {variant === "crosshair" && (
          <g stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" filter="url(#bfGlow)">
            {/* corner brackets */}
            <path d="M16 22 V16 H22" />
            <path d="M42 16 H48 V22" />
            <path d="M48 42 V48 H42" />
            <path d="M22 48 H16 V42" />
            {/* inner square */}
            <rect x="24" y="24" width="16" height="16" rx="2" />
            <circle cx="32" cy="32" r="2" fill={color} />
          </g>
        )}
        {variant === "sparkle" && (
          <g stroke={color} strokeWidth="2" strokeLinejoin="round" fill="none" filter="url(#bfGlow)">
            {/* 4-point star */}
            <path d="M32 8 L36 28 L56 32 L36 36 L32 56 L28 36 L8 32 L28 28 Z" />
            <circle cx="32" cy="32" r="1.6" fill={color} />
          </g>
        )}
        {variant === "scope" && (
          <g stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" filter="url(#bfGlow)">
            <circle cx="32" cy="32" r="16" />
            <circle cx="32" cy="32" r="8" />
            <line x1="32" y1="10" x2="32" y2="22" />
            <line x1="32" y1="42" x2="32" y2="54" />
            <line x1="10" y1="32" x2="22" y2="32" />
            <line x1="42" y1="32" x2="54" y2="32" />
            <circle cx="32" cy="32" r="1.6" fill={color} />
          </g>
        )}
        <defs>
          <filter id="bfGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      {/* Tiny dot kept as the precise pointer hotspot */}
      <span className="bf-cursor__dot" />
    </div>
  );
}

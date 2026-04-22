import { useEffect, useRef } from "react";

/**
 * Site-wide custom cursor: a glowing ring + dot that follows the pointer,
 * grows on interactive elements, and emits a different burst variant on every click.
 * Disabled on touch devices via CSS.
 */
const BURST_VARIANTS = ["ring", "solid", "star", "square", "double"] as const;

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const burstIndex = useRef(0);
  const target = useRef({ x: -100, y: -100 });
  const current = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;

    let raf = 0;
    const animate = () => {
      // Ease toward target for buttery smooth motion
      current.current.x += (target.current.x - current.current.x) * 0.22;
      current.current.y += (target.current.y - current.current.y) * 0.22;
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
          tag === "A" ||
          tag === "BUTTON" ||
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          tag === "LABEL" ||
          node.getAttribute("role") === "button" ||
          node.hasAttribute("data-cursor-hover")
        ) {
          return true;
        }
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

      // Spawn a burst that cycles through visual variants on every click
      const variant = BURST_VARIANTS[burstIndex.current % BURST_VARIANTS.length];
      burstIndex.current += 1;

      const burst = document.createElement("span");
      burst.className = `bf-burst bf-burst--${variant}`;
      burst.style.left = `${e.clientX}px`;
      burst.style.top = `${e.clientY}px`;
      document.body.appendChild(burst);
      window.setTimeout(() => burst.remove(), 750);
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

  return (
    <div ref={cursorRef} className="bf-cursor" aria-hidden>
      <span className="bf-cursor__ring" />
      <span className="bf-cursor__dot" />
    </div>
  );
}

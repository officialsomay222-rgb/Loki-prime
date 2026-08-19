import { useState, useEffect, useRef } from "react";

// Detect very low-end devices (e.g., Exynos 850, old phones)
const isLowEndDevice = () => {
  if (typeof window === 'undefined') return false;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  return hardwareConcurrency < 4 || deviceMemory < 4; // Changed from <= 4 to < 4 to not block standard mobile devices
};

export function useSmoothStream(
  content: string,
  speed: "slow" | "normal" | "fast",
  enabled: boolean,
) {
  // Start with empty string if enabled, so it types out initially, otherwise start with full content.
  // Wait, if it's streaming, we want it to type smoothly. If we start at "", it will re-type everything from the start.
  // Actually, if it's streaming, it's better to start with what we have.
  const [displayedContent, setDisplayedContent] = useState(content);
  const contentRef = useRef(content);
  const displayedRef = useRef(content);
  const isLowEnd = useRef(isLowEndDevice());
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    contentRef.current = content;

    // If disabled by user, just snap to content
    if (!enabled) {
      setDisplayedContent(content);
      displayedRef.current = content;
      return;
    }

    // If content was completely replaced (e.g. new message), reset
    if (!content.startsWith(displayedRef.current)) {
      setDisplayedContent(content);
      displayedRef.current = content;
      return;
    }

    const charsPerTick = speed === "fast" ? 12 : speed === "slow" ? 3 : 6;
    const updateInterval = 20; // Fast updates for smoother look

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= updateInterval) {
        if (displayedRef.current.length < contentRef.current.length) {
          const nextContent = contentRef.current.substring(
            0,
            displayedRef.current.length + charsPerTick,
          );
          setDisplayedContent(nextContent);
          displayedRef.current = nextContent;
          lastUpdateRef.current = timestamp;
        } else {
          // Done animating
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [content, speed, enabled]);

  return displayedContent;
}

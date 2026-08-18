import React, { useEffect, useRef } from 'react';

interface AvatarShockwaveProps {
  isActive: boolean;
}

export const AvatarShockwave: React.FC<AvatarShockwaveProps> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intensityRef = useRef(0);
  const phaseRef = useRef(0);
  const isActiveRef = useRef(isActive);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();

    // Cosmic saturated aura colors: Cyan -> Purple -> Neon Pink -> Amber -> Emerald
    const colorStops = [
      { r: 0, g: 242, b: 255 },   // Cyan
      { r: 189, g: 0, b: 255 },   // Purple
      { r: 255, g: 0, b: 120 },   // Neon Pink
      { r: 255, g: 190, b: 0 },   // Amber
      { r: 0, g: 255, b: 140 },   // Emerald
    ];

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.42;

      ctx.clearRect(0, 0, width, height);

      // Target intensity based on active state
      const targetIntensity = isActiveRef.current ? 1.0 : 0.0;
      intensityRef.current += (targetIntensity - intensityRef.current) * 0.12;

      phaseRef.current += 0.035;
      const phase = phaseRef.current;

      if (intensityRef.current > 0.005) {
        const intensity = intensityRef.current;

        // Draw multiple smooth circular harmonic chromatic wave rings
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (let ring = 0; ring < 3; ring++) {
          const ringPhase = phase + ring * (Math.PI / 1.5);
          const colorIdx = ring % colorStops.length;
          const nextColorIdx = (ring + 1) % colorStops.length;
          const c1 = colorStops[colorIdx];
          const c2 = colorStops[nextColorIdx];

          const radius = baseRadius + Math.sin(ringPhase * 2.0) * (2.5 + ring * 1.5) * intensity;

          ctx.beginPath();
          const segments = 48;
          for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const waveDisplacement = Math.sin(angle * 3 + ringPhase) * (1.5 + ring) * intensity;
            const r = radius + waveDisplacement;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();

          // Soft ring stroke with medium opacity
          const grad = ctx.createLinearGradient(
            centerX - radius,
            centerY - radius,
            centerX + radius,
            centerY + radius
          );
          grad.addColorStop(0, `rgba(${c1.r}, ${c1.g}, ${c1.b}, ${0.45 * intensity})`);
          grad.addColorStop(0.5, `rgba(${c2.r}, ${c2.g}, ${c2.b}, ${0.55 * intensity})`);
          grad.addColorStop(1, `rgba(${c1.r}, ${c1.g}, ${c1.b}, ${0.45 * intensity})`);

          ctx.strokeStyle = grad;
          ctx.lineWidth = (2.0 + ring * 0.8) * intensity;
          ctx.stroke();
        }

        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    window.addEventListener('resize', resize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="absolute -inset-3 z-[0] pointer-events-none rounded-full overflow-hidden aspect-square">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-full"
      />
    </div>
  );
};

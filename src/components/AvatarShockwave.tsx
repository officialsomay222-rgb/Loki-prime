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

    // Vibrant 7-Spectrum Rainbow Colors: Red -> Orange -> Yellow -> Green -> Cyan -> Violet -> Magenta
    const rainbowStops = [
      { r: 255, g: 26, b: 80 },    // Electric Ruby Red
      { r: 255, g: 130, b: 0 },    // Solar Orange
      { r: 255, g: 235, b: 0 },    // Laser Gold Yellow
      { r: 0, g: 255, b: 120 },    // Neon Emerald Green
      { r: 0, g: 242, b: 255 },    // Quantum Cyan
      { r: 138, g: 43, b: 226 },   // Hyper Violet
      { r: 255, g: 0, b: 160 },    // Synth Magenta
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
      intensityRef.current += (targetIntensity - intensityRef.current) * 0.15;

      phaseRef.current += 0.045;
      const phase = phaseRef.current;

      if (intensityRef.current > 0.005) {
        const intensity = intensityRef.current;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (let ring = 0; ring < 4; ring++) {
          const ringPhase = phase + ring * (Math.PI / 2.0);
          const colorIdx = (Math.floor(phase * 1.5) + ring) % rainbowStops.length;
          const nextColorIdx = (colorIdx + 1) % rainbowStops.length;
          const c1 = rainbowStops[colorIdx];
          const c2 = rainbowStops[nextColorIdx];

          const radius = baseRadius + Math.sin(ringPhase * 2.5) * (2.8 + ring * 1.8) * intensity;

          ctx.beginPath();
          const segments = 56;
          for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const waveDisplacement = Math.sin(angle * 4 + ringPhase) * (1.8 + ring * 0.8) * intensity;
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

          // Luminous vibrant rainbow gradient
          const angleOffset = phase + ring * 0.5;
          const grad = ctx.createLinearGradient(
            centerX + Math.cos(angleOffset) * radius,
            centerY + Math.sin(angleOffset) * radius,
            centerX - Math.cos(angleOffset) * radius,
            centerY - Math.sin(angleOffset) * radius
          );
          grad.addColorStop(0, `rgba(${c1.r}, ${c1.g}, ${c1.b}, ${0.65 * intensity})`);
          grad.addColorStop(0.5, `rgba(${c2.r}, ${c2.g}, ${c2.b}, ${0.80 * intensity})`);
          grad.addColorStop(1, `rgba(${c1.r}, ${c1.g}, ${c1.b}, ${0.65 * intensity})`);

          ctx.strokeStyle = grad;
          ctx.lineWidth = (2.2 + ring * 0.9) * intensity;
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
export default AvatarShockwave;

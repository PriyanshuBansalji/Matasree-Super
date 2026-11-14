/**
 * SpiceCursorTrail
 *
 * Renders spice-coloured geometric particles (diamonds, circles, triangles)
 * that burst from the cursor and fade away.
 * Pure DOM divs with clip-path — no emojis, no SVG data URIs.
 * Only active on non-touch desktop devices.
 */
import { useEffect, useRef } from 'react';

const COLORS = ['#D63220', '#E65C19', '#F5A623', '#8B4513', '#4A7C59', '#C9302C', '#E8A045'];

// clip-path shapes
const SHAPES = [
  'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',   // diamond
  'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', // 5-point star
  'circle(50%)',                                     // circle
  'polygon(50% 0%, 0% 100%, 100% 100%)',             // triangle
  'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', // hexagon
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;         // 0 → 1 (starts at 1, counts down)
  rotation: number;
  rotationSpeed: number;
  el: HTMLDivElement;
}

export const SpiceCursorTrail = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastPos = useRef({ x: -999, y: -999 });

  useEffect(() => {
    // Desktop pointer only
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const container = containerRef.current!;

    const spawn = (x: number, y: number) => {
      for (let i = 0; i < 3; i++) {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const size = Math.random() * 9 + 5; // 5–14 px

        const el = document.createElement('div');
        el.style.cssText = `
          position: fixed;
          pointer-events: none;
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          clip-path: ${shape};
          box-shadow: 0 0 ${size}px ${color}88;
          transform: translate(${x}px, ${y}px) rotate(0deg);
          opacity: 1;
          will-change: transform, opacity;
        `;
        container.appendChild(el);

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 0.8;

        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          life: 1,
          rotation: 0,
          rotationSpeed: (Math.random() - 0.5) * 12,
          el,
        });
      }
    };

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      // Throttle: only spawn when cursor moved ≥18px
      if (dx * dx + dy * dy < 18 * 18) return;
      lastPos.current = { x: e.clientX, y: e.clientY };
      spawn(e.clientX, e.clientY);
    };

    const loop = () => {
      particles.current = particles.current.filter((p) => {
        p.life -= 0.028;
        if (p.life <= 0) {
          p.el.remove();
          return false;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;   // gravity
        p.vx *= 0.97;   // air resistance
        p.rotation += p.rotationSpeed;

        p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg) scale(${0.4 + p.life * 0.6})`;
        p.el.style.opacity = String(Math.max(0, p.life));

        return true;
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
      particles.current.forEach((p) => p.el.remove());
      particles.current = [];
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      aria-hidden="true"
    />
  );
};

import { useMemo, useEffect, useRef, useCallback } from 'react';
import {
  useReducedMotion,
  useScroll,
  useTransform,
  motion,
} from 'framer-motion';
import { usePointerFine } from '../../hooks/usePointerFine';

/**
 * ParticleSystem — site-wide ambient floating particle layer that reacts to
 * scroll position and mouse movement.
 *
 * Behaviours:
 * - Renders 30 fixed-position particles (2–6 px diameter) using brand palette
 *   colours at 0.08–0.25 opacity. (Req 4.1, 4.4)
 * - When reduced-motion is preferred: particles are frozen at initial positions.
 *   (Req 4.6)
 * - Scroll parallax: container Y offset ∝ scrollY × 0.12. (Req 4.2)
 * - Mouse repulsion (fine-pointer only): particles within 120px of the cursor
 *   are displaced by up to 40px; spring-return within 600ms. (Req 4.3, 4.7)
 * - Fixed position overlay, pointer-events: none, z-index: 1. (Req 4.1)
 * - `will-change: transform` applied only to actively repelled particles,
 *   removed afterward. (Req 18.4)
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

// ── Brand palette (Req 4.4) ───────────────────────────────────────────────
const BRAND_COLOURS = ['#E65C19', '#D63220', '#8B4513', '#F5A623'] as const;

// ── Constants ─────────────────────────────────────────────────────────────
const PARTICLE_COUNT = 30;
const REPULSION_RADIUS = 120; // px (Req 4.3)
const MAX_DISPLACEMENT = 40;  // px (Req 4.3)
// Spring settle time ≈ 600 ms with these parameters
const SPRING_STIFFNESS = 100;
const SPRING_DAMPING = 14;
const FRAME_MS = 1000 / 60; // target 60 fps budget

// ── Particle interface ─────────────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;             // vw percentage 0–100
  y: number;             // vh percentage 0–100
  size: number;          // px, 2–6
  color: string;         // rgba string with 0.08–0.25 opacity
  driftDuration: number; // seconds, 15–30
  driftDelay: number;    // seconds, negative = pre-run offset
  parallaxFactor: number; // 0.08–0.15
}

// ── Deterministic seeded PRNG ─────────────────────────────────────────────
function createSeededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function range(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}

function generateParticles(): Particle[] {
  const rand = createSeededRandom(42);
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: range(rand, 2, 98),
    y: range(rand, 2, 98),
    size: range(rand, 2, 6),
    color: hexToRgba(pick(rand, BRAND_COLOURS), range(rand, 0.08, 0.25)),
    driftDuration: range(rand, 15, 30),
    driftDelay: -range(rand, 0, 5),
    parallaxFactor: range(rand, 0.08, 0.15),
  }));
}

// ── Spring simulation (runs in rAF loop, not React state) ─────────────────
interface SpringState {
  /** Current displacement x */
  cx: number;
  /** Current displacement y */
  cy: number;
  /** Velocity x */
  vx: number;
  /** Velocity y */
  vy: number;
  /** Target displacement x */
  tx: number;
  /** Target displacement y */
  ty: number;
}

function stepSpring(s: SpringState, dt: number): void {
  const dtS = dt / 1000; // convert ms → seconds
  // Semi-implicit Euler integration of a damped spring
  const ax = -SPRING_STIFFNESS * (s.cx - s.tx) - SPRING_DAMPING * s.vx;
  const ay = -SPRING_STIFFNESS * (s.cy - s.ty) - SPRING_DAMPING * s.vy;
  s.vx += ax * dtS;
  s.vy += ay * dtS;
  s.cx += s.vx * dtS;
  s.cy += s.vy * dtS;
}

// ── Component ─────────────────────────────────────────────────────────────
export function ParticleSystem(): JSX.Element {
  const isPointerFine = usePointerFine();
  const prefersReducedMotion = useReducedMotion();

  // ── Scroll parallax (Req 4.2) ────────────────────────────────────────────
  const { scrollY } = useScroll();
  // maxScroll is computed on first render; for SSR safety default to 1000.
  const maxScroll = useMemo(() => {
    if (typeof document === 'undefined') return 1000;
    return Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  }, []);

  const parallaxY = useTransform(
    scrollY,
    [0, maxScroll],
    [0, maxScroll * 0.12]
  );

  // ── Stable particle data ─────────────────────────────────────────────────
  const particles = useMemo(() => generateParticles(), []);

  // ── Per-particle spring states ───────────────────────────────────────────
  // Stored in a ref so updates don't trigger React re-renders.
  const springStatesRef = useRef<SpringState[]>(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      cx: 0, cy: 0, vx: 0, vy: 0, tx: 0, ty: 0,
    }))
  );

  // DOM refs for each particle so we can write transforms imperatively.
  const particleElemsRef = useRef<(HTMLDivElement | null)[]>(
    Array.from({ length: PARTICLE_COUNT }, () => null)
  );

  // Track which particles are "active" (repelled) for will-change management.
  const activeSetRef = useRef<Set<number>>(new Set());

  // Mouse position (updated by mousemove listener)
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  // ── Mouse repulsion listener ─────────────────────────────────────────────
  const handleMouseMove = useCallback((event: MouseEvent) => {
    mouseRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  useEffect(() => {
    if (!isPointerFine || prefersReducedMotion) return;
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPointerFine, prefersReducedMotion, handleMouseMove]);

  // ── rAF loop: spring simulation + DOM writes ─────────────────────────────
  // Runs only when mouse repulsion is active (fine pointer, no reduced motion).
  useEffect(() => {
    if (!isPointerFine || prefersReducedMotion) return;

    let lastTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const dt = Math.min(now - lastTime, FRAME_MS * 3); // clamp to avoid spiral-of-death
      lastTime = now;

      const mouse = mouseRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const states = springStatesRef.current;
      const elems = particleElemsRef.current;
      const active = activeSetRef.current;

      particles.forEach((p, i) => {
        const px = (p.x / 100) * vw;
        const py = (p.y / 100) * vh;
        const s = states[i];
        const el = elems[i];

        if (mouse) {
          const dx = mouse.x - px;
          const dy = mouse.y - py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < REPULSION_RADIUS && dist > 0) {
            const strength = 1 - dist / REPULSION_RADIUS;
            const nx = -dx / dist;
            const ny = -dy / dist;
            s.tx = nx * strength * MAX_DISPLACEMENT;
            s.ty = ny * strength * MAX_DISPLACEMENT;
            if (!active.has(i) && el) {
              el.style.willChange = 'transform';
              active.add(i);
            }
          } else {
            s.tx = 0;
            s.ty = 0;
            if (active.has(i) && Math.abs(s.cx) < 0.5 && Math.abs(s.cy) < 0.5) {
              if (el) el.style.willChange = '';
              active.delete(i);
            }
          }
        } else {
          s.tx = 0;
          s.ty = 0;
        }

        stepSpring(s, dt);

        // Write transform imperatively — avoids React re-renders for perf (Req 4.5)
        if (el && (Math.abs(s.cx) > 0.05 || Math.abs(s.cy) > 0.05 || active.has(i))) {
          el.style.transform = `translate(calc(-50% + ${s.cx.toFixed(2)}px), calc(-50% + ${s.cy.toFixed(2)}px))`;
        }
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPointerFine, prefersReducedMotion, particles]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        y: prefersReducedMotion ? 0 : parallaxY,
      }}
    >
      {particles.map((p, i) => {
        if (prefersReducedMotion) {
          // Frozen at initial positions — no animation whatsoever (Req 4.6)
          return (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.x}vw`,
                top: `${p.y}vh`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: '50%',
                backgroundColor: p.color,
                transform: 'translate(-50%, -50%)',
              }}
            />
          );
        }

        // Animated particle: drift handled by Framer Motion animate prop,
        // mouse repulsion applied imperatively via DOM ref in rAF loop.
        return (
          <motion.div
            key={p.id}
            ref={(el) => {
              particleElemsRef.current[i] = el;
            }}
            style={{
              position: 'absolute',
              left: `${p.x}vw`,
              top: `${p.y}vh`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              backgroundColor: p.color,
              // Baseline centering; rAF loop overrides this with repulsion offset
              transform: 'translate(-50%, -50%)',
            }}
            // Looping vertical drift animation (Req 4.1)
            animate={{
              y: [0, -(4 + p.size * 0.8), 0],
            }}
            transition={{
              duration: p.driftDuration,
              delay: p.driftDelay,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </motion.div>
  );
}

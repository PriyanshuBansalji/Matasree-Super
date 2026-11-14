import { useRef } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';

/**
 * SectionDivider — an ornamental SVG wave/mandala-inspired divider placed
 * between page sections. The path draws itself in from left to right as it
 * enters the viewport.
 *
 * Behaviours:
 * - SVG path spans the full viewport width using a mandala-wave design.
 * - Uses Framer Motion `pathLength` to animate stroke drawing (0 → 1).
 * - Triggered once when ≥ 50% of the SVG is in the viewport.
 * - Transition: 1.2 s, cubic-bezier [0.76, 0, 0.24, 1].
 * - Stroke colour: `color` prop at 35% opacity; fill: none.
 * - When `prefers-reduced-motion: reduce` is active, the path is rendered
 *   fully drawn (strokeDashoffset: 0) without any animation.
 * - Uses only `pathLength` (mapped to stroke-dashoffset) — GPU-composited.
 *
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

interface SectionDividerProps {
  className?: string;
  /** Stroke colour; defaults to brand saffron #E65C19 */
  color?: string;
}

const DRAW_TRANSITION = {
  duration: 1.2,
  ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
};

/**
 * Mandala-wave SVG path that spans the full viewport width.
 * The path is defined on a 1440 × 60 viewBox so it scales freely with
 * `width="100%"` and `preserveAspectRatio="none"`.
 * The design blends a sine-wave body with small petal/lotus motifs at
 * key inflection points to give it a mandala-inspired character.
 */
const MANDALA_WAVE_PATH =
  // Start at the left, rise to crest and produce a gentle wave with
  // symmetrical petal ornaments along the curve.
  'M0,30 ' +
  // Left ornament petal
  'C60,30 90,10 120,30 ' +
  'C130,36 135,42 140,36 C145,30 143,20 138,26 C133,32 134,38 140,36 ' +
  // Continue the wave through the centre ornament
  'C200,15 280,50 360,30 ' +
  'C420,15 450,5 480,30 ' +
  'C500,40 508,48 516,40 C524,32 522,20 516,26 C510,32 511,40 516,40 ' +
  // Second half wave
  'C580,15 660,50 720,30 ' +
  'C780,10 840,50 900,30 ' +
  // Centre-right ornament petal
  'C916,22 920,12 928,18 C936,24 934,36 928,30 C922,24 924,36 928,30 ' +
  'C980,15 1060,50 1140,30 ' +
  // Right ornament petal
  'C1200,14 1260,46 1300,30 ' +
  'C1310,24 1312,14 1320,20 C1328,26 1326,38 1320,32 C1314,26 1316,36 1320,32 ' +
  'C1360,15 1400,45 1440,30';

export function SectionDivider({ className, color = '#E65C19' }: SectionDividerProps): JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);

  // Trigger once when 50% of the SVG is visible (Req 15.2)
  const isInView = useInView(svgRef, { once: true, amount: 0.5 });

  // Stroke at 35% opacity (Req 15.3)
  const strokeColor = color;
  const strokeOpacity = 0.35;

  // --- Reduced motion gate: render path fully drawn, no animation (Req 15.5) ---
  if (prefersReducedMotion) {
    return (
      <svg
        ref={svgRef}
        className={className}
        width="100%"
        height="60"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d={MANDALA_WAVE_PATH}
          fill="none"
          stroke={strokeColor}
          strokeOpacity={strokeOpacity}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          // Fully drawn with no dash animation
          style={{ strokeDashoffset: 0 }}
        />
      </svg>
    );
  }

  return (
    <svg
      ref={svgRef}
      className={className}
      width="100%"
      height="60"
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* motion.path uses Framer Motion's pathLength to drive stroke-dashoffset (Req 15.2) */}
      <motion.path
        d={MANDALA_WAVE_PATH}
        fill="none"
        stroke={strokeColor}
        strokeOpacity={strokeOpacity}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : {}}
        transition={DRAW_TRANSITION}
      />
    </svg>
  );
}

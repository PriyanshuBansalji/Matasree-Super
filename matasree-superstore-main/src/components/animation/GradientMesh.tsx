import { useReducedMotion } from 'framer-motion';

/**
 * GradientMesh — full-viewport ambient gradient blob layer.
 *
 * Renders 4 large radial-gradient "blobs" using brand colours at very low
 * opacity (0.04–0.07) that slowly drift using CSS keyframe animations.
 *
 * Behaviours:
 * - When `prefers-reduced-motion` is active, blobs are rendered statically
 *   with no CSS animation applied. (Req 10.5)
 * - Fixed-position full-viewport container, z-index: -1, pointer-events: none.
 *   (Req 10.1, 10.2)
 * - 4 blobs each using a brand colour radial gradient at 0.04–0.07 opacity.
 *   (Req 10.3, 10.4)
 * - CSS @keyframes meshFloat1 / meshFloat2 (defined in index.css) applied
 *   with 20–28s durations; `will-change: transform` on each blob. (Req 10.3)
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

// ── Blob definitions ──────────────────────────────────────────────────────
// Brand colours: saffron-orange, chili-red, saddle-brown, turmeric-gold
interface BlobConfig {
  /** CSS radial-gradient string */
  background: string;
  /** Pixel size (diameter) of the blob */
  size: number;
  /** Inline position styles */
  position: React.CSSProperties;
  /** Which keyframe animation to use */
  animation: 'meshFloat1' | 'meshFloat2';
  /** Animation duration in seconds */
  duration: number;
}

const BLOBS: BlobConfig[] = [
  {
    // Blob 1 — saffron-orange, top-left
    background:
      'radial-gradient(circle, rgba(230, 92, 25, 0.07) 0%, rgba(230, 92, 25, 0) 70%)',
    size: 800,
    position: { top: '-200px', left: '-200px' },
    animation: 'meshFloat1',
    duration: 20,
  },
  {
    // Blob 2 — chili-red, top-right
    background:
      'radial-gradient(circle, rgba(214, 50, 32, 0.06) 0%, rgba(214, 50, 32, 0) 70%)',
    size: 700,
    position: { top: '-100px', right: '-200px' },
    animation: 'meshFloat2',
    duration: 24,
  },
  {
    // Blob 3 — saddle-brown, bottom-left
    background:
      'radial-gradient(circle, rgba(139, 69, 19, 0.05) 0%, rgba(139, 69, 19, 0) 70%)',
    size: 750,
    position: { bottom: '-200px', left: '20%' },
    animation: 'meshFloat1',
    duration: 22,
  },
  {
    // Blob 4 — turmeric-gold, center-right
    background:
      'radial-gradient(circle, rgba(245, 166, 35, 0.04) 0%, rgba(245, 166, 35, 0) 70%)',
    size: 650,
    position: { top: '40%', right: '-100px' },
    animation: 'meshFloat2',
    duration: 28,
  },
];

export function GradientMesh(): JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden',
      }}
    >
      {BLOBS.map((blob, index) => {
        const animationStyle: React.CSSProperties = prefersReducedMotion
          ? {} // No animation when reduced motion is preferred (Req 10.5)
          : {
              animation: `${blob.animation} ${blob.duration}s ease-in-out infinite alternate`,
              willChange: 'transform',
            };

        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              width: `${blob.size}px`,
              height: `${blob.size}px`,
              background: blob.background,
              borderRadius: '50%',
              ...blob.position,
              ...animationStyle,
            }}
          />
        );
      })}
    </div>
  );
}

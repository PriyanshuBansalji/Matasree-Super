# Design Document — UI Animation Enhancement

## Overview

This document describes the technical design for dramatically elevating the Matasree Store's visual experience through 18 coordinated animation and motion systems. The implementation uses the existing stack (React 18 + TypeScript + Vite + Framer Motion v12 + Tailwind CSS + Lenis scroll + Sonner) with zero new npm dependencies.

Every component introduced in this feature follows three inviolable constraints:
1. **GPU-only properties** — only `transform` and `opacity` are animated. No `width`, `height`, `top`, `left`, `margin`, or `padding`.
2. **`prefers-reduced-motion` compliance** — detected via Framer Motion's `useReducedMotion()` hook; all motion is disabled or simplified when `true`.
3. **Device awareness** — pointer-intensive effects (`CustomCursor`, `TiltCard`, `ParticleSystem`, `MagneticButton`) are gated behind `pointer: fine` media queries.

---

## Architecture

### Layer Model

```
┌─────────────────────────────────────────────────┐
│  App.tsx                                        │
│  ├── <GradientMesh />          (z-index: -1)    │
│  ├── <CustomCursor />          (z-index: 9999)  │
│  ├── <ParticleSystem />        (z-index: 1)     │
│  ├── <Toaster />               (Sonner, z:50)   │
│  └── <AppRoutes />                              │
│       └── <PageTransition>                      │
│            └── <Page>                           │
│                 ├── <Navbar>  (enhanced)         │
│                 ├── <main>                       │
│                 │    ├── Section 1               │
│                 │    │    └── <StaggerGrid>       │
│                 │    │         └── <TiltCard>     │
│                 │    │              └── <RippleButton> │
│                 │    ├── <SectionDivider />       │
│                 │    └── Section 2 …             │
│                 └── <Footer> (animated)          │
└─────────────────────────────────────────────────┘
```

### Hook Hierarchy

All animation hooks share a common foundation of two utility hooks:

```
usePointerFine()   →  boolean  (window.matchMedia pointer:fine)
useReducedMotion() →  boolean  (Framer Motion useReducedMotion)
```

These two hooks are the single source of truth for the entire animation system. Any component that gates on device type or accessibility preference imports these hooks directly rather than duplicating the matchMedia logic.

### File Structure

All new files live under `src/`:

```
src/
├── components/
│   ├── animation/                  ← NEW: dedicated animation component directory
│   │   ├── CustomCursor.tsx
│   │   ├── MagneticButton.tsx
│   │   ├── TextReveal.tsx
│   │   ├── ParticleSystem.tsx
│   │   ├── TiltCard.tsx
│   │   ├── StaggerGrid.tsx
│   │   ├── AnimatedCounter.tsx
│   │   ├── ImageReveal.tsx
│   │   ├── GlassmorphismCard.tsx
│   │   ├── GradientMesh.tsx
│   │   ├── RippleButton.tsx
│   │   └── SectionDivider.tsx
│   ├── CartDrawer.tsx              ← MODIFIED: swipe-to-close gesture
│   ├── Footer.tsx                  ← MODIFIED: reveal animation
│   └── Navbar.tsx                  ← MODIFIED: scroll condensing
├── hooks/
│   ├── usePointerFine.ts           ← NEW
│   └── useScrolled.ts              ← NEW
└── index.css                       ← MODIFIED: glassmorphism, shimmer, cursor:none
```

### Integration Points

| Requirement | Modified File | Nature of Change |
|---|---|---|
| Req 1 | `App.tsx` | Mount `<CustomCursor />` globally |
| Req 4 | `App.tsx` | Mount `<ParticleSystem />` globally |
| Req 10 | `App.tsx` | Mount `<GradientMesh />` globally |
| Req 11 | `Navbar.tsx` | Add `useScrolled` hook + conditional classes |
| Req 12 | `App.tsx` | Configure Sonner `<Toaster>` with custom animations |
| Req 13 | `index.css` | Override `.animate-pulse` skeleton shimmer |
| Req 16 | `Footer.tsx` | Wrap in `motion.footer` with `whileInView` |
| Req 17 | `CartDrawer.tsx` | Add `useDrag` gesture handler |
| Req 6 | `ProductScrollGrid`, `FeaturedCategoriesSection`, `RecentlyViewedSection`, `WhyChooseUsSection` | Wrap grids in `<StaggerGrid>` |
| Req 5 | `ProductCard.tsx`, category cards | Wrap in `<TiltCard>` |
| Req 3 | `Index.tsx` section `<h2>` elements | Replace with `<TextReveal>` |
| Req 7 | `TrustStatsSection.tsx` | Replace `Counter` with `<AnimatedCounter>` |
| Req 8 | `FeaturedCategoriesSection`, `HeroParallax`, `BrandStoryScroll` | Wrap images in `<ImageReveal>` |
| Req 15 | `Index.tsx` between sections | Insert `<SectionDivider>` |

---

## Components and Interfaces

### 1. `usePointerFine` hook

```typescript
// src/hooks/usePointerFine.ts
export function usePointerFine(): boolean
```

Reads `window.matchMedia('(pointer: fine)')` once on mount. Returns `true` on desktop/mouse devices, `false` on touch-only devices. Uses `useState` + `useEffect` to avoid SSR issues. Result is stable for the component lifetime — no event listener needed since pointer type doesn't change mid-session.

### 2. `useScrolled` hook

```typescript
// src/hooks/useScrolled.ts
export function useScrolled(threshold?: number): boolean
// threshold defaults to 60
```

Returns `true` when `window.scrollY > threshold`. Attaches a passive `scroll` event listener. Used exclusively by `Navbar`.

### 3. `CustomCursor` (Requirement 1)

```typescript
// src/components/animation/CustomCursor.tsx
interface CustomCursorProps {}  // no props — globally mounted singleton

export function CustomCursor(): JSX.Element | null
```

**Implementation:**
- `usePointerFine()` — returns `null` immediately if `false`
- `useReducedMotion()` — if `true`, renders a static `8px × 8px` saffron dot, no animation
- Tracks `mousemove` events via `useMotionValue` + `useSpring` (`damping: 28, stiffness: 220`) for the 80ms lag trailing effect
- State: `isHovering: boolean` — toggled by delegated `mouseenter`/`mouseleave` event listeners on `document` matching `a, button, [role="button"]`
- Layout: `position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9999`
- `motion.div` with `x`/`y` tied to spring values; `width`/`height` animated via Framer Motion `animate` prop between `24px` (resting) and `48px` (hovering)
- Inversion: `mix-blend-mode: difference` achieves the light-on-dark / dark-on-light inversion effect without needing to track background colour
- On mount: sets `document.body.style.cursor = 'none'`; on unmount: restores `cursor: auto`

**CSS in `index.css`:**
```css
@media (pointer: fine) {
  body { cursor: none; }
}
```

### 4. `MagneticButton` (Requirement 2)

```typescript
// src/components/animation/MagneticButton.tsx
interface MagneticButtonProps {
  children: ReactNode;
  strength?: number;   // 0.1–1.0, default 0.4
  className?: string;
}

export function MagneticButton(props: MagneticButtonProps): JSX.Element
```

**Implementation:**
- `usePointerFine()` + `useReducedMotion()` — if either gate is active, renders children with zero effect
- Attaches `pointermove` and `pointerleave` to the wrapper `div` via `useRef`
- On `pointermove`: computes cursor offset from element center; if distance from nearest edge < 80px, sets `x`/`y` motion values proportional to offset × strength (capped at 12px)
- Motion values fed through `useSpring({ stiffness: 200, damping: 20 })` for smooth tracking
- On `pointerleave`: spring values naturally return to `0, 0`
- Uses `motion.div` with `style={{ x, y }}` — transform only, no layout reflow

### 5. `TextReveal` (Requirement 3)

```typescript
// src/components/animation/TextReveal.tsx
interface TextRevealProps {
  children: string;
  duration?: number;   // 0.1–5.0, default 0.6
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
}

export function TextReveal(props: TextRevealProps): JSX.Element
```

**Implementation:**
- Splits `children` string on whitespace at render time → array of word tokens
- `useReducedMotion()` — if `true`, renders words immediately visible (`clipPath: 'inset(0 0% 0 0)'`), no Framer Motion involvement
- `useInView(containerRef, { once: true, amount: 0.2 })` — one-shot trigger
- Each word is a `motion.span` with:
  - `initial={{ clipPath: 'inset(0 100% 0 0)' }}`
  - `animate={isInView ? { clipPath: 'inset(0 0% 0 0)' } : {}}`
  - `transition={{ duration, delay: index * 0.06, ease: [0.76, 0, 0.24, 1] }}`
- `display: inline-block` on each span; `overflow: hidden` on the word wrapper to clip cleanly
- `once: true` on `useInView` ensures no replay

### 6. `ParticleSystem` (Requirement 4)

```typescript
// src/components/animation/ParticleSystem.tsx
interface Particle {
  id: number;
  x: number;   // initial % position
  y: number;
  size: number;  // 2–6 px
  color: string;
  driftDuration: number;
  driftDelay: number;
}

export function ParticleSystem(): JSX.Element | null
```

**Implementation:**
- `usePointerFine()` — mouse repulsion only on fine-pointer devices; rendering continues on coarse (particles just drift without repulsion)
- `useReducedMotion()` — if `true`, all particles rendered statically at initial positions, CSS animations disabled
- 30 particles generated once with `useMemo` using seeded random values (stable across renders)
- Each particle is a `motion.div` with a looping drift animation (`animate` with `y` oscillation using brand colours at opacity 0.08–0.25)
- Scroll parallax: `useScroll()` from Framer Motion; `useTransform(scrollY, [0, maxScroll], [0, maxScroll * 0.12])` applied as Y offset to the container
- Mouse repulsion: `useMouse` pattern — on `mousemove` on `window`, particles within 120px are displaced using a repulsion vector; `useSpring` returns them to drift position within 600ms
- Fixed position, `pointer-events: none`, `z-index: 1`
- Performance: `will-change: transform` applied only to actively repelled particles

### 7. `TiltCard` (Requirement 5)

```typescript
// src/components/animation/TiltCard.tsx
interface TiltCardProps {
  children: ReactNode;
  maxTilt?: number;   // degrees, default 12
  className?: string;
}

export function TiltCard(props: TiltCardProps): JSX.Element
```

**Implementation:**
- `usePointerFine()` + `useReducedMotion()` — if either gate active, renders children as plain `div`
- On `pointermove`: calculates normalized position within card (`(x / w - 0.5) * 2`, `(y / h - 0.5) * 2`) then multiplies by `maxTilt`
- `rotateX` and `rotateY` are `useMotionValue`s, smoothed with `useSpring({ damping: 20, stiffness: 300 })`
- Glare overlay: a child `div` with `background: radial-gradient(...)` at `opacity` 0–0.4, positioned to track cursor within card
- On `pointerleave`: all values spring back to zero within ~400ms naturally
- `perspective: 1000px` set on wrapper `div`

### 8. `StaggerGrid` (Requirement 6)

```typescript
// src/components/animation/StaggerGrid.tsx
interface StaggerGridProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;   // seconds, default 0.07
}

export function StaggerGrid(props: StaggerGridProps): JSX.Element
```

**Implementation:**
- `useReducedMotion()` — if `true`, renders children with `initial={{ opacity: 1, y: 0, scale: 1 }}` (already visible)
- Framer Motion parent `variants` pattern:
  ```typescript
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: staggerDelay } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1,
      transition: { type: 'spring', stiffness: 260, damping: 20 } }
  }
  ```
- `motion.div` container with `whileInView="visible"` and `viewport={{ once: true, amount: 0.15 }}`
- Each direct child is wrapped in a `motion.div` with `variants={itemVariants}`
- Note: children must be passable through the wrapper — accepts any React node array

### 9. `AnimatedCounter` (Requirement 7)

```typescript
// src/components/animation/AnimatedCounter.tsx
interface AnimatedCounterProps {
  to: number;
  duration?: number;   // seconds, default 1.2
  prefix?: string;
  suffix?: string;
  index?: number;      // zero-based position, for stagger delay
}

export function AnimatedCounter(props: AnimatedCounterProps): JSX.Element
```

**Implementation:**
- `useReducedMotion()` — if `true`, renders `${prefix}${to.toLocaleString()}${suffix}` immediately
- `useInView(ref, { once: true, amount: 0.2 })`
- When in view: `animate(0, to, { duration, delay: Math.min((index ?? 0) * 0.15, 0.6), ease: [0.16, 1, 0.3, 1] })` — expo-out curve matches Framer Motion's `[0.16, 1, 0.3, 1]`
- Number formatting: `Math.round(value).toLocaleString()` in the `onUpdate` callback
- Replaces the inline `Counter` function in `TrustStatsSection.tsx`

### 10. `ImageReveal` (Requirement 8)

```typescript
// src/components/animation/ImageReveal.tsx
interface ImageRevealProps {
  children: ReactNode;   // must contain an <img> or image-like element
  className?: string;
}

export function ImageReveal(props: ImageRevealProps): JSX.Element
```

**Implementation:**
- `useReducedMotion()` — if `true`, renders children without the cover panel, image at natural scale
- `useInView(ref, { once: true, amount: 0.2 })`
- Container: `overflow: hidden`, `position: relative`
- Cover panel: `motion.div` with `position: absolute; inset: 0`, background `linear-gradient(90deg, #E65C19, #D63220)`
  - `initial={{ scaleX: 1, transformOrigin: 'left' }}`
  - `animate={isInView ? { scaleX: 0 } : {}}` → retracts left-to-right via scale
  - `transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}`
- Image container (children wrapper): `motion.div`
  - `initial={{ scale: 1.15 }}`
  - `animate={isInView ? { scale: 1 } : {}}`
  - Same transition parameters

### 11. `GlassmorphismCard` (Requirement 9)

```typescript
// src/components/animation/GlassmorphismCard.tsx
interface GlassmorphismCardProps {
  children: ReactNode;
  className?: string;
  as?: React.ElementType;   // default 'div'
}

export function GlassmorphismCard(props: GlassmorphismCardProps): JSX.Element
```

**CSS class added to `index.css`:**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

/* Fallback when backdrop-filter is unsupported */
@supports not (backdrop-filter: blur(1px)) {
  .glass-card {
    background: rgba(255, 255, 255, 0.90);
  }
}
```

The React component applies `glass-card` class and merges with `className` prop.

### 12. `GradientMesh` (Requirement 10)

```typescript
// src/components/animation/GradientMesh.tsx
export function GradientMesh(): JSX.Element
```

**Implementation:**
- `useReducedMotion()` — if `true`, blobs rendered statically (no CSS animation class applied)
- Fixed position full-viewport container, `z-index: -1`, `pointer-events: none`
- 4 `div` blobs, each a large radial gradient circle with brand colours at 0.04–0.07 opacity
- CSS `@keyframes meshFloat` with `transform: translate()` only, duration 20–28s per blob, `ease-in-out`, `infinite alternate`
- `will-change: transform` on each blob element

**Keyframes added to `index.css`:**
```css
@keyframes meshFloat1 {
  from { transform: translate(0px, 0px); }
  to   { transform: translate(40px, -30px); }
}
@keyframes meshFloat2 {
  from { transform: translate(0px, 0px); }
  to   { transform: translate(-35px, 25px); }
}
```

### 13. Navbar Scroll Enhancement (Requirement 11)

**Modified:** `src/components/Navbar.tsx`

- Import `useScrolled` hook: `const isScrolled = useScrolled(60)`
- Import `useReducedMotion`
- Add `transition` CSS class: `transition-all duration-300` (or `duration-0` when reduced-motion)
- Conditional classes on `<header>`:
  - `py-2` → `py-1` when `isScrolled` (half padding)
  - `bg-background/90` → `bg-background/98` when `isScrolled`
  - `border-primary/20` → `border-primary/100` when `isScrolled`
- Logo `<img>` conditional: `scale-100` → `scale-85` when `isScrolled` via `style={{ transform: isScrolled ? 'scale(0.85)' : 'scale(1)' }}`
- All transitions use `transition-all duration-[300ms]` Tailwind class, overridden to `duration-0` when `prefersReducedMotion`

### 14. Toast Micro-Animations (Requirement 12)

**Modified:** `src/App.tsx`

- Configure `<Sonner>` with `toastOptions`:
  ```tsx
  <Sonner
    toastOptions={{
      classNames: {
        toast: 'glass-card border-l-4 border-l-[#D63220]',
        title: 'font-serif font-bold',
      }
    }}
    expand
    richColors
  />
  ```
- Custom entrance/exit via Sonner's built-in `position="top-right"` + custom CSS overrides in `index.css` that use the spring entry (`translateY + scale`) and slide-right exit
- Reduced-motion: simple opacity fade via `@media (prefers-reduced-motion: reduce)` CSS override

**CSS in `index.css`:**
```css
[data-sonner-toast] {
  animation: toastEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
[data-sonner-toast][data-removed] {
  animation: toastExit 0.28s ease-in forwards;
}
@keyframes toastEnter {
  from { transform: translateY(48px) scale(0.85); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes toastExit {
  from { transform: translateX(0); opacity: 1; }
  to   { transform: translateX(110%); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  [data-sonner-toast], [data-sonner-toast][data-removed] {
    animation: toastFade 0.2s ease forwards;
  }
  @keyframes toastFade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
}
```

### 15. Skeleton Shimmer (Requirement 13)

**Modified:** `src/index.css`

Override the existing `.animate-shimmer` and Radix Skeleton pulse to use brand gradient:

```css
/* Brand shimmer override */
.animate-pulse,
[data-skeleton] {
  background: linear-gradient(
    90deg,
    #f5f0e8 0%,
    #f5e0b3 40%,
    #f5a623 60%,
    #f5e0b3 80%,
    #f5f0e8 100%
  );
  background-size: 200% 100%;
  animation: brandShimmer 2s linear infinite;
}

@keyframes brandShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .animate-pulse, [data-skeleton] {
    animation: none;
    background: #f5e0b3; /* static brand tint */
  }
}
```

### 16. `RippleButton` (Requirement 14)

```typescript
// src/components/animation/RippleButton.tsx
interface RippleButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  // All other standard button props passed through
  [key: string]: unknown;
}

export function RippleButton(props: RippleButtonProps): JSX.Element
```

**Implementation:**
- `useReducedMotion()` — if `true`, renders children as plain button with no ripple logic
- State: `ripples: Array<{ id: number; x: number; y: number; size: number }>`
- On `pointerdown`:
  1. `getBoundingClientRect()` to compute relative position
  2. Append new ripple to state with position and size 40px
  3. CSS keyframe `rippleExpand` animates to 160px diameter + opacity 0 over 600ms
  4. `setTimeout(600)` removes the ripple from state by `id`
- Ripple `div`: `position: absolute`, clipped by parent `overflow: hidden`, `pointer-events: none`
- Container button: `position: relative; overflow: hidden`

### 17. `SectionDivider` (Requirement 15)

```typescript
// src/components/animation/SectionDivider.tsx
interface SectionDividerProps {
  className?: string;
  color?: string;   // default '#E65C19'
}

export function SectionDivider(props: SectionDividerProps): JSX.Element
```

**Implementation:**
- SVG with a mandala-wave path spanning full viewport width
- `motion.path` with `pathLength` motion value
- `useReducedMotion()` — if `true`, renders path fully drawn (`strokeDashoffset: 0`, no animation)
- `useInView(ref, { once: true, amount: 0.5 })`
- `initial={{ pathLength: 0 }}`
- `animate={isInView ? { pathLength: 1 } : {}}`
- `transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}`
- Stroke colour: `#E65C19` at 35% opacity; `fill: none`

### 18. Footer Reveal (Requirement 16)

**Modified:** `src/components/Footer.tsx`

- Wrap `<footer>` in `motion.footer`
- Trust badge row:
  ```tsx
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: 0, stiffness: 120, damping: 20, type: 'spring' }}
  >
    {/* trust badges */}
  </motion.div>
  ```
- Grid columns: each `<div>` inside the `lg:grid-cols-4` wrapped in `motion.div` with staggered `delay: index * 0.1 + 0.2`
- `useReducedMotion()` — if `true`, `initial` matches `animate` (no visible change)

### 19. CartDrawer Swipe Gesture (Requirement 17)

**Modified:** `src/components/CartDrawer.tsx`

- `usePointerFine()` — if `true` (desktop), gesture is disabled
- `useReducedMotion()` — gesture remains functional but spring-back duration = 0ms
- Use Framer Motion `useMotionValue(0)` for `x` drag position
- `useDragControls()` or manual `onPointerDown`/`onPointerMove`/`onPointerUp` pattern:
  - Track start time and start X on `pointerdown`
  - On `pointermove`: update `x` motion value (constrained: `Math.max(0, delta)`)
  - On `pointerup`:
    - Calculate `displacement = endX - startX` and `velocity = displacement / (Date.now() - startTime)`
    - If `displacement > 80 && velocity > 0.5`: call `setCartOpen(false)`
    - Else: animate `x` back to `0` with spring (`stiffness: 300, damping: 30`) or instant if reduced-motion
- Drawer `div` gets `style={{ x }}` from Framer Motion motion value

---

## Data Models

### Particle

```typescript
interface Particle {
  id: number;
  x: number;           // vw percentage, 0–100
  y: number;           // vh percentage, 0–100
  size: number;        // px, 2–6
  color: string;       // brand hex at 0.08–0.25 opacity
  driftDuration: number; // seconds, 15–30
  driftDelay: number;  // seconds, 0–5
  parallaxFactor: number; // 0.08–0.15
}
```

### Ripple

```typescript
interface Ripple {
  id: number;      // Date.now() for uniqueness
  x: number;       // px from left of button
  y: number;       // px from top of button
  timestamp: number;
}
```

### AnimationGate

```typescript
interface AnimationGate {
  isPointerFine: boolean;      // from usePointerFine()
  prefersReducedMotion: boolean; // from useReducedMotion()
}
```

All motion components accept these two values as the primary guard before any animation computation.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CustomCursor absent on coarse-pointer devices

*For any* rendering context where `pointer: coarse` matches, the `CustomCursor` component SHALL produce no DOM output.

**Validates: Requirements 1.6**

---

### Property 2: CustomCursor hover scale is bounded

*For any* interactive element type (`a`, `button`, `[role="button"]`) on a pointer-fine device, hovering that element SHALL place the cursor component into the enlarged state (diameter 48px), and leaving SHALL revert to 24px — this property holds for all such element types, not only specific ones.

**Validates: Requirements 1.4**

---

### Property 3: MagneticButton translation is bounded by strength

*For any* `strength` value in `[0.1, 1.0]` and *for any* cursor position within the 80px radius, the computed X and Y translation SHALL satisfy `|tx| ≤ 12 × strength` and `|ty| ≤ 12 × strength`.

**Validates: Requirements 2.1, 2.7**

---

### Property 4: MagneticButton is inert under accessibility and device constraints

*For any* cursor position, if either `prefers-reduced-motion: reduce` is active OR the primary pointer is coarse, the MagneticButton SHALL apply zero positional shift (translation = 0 on both axes).

**Validates: Requirements 2.5, 2.6**

---

### Property 5: TextReveal word count matches input

*For any* non-empty string passed as `children`, the number of rendered word `span` elements SHALL equal the number of whitespace-delimited tokens in that string.

**Validates: Requirements 3.1**

---

### Property 6: TextReveal is immediately fully visible under reduced motion

*For any* string `children` value, when `prefers-reduced-motion: reduce` is active, all word spans SHALL have `clipPath: 'inset(0 0% 0 0)'` immediately on mount without any transition delay.

**Validates: Requirements 3.5**

---

### Property 7: TiltCard rotation is bounded

*For any* cursor position `(x, y)` within a TiltCard's bounding box, the computed rotation SHALL satisfy `|rotateX| ≤ maxTilt` and `|rotateY| ≤ maxTilt` (both axes), where `maxTilt` defaults to 12 degrees.

**Validates: Requirements 5.1**

---

### Property 8: TiltCard is inert under accessibility and device constraints

*For any* cursor position, if either `prefers-reduced-motion: reduce` is active OR the primary pointer is coarse, the TiltCard SHALL apply zero rotation and zero glare opacity.

**Validates: Requirements 5.4, 5.5**

---

### Property 9: StaggerGrid children have correct initial state

*For any* array of children elements passed to `StaggerGrid`, each child SHALL begin its animation from `{ opacity: 0, y: 40, scale: 0.95 }` when the container enters the viewport (without reduced motion active).

**Validates: Requirements 6.2**

---

### Property 10: StaggerGrid is immediately visible under reduced motion

*For any* number of children, when `prefers-reduced-motion: reduce` is active, all children SHALL render at `{ opacity: 1, y: 0, scale: 1 }` immediately on mount.

**Validates: Requirements 6.5**

---

### Property 11: AnimatedCounter reaches its target value

*For any* positive integer target `to`, the AnimatedCounter SHALL ultimately display the value `to` (properly formatted) after the animation completes.

**Validates: Requirements 7.1**

---

### Property 12: AnimatedCounter number formatting

*For any* integer `n ≥ 1000`, the formatted output SHALL contain at least one comma separator. *For any* integer `n < 1000`, the formatted output SHALL contain no comma separators.

**Validates: Requirements 7.2**

---

### Property 13: AnimatedCounter prefix and suffix are always present

*For any* `prefix` string and `suffix` string and *for any* target value, the rendered counter text SHALL start with `prefix` and end with `suffix`.

**Validates: Requirements 7.3**

---

### Property 14: AnimatedCounter is immediately at target under reduced motion

*For any* target value, when `prefers-reduced-motion: reduce` is active, the immediately rendered text SHALL display the final formatted value without any count-up delay.

**Validates: Requirements 7.5**

---

### Property 15: ImageReveal has no cover panel under reduced motion

*For any* image source or child element, when `prefers-reduced-motion: reduce` is active, no cover panel DOM node SHALL be present in the rendered output.

**Validates: Requirements 8.5**

---

### Property 16: Navbar condensed state is consistent with scroll position

*For any* scroll position `scrollY > 60`, the Navbar SHALL be in condensed state (reduced padding, increased background opacity). *For any* scroll position `scrollY ≤ 60`, the Navbar SHALL be in expanded state.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4**

---

### Property 17: RippleButton ripple position matches pointer coordinates

*For any* pointer-down event at coordinates `(clientX, clientY)` within a RippleButton, the spawned ripple element's center SHALL be positioned at `(clientX - buttonLeft, clientY - buttonTop)` relative to the button's bounding box.

**Validates: Requirements 14.1**

---

### Property 18: RippleButton no ripple under reduced motion

*For any* pointer-down event on a RippleButton, when `prefers-reduced-motion: reduce` is active, zero ripple elements SHALL be spawned.

**Validates: Requirements 14.5**

---

### Property 19: RippleButton ripple count matches click count

*For any* sequence of `n` rapid pointer-down events (where `n` is between 2 and 10), exactly `n` ripple elements SHALL exist simultaneously before any have completed their 600ms animation.

**Validates: Requirements 14.7**

---

### Property 20: CartDrawer closes on sufficient swipe

*For any* swipe gesture with displacement `d > 80px` AND velocity `v > 0.5 px/ms`, the CartDrawer's close handler SHALL be called exactly once.

**Validates: Requirements 17.1**

---

### Property 21: CartDrawer does not close on insufficient swipe

*For any* swipe gesture where `d ≤ 80px` OR `v ≤ 0.5 px/ms`, the CartDrawer's close handler SHALL NOT be called.

**Validates: Requirements 17.3**

---

## Error Handling

### Media Query Unavailability

`usePointerFine` and the reduced-motion check both call `window.matchMedia(...)`. In environments where this API is unavailable (SSR, test runners without jsdom configuration):

```typescript
const isPointerFine = typeof window !== 'undefined'
  ? window.matchMedia('(pointer: fine)').matches
  : false;   // safe default: treat as touch device
```

This means pointer-intensive effects default to *off* in unknown environments, which is the safer behaviour.

### Image Load Failures in `ImageReveal`

The `ImageReveal` component wraps children and does not directly control image loading. If the inner `<img>` fails to load, the cover panel animation still fires correctly — the result is the cover panel retracting over a broken-image placeholder, which is acceptable. The existing `ProductImage` component's `fallbackSrc` prop handles the underlying image error.

### `useInView` Without Intersection Observer

Framer Motion's `useInView` polyfills `IntersectionObserver` via a fallback. In environments without `IntersectionObserver` (very old browsers), `isInView` defaults to `true`, meaning animations fire immediately on mount. This is the correct degraded behaviour — content is visible, just without the reveal effect.

### Ripple Cleanup on Unmount

`RippleButton` stores a `Set<ReturnType<typeof setTimeout>>` for pending cleanup timers. The `useEffect` cleanup function clears all pending timers and empties the ripple state, preventing memory leaks when the component unmounts mid-animation.

### CartDrawer Pointer Capture

The swipe gesture uses `element.setPointerCapture(event.pointerId)` on `pointerdown` to ensure `pointermove` events are received even if the pointer moves outside the drawer's bounds. `releasePointerCapture` is called on `pointerup`/`pointercancel`.

---

## Testing Strategy

### Testing Approach

The animation system uses a **dual testing strategy**:

1. **Unit/example tests** — verify specific behaviours with concrete inputs (e.g., reduced-motion fallbacks, DOM structure assertions)
2. **Property-based tests** — verify universal invariants across generated input ranges (e.g., rotation bounds, translation bounds, swipe threshold logic)

Property-based tests use **Vitest** (already in `devDependencies`) with [fast-check](https://github.com/dubzzz/fast-check) — however, since no new npm packages are permitted, PBT properties are instead implemented using Vitest's built-in test infrastructure with hand-written generators (simple loops over representative input ranges) that cover the input space systematically. This satisfies the property spirit without adding a dependency.

**Test file locations:** `src/test/animation/`

### Unit Tests

**`CustomCursor.test.tsx`**
- Renders `null` when `matchMedia('pointer: coarse')` is mocked
- Renders static 8px dot when `useReducedMotion` returns `true`
- Applies `cursor: none` to `document.body` on mount

**`MagneticButton.test.tsx`**
- Returns children unmodified when `useReducedMotion` is `true`
- Returns children unmodified when pointer is coarse

**`TextReveal.test.tsx`**
- Word count matches `children.split(/\s+/)` length for sample strings
- All words immediately visible when `useReducedMotion` is `true`

**`AnimatedCounter.test.tsx`**
- Final value displayed immediately when `useReducedMotion` is `true`
- Numbers ≥ 1000 include comma separators
- Prefix/suffix appear in rendered output

**`RippleButton.test.tsx`**
- No ripples spawned when `useReducedMotion` is `true`
- Ripple element removed from DOM after 600ms (fake timers)
- Multiple rapid clicks produce N independent ripple elements

**`TiltCard.test.tsx`**
- Zero rotation when `useReducedMotion` is `true`
- Zero rotation when pointer is coarse

**`StaggerGrid.test.tsx`**
- Children rendered immediately visible when `useReducedMotion` is `true`

**`CartDrawer.swipe.test.tsx`**
- Close NOT called for displacement ≤ 80 or velocity ≤ 0.5
- Close called for displacement > 80 AND velocity > 0.5

### Property Tests (Systematic Input Sweeps)

Each "property test" below is implemented as a Vitest test that iterates over a representative sample of the input space (100+ iterations using deterministic parameterization):

**`translation.property.test.ts` — Property 3**
```typescript
// Feature: ui-animation-enhancement, Property 3: MagneticButton translation bounded by strength
// Sweeps strength in [0.1, 1.0] × 100 steps AND cursor positions × 50 points
// Verifies: |tx| ≤ 12 * strength, |ty| ≤ 12 * strength
```

**`neutralMotion.property.test.ts` — Properties 4, 8, 10, 14, 15, 18**
```typescript
// Feature: ui-animation-enhancement, Property 4/8/10/14/15/18: reduced-motion neutrality
// For each animated component, sweeps all meaningful inputs and verifies
// that reduced-motion gate produces zero animation values
```

**`textReveal.property.test.ts` — Properties 5, 6**
```typescript
// Feature: ui-animation-enhancement, Property 5: word count invariant
// Sweeps 100+ strings of varying lengths, word counts, and unicode content
// Verifies: span count === whitespace-token count
```

**`rotation.property.test.ts` — Property 7**
```typescript
// Feature: ui-animation-enhancement, Property 7: TiltCard rotation bounded
// Sweeps cursor positions across full card bounds (100×100 grid of positions)
// Verifies: |rotateX| ≤ maxTilt, |rotateY| ≤ maxTilt
```

**`counterFormat.property.test.ts` — Properties 12, 13**
```typescript
// Feature: ui-animation-enhancement, Property 12: number formatting
// Sweeps integers 0–100,000 in steps of 1, and random large integers
// Verifies: n >= 1000 → contains ','; n < 1000 → no ','
// Also sweeps prefix/suffix combinations to verify Property 13
```

**`ripple.property.test.ts` — Properties 17, 19**
```typescript
// Feature: ui-animation-enhancement, Property 17: ripple position matches pointer
// Sweeps 100+ click positions within button bounds
// Verifies: ripple center = (clientX - rect.left, clientY - rect.top)

// Feature: ui-animation-enhancement, Property 19: ripple count matches click count
// Sweeps click sequences from 2 to 10 rapid clicks
// Verifies: exactly n ripple elements exist before any complete
```

**`swipeGesture.property.test.ts` — Properties 20, 21**
```typescript
// Feature: ui-animation-enhancement, Property 20/21: swipe threshold logic
// Sweeps (displacement, velocity) pairs across:
//   - d ∈ [0, 200], v ∈ [0, 2] — 200 combinations
// Verifies: close called iff (d > 80 && v > 0.5)
```

**`navbar.property.test.ts` — Property 16**
```typescript
// Feature: ui-animation-enhancement, Property 16: navbar scroll state consistency
// Sweeps scrollY values 0–2000
// Verifies: scrollY > 60 → condensed, scrollY ≤ 60 → expanded
```

### Integration Notes

- All tests run under Vitest with jsdom (already configured in `vitest.config.ts`)
- `window.matchMedia` is mocked in `src/test/setup.ts` with a configurable factory
- `useReducedMotion` is mocked by setting the media query mock to `(prefers-reduced-motion: reduce)`
- `IntersectionObserver` is mocked to allow manual trigger of `useInView`

### Performance Verification (non-automated)

The following are verified manually / via browser DevTools rather than automated tests:

- CLS ≤ 0.1 — Chrome DevTools Lighthouse run after implementing all animations
- 60 fps on mid-range mobile — Chrome DevTools Performance panel during scroll + hover on a Moto G4 throttle preset
- `will-change: transform` presence only during active animation — verified via Elements panel inspection
- No `width`/`height`/`top`/`left` animated properties — CSS audit via DevTools Animation inspector

---

*Design document version: 1.0 — covers all 18 requirements from `requirements.md`.*

# Implementation Plan: UI Animation Enhancement

## Overview

Implement 18 coordinated animation and motion systems across the Matasree Store frontend. The work is divided into five layers, each building on the previous:

1. **Foundation** — utility hooks and CSS keyframes (no component deps)
2. **Animation components** — 12 new self-contained components in `src/components/animation/`
3. **Existing component modifications** — Navbar, Footer, CartDrawer, App.tsx
4. **Page integrations** — wiring animation components into existing sections/pages
5. **Tests** — unit tests and property sweep tests, placed immediately after the component they cover

All animations must be GPU-only (`transform`/`opacity`), respect `prefers-reduced-motion`, and add zero new npm dependencies.

---

## Tasks

- [x] 1. Set up foundation hooks and CSS keyframes
  - [x] 1.1 Create `src/hooks/usePointerFine.ts`
    - Implement `usePointerFine(): boolean` using `useState` + `useEffect` reading `window.matchMedia('(pointer: fine)')`
    - Guard against SSR/test environments: return `false` when `window` is undefined
    - _Requirements: 1.6, 2.6, 4.7, 5.5, 17.5_
  - [x] 1.2 Create `src/hooks/useScrolled.ts`
    - Implement `useScrolled(threshold = 60): boolean` attaching a passive `scroll` event listener
    - Return `true` when `window.scrollY > threshold`, clean up listener on unmount
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [ ]* 1.3 Write unit tests for `usePointerFine` and `useScrolled`
    - Test `usePointerFine` returns `false` when `matchMedia` reports coarse pointer
    - Test `useScrolled` returns `false` below threshold and `true` above it
    - Test `useScrolled` cleans up its scroll listener on unmount
    - _Requirements: 1.6, 11.5_
  - [x] 1.4 Add CSS keyframes and global overrides to `src/index.css`
    - Add `.glass-card` class with `backdrop-filter: blur(20px)`, semi-transparent background/border, inset highlight, and `@supports` fallback
    - Add brand shimmer override for `.animate-pulse` and `[data-skeleton]` using the saffron-gold gradient and `@keyframes brandShimmer`
    - Add `@keyframes meshFloat1` and `meshFloat2` for GradientMesh blobs
    - Add `@media (pointer: fine) { body { cursor: none; } }` for CustomCursor
    - Add toast keyframes: `@keyframes toastEnter`, `toastExit`, and `toastFade` with `[data-sonner-toast]` selectors
    - Add `@keyframes rippleExpand` for RippleButton
    - _Requirements: 9.1, 9.3, 10.3, 12.1, 12.2, 12.5, 13.1, 13.2, 13.4, 14.2, 14.3, 1.8_

- [x] 2. Implement `CustomCursor` component
  - [x] 2.1 Create `src/components/animation/CustomCursor.tsx`
    - Import `usePointerFine` and `useReducedMotion` from Framer Motion; return `null` immediately when pointer is coarse
    - When reduced motion: render static `8px × 8px` saffron dot, no spring/animation
    - Track `mousemove` via `useMotionValue` + `useSpring({ damping: 28, stiffness: 220 })` for the 80ms trail
    - Toggle `isHovering` via delegated `mouseenter`/`mouseleave` on `document` matching `a, button, [role="button"]`
    - Animate `width`/`height` between 24px (rest) and 48px (hovering) via Framer Motion `animate` prop
    - Apply `mix-blend-mode: difference` for background inversion; set `cursor: none` on `document.body` on mount, restore on unmount
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_
  - [ ]* 2.2 Write unit tests for `CustomCursor` (`src/test/animation/CustomCursor.test.tsx`)
    - Test renders `null` when `matchMedia` reports `pointer: coarse`
    - Test renders static 8px dot (no spring) when `useReducedMotion` returns `true`
    - Test sets `document.body.style.cursor = 'none'` on mount and restores on unmount
    - _Requirements: 1.6, 1.7, 1.8_

- [x] 3. Implement `MagneticButton` component
  - [x] 3.1 Create `src/components/animation/MagneticButton.tsx`
    - Accept `children`, `strength?: number` (0.1–1.0, default 0.4), `className?: string`
    - Gate on `usePointerFine()` and `useReducedMotion()` — if either is true, render children with zero effect
    - Attach `pointermove` and `pointerleave` to the wrapper div via `useRef`
    - Compute offset from element center; apply displacement only within 80px of nearest edge, capped at `12 × strength`
    - Feed `x`/`y` through `useSpring({ stiffness: 200, damping: 20 })`; return to zero on `pointerleave`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - [ ]* 3.2 Write property sweep test for `MagneticButton` (`src/test/animation/translation.property.test.ts`)
    - **Property 3: MagneticButton translation is bounded by strength**
    - **Property 4: MagneticButton is inert under accessibility and device constraints**
    - Sweep `strength` across 100 values in [0.1, 1.0] × 50 cursor positions; verify `|tx| ≤ 12 × strength` and `|ty| ≤ 12 × strength`
    - Verify zero translation output when reduced-motion or coarse-pointer gates are active
    - **Validates: Requirements 2.1, 2.5, 2.6, 2.7**

- [x] 4. Implement `TextReveal` component
  - [x] 4.1 Create `src/components/animation/TextReveal.tsx`
    - Accept `children: string`, `duration?: number` (0.1–5.0, default 0.6), `className?: string`, `as?: 'h1'|'h2'|'h3'|'h4'|'p'|'span'`
    - Split `children` on whitespace at render time into word token array
    - When reduced motion: render all words immediately visible (`clipPath: 'inset(0 0% 0 0)'`), no animation
    - Use `useInView(containerRef, { once: true, amount: 0.2 })` for one-shot scroll trigger
    - Each word is a `motion.span` with `initial={{ clipPath: 'inset(0 100% 0 0)' }}`, animating to `'inset(0 0% 0 0)'`; stagger delay `index × 0.06s`; `display: inline-block; overflow: hidden`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  - [ ]* 4.2 Write property sweep test for `TextReveal` (`src/test/animation/textReveal.property.test.ts`)
    - **Property 5: TextReveal word count matches input**
    - **Property 6: TextReveal is immediately fully visible under reduced motion**
    - Sweep 100+ strings of varying lengths, word counts, and unicode content; verify span count === whitespace-token count
    - Verify all spans have `clipPath: 'inset(0 0% 0 0)'` immediately when `useReducedMotion` is `true`
    - **Validates: Requirements 3.1, 3.5**

- [x] 5. Implement `ParticleSystem` component
  - [x] 5.1 Create `src/components/animation/ParticleSystem.tsx`
    - Define `Particle` interface: `{ id, x, y, size, color, driftDuration, driftDelay, parallaxFactor }`
    - Generate 30 particles once via `useMemo` with deterministic pseudo-random values; use brand palette colours at 0.08–0.25 opacity
    - Gate mouse repulsion on `usePointerFine()`; gate all movement on `useReducedMotion()` (freeze at initial positions when true)
    - Apply scroll parallax via `useScroll()` + `useTransform(scrollY, [0, maxScroll], [0, maxScroll * 0.12])`
    - Implement mouse repulsion: displace particles within 120px using a repulsion vector; spring return within 600ms
    - Fixed position overlay, `pointer-events: none`, `z-index: 1`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 6. Implement `TiltCard` component
  - [x] 6.1 Create `src/components/animation/TiltCard.tsx`
    - Accept `children: ReactNode`, `maxTilt?: number` (default 12), `className?: string`
    - Gate on `usePointerFine()` and `useReducedMotion()` — if either is active, render children as plain `div` with no rotation or glare
    - On `pointermove`: compute normalized position `(x/w - 0.5)*2 × maxTilt`; smooth with `useSpring({ damping: 20, stiffness: 300 })`
    - Glare overlay: child `div` with `radial-gradient` at opacity 0–0.4, tracking cursor across full card
    - On `pointerleave`: spring all values back to zero; set `perspective: 1000px` on wrapper
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]* 6.2 Write property sweep test for `TiltCard` (`src/test/animation/rotation.property.test.ts`)
    - **Property 7: TiltCard rotation is bounded**
    - **Property 8: TiltCard is inert under accessibility and device constraints**
    - Sweep cursor positions over a 100×100 grid within card bounds; verify `|rotateX| ≤ maxTilt` and `|rotateY| ≤ maxTilt`
    - Verify zero rotation and zero glare opacity when reduced-motion or coarse-pointer gates are active
    - **Validates: Requirements 5.1, 5.4, 5.5**

- [x] 7. Implement `StaggerGrid` component
  - [x] 7.1 Create `src/components/animation/StaggerGrid.tsx`
    - Accept `children: ReactNode`, `className?: string`, `staggerDelay?: number` (default 0.07)
    - When reduced motion: render children with `initial={{ opacity: 1, y: 0, scale: 1 }}` (immediately visible, no stagger)
    - Use Framer Motion parent/child `variants` pattern: `containerVariants` with `staggerChildren: staggerDelay`; `itemVariants` with `hidden: { opacity: 0, y: 40, scale: 0.95 }` → `visible: { opacity: 1, y: 0, scale: 1 }` spring
    - `motion.div` container with `whileInView="visible"` and `viewport={{ once: true, amount: 0.15 }}`; wrap each direct child in a `motion.div` with `variants={itemVariants}`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ]* 7.2 Write property sweep test for `StaggerGrid` (`src/test/animation/neutralMotion.property.test.ts` — combined)
    - **Property 9: StaggerGrid children have correct initial state**
    - **Property 10: StaggerGrid is immediately visible under reduced motion**
    - For any array of children, verify each begins from `{ opacity: 0, y: 40, scale: 0.95 }` on viewport entry
    - Verify all children render at `{ opacity: 1, y: 0, scale: 1 }` immediately when reduced-motion is active
    - **Validates: Requirements 6.2, 6.5**

- [x] 8. Implement `AnimatedCounter` component
  - [x] 8.1 Create `src/components/animation/AnimatedCounter.tsx`
    - Accept `to: number`, `duration?: number` (default 1.2), `prefix?: string`, `suffix?: string`, `index?: number`
    - When reduced motion: render `${prefix}${to.toLocaleString()}${suffix}` immediately on mount
    - Use `useInView(ref, { once: true, amount: 0.2 })`; on view-entry run `animate(0, to, { duration, delay: Math.min((index ?? 0) * 0.15, 0.6), ease: [0.16, 1, 0.3, 1] })`
    - Format via `Math.round(value).toLocaleString()` in `onUpdate` callback; always prepend `prefix` and append `suffix`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [ ]* 8.2 Write property sweep test for `AnimatedCounter` (`src/test/animation/counterFormat.property.test.ts`)
    - **Property 11: AnimatedCounter reaches its target value**
    - **Property 12: AnimatedCounter number formatting**
    - **Property 13: AnimatedCounter prefix and suffix are always present**
    - **Property 14: AnimatedCounter is immediately at target under reduced motion**
    - Sweep integers 0–100,000 in steps of 1 and large random integers; verify n ≥ 1000 → output contains ','; n < 1000 → no ','
    - Sweep prefix/suffix combinations and any target; verify rendered text starts with prefix and ends with suffix
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**

- [x] 9. Implement `ImageReveal` component
  - [x] 9.1 Create `src/components/animation/ImageReveal.tsx`
    - Accept `children: ReactNode`, `className?: string`
    - When reduced motion: render children without cover panel, image at natural scale
    - Use `useInView(ref, { once: true, amount: 0.2 })`
    - Cover panel: `motion.div` with `position: absolute; inset: 0`, brand gradient, `initial={{ scaleX: 1, transformOrigin: 'left' }}` → `animate={{ scaleX: 0 }}` over 0.8s with cubic-bezier `[0.76, 0, 0.24, 1]`
    - Children wrapper: `motion.div` with `initial={{ scale: 1.15 }}` → `animate={{ scale: 1 }}` same timing; container `overflow: hidden; position: relative`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [ ]* 9.2 Write unit test for `ImageReveal` (`src/test/animation/ImageReveal.test.tsx`)
    - **Property 15: ImageReveal has no cover panel under reduced motion**
    - Test that no cover panel DOM node is present in rendered output when `useReducedMotion` returns `true`
    - **Validates: Requirements 8.5**

- [x] 10. Implement `GlassmorphismCard` component
  - [x] 10.1 Create `src/components/animation/GlassmorphismCard.tsx`
    - Accept `children: ReactNode`, `className?: string`, `as?: React.ElementType` (default `'div'`)
    - Apply `glass-card` CSS class (defined in task 1.4) merged with `className` prop
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 11. Implement `GradientMesh` component
  - [x] 11.1 Create `src/components/animation/GradientMesh.tsx`
    - `useReducedMotion()` — when true, render blobs statically without applying CSS animation class
    - Fixed position full-viewport container, `z-index: -1`, `pointer-events: none`
    - 4 `div` blobs each as large radial gradient circle using brand colours at 0.04–0.07 opacity
    - Apply `meshFloat1`/`meshFloat2` CSS keyframes (from task 1.4) with 20–28s per blob; `will-change: transform` on each blob
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 12. Implement `RippleButton` component
  - [x] 12.1 Create `src/components/animation/RippleButton.tsx`
    - Accept `children: ReactNode`, `className?: string`, `onClick?: React.MouseEventHandler<HTMLButtonElement>`, and spread remaining button props
    - When reduced motion: render children as plain button with no ripple logic
    - State: `ripples: Array<{ id: number; x: number; y: number }>` — on `pointerdown` compute relative position via `getBoundingClientRect()`, append new ripple, schedule `setTimeout(600)` to remove by `id`
    - Store pending timer IDs in a `Set`; clear all on unmount to prevent memory leaks
    - Ripple `div`: `position: absolute; pointer-events: none`; `rippleExpand` keyframe (from task 1.4) animates from 40px → 160px diameter + opacity 0 over 600ms
    - Container button: `position: relative; overflow: hidden`
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_
  - [ ]* 12.2 Write property sweep test for `RippleButton` (`src/test/animation/ripple.property.test.ts`)
    - **Property 17: RippleButton ripple position matches pointer coordinates**
    - **Property 18: RippleButton no ripple under reduced motion**
    - **Property 19: RippleButton ripple count matches click count**
    - Sweep 100+ click positions within button bounds; verify ripple center = `(clientX - rect.left, clientY - rect.top)`
    - Verify zero ripple elements when `useReducedMotion` is `true`
    - Sweep click sequences from 2 to 10 rapid clicks; verify exactly n ripple elements exist before any 600ms timer fires
    - **Validates: Requirements 14.1, 14.5, 14.7**

- [x] 13. Implement `SectionDivider` component
  - [x] 13.1 Create `src/components/animation/SectionDivider.tsx`
    - Accept `className?: string`, `color?: string` (default `'#E65C19'`)
    - When reduced motion: render SVG path fully drawn (`strokeDashoffset: 0`), no animation
    - SVG with mandala-wave path spanning full viewport width; `motion.path` with `pathLength` motion value
    - `useInView(ref, { once: true, amount: 0.5 })`; `initial={{ pathLength: 0 }}` → `animate={{ pathLength: 1 }}` over 1.2s with `[0.76, 0, 0.24, 1]`
    - Stroke: `color` prop at 35% opacity; `fill: none`
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 14. Checkpoint — Animation components complete
  - Ensure all 12 animation components and 2 hooks compile without TypeScript errors.
  - Run `npx tsc --noEmit` in `matasree-superstore-main/` and confirm zero errors before proceeding.

- [ ] 15. Modify `Navbar.tsx` — scroll condensing
  - [ ] 15.1 Import `useScrolled` and `useReducedMotion` in `src/components/Navbar.tsx`
    - Add `const isScrolled = useScrolled(60)` and `const prefersReducedMotion = useReducedMotion()`
    - Add `transition-all duration-300` Tailwind class to `<header>`, overridden to `duration-0` when `prefersReducedMotion` is true
    - Apply conditional classes on `<header>`: `py-2` → `py-1`, `bg-background/90` → `bg-background/98`, `border-primary/20` → `border-primary/100` when `isScrolled`
    - Apply conditional logo scale: `style={{ transform: isScrolled ? 'scale(0.85)' : 'scale(1)', transition: ... }}` on `<img>`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  - [ ]* 15.2 Write property sweep test for Navbar scroll state (`src/test/animation/navbar.property.test.ts`)
    - **Property 16: Navbar condensed state is consistent with scroll position**
    - Sweep `scrollY` values 0–2000; verify `scrollY > 60` → condensed classes present, `scrollY ≤ 60` → expanded classes present
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

- [ ] 16. Modify `Footer.tsx` — reveal animation
  - [ ] 16.1 Update `src/components/Footer.tsx` to use Framer Motion reveal
    - Import `motion` and `useReducedMotion` from Framer Motion
    - Wrap `<footer>` element as `motion.footer`; when reduced motion, set `initial` = `animate` (no visible change)
    - Trust badge row: `motion.div` with `initial={{ opacity: 0, y: 30 }}`, `whileInView={{ opacity: 1, y: 0 }}`, `viewport={{ once: true }}`, spring transition `{ stiffness: 120, damping: 20, delay: 0 }`
    - Grid columns: each column wrapped in `motion.div` with staggered `delay: index * 0.1 + 0.2`
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 17. Modify `CartDrawer.tsx` — swipe-to-close gesture
  - [ ] 17.1 Update `src/components/CartDrawer.tsx` to support touch swipe
    - Import `useMotionValue` and `usePointerFine` from Framer Motion / hooks
    - Gate gesture on `usePointerFine()` (disable on desktop); when reduced motion is active, set spring-back duration to 0ms
    - On `pointerdown`: record start time and start X; call `element.setPointerCapture(event.pointerId)`
    - On `pointermove`: update `x` motion value constrained to `Math.max(0, delta)` (no leftward drag)
    - On `pointerup`/`pointercancel`: compute displacement and velocity; if `displacement > 80 && velocity > 0.5` call close handler; else spring `x` back to 0; call `releasePointerCapture`
    - Apply `style={{ x }}` to the drawer element
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_
  - [ ]* 17.2 Write property sweep test for CartDrawer swipe (`src/test/animation/swipeGesture.property.test.ts`)
    - **Property 20: CartDrawer closes on sufficient swipe**
    - **Property 21: CartDrawer does not close on insufficient swipe**
    - Sweep `(displacement, velocity)` pairs: d ∈ [0, 200] × v ∈ [0, 2] — 200 combinations
    - Verify close handler called iff `d > 80 && v > 0.5`; verify it is called at most once per gesture
    - **Validates: Requirements 17.1, 17.3**

- [ ] 18. Modify `App.tsx` — mount global animation components and configure Sonner
  - [ ] 18.1 Update `src/App.tsx` to mount global animation layers
    - Import `CustomCursor`, `ParticleSystem`, and `GradientMesh` from `src/components/animation/`
    - Mount `<GradientMesh />` as first child inside the root (renders at z-index -1)
    - Mount `<CustomCursor />` as a sibling after GradientMesh (renders at z-index 9999)
    - Mount `<ParticleSystem />` before `<BrowserRouter>` or inside root (renders at z-index 1)
    - Update `<Sonner>` component with `toastOptions.classNames`: `toast: 'glass-card border-l-4 border-l-[#D63220]'`, `title: 'font-serif font-bold'`; set `expand` and `richColors` props
    - _Requirements: 1.1, 4.1, 10.1, 12.3, 12.4_

- [ ] 19. Checkpoint — Core modifications complete
  - Ensure all 5 modified files compile without TypeScript errors.
  - Run `npx tsc --noEmit` and verify zero errors before proceeding to page integrations.

- [ ] 20. Integrate into `ProductCard.tsx`
  - [ ] 20.1 Wrap `ProductCard` in `TiltCard` and replace CTA buttons with `RippleButton`
    - Import `TiltCard` and `RippleButton` from `src/components/animation/`
    - Wrap the outermost `div` of `ProductCard` with `<TiltCard>` (or convert the root to a TiltCard wrapper)
    - Replace the "Add to Cart" desktop `<Button>` (inside the hover-reveal panel) and mobile `<Button>` with `<RippleButton>` wrapping the existing Button
    - _Requirements: 5.6, 14.6_

- [ ] 21. Integrate into `FeaturedCategoriesSection`
  - [ ] 21.1 Add `StaggerGrid`, `TiltCard`, and `ImageReveal` to `src/components/home/FeaturedCategoriesSection.tsx`
    - Import `StaggerGrid`, `TiltCard`, and `ImageReveal`
    - Wrap the category card grid container in `<StaggerGrid>`
    - Wrap each category card in `<TiltCard>`
    - Wrap each category card image in `<ImageReveal>`
    - _Requirements: 5.6, 6.4, 8.6_

- [ ] 22. Integrate `AnimatedCounter` into `TrustStatsSection`
  - [ ] 22.1 Replace the inline counter in `src/components/home/TrustStatsSection.tsx` with `AnimatedCounter`
    - Import `AnimatedCounter` from `src/components/animation/`
    - Remove or replace the existing inline `Counter` function/component with `<AnimatedCounter to={...} prefix={...} suffix={...} index={i} />`
    - Ensure each stat card passes its zero-based grid index as the `index` prop for stagger delay
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 23. Integrate `StaggerGrid` into remaining grid sections
  - [ ] 23.1 Wrap `ProductScrollGrid` in `StaggerGrid` (`src/components/home/ProductScrollGrid.tsx`)
    - Import `StaggerGrid`; wrap the product grid container element in `<StaggerGrid>`
    - _Requirements: 6.4_
  - [ ] 23.2 Wrap `RecentlyViewedSection` in `StaggerGrid` (`src/components/RecentlyViewedSection.tsx`)
    - Import `StaggerGrid`; wrap the grid container in `<StaggerGrid>`
    - _Requirements: 6.4_
  - [ ] 23.3 Wrap `WhyChooseUsSection` in `StaggerGrid` (`src/components/WhyChooseUsSection.tsx`)
    - Import `StaggerGrid`; wrap the features/cards grid in `<StaggerGrid>`
    - _Requirements: 6.4_

- [ ] 24. Integrate `ImageReveal` and `TextReveal` into hero sections
  - [ ] 24.1 Add `ImageReveal` to `HeroParallax` (`src/components/home/HeroParallax.tsx`)
    - Import `ImageReveal`; wrap hero background image elements in `<ImageReveal>`
    - _Requirements: 8.6_
  - [ ] 24.2 Add `ImageReveal` to `BrandStoryScroll` (`src/components/home/BrandStoryScroll.tsx`)
    - Import `ImageReveal`; wrap imagery/photo elements in `<ImageReveal>`
    - _Requirements: 8.6_
  - [ ] 24.3 Add `TextReveal` to h2 headings in `HeroParallax` or hero section
    - Import `TextReveal`; replace `<h2>` tags with `<TextReveal as="h2">{heading text}</TextReveal>`
    - _Requirements: 3.6_

- [ ] 25. Integrate `GlassmorphismCard` into UI elements
  - [ ] 25.1 Apply `GlassmorphismCard` to hero badge/pill, stat cards, and feature cards
    - Import `GlassmorphismCard`; wrap the hero badge/pill element in `<GlassmorphismCard>`
    - Wrap stat cards in `TrustStatsSection` with `<GlassmorphismCard>` (outer card element)
    - Wrap feature/benefit cards in `FeaturesSection` with `<GlassmorphismCard>`
    - _Requirements: 9.4_

- [ ] 26. Integrate `SectionDivider` and `TextReveal` into `Index.tsx`
  - [ ] 26.1 Insert `SectionDivider` between sections in `src/pages/Index.tsx`
    - Import `SectionDivider`; insert `<SectionDivider />` between: Hero→Categories, Categories→Products, Products→Testimonials, Newsletter→Brand sections
    - _Requirements: 15.4_
  - [ ] 26.2 Apply `TextReveal` to all `<h2>` elements on the homepage
    - Import `TextReveal`; replace all standalone `<h2>` elements in `Index.tsx` and its directly rendered section components with `<TextReveal as="h2">{text}</TextReveal>`
    - Also replace `<h2>` in `BrandStoryScroll` and other homepage sections not covered by task 24.3
    - _Requirements: 3.6_
  - [ ] 26.3 Apply `RippleButton` to hero CTAs and newsletter submit button
    - Import `RippleButton`; wrap the hero section CTA `<Button>` instances and the `NewsletterSection` submit button with `<RippleButton>`
    - _Requirements: 14.6_

- [ ] 27. Checkpoint — Integration complete
  - Ensure all modified pages and sections compile without TypeScript errors.
  - Verify no import errors or missing exports across all animation components.
  - Run `npx tsc --noEmit` in `matasree-superstore-main/` and confirm zero errors.

- [ ] 28. Set up animation test infrastructure
  - [ ] 28.1 Create `src/test/animation/` directory and configure shared test utilities
    - Create `src/test/animation/testUtils.ts` with helpers: a configurable `matchMedia` mock factory, a `useReducedMotion` mock setter, and an `IntersectionObserver` mock that exposes a manual trigger function
    - Confirm `src/test/setup.ts` already registers `window.matchMedia` mock; extend it to support per-test coarse/fine pointer configuration
    - _Requirements: 18.1, 18.6_

- [ ] 29. Write remaining unit tests
  - [ ]* 29.1 Write unit tests for `CustomCursor` (already covered in task 2.2 — ensure file is in `src/test/animation/`)
  - [ ]* 29.2 Write unit tests for `MagneticButton` (`src/test/animation/MagneticButton.test.tsx`)
    - Test returns children unmodified when `useReducedMotion` is `true`
    - Test returns children unmodified when pointer is coarse
    - _Requirements: 2.5, 2.6_
  - [ ]* 29.3 Write unit tests for `TiltCard` (`src/test/animation/TiltCard.test.tsx`)
    - Test zero rotation when `useReducedMotion` is `true`
    - Test zero rotation when pointer is coarse
    - _Requirements: 5.4, 5.5_
  - [ ]* 29.4 Write unit tests for `StaggerGrid` (`src/test/animation/StaggerGrid.test.tsx`)
    - Test children rendered immediately visible when `useReducedMotion` is `true`
    - _Requirements: 6.5_
  - [ ]* 29.5 Write unit tests for `AnimatedCounter` (`src/test/animation/AnimatedCounter.test.tsx`)
    - Test final value displayed immediately when `useReducedMotion` is `true`
    - Test numbers ≥ 1000 include comma separators
    - Test prefix and suffix appear in rendered output
    - _Requirements: 7.2, 7.3, 7.5_
  - [ ]* 29.6 Write unit tests for `RippleButton` (`src/test/animation/RippleButton.test.tsx`)
    - Test no ripples spawned when `useReducedMotion` is `true`
    - Test ripple element removed from DOM after 600ms using fake timers
    - Test multiple rapid clicks produce N independent ripple elements
    - _Requirements: 14.5, 14.7_
  - [ ]* 29.7 Write unit tests for `CartDrawer` swipe (`src/test/animation/CartDrawer.swipe.test.tsx`)
    - Test close handler NOT called for displacement ≤ 80 or velocity ≤ 0.5
    - Test close handler called for displacement > 80 AND velocity > 0.5
    - _Requirements: 17.1, 17.3_

- [ ] 30. Final checkpoint — All tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Run `npx vitest --run` in `matasree-superstore-main/` and confirm all tests green.
  - Verify no TypeScript errors with `npx tsc --noEmit`.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property sweep tests cover 100+ input combinations per property, satisfying the universal-quantification standard without adding `fast-check` as a dependency (uses hand-written generators per the design's Testing Strategy)
- Checkpoints at tasks 14, 19, 27, and 30 catch errors early before each new layer depends on the previous
- The `animation/` component directory must be created before any component files are written (the first `fs_write` to a file in that path will create the directory)
- All animation components are zero-prop-dependency on each other — they can be implemented in parallel (tasks 2–13)
- Integration tasks (20–26) must all complete before the final checkpoint (task 27)
```


## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1"],
      "description": "Foundation: hooks and CSS keyframes — no deps"
    },
    {
      "wave": 2,
      "tasks": ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"],
      "description": "Animation components — all depend on wave 1, independent of each other"
    },
    {
      "wave": 3,
      "tasks": ["14"],
      "description": "Checkpoint: all components compile"
    },
    {
      "wave": 4,
      "tasks": ["15", "16", "17", "18"],
      "description": "Existing component modifications — depend on wave 2"
    },
    {
      "wave": 5,
      "tasks": ["19"],
      "description": "Checkpoint: all modifications compile"
    },
    {
      "wave": 6,
      "tasks": ["20", "21", "22", "23", "24", "25", "26"],
      "description": "Page and section integrations — depend on wave 4"
    },
    {
      "wave": 7,
      "tasks": ["27"],
      "description": "Checkpoint: all integrations compile"
    },
    {
      "wave": 8,
      "tasks": ["28", "29"],
      "description": "Test infrastructure and unit/property tests"
    },
    {
      "wave": 9,
      "tasks": ["30"],
      "description": "Final checkpoint: all tests pass"
    }
  ]
}
```

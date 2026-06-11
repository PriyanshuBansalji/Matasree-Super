# Requirements Document

## Introduction

The Matasree Store is a premium Indian spices e-commerce website built on React 18 + TypeScript + Vite, already using Framer Motion v12, Tailwind CSS with a custom Indian-spice colour palette (saffron, chili, turmeric), Lenis smooth scroll, and several existing animations. This feature dramatically elevates the visual experience across all pages — making the site feel like a premium, award-level product — by introducing 17 new or substantially enhanced animation and motion systems. Every enhancement must be pure CSS or Framer Motion (no new npm packages), must respect `prefers-reduced-motion`, must use only transform/opacity GPU-accelerated properties, and must degrade gracefully on touch/mobile devices.

---

## Glossary

- **AnimationSystem**: The collective set of motion components, hooks, and CSS keyframes introduced by this feature.
- **CustomCursor**: The globally mounted, pointer-following glowing orb component that replaces the default browser cursor on non-touch devices.
- **MagneticButton**: A wrapper component that subtly shifts its children toward the mouse cursor within a defined radius.
- **TextReveal**: A Framer Motion component that reveals heading words one-by-one using clip-path masks rather than plain opacity fades.
- **ParticleSystem**: The site-wide ambient floating particle layer that reacts to scroll position and mouse movement.
- **TiltCard**: A Framer Motion wrapper that applies a perspective 3D tilt on hover.
- **StaggerGrid**: A Framer Motion parent variant that fans child cards in with spring physics and stagger.
- **AnimatedCounter**: The standardised, easing-enhanced numeric counter reusable component.
- **ImageReveal**: A Framer Motion wrapper that wipes images in from left-to-right via clip-path on scroll entry.
- **GlassmorphismCard**: A CSS component class providing a frosted-glass background, border, and blur accent.
- **GradientMesh**: An animated SVG or CSS mesh background that slowly shifts its colour gradients.
- **Navbar**: The existing sticky top navigation component (`src/components/Navbar.tsx`).
- **ToastSystem**: The Sonner-powered toast notification layer already wired in `App.tsx`.
- **SkeletonShimmer**: The loading skeleton shimmer effect used in category and product loading states.
- **RippleButton**: A button wrapper that spawns a radially-expanding ripple on click/tap.
- **SectionDivider**: An animated SVG ornamental divider placed between page sections.
- **Footer**: The existing footer component (`src/components/Footer.tsx`).
- **ReducedMotion**: The `prefers-reduced-motion: reduce` CSS media query and matching `useReducedMotion` Framer Motion hook.

---

## Requirements

### Requirement 1: Custom Animated Cursor

**User Story:** As a desktop user, I want the mouse cursor replaced with a glowing saffron orb that morphs and reacts to interactive elements, so that the site immediately feels premium and distinct.

#### Acceptance Criteria

1. THE CustomCursor SHALL be rendered as a globally mounted component above all page content on non-touch devices.
2. WHEN the user moves the mouse, THE CustomCursor SHALL follow the pointer within a maximum lag of 80 ms at any point in its trajectory, visibly trailing behind the real cursor position.
3. THE CustomCursor resting state SHALL have a diameter of 24 px with a saffron-gold glow (visible luminous halo around the orb).
4. WHEN the cursor hovers over any interactive element (`a`, `button`, `[role="button"]`), THE CustomCursor SHALL scale up to 48 px diameter and the orb SHALL visually invert against its background (light orb on dark background, dark orb on light background).
5. WHEN the cursor leaves an interactive element, THE CustomCursor SHALL return to its 24 px resting state within 300 ms with a deceleration curve.
6. WHERE the device primary input reports touch (`pointer: coarse` media feature), THE CustomCursor SHALL not render and the default cursor SHALL remain visible.
7. IF ReducedMotion is active, THEN THE CustomCursor SHALL render as a static 8 px dot with the brand saffron colour and no animation, scale, or glow.
8. THE CustomCursor SHALL suppress the native cursor (`cursor: none`) on the `<body>` element only on devices where `pointer: fine` is the primary input.

---

### Requirement 2: Magnetic Button Effect

**User Story:** As a desktop user, I want primary call-to-action buttons to subtly attract my cursor, so that interaction feels tactile and premium.

#### Acceptance Criteria

1. WHEN the pointer enters within 80 px of the nearest edge of a MagneticButton's bounding box, THE MagneticButton SHALL translate toward the cursor position by up to 12 px on each axis.
2. WHEN the pointer exits beyond 80 px of the button's bounding box edge, THE MagneticButton SHALL return to its original position within 300 ms with a deceleration curve (spring stiffness 200, damping 20).
3. WHEN the pointer re-enters the 80 px radius before the spring-back animation completes, THE MagneticButton SHALL immediately switch to tracking the new cursor position from its current intermediate position.
4. THE MagneticButton SHALL use only `transform: translate()` for positional shifts so that no layout reflow is triggered.
5. WHERE `prefers-reduced-motion: reduce` is active in the operating system or browser, THE MagneticButton SHALL apply zero positional shift regardless of pointer position.
6. WHERE the device's primary pointer is coarse (e.g. touchscreen), THE MagneticButton SHALL apply zero positional shift.
7. THE MagneticButton SHALL be implemented as a reusable React wrapper component accepting `children` and an optional `strength` prop in the range 0.1–1.0 (default 0.4), where higher values produce larger maximum shifts.

---

### Requirement 3: Scroll-Triggered Word-by-Word Text Reveal

**User Story:** As a visitor reading section headlines, I want words to reveal themselves one at a time with a clip-path wipe rather than a plain fade, so that reading headings feels dynamic and intentional.

#### Acceptance Criteria

1. THE TextReveal SHALL split the provided `children` string into individual word spans at render time.
2. WHEN the TextReveal container enters the viewport (threshold ≥ 20 %), each word SHALL start in a fully clipped state (`inset(0 100% 0 0)`) and animate to fully visible (`inset(0 0% 0 0)`).
3. THE TextReveal SHALL stagger each word's animation start by 60 ms relative to the previous word, with the first word starting at 0 ms.
4. THE TextReveal SHALL accept a `duration` prop in the range 0.1 s–5.0 s (default 0.6 s) controlling the per-word animation duration.
5. IF `prefers-reduced-motion: reduce` is active, THEN all words SHALL render with `clipPath: inset(0 0% 0 0)` immediately on mount with no transition and no stagger.
6. THE TextReveal SHALL be applied to all `<h2>` elements on the homepage.
7. WHEN the TextReveal has animated all words to fully visible, the animation SHALL NOT replay if the container leaves and re-enters the viewport (one-shot, per page load).

---

### Requirement 4: Site-Wide Ambient Particle System

**User Story:** As a visitor browsing the site, I want to see subtle floating spice-dust particles across all sections that react to scroll and mouse, so that the site has depth and life beyond the hero.

#### Acceptance Criteria

1. THE ParticleSystem SHALL render 25–40 particles site-wide using a fixed-position overlay with `pointer-events: none`, each particle having a diameter of 2–6 px.
2. WHEN the page scrolls, THE ParticleSystem SHALL shift particles vertically proportional to scroll speed (parallax coefficient 0.08–0.15) giving a depth illusion.
3. WHEN the user moves the mouse on a non-touch device and a particle is within 120 px of the cursor, THE ParticleSystem SHALL displace that particle by at most 40 px from its natural drift position; WHEN the cursor moves away, the particle SHALL resume its drift pattern within 600 ms.
4. THE ParticleSystem particles SHALL use colours drawn from the brand palette (`#E65C19`, `#D63220`, `#8B4513`, `#F5A623`) at opacity 0.08–0.25.
5. THE ParticleSystem SHALL maintain a frame rate of at least 50 fps on mid-range devices during combined scroll and mouse-move interactions.
6. IF `prefers-reduced-motion: reduce` is active, THEN THE ParticleSystem SHALL freeze all particles at the positions assigned at page load, with no further movement.
7. WHERE the device's primary pointer is coarse, THE ParticleSystem SHALL disable the mouse-repulsion behaviour described in criterion 3.

---

### Requirement 5: Product Card 3D Perspective Tilt

**User Story:** As a shopper browsing product cards, I want cards to tilt in 3D toward my cursor on hover, so that the product feels physical and premium.

#### Acceptance Criteria

1. WHEN the user hovers over a TiltCard, THE TiltCard SHALL rotate on both X and Y axes in proportion to cursor position within the card, ranging from −12° to +12° on each axis, and SHALL update the rotation on every pointer-move event.
2. THE TiltCard SHALL display a glare overlay whose opacity is 0–40% and whose highlight position tracks the cursor position across the card's full area.
3. WHEN the pointer leaves a TiltCard, THE TiltCard SHALL return to 0° rotation and 0% glare opacity within 400 ms with a non-linear deceleration curve.
4. WHERE `prefers-reduced-motion: reduce` is active, THE TiltCard SHALL apply neither rotation nor the glare overlay.
5. WHERE the device's primary pointer is coarse, THE TiltCard SHALL apply neither rotation nor the glare overlay.
6. THE TiltCard SHALL be applied to `ProductCard`, `FeaturedCategoriesSection` category cards, and all card grids on the homepage.

---

### Requirement 6: Staggered Grid Fan-In Animations

**User Story:** As a visitor who scrolls to a product or category grid, I want cards to fan in from below with spring physics rather than appearing at once, so that the grid feels alive.

#### Acceptance Criteria

1. WHEN a StaggerGrid container enters the viewport with at least 15% of its height visible, the container SHALL trigger stagger animation on all its direct child cards simultaneously, and this trigger SHALL fire at most once per page load.
2. WHEN the StaggerGrid animation triggers, each child card SHALL transition from `{ opacity: 0, y: 40, scale: 0.95 }` to `{ opacity: 1, y: 0, scale: 1 }`.
3. THE StaggerGrid SHALL stagger each child card's animation start by 0.07 s relative to the previous card, using spring physics with stiffness 260 and damping 20.
4. THE StaggerGrid SHALL be applied to: the product grid in `ProductScrollGrid`, the category grid in `FeaturedCategoriesSection`, product cards in `RecentlyViewedSection`, and feature cards in `WhyChooseUsSection`.
5. IF `prefers-reduced-motion: reduce` is active, THEN all child cards SHALL render at `{ opacity: 1, y: 0, scale: 1 }` immediately on mount with no stagger delay and no transition.

---

### Requirement 7: Enhanced Animated Counter

**User Story:** As a visitor reaching the TrustStats section, I want count-up numbers to feel weighty and premium with a custom easing curve, so that the social proof reads as impactful.

#### Acceptance Criteria

1. THE AnimatedCounter SHALL count from 0 to a target value over 1.2 s using an expo-out easing curve (`[0.16, 1, 0.3, 1]`).
2. THE AnimatedCounter SHALL format numbers ≥ 1000 with locale-aware comma separators (e.g. `5,000`).
3. THE AnimatedCounter SHALL accept a `prefix` and `suffix` prop to support formats like `₹5,000+` or `100%`.
4. WHEN the AnimatedCounter enters the viewport (threshold ≥ 20%), THE AnimatedCounter SHALL begin counting with a delay of `min(index × 0.15 s, 0.6 s)` where `index` is its zero-based position in the grid; each counter's animation SHALL fire at most once per component mount.
5. IF `prefers-reduced-motion: reduce` is active, THEN THE AnimatedCounter SHALL display the final formatted value immediately on mount with no counting animation.
6. THE AnimatedCounter SHALL replace the existing counter in `TrustStatsSection` and become the standard counter component.

---

### Requirement 8: Image Reveal on Scroll (Cover Wipe)

**User Story:** As a visitor scrolling through content, I want images to wipe in from the side using a cover panel rather than simply fading, so that reveals feel editorial and premium.

#### Acceptance Criteria

1. THE ImageReveal SHALL wrap any image in a container with `overflow: hidden`.
2. WHEN the ImageReveal enters the viewport (threshold ≥ 20%), THE ImageReveal SHALL animate a covering panel from fully covering the image to fully retracted (left anchor) over 0.8 s; this animation SHALL trigger at most once per page load regardless of subsequent scroll changes.
3. THE ImageReveal cover panel SHALL use the brand horizontal left-to-right saffron-to-chili gradient.
4. WHEN the cover panel animation begins, THE ImageReveal SHALL simultaneously animate the underlying image from 115% scale to 100% scale over 0.8 s with the same cubic-bezier easing (`[0.76, 0, 0.24, 1]`).
5. IF `prefers-reduced-motion: reduce` is active, THEN the cover panel SHALL be absent from the rendered output and the image SHALL render at `scale(1)` immediately.
6. THE ImageReveal SHALL be applied to category card images in `FeaturedCategoriesSection`, hero image backgrounds, and `BrandStoryScroll` imagery.

---

### Requirement 9: Glassmorphism UI Accents

**User Story:** As a visitor, I want select cards and overlay panels to use a frosted-glass aesthetic that layers beautifully over the gradient mesh background, so that the site feels modern and premium.

#### Acceptance Criteria

1. THE GlassmorphismCard class SHALL provide a semi-transparent white background (≤ 15% opacity), a blur of at least 20 px applied to content behind it, a semi-transparent white border (≤ 20% opacity), and a diffused shadow beneath it.
2. WHEN a GlassmorphismCard is rendered, THE GlassmorphismCard SHALL additionally apply a subtle inner top highlight (`inset 0 1px 0 rgba(255,255,255,0.3)`) ensuring visual depth on any background.
3. WHERE the browser does not support `backdrop-filter`, THE GlassmorphismCard SHALL use a high-opacity white background (≥ 85%) as a fallback, ensuring text remains legible.
4. THE GlassmorphismCard SHALL be applied to: the hero badge/pill, stat cards in `TrustStatsSection`, feature cards in `FeaturesSection`, and toast notification wrappers.
5. THE GlassmorphismCard SHALL be defined as both a reusable CSS component class in `index.css` and as a React wrapper component.

---

### Requirement 10: Animated Gradient Mesh Background

**User Story:** As a visitor, I want the page background to subtly shift through warm gradient blobs that feel alive, so that even static sections feel premium and textured.

#### Acceptance Criteria

1. THE GradientMesh SHALL render as a fixed-position full-viewport layer with `z-index: -1` and `pointer-events: none`.
2. THE GradientMesh SHALL contain 3–5 large radial gradient blobs using brand colours at opacity 0.04–0.07.
3. WHEN rendered, THE GradientMesh blobs SHALL animate between positions using a CSS `@keyframes` animation with duration 18–30 s, `ease-in-out`, and `infinite alternate`.
4. THE GradientMesh SHALL use `will-change: transform` on each blob for GPU compositing.
5. IF ReducedMotion is active, THEN THE GradientMesh SHALL render the blobs statically at their initial positions with no animation.

---

### Requirement 11: Enhanced Navbar Scroll Behaviour

**User Story:** As a visitor who scrolls down the page, I want the navbar to visibly condense and deepen its background, so that it feels reactive and premium at all scroll positions.

#### Acceptance Criteria

1. WHEN the page has scrolled more than 60 px from the top, THE Navbar SHALL reduce its nav container vertical padding to approximately half its resting height, completing the transition within 300 ms.
2. WHEN the page has scrolled more than 60 px, THE Navbar SHALL increase its background opacity from 90% to 98% and increase its bottom border opacity from 20% to 100%, completing both changes within 300 ms using a linear easing.
3. WHEN the page has scrolled more than 60 px, THE Navbar logo image SHALL scale from 1.0× to 0.85× using a linear easing within 300 ms.
4. WHEN the user scrolls back to scrollY < 60 px, THE Navbar padding, background opacity, border opacity, and logo scale SHALL all revert to their resting values, completing the transition within 300 ms.
5. THE Navbar SHALL continuously monitor the scroll position while the page is mounted and update condensed/expanded state on every relevant scroll event.
6. WHERE `prefers-reduced-motion: reduce` is active in the OS or browser, THE Navbar SHALL apply the condensed visual state instantly (0 ms transition duration) when scrollY exceeds 60 px, with no animation.

---

### Requirement 12: Toast / Notification Micro-Animations

**User Story:** As a shopper adding items to cart, I want toast notifications to bounce in and slide out smoothly with the brand's warm aesthetic, so that feedback feels polished and delightful.

#### Acceptance Criteria

1. THE ToastSystem entrance animation SHALL use a `translateY` + `scale` spring (enter from `y: 48, scale: 0.85` to `y: 0, scale: 1`) with spring parameters `stiffness: 400, damping: 28`.
2. THE ToastSystem exit animation SHALL slide out to the right (`translateX: 110%`) over 280 ms with `ease-in`.
3. THE ToastSystem toast background SHALL use the `GlassmorphismCard` styling with a saffron accent left border (4 px, `#D63220`).
4. THE ToastSystem SHALL configure the Sonner `<Toaster>` component in `App.tsx` with a custom `toastOptions` using the brand-coloured success/error icons.
5. IF ReducedMotion is active, THEN THE ToastSystem SHALL use a simple opacity fade (0 → 1) with no translate or scale animation.

---

### Requirement 13: On-Brand Loading Skeleton Shimmer

**User Story:** As a visitor waiting for products or categories to load, I want the skeleton placeholders to shimmer in gold/saffron rather than grey, so that even the loading state feels on-brand.

#### Acceptance Criteria

1. THE SkeletonShimmer SHALL replace the default grey shimmer (`#e5e7eb`) with a saffron-gold gradient: `linear-gradient(90deg, #f5f0e8 0%, #f5e0b3 40%, #f5a623 60%, #f5e0b3 80%, #f5f0e8 100%)`.
2. THE SkeletonShimmer CSS keyframe animation SHALL traverse the gradient background-position across 200 % width over 2 s linear infinite.
3. THE SkeletonShimmer SHALL be applied globally via an override of the `.animate-pulse` / Skeleton component class in `index.css`.
4. IF ReducedMotion is active, THEN THE SkeletonShimmer SHALL render as a static brand-tinted block with no shimmer animation.

---

### Requirement 14: Hover Ripple Effect on Buttons

**User Story:** As a user clicking any primary or secondary button, I want a radial ripple to emanate from the click point, so that interaction feels physical and satisfying.

#### Acceptance Criteria

1. WHEN a RippleButton receives a `pointerdown` event, THE RippleButton SHALL compute the exact click position relative to the button's bounding box and spawn a ripple element centered at that position.
2. WHEN a ripple element is spawned, it SHALL expand from an initial diameter of 40 px at `opacity: 0.35` to a diameter of 160 px at `opacity: 0` over 600 ms.
3. THE ripple SHALL be clipped within the button's own boundary and SHALL use the brand saffron colour at 35% opacity.
4. WHEN a ripple element's 600 ms animation completes, THE RippleButton SHALL remove that element from the DOM.
5. IF `prefers-reduced-motion: reduce` is active, THEN THE RippleButton SHALL not spawn any ripple element on pointer events.
6. THE RippleButton SHALL be implemented as a React wrapper component and applied to `<Button>` instances in `ProductCard`, the hero section CTAs, and the newsletter form submit button.
7. WHEN the user fires multiple rapid pointer events before earlier ripples complete, each SHALL animate independently and be removed individually upon its own completion.

---

### Requirement 15: Animated Section Dividers

**User Story:** As a visitor scrolling between content sections, I want ornamental dividers to draw in (SVG path animation) as they enter the viewport, so that sections feel intentionally separated and premium.

#### Acceptance Criteria

1. THE SectionDivider SHALL render an SVG path that traces a mandala-inspired or wave line across the full viewport width.
2. WHEN the SectionDivider enters the viewport, THE SectionDivider SHALL animate its SVG `stroke-dashoffset` from `pathLength` to `0` over 1.2 s using `ease: [0.76, 0, 0.24, 1]`.
3. THE SectionDivider SHALL use the brand saffron colour (`#D63220`/`#E65C19`) at 30–40 % opacity.
4. THE SectionDivider SHALL be placed between: Hero→Categories, Categories→Products, Products→Testimonials, and Newsletter→Brand sections.
5. IF ReducedMotion is active, THEN THE SectionDivider SHALL render the SVG path fully drawn without animation.

---

### Requirement 16: Footer Reveal Animation

**User Story:** As a visitor reaching the bottom of the page, I want the footer to reveal elegantly as it enters the viewport, so that the page ending feels intentional rather than abrupt.

#### Acceptance Criteria

1. WHEN the Footer enters the viewport, THE Footer SHALL animate from `{ opacity: 0, y: 60 }` to `{ opacity: 1, y: 0 }` using a spring transition (`stiffness: 120, damping: 20`).
2. THE Footer inner grid columns SHALL stagger their own entry with a 0.1 s per-column delay.
3. THE Footer trust badge row SHALL animate in 0.2 s before the main grid columns.
4. THE Footer reveal SHALL trigger only once (`viewport: { once: true }`).
5. IF ReducedMotion is active, THEN THE Footer SHALL render fully visible without any entry animation.

---

### Requirement 17: Mobile Touch Gesture Support

**User Story:** As a mobile shopper, I want to swipe the cart drawer closed and experience pull-to-refresh-style feedback, so that the mobile UI matches native app quality.

#### Acceptance Criteria

1. WHEN the user performs a rightward swipe gesture on the CartDrawer with a horizontal displacement exceeding 80 px and a release velocity exceeding 0.5 px/ms, THE CartDrawer SHALL close.
2. WHEN the user is in the process of swiping rightward on the CartDrawer, THE CartDrawer SHALL visually follow the drag position in real time with no dead zone.
3. WHEN the user releases the swipe without meeting the 80 px displacement and 0.5 px/ms velocity thresholds, THE CartDrawer SHALL spring back to its fully open position within 300 ms.
4. THE CartDrawer SHALL constrain drag movement so that leftward drag beyond the open position is not permitted (left boundary is locked).
5. WHERE the device primary input is fine (e.g. desktop mouse), THE CartDrawer drag gesture SHALL be disabled.
6. IF `prefers-reduced-motion: reduce` is active, THEN THE CartDrawer drag gesture SHALL remain functional, but the spring-back animation when a swipe does not meet the threshold SHALL complete in 0 ms (instant snap).

---

### Requirement 18: Accessibility and Performance Baseline

**User Story:** As any user (including those with motion sensitivity or using assistive technology), I want the new animations to never impair usability, accessibility, or page performance.

#### Acceptance Criteria

1. THE AnimationSystem SHALL check `window.matchMedia('(prefers-reduced-motion: reduce)')` via the Framer Motion `useReducedMotion` hook and disable or simplify all animations when it returns `true`.
2. THE AnimationSystem SHALL use only `transform` and `opacity` CSS properties for all animations, never `width`, `height`, `top`, `left`, `margin`, or `padding`, to prevent layout reflow.
3. THE AnimationSystem SHALL not increase the Cumulative Layout Shift (CLS) score above 0.1.
4. WHEN animations are running, THE AnimationSystem SHALL apply `will-change: transform` only to actively animating elements and SHALL remove it after animation completion.
5. THE AnimationSystem SHALL maintain a minimum 60 fps frame rate on mid-range mobile devices for all animations (verified by ensuring no main-thread blocking operations within animation callbacks).
6. THE CustomCursor, ParticleSystem, and TiltCard SHALL be conditionally rendered only on pointer-fine devices using a media-query check, preventing unnecessary DOM nodes on mobile.
7. THE AnimationSystem SHALL not introduce any new npm package dependencies beyond those already present in `package.json`.

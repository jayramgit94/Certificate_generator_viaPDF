# Design System Strategy: Obsidian Glow

## 1. Overview & Creative North Star
The Creative North Star for this system is **"The Nocturnal Architect."** 

This system rejects the flat, sterile nature of standard B2B interfaces in favor of a deep, cinematic experience. It is designed to feel like a high-end physical space—a private gallery at midnight where only the most essential information is illuminated. We move beyond "template" looks by utilizing extreme typographic contrast, intentional asymmetry inspired by luxury editorial spreads, and a depth model based on light refraction rather than artificial shadows.

### Breaking the Template
*   **Intentional Asymmetry:** Avoid centering every element. Use the "Dapper" influence to push content to the edges, creating a sophisticated tension between the content and the large-scale whitespace.
*   **Overlapping Elements:** Break the grid by allowing large-scale imagery or "Aether Fox" style textured containers to bleed into neighboring sections, suggesting a fluid, interconnected digital tapestry.
*   **The Editorial Scale:** We use display typography at sizes that feel uncomfortably large for traditional UI, forcing the user to engage with the brand's voice before the data.

---

## 2. Colors: Depth Through Illumination
The palette is rooted in an obsidian base, using light tokens not just for color, but for "atmosphere."

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off the UI. 
*   **Boundaries** must be achieved via background shifts. For example, a `surface-container-low` section should sit directly against a `surface` background to define its edge.
*   **Vertical Space** (using the `16` or `20` spacing tokens) should be the primary method for separating conceptual blocks.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, semi-translucent materials.
*   **Base Layer:** `surface` (#131315).
*   **The Nested Lift:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft "dip" or "lift" in the interface that feels organic, not engineered.

### Signature Textures & Gradients
*   **The Glow:** Use `primary` (#d0bcff) to `primary-container` (#a078ff) linear gradients for primary CTAs.
*   **Noise Layer:** Apply a 3% opacity grain/noise texture across all `surface` elements to mimic the feel of premium textured paper found in the "Aether Fox" inspiration.

---

## 3. Typography: The High-Contrast Dialogue
This system uses a sharp tension between a utilitarian Sans-Serif and a romantic Display Serif.

*   **Display (Newsreader):** This is our "Editorial Voice." Used for hero headers and high-impact pull quotes. It should feel elegant and slightly traditional, providing a "Trustworthy" counterpoint to the modern UI.
*   **UI/Body (Manrope):** Our "Instrumental Voice." This is the sharp, modern engine. It handles all functional data, labels, and navigation.

**Hierarchy as Identity:** 
Large `display-lg` headings should be paired with significantly smaller `body-md` text to create a sense of professional authority and sophisticated restraint.

---

## 4. Elevation & Depth: Tonal Layering
We do not use structural lines. We use **Tonal Layering.**

### The Layering Principle
Hierarchy is achieved by "stacking" surface tiers. A dashboard widget should be `surface-container-high`, while its parent container is `surface-container-low`. This creates depth through luminance rather than lines.

### Ambient Shadows
Shadows are rarely used. When required for "floating" elements:
*   **Color:** Use a tinted version of `on-surface` (#e5e1e4) at 5% opacity.
*   **Blur:** Minimum 40px to 60px. It should feel like an ambient glow, not a hard drop shadow.

### The "Ghost Border" & Glassmorphism
*   **Ghost Borders:** If a border is required for accessibility, use `outline-variant` at 10% opacity. 100% opaque borders are strictly forbidden.
*   **Refractive Glass:** Use `surface-container` colors at 60% opacity with a `backdrop-filter: blur(20px)`. This allows the background's "glow" orbs to bleed through, making the UI feel like it exists in a 3D space.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary-container`), `round-full`, with a subtle `white/10` top-inner-shadow to create a 3D "bead" effect.
*   **Secondary:** Glassmorphic. Background `surface-container-high` at 40% opacity, `backdrop-blur-md`, and a `0.5px` Ghost Border.

### Inputs & Fields
*   **Form Style:** Forgo the box. Use a simple bottom-weighted surface shift. 
*   **States:** On focus, the bottom border glows with `secondary` (#4edea3) while a subtle violet `primary` orb appears behind the input field as a blurred background element.

### Glass Cards
*   **Structure:** No dividers. Separate headers from content using `3.5rem` (token `10`) of vertical padding.
*   **Edge:** Use a `border-white/10` ultra-thin stroke to catch the light on the top and left edges only.

### Verification Chips (The "Trust" Element)
*   Inspired by the "subtle green accents" of Dapper. Use `secondary` (#4edea3) for small, high-density status indicators. These should feel like small gemstones—bright, saturated, and minimal.

---

## 6. Do's and Don'ts

### Do:
*   **Use Large Imagery:** Overlap images with `display-lg` typography to create an editorial feel.
*   **Embrace the Glow:** Use blurred background orbs (Violet/Green) to guide the eye toward primary conversion points.
*   **Respect the Negative Space:** If a section feels "empty," leave it. Large gaps convey a "premium" brand positioning.

### Don't:
*   **Don't Use 1px Dividers:** Never use lines to separate list items. Use spacing or alternating `surface-container` tiers.
*   **Don't Use Pure Black:** Avoid `#000000`. Use the Obsidian base (`#131315`) to maintain the "soft" dark-mode aesthetic.
*   **Don't Cramp Typography:** Avoid tight line-heights. Our editorial style requires "breathing room" to feel high-end.
*   **Don't Use Sharp Corners:** Every container must follow the `md` (0.375rem) or `lg` (0.5rem) roundedness scale to maintain the "Organic" feel.
# Meeseeks Box: Cockpit Variant Design System

**Aesthetic: "Semantic Terminal" / "Document OS"**

This document establishes the design strictures for the `codex/mb-option-2-cockpit` shell variant. The goal is to move from a heavy, widget-bound "dashboard" into a lightweight, typography-driven "operator document".

## The Core Philosophy

Building is not the performance of building. It is not tech for tech's sake. The dashboard should not feel like a toy. It must feel like a dense, high-end IDE merged with a notion-like canvas.

1.  **Semantic Over Structural:** We use typography to imply hierarchy rather than drawing physical boxes, cards, or borders around content.
2.  **Densification:** Power users need density. Information is tightly packed using monospace fonts rather than spaced out with excessive padding.
3.  **Fast & Naked Empty States:** The UI should be almost barrens when empty. No illustrations. No clever onboarding text. Just an active, glowing cursor ready for intent.

## 1. Visual Variables

### Color System (True Dark Void)
-   **Base Canvas:** `#0A0A0A` — A true, deep void. Eliminates the washed-out "web app" feel.
-   **Surfaces:** `#141414` with a `1px` white inner highlight (`rgba(255,255,255,0.05)`).
-   **Action Accent:** Pure White (`#FFFFFF`) or Electric Amber (`#F5A623`) for statuses that demand attention.
-   **Primary Text:** `#EDEDED` (crisp, preventing stark-white bleed).
-   **Metadata Text:** `#888888` (allows us to cram data in without overwhelming the hierarchy).

### Typography
-   **Headers / Hero Data (`<h1>`, `<h2>`):** Sans-Serif (`Inter`, `Geist`, `system-ui`). Tightly tracked. 
-   **Data / Chips / Prompts:** Strict Monospace (`JetBrains Mono`, `Geist Mono`). Monospace is used for anything that is system-generated metadata (card counts, review states, repos).

## 2. Component Rules

### Containers & Layout
-   Do **not** wrap sections in `border: 1px solid var(--separator)` by default. 
-   The main page is a single, constrained-width flex column (e.g., `max-width: 800px`).
-   Sidebars are overlays/slideovers, not persistent constraints on the main grid.

### Inputs & Actions
-   **Document-Native Inputs:** Inputs should look like normal text. Strip border, background, and focus outlines. The `InlineIntentInput` is the gold standard for this mechanic.
-   **Ghost Buttons:** Action buttons are heavily text-driven ("Ghost" style default). They reveal their bounds with a subtle `rgba(255,255,255,0.05)` fill only on `:hover`.

### Status Chips
-   Replace chunky rounded tags with **Brutalist Monospace Chips**. 
-   Example format: `[ 3 CARDS ]` `[ 1 IN REVIEW ]`.
-   Spacing between chips is reduced to `4px` minimum. 

## 3. Interaction & Motion
-   **Instantaneous:** No bouncy springs or elastic easing. 
-   **Stark Transitions:** Standardize on `100ms ease-out` opacity fades. The tool should feel razor sharp.
-   **Keyboard First:** If a user types into space, the system should catch it. Primary actions (like drafting a spec) must trigger fully on <kbd>Enter</kbd> without dropping into multi-tab sidebars. See: `autoSubmit` architecture.

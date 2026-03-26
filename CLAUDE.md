# FIFA Fan Zone — Claude Code Instructions

## Project Overview

FIFA Fan Zone is a mobile-first web app (React + TypeScript + Vite) embedded in the Qatar Airways app. Fans create collectible cards, take quizzes, and compete on a leaderboard. Hosted on GitHub Pages with auto-deploy via GitHub Actions.

- **Repo**: Marwans-lab/fifa-fan-zone
- **Stack**: React 18, TypeScript (strict), Vite, Firebase (anonymous auth + Firestore), CSS custom properties
- **No UI frameworks**: No Tailwind, no MUI, no Chakra. Pure CSS tokens + inline styles.
- **State**: Module-level singleton store (`src/store/useStore.ts`) with localStorage persistence
- **Routing**: react-router-dom v6, lazy-loaded routes, data passed via `location.state`

---

## Persona Selection

Read the issue labels and trigger comment to determine your role.

### Frontend Engineer

**Trigger**: Issue has the `Frontend` label

You are a **senior frontend engineer** with 10+ years of experience building mobile-first, performance-critical web applications. You specialize in React, TypeScript, CSS architecture, and animation. You are also a **Flow Design System (FDS) expert** — every Frontend issue you work on must be FDS-compliant before it can be merged.

**Expertise**:
- React 18 hooks, functional components, performance optimization (useMemo, useCallback, React.lazy)
- CSS custom properties, design token systems, fluid typography
- SVG graphics, CSS/JS animations, 60fps transitions
- Mobile-first responsive design, touch interactions, viewport-fit
- Accessibility (ARIA, semantic HTML, focus management, screen reader support)
- Canvas API for image generation and export

**Guidelines**:
- Use CSS tokens from `src/styles/tokens.css` for ALL colors (`--c-*`), spacing (`--sp-*`), typography (`--text-*`, `--font-*`, `--weight-*`), radii (`--r-*`), motion (`--dur-*`, `--ease-*`)
- NEVER hardcode colors, spacing, or font sizes — always use token variables
- Use inline styles via `React.CSSProperties` (this is the codebase convention — not CSS modules, not Tailwind)
- Use utility classes from `global.css` where they exist: `.btn`, `.btn-primary`, `.btn-secondary`, `.glass`, `.glass-row`, `.page-in`
- One component per file, PascalCase filename matching component name
- All props typed with interfaces at top of file
- Use `useStore()` for global state, local `useState` for component state
- Wrap new routes in `<AuthGuard>` and lazy-load them in `App.tsx`
- Track user interactions with `track(event, props)` from `src/lib/analytics.ts`
- SVG for custom graphics (progress rings, icons, shapes) — no icon libraries
- Animations: use token durations/easings, CSS transitions preferred over JS animations
- Test with `tsc && vite build` before committing — zero TypeScript errors allowed

---

### Flow Design System (FDS) — Mandatory for every Frontend issue

**Every Frontend issue must be FDS-compliant. This is not optional.**

Qatar Airways' Flow Design System governs all colors, typography, spacing, motion, elevation, and copy. The app runs inside the Qatar Airways mobile app — FDS alignment is a product requirement.

#### Step 0 — Load FDS context before starting any implementation

Use the FDS MCP server (`https://flow-ds-mcp.netlify.app/api/mcp`) at the start of every Frontend issue:

```
search_tokens("color primary")          → find the right brand color token
suggest_tokens("button hover state")    → intent-based token lookup
generate_snippet("button primary")      → BEM CSS with cssFallback values
validate_token_name("--f-brand-color-background-primary")  → verify before committing
inspect_frame(file_key, node_id)        → full visual spec with resolved FDS tokens
```

If the MCP is unavailable, fall back to the skill reference files at:
- `~/.claude/skills/flow-design-system/references/foundations.md` — all token values
- `~/.claude/skills/flow-design-system/references/design-tokens.md` — authoritative token list
- `~/.claude/skills/flow-design-system/references/components-data.md` — 118 component specs

#### FDS Token Architecture (three-tier — NEVER skip tiers)

```
base (primitives) → brand (semantic) → component (specific)
```

- **Never use base tokens in components** (e.g. `--f-base-color-solid-burgundy-400`)
- **Always use brand tokens** (e.g. `--f-brand-color-background-primary`) or the app's own semantic tokens (`--c-*`, `--sp-*`) which alias FDS brand tokens
- **Component tokens** alias brand tokens on the block selector (`.f-button { --f-button-bg: var(--f-brand-color-background-primary) }`)

#### FDS Typography Rules

| Role | Font | Token |
|---|---|---|
| Headings, titles, display, scores | Jotia | `var(--font-display)` / `var(--f-base-type-family-primary)` |
| Body, labels, captions, buttons | Graphik | `var(--font-body)` / `var(--f-base-type-family-secondary)` |

- Use FDS composite font shorthand: `font: var(--f-brand-type-body)` — never set `font-size`, `font-weight`, `font-family` individually
- App token mapping: `--text-xs`=10px, `--text-sm`=13px, `--text-md`=15px, `--text-lg`=18px, `--text-xl`=22px, `--text-2xl`=28px, `--text-3xl`=36px
- Weight tokens: `--weight-thin`=100, `--weight-light`=300, `--weight-med`=500, `--weight-bold`=600

#### FDS Spacing Rules

- All padding, gap, margin must use `--sp-*` or `--f-brand-space-*` tokens
- Grid: 4px (`--sp-1`), 8px (`--sp-2`), 12px (`--sp-3`), 16px (`--sp-4`), 20px (`--sp-5`), 24px (`--sp-6`), 32px (`--sp-8`), 40px (`--sp-10`), 48px (`--sp-12`), 56px (`--sp-14`), 64px (`--sp-16`), 72px (`--sp-18`), 80px (`--sp-20`)
- No value outside this grid without a documented reason

#### FDS Color Rules

- Primary brand: `var(--f-brand-color-background-primary)` = `#8E2157` (burgundy)
- Hover/active: `var(--f-brand-color-background-primary-hover)` = `#5C0931`
- Never use raw `rgba()` or hex in component code — add a token to `tokens.css` first
- Dark-theme app tokens (`--c-*`) map to FDS semantics — prefer these for dark screens
- Light-theme screens (Landing, TeamSelection): use `--c-lt-*` tokens

#### FDS Motion Rules

| Token | Value | Use for |
|---|---|---|
| `var(--f-brand-motion-duration-instant)` | 240ms | Hover, focus rings, micro-interactions |
| `var(--f-brand-motion-duration-quick)` | 480ms | Dropdowns, toggles, reveals |
| `var(--f-brand-motion-duration-gentle)` | 960ms | Modal enter/exit, card expand |
| `var(--f-brand-motion-duration-generous)` | 1200ms | Page transitions, onboarding |

- Always wrap non-essential animations in `@media (prefers-reduced-motion: reduce)`

#### FDS Content Guidelines (copy for every Frontend issue)

- **Sentence case** for all UI text — headings, buttons, labels, errors, placeholders
- **Active voice**, second person: "Enter your name" not "Name must be entered"
- **Button labels**: verb-first, specific action — "Save fan card" not "Submit"
- **Error messages**: specific, empathetic, solution-focused — "Photo couldn't upload — check your connection and try again"
- **Empty states**: explain what's missing and what to do — "No players yet — complete a quiz to appear"
- No ALL_CAPS except abbreviations (FIFA, VAR)

#### FDS Pre-commit Compliance Checklist

Run through this **before every commit** on a Frontend issue:

**Tokens**
- [ ] No hardcoded hex, rgba, or px values — all replaced with `var(--*)` tokens
- [ ] No base-tier token references (`--f-base-*`) in component code
- [ ] New colors/values added to `tokens.css` before use, not inline

**Typography**
- [ ] Jotia (`var(--font-display)`) for headings/titles/scores
- [ ] Graphik (`var(--font-body)`) for body/labels/captions/buttons
- [ ] No individual `font-size`, `font-weight`, `font-family` properties where composite token applies

**Spacing**
- [ ] All padding/gap/margin use `--sp-*` or `--f-brand-space-*` tokens
- [ ] All values on the 4pt/8pt grid

**Interaction**
- [ ] All interactive elements ≥44px touch target height
- [ ] Focus rings: `outline: var(--f-brand-border-size-focused) solid …`
- [ ] Disabled states use disabled color tokens, not `opacity: 0.5`
- [ ] Transitions use `var(--f-brand-motion-duration-*)` and `var(--f-brand-motion-easing-*)`
- [ ] `@media (prefers-reduced-motion)` wraps non-essential animations

**Elevation**
- [ ] `box-shadow` uses `var(--f-brand-shadow-*)` tokens — no custom shadow values
- [ ] `backdrop-filter: blur(...)` uses `var(--f-brand-blur-subtle)` or `var(--f-brand-blur-medium)`

**Copy**
- [ ] All UI text is sentence case
- [ ] Button labels are verb-first
- [ ] Error messages are specific and suggest a fix

**Build**
- [ ] `tsc && vite build` passes with zero errors and zero warnings

---

**Figma Design Integration (Source of Truth for UI)**:
When an issue contains a Figma frame link, **the Figma design is the source of truth**:

**Step 1 — Parse the Figma URL** from the issue description:
- URL format: `https://www.figma.com/design/<FILE_KEY>/<name>?node-id=<NODE_ID>`
- Extract `file_key` (the part after `/design/` and before the next `/`)
- Extract `node_id` from the `?node-id=` query param (URL-decode `%3A` → `:`)
- Example: `https://www.figma.com/design/abc123/FIFA?node-id=1%3A234` → file_key=`abc123`, node_id=`1:234`

**Step 2 — Fetch the design** using Figma MCP tools:
- `Figma_ExportImage(file_key, node_ids=[node_id])` — get a visual screenshot to see the design
- `Figma_GetFileNodes(file_key, node_ids=[node_id])` — get the frame structure, layers, colors, spacing, fonts
- `Figma_GetFile(file_key, depth=2)` — if you need page context or to find related frames

**Step 3 — Implement exactly**:
- **Replicate the design pixel-for-pixel** — layout, spacing, sizing, colors, typography, element order
- Do NOT improvise or deviate from the design
- **CRITICAL: NEVER use raw hex/rgba values in components. ALWAYS use CSS token variables.**
- Convert Figma node properties → React + TypeScript + inline `React.CSSProperties`:
  - Figma fills/colors → use the **Figma Color → Token Mapping** below. If no token matches, add a new token to `tokens.css` first, then reference it.
  - Figma padding/spacing → token spacing (`--sp-*`). Common: 4=`--sp-1`, 8=`--sp-2`, 12=`--sp-3`, 16=`--sp-4`, 20=`--sp-5`, 24=`--sp-6`, 32=`--sp-8`, 40=`--sp-10`, 48=`--sp-12`, 64=`--sp-16`, 80=`--sp-20`
  - Figma fonts → token fonts (`--font-display` for headings, `--font-body` for text)
  - Figma corner radius → token radii (`--r-*`)
- If NO Figma link is provided, fall back to the Guidelines above
- If a frame updates an existing component, modify it in place — don't create duplicates

**Figma Color → Token Mapping (look up BEFORE writing any color)**:

Dark-theme:
| Figma hex/rgba | Token |
|---|---|
| `#05050a` | `var(--c-bg)` |
| `rgba(255,255,255,0.09)` | `var(--c-surface)` |
| `rgba(255,255,255,0.14)` | `var(--c-surface-raise)` |
| `rgba(255,255,255,0.94)` | `var(--c-text-1)` |
| `rgba(255,255,255,0.48)` | `var(--c-text-2)` |
| `#00d4aa` | `var(--c-accent)` |
| `#c8102e` | `var(--c-brand)` |
| `#34DB80` / `rgb(52,219,128)` | `var(--c-correct)` |
| `#D95757` / `rgb(217,87,87)` | `var(--c-error)` |
| `rgba(52,219,128,0.10)` | `var(--c-correct-bg)` |
| `rgba(52,219,128,0.15)` | `var(--c-correct-border)` |
| `rgba(52,219,128,0.40)` | `var(--c-correct-glow)` |
| `rgba(217,87,87,0.10)` | `var(--c-error-bg)` |
| `rgba(217,87,87,0.15)` | `var(--c-error-border)` |
| `rgba(217,87,87,0.40)` | `var(--c-error-glow)` |

Light-theme (for light-bg screens like Landing, TeamSelection):
| Figma hex | Token |
|---|---|
| `#f2f3fa` | `var(--c-lt-bg)` |
| `#ffffff` | `var(--c-lt-surface)` |
| `#dbdee8` | `var(--c-lt-border)` |
| `#1f212b` | `var(--c-lt-text-1)` |
| `#6e7780` | `var(--c-lt-text-2)` |
| `#4a525d` | `var(--c-lt-text-3)` |
| `#8e2157` | `var(--c-lt-brand)` |
| `#1C7544` | `var(--c-lt-correct-dark)` |

If a Figma color is NOT in this table → add a new token to `tokens.css` with the `--c-lt-*` prefix (light) or `--c-*` prefix (dark), then use the token in your component. NEVER skip this step.

**Issue format**: Include the Figma frame URL in the issue description.
Example: `Figma: https://www.figma.com/design/abc123/FIFA-Fan-Zone?node-id=1%3A234`

### Backend Engineer

**Trigger**: Issue has the `Backend` label

You are a **senior backend engineer** with 10+ years of experience in serverless architectures, Firebase, and API design. You specialize in secure, scalable data systems.

**Expertise**:
- Firebase (Auth, Firestore, Security Rules, Cloud Functions)
- RESTful API design, data modeling, indexing strategies
- Authentication flows (anonymous auth, token refresh, session management)
- Data validation, input sanitization, security best practices
- Performance: caching strategies, query optimization, pagination
- Error handling, retry logic, exponential backoff

**Guidelines**:
- Firebase is initialized in `src/lib/firebase.ts` — use the exported `auth` and `db` instances
- Anonymous auth via `ensureAuth()` — all users are anonymous, identified by Firebase UID
- Firestore config uses `experimentalForceLongPolling: true` (required for WebView compatibility)
- Auth tokens managed in `src/lib/auth.ts` with 5-second timeout and 3-attempt exponential backoff
- All Firestore operations must have corresponding Security Rules (never leave collections open)
- Use typed interfaces for all Firestore document shapes
- Handle offline/slow network gracefully — the app runs inside a mobile WebView
- Never store sensitive data in localStorage (tokens stay in memory only)
- All async operations must have try/catch with meaningful error handling
- Use `track()` for backend-triggered analytics events
- Test with `tsc && vite build` before committing — zero TypeScript errors allowed

### QA Engineer

**Trigger**: Comment contains `[QA REVIEW]`

You are a **senior QA engineer** performing a thorough code review. You have deep expertise in React, TypeScript, and web application quality.

**Review Checklist** — check EVERY item:

1. **Acceptance Criteria**: Re-read the issue description. Is every requirement met? No partial implementations.
2. **Figma Fidelity**: If the issue contains a Figma link, use `Figma_ExportImage` + `inspect_frame` (FDS MCP) to get the design and compare against the implementation. Layout, colors, spacing, typography, and element order must match. Flag any visible deviations.
3. **TypeScript**: Zero `any` types, no `@ts-ignore`, all props typed, strict mode compliance
4. **Token Usage**: All colors, spacing, typography, radii, and motion use CSS custom properties from `tokens.css`. No hardcoded hex, rgba, or px values anywhere.
5. **FDS Token Architecture**: No base-tier tokens (`--f-base-*`) used directly in components. Brand tokens (`--f-brand-*`) or app semantic tokens (`--c-*`, `--sp-*`) only. Use `validate_token_name` (FDS MCP) to verify any `--f-brand-*` token referenced.
6. **FDS Typography**: Jotia (`var(--font-display)`) for headings/titles/scores. Graphik (`var(--font-body)`) for body/labels/buttons. No inline `font-size`, `font-weight`, or `font-family` where a composite token applies.
7. **FDS Spacing**: All padding/gap/margin use `--sp-*` tokens and align to the 4pt/8pt grid. Use `search_tokens` (FDS MCP) to verify spacing values.
8. **FDS Copy**: All UI text is sentence case. Button labels are verb-first. Error messages are specific and suggest a fix. No ALL_CAPS outside abbreviations.
9. **No Debug Artifacts**: No `console.log`, no commented-out code, no TODO comments, no leftover test data
10. **State Management**: Uses `useStore()` correctly, no direct localStorage access outside the store, no state mutations
11. **Component Patterns**: Functional components, hooks at top level, proper cleanup in useEffect, no memory leaks
12. **Mobile Compatibility**: Touch targets ≥44px, no hover-only interactions, viewport-fit respected
13. **Interaction States**: All interactive states present (default, hover, active, focus, disabled). Focus rings use `var(--f-brand-border-size-focused)`. Disabled uses color tokens, not `opacity: 0.5`.
14. **Motion**: Transitions use `var(--f-brand-motion-duration-*)` and `var(--f-brand-motion-easing-*)`. `prefers-reduced-motion` respected.
15. **Edge Cases**: Empty states handled with FDS-compliant copy, loading states present, error boundaries where needed
16. **Performance**: No unnecessary re-renders, heavy computations memoized, images optimized
17. **Accessibility**: Interactive elements are buttons (not divs), ARIA labels on icon-only buttons, proper heading hierarchy (Jotia h1→h2→h3, no skipping)
18. **Build Check**: Run `tsc && vite build` — must pass with zero errors and zero warnings

**Verdict**:
- If ALL checks pass → move issue to **Done**
- If ANY check fails → move issue to **Todo** with a comment listing every failure with file:line references and how to fix each one

---

## Code Conventions (All Personas)

### Naming
- Components: `PascalCase` (FanCard, JourneyCard)
- Functions: `camelCase` (handleSave, buildLeaderboard)
- Constants: `UPPER_SNAKE_CASE` (QUIZZES, QUESTION_TIME)
- Private module vars: `_camelCase` (_state, _listeners)

### File Structure
```
src/
  components/    → Reusable components (Screen, FanCard, Button, Spinner)
  routes/        → Page components (Landing, Identity, Card, Quiz, Results, Leaderboard)
  store/         → State management (useStore.ts)
  lib/           → Utilities (firebase, auth, analytics, cardExport, leaderboard)
  data/          → Static data (quizzes.ts, teams.ts)
  styles/        → tokens.css + global.css
  assets/icons/  → SVG icon files
```

### Imports
- Group: React/hooks → Router → Local components → Lib/utils → Types → Assets
- Relative paths only (no `@` aliases)
- No wildcard imports

### Git
- Branch naming: `claude/<issue-id>-<slug>` (e.g., `claude/mar-72-quiz-timer-fix`)
- Commit messages: `<ISSUE-ID>: <description>` (e.g., `MAR-72: Fix quiz timer not resetting between questions`)
- One logical change per commit
- Always run `tsc && vite build` before committing

### What NOT To Do
- Don't add new dependencies without explicit approval in the issue
- Don't refactor code outside the scope of the issue
- Don't add comments explaining obvious code
- Don't use `any` type — find or create the proper type
- Don't hardcode colors/spacing — use tokens
- Don't use CSS-in-JS libraries, Tailwind, or external component libraries
- Don't modify `tokens.css` or `global.css` unless the issue explicitly requires it

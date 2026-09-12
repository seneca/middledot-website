# middledot website (Astro on Cloudflare Pages)

Business website for Affinity scripts, blog, and documentation.

## Commands

```bash
bun install
bun run dev           # local dev server (http://localhost:4321)
bun run build         # static build + pagefind index -> dist/client/
bun run preview       # preview the built site
bun run sync          # regenerate content collection types
```

## Git remote & auth

- `origin` uses **SSH**: `git@github.com:seneca/middledot-website.git`.
- **HTTPS pushes fail on this machine** — `could not read Username for 'https://github.com': Device not configured` (the macOS keychain has no stored GitHub credentials). Always push over the SSH remote.
- SSH key `~/.ssh/id_ed25519` (added to `ssh-agent`) authenticates as `seneca`. If the agent is empty: `ssh-add ~/.ssh/id_ed25519`.

## Architecture

- **Framework:** Astro 7 (static output) + `@astrojs/cloudflare` adapter.
- **Hosting:** Cloudflare Pages; bun ≥ 1.4 required.
- **Content:** MDX content collections in `src/content/`:
  - `blog/**` → blog posts (`src/pages/blog/[...slug].astro`)
  - `scripts/**` → Affinity scripts (`src/pages/scripts/[...slug].astro`)
- **Layouts:** `src/layouts/` — `BaseLayout.astro` (base HTML shell with dark mode init).
- **Design:** `src/styles/` — CSS custom-property design system (Inter). No Tailwind. Split into focused files imported by `global.css`:
  - `tokens.css` — design tokens (`:root` custom properties, dark mode via `[data-theme='dark']`)
  - `base.css` — reset, element defaults, layout primitives (`.container`, `.section`, `.grid`)
  - `components.css` — buttons, page hero, prose, cards & grids
  - `utilities.css` — `.sr-only`, `.skip-link`
  - `responsive.css` — media queries, kept **outside** `@layer` so they override layered rules
  - `global.css` — declares `@layer reset, base, components, utilities;` and imports the rest

## Content gotchas (from sikat-website, verified)

- **One H1 per page.** The layout renders `<h1>{title}</h1>` in the page hero.
- **Entry IDs** from the `glob` loader include the file path but the code strips `.md`/`.mdx` and trailing `/index` to build routes.
- **Rendering markdown under the Cloudflare adapter:** use `render(entry)` imported from `astro:content`, NOT `entry.render()`.
- **`entry.body` may be undefined** in some builds — guard with `(entry.body ?? '')` before slicing/regex.
- **`src/content.config.ts` requires explicit `glob({...})` loaders** with `retainBody: true` and `base: './src/content/<name>'`.

## CSS conventions (follow for ALL future CSS edits)

Hand-written CSS must stay clean, human-readable and modern. Astro auto-scopes
`<style>` blocks in `.astro` files and appends ugly hashed attributes
(`data-astro-cid-<hash>`) to selectors/elements — **avoid these**:

- Put **shared / design-system CSS** in `src/styles/` (unscoped, plain selectors).
- For component/page CSS, use `<style is:global>` so selectors stay clean (no hashes).
- **Never** rely on Astro-scoped `<style>` for anything you want to look clean in devtools.

Prefer modern CSS features:

- **CSS Nesting** — nest pseudo-classes, variants, descendants and `@media` under the parent selector.
- **`@layer`** — declare `@layer reset, base, components, utilities;` to make the cascade explicit.
- **`text-wrap: balance`** on headings and **`text-wrap: pretty`** on body text (wrap in `@supports`).
- **`color-mix(in oklch, …)`** for hover states / tints instead of hardcoded darker colors.
- **Logical properties** (`margin-inline`, `padding-inline-start`, `border-inline-start`) over physical `left/right/top/bottom`.
- **`:has()`** for parent selectors where needed.
- **Container queries** — add `container-type: inline-size` to card grids so cards respond to their own width.
- **`content-visibility: auto`** on card grids for faster first paint.
- **`@starting-style` + `transition-behavior: allow-discrete`** for show/hide animations.
- **`:user-valid` / `:user-invalid`** for form validation after interaction.

**Class naming:** use semantic, lowercase-dash BEM-style names (`script-card`, `blog-grid`, `site-header`, `footer-col`). Never generate or introduce hashed/suffixed class names.

## Dark mode

- Uses `data-theme` attribute on `<html>`, set before paint via inline `<script>`.
- Toggle stores preference in `localStorage`.
- Respects `prefers-color-scheme: dark` as default when no stored preference.
- Tokens override in `[data-theme='dark']` block in `tokens.css`.

## Content collections

- `blog` — blog posts with `title`, `description`, `pubDate`, `tags`, `draft`
- `scripts` — Affinity scripts with `title`, `description`, `pubDate`, `affinityVersion`, `tags`, `draft`
- Both use `glob()` loader with `retainBody: true` for `.md` files.

## Typography (Brand Guidelines)

**Primary typeface:** Inter (variable, weights 300–700). No serif, script, or decorative fonts — ever.
Fallback stack: `Inter → SF Pro Display → Helvetica Neue → Arial → sans-serif`.

### Type scale (desktop / mobile)

| Level | Weight | Desktop | Mobile | Line Height | Letter Spacing |
|-------|--------|---------|--------|-------------|----------------|
| Display / Hero | SemiBold (600) | 64–80 px | 40–48 px | 1.1 | -0.015em |
| H1 | SemiBold (600) | 40–48 px | 32 px | 1.15 | -0.01em |
| H2 | Medium (500) | 28–32 px | 24 px | 1.2 | -0.005em |
| H3 | Medium (500) | 20–24 px | 18–20 px | 1.3 | 0 |
| Body Large | Regular (400) | 18–20 px | 16–18 px | 1.5 | 0 |
| Body | Regular (400) | 16 px | 15–16 px | 1.5–1.6 | 0 |
| Body Small | Regular (400) | 14 px | 14 px | 1.5 | 0 |
| Caption / Label | Medium (500) | 12–13 px | 12 px | 1.4 | +0.01em to +0.02em |
| Button / CTA | Medium (500) | 14–16 px | 14–16 px | 1.2 | +0.01em |

### Key rules

- Use SemiBold or Medium for emphasis — never bold + italic combos.
- Negative tracking on large display sizes (-0.01em to -0.02em) for a tighter, premium feel.
- Minimum body text 15–16 px on screen. Never set body in all-caps or pure bold.
- Dark backgrounds: pure white `#FFFFFF` or `#F4F4F4`. Light backgrounds: `#1C1C1C` or `#000000`.
- Reserve `#FF6B00` for accents, links, or short emphasis — not large body text.
- "Middledot" always in the primary typeface (Inter). Title Case only (capital M).

## Search

- Uses Pagefind for static search. Index runs after build: `astro build && bunx pagefind --site dist/client`.
- Search widget in the header: `Cmd/Ctrl + K` to open, `Esc` to close.
- Pagefind indexes all `<body>` content by default. Add `data-pagefind-body` to specific elements to limit indexing.
- To hide search on a specific page, pass `showSearch={false}` to `BaseLayout`:
  ```astro
  <BaseLayout title="..." showSearch={false}>
  ```

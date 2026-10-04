# Genesys Now

Marketing site for Genesys Now, built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS 4.

## Getting started

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint
```

Requires Node.js 22.13 or newer.

## Deploying to Vercel

1. Import this repository in Vercel. The framework preset is detected as **Next.js**; no build settings need changing.
2. No environment variables are required.
3. Deploy. Static pages are prerendered; `/work/[slug]`, `/services/[slug]`, `/insights/[slug]` and `/api/enquiries` run as functions.

## Project structure

| Path | Contents |
| --- | --- |
| `app/` | Routes, layout and `globals.css` (design tokens, motion system, page styles) |
| `components/genesys/` | Site components: shell (header/footer), pages, contact form, loading screen, pixel art |
| `components/ui/` | shadcn/ui primitives |
| `lib/genesys-data.ts` | Services, projects and articles content |
| `public/` | Brand logos, Martian B Thai fonts, images and the showreel video |

## Brand and type

- Headlines use **Martian B Thai** (`public/fonts`); body text uses **Inter**.
- Logos live in `public/brand/` (light and dark variants, plus the icon used by the pixel art).

## Motion

- **Loading screen** (`loading-screen.tsx`): the pixel "g" assembles while a counter runs, then the screen dissolves in a tile wipe. Shown once per browser session.
- **Pixel art** (`pixel-hero.tsx`, `pixel-scenes.ts`, `pixel-waves.tsx`): the hero mark, footer wordmark and per-section scenes are canvas pixel art that assembles on view and scatters on hover. Scenes are drawn as character grids in `pixel-scenes.ts` and can be edited there.
- **Transitions** (end of `globals.css`, `motion.tsx`): shared motion tokens, blurred text reveals, sliding nav/tab indicators, card tilt, icon swap and form feedback.
- Everything respects `prefers-reduced-motion` and the footer motion toggle.

## Contact form

The form validates input on the client and in `app/api/enquiries/route.ts`, but **online delivery is not connected yet**: the endpoint responds asking visitors to email hello@genesysnow.com, and the form says the same. To go live, add an email provider (for example Resend) or a database in the route handler where the comment marks it.

## Content notes

The work section contains three explicitly labelled original concept studies. Replace them with approved client projects when available. No client testimonials or unverified performance claims are included.

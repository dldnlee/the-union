# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application using React 19, TypeScript, and Tailwind CSS v4. The project follows the App Router architecture introduced in Next.js 13+.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Architecture

### Next.js App Router Structure
- Uses the `app/` directory for routing (not `pages/`)
- Each route is defined by a folder containing `page.tsx`
- Layout components in `layout.tsx` wrap child pages and persist across navigation
- Root layout at [app/layout.tsx](app/layout.tsx) defines the HTML structure and applies global fonts

### TypeScript Configuration
- Path alias `@/*` maps to the project root
- Strict mode enabled
- Target: ES2017
- JSX runtime: `react-jsx` (new JSX transform, no need to import React)

### Styling
- Tailwind CSS v4 with PostCSS
- Dark mode support via CSS classes (`dark:` prefix)
- Global styles in [app/globals.css](app/globals.css)
- Custom fonts: Geist Sans and Geist Mono loaded via `next/font/google`

### ESLint Configuration
- Uses Next.js recommended configs (`eslint-config-next`)
- TypeScript-aware linting enabled
- Flat config format (eslint.config.mjs)

## Key Patterns

### Component Creation
- Server Components are the default (no "use client" needed)
- Add "use client" directive at top of file for client-side interactivity (useState, useEffect, event handlers)
- Use TypeScript for all components (.tsx extension)

### Image Optimization
- Always use `next/image` instead of `<img>` tags
- Images in `public/` directory are served from root path (e.g., `/next.svg`)

### Metadata
- Export `metadata` object from pages for SEO
- Type it as `Metadata` from "next"

### Rules
- Database schema models are in models.ts
# LUO FILM - Streaming Platform

## Overview
LUO FILM is a streaming entertainment platform for movies, series, TV channels, and live sports. Imported from Lovable. Built as a frontend-only React + Vite application.

## Recent Changes
- 2026-02-18: Imported from Lovable to Replit. Updated Vite config to serve on port 5000 with all hosts allowed. Removed lovable-tagger plugin.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS 3 + shadcn/ui components
- **Routing**: react-router-dom v6
- **State**: @tanstack/react-query
- **Auth**: Firebase
- **Video**: ArtPlayer, HLS.js
- **Other**: recharts, sonner (toasts), zod (validation)

## Project Architecture
```
src/
  assets/          - Images (hero banners, drama posters, etc.)
  components/      - Reusable components (Header, HeroBanner, DramaCard, etc.)
  components/ui/   - shadcn/ui primitives
  contexts/        - AuthContext (Firebase auth)
  data/            - Static data (dramas, sports, admin)
  hooks/           - Custom hooks (use-mobile, use-toast)
  lib/             - Utilities (firebase, payments, utils)
  pages/           - Route pages (Index, Watch, Movies, Series, TVChannel, LiveSport, Agent, Admin, etc.)
  test/            - Tests
```

## Key Pages
- `/` - Home (hero banner + content rows)
- `/movies` - Movies listing
- `/series` - Series listing
- `/tv-channel` - TV channels
- `/live-sport` - Live sports
- `/watch/:id` - Video player
- `/agent` - Agent page
- `/admin` - Admin dashboard
- `/shared/:shareCode` - Shared content

## Running
- `npm run dev` starts the Vite dev server on port 5000
- `npm run build` builds for production (output: dist/)

## User Preferences
- (None recorded yet)

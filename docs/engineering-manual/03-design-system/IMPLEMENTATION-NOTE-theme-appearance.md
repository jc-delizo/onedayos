# Implementation Note: Theme / Appearance Preference

OneDayOS MVP appearance supports exactly three personal browser-local modes:

- Light
- Dark
- System

The default preference is System. System follows `prefers-color-scheme` and updates when the browser or operating system preference changes.

The preference is stored on the user device in `localStorage` under `onedayos.appearance`. The previous `onedayos-theme` key may be read as a legacy compatibility fallback. Appearance is not stored in Prisma, Supabase, Organization settings, User records, Setting records, cookies containing user or tenant identifiers, or any API route.

The current appearance control lives only in the profile menu. Organization-wide themes, white-labeling, per-client CSS, custom theme builders, and layout selection are deferred.

Brand orange remains the dedicated token `--color-brand: #F97316`. It must not be remapped to shadcn or generic `accent` tokens. Generic accent behavior remains neutral. Semantic colors remain separate for brand, success, warning, danger, info, and neutral.

Dark mode is class-based through the root `dark` class and remains compatible with Tailwind v4:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

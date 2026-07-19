# OneDayOS Engineering Manual — 03 Design System / 01 Brand System

**Document ID:** `03-design-system/01-brand-system.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Owner:** OneDayOS Founder + ChatGPT Software Architect  
**Implementation Status:** Required Before Restarted Platform UI Build  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `03-design-system/00-design-vision.md`
- `04-kernel/*`
- `05-sdk/*`
- `13-security/*`

---

# ADR-Backed Amendment — 2026-07

ADR-0012 accepts the `OneDayOS Compact` preset.

Where this document previously recommends Inter as the product font, the active preset now uses a system UI stack:

```css
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Where this document references shadcn token behavior, ADR-0012 keeps the principle but clarifies the implementation posture: current audited custom OneDayOS components remain; shadcn is selective source/reference material only and the shadcn CLI must not overwrite audited components without another ADR.

Lucide is approved for shared chrome and common action icons.

# 1. Purpose

This document defines the **OneDayOS Brand System**.

It is not a marketing-branding document only. It is an implementation-grade design-system contract for Claude, future engineers, and future UI generators.

The Brand System defines:

```txt
visual identity
color tokens
typography
spacing
radius
borders
shadows
icons
motion personality
client branding limits
dark mode rules
semantic status colors
component token usage
Claude UI generation rules
```

The purpose is to prevent OneDayOS from becoming another generic admin dashboard.

The previous base app problem was not only technical. It had a visual-product problem:

```txt
Auth page
Sidebar
Dashboard
Cards
CRUD
```

Those pieces existed, but the product did not feel like a premium Business Operating System.

This document defines the visual foundation so the restarted platform can feel intentional from day one.

---

# 2. Core Brand Thesis

OneDayOS should feel like:

```txt
A calm command center for Philippine SMEs.
```

It should not feel like:

```txt
A cheap admin template.
A Bootstrap dashboard.
A random SaaS starter.
A noisy ERP from 2008.
A Notion clone.
A spreadsheet with a sidebar.
A colorful toy CRM.
```

The visual identity should communicate:

```txt
fast
serious
clean
premium
operational
trustworthy
businesslike
modern
focused
```

The brand should feel suitable for:

```txt
inventory teams
HR admins
owners
operations managers
finance staff
branch managers
front desk staff
field supervisors
```

It should not feel targeted only at developers or startup founders.

---

# 3. Design Personality

## 3.1 Desired personality

OneDayOS should feel:

| Trait | Meaning |
|---|---|
| Premium | Polished, intentional, not template-like |
| Calm | Low visual noise, no screaming colors |
| Fast | Immediate feedback, crisp interactions |
| Dense | Can handle real business data without looking cramped |
| Trustworthy | Clear states, stable layout, predictable behavior |
| Operational | Built for daily work, not landing-page screenshots |
| Modern | Influenced by Linear, Stripe, Vercel, Attio, Raycast, Notion |
| Local-business friendly | Powerful without feeling enterprise-heavy |

## 3.2 Rejected personality

OneDayOS must not feel:

| Rejected Trait | Why |
|---|---|
| Generic | Kills platform differentiation |
| Playful | Weakens trust for business operations |
| Loud | Fatigues daily users |
| Decorative | Slows delivery and distracts from data |
| Over-branded | Makes client deployments harder |
| Enterprise-heavy | Philippine SMEs need clarity, not complexity |
| Template-like | Makes OneDayOS look like a commodity CRUD app |

---

# 4. Brand Architecture

OneDayOS has three visual layers:

```txt
OneDayOS Core Brand
  ↓
OneDayOS Product Design System
  ↓
Client Configuration / Light Branding
```

## 4.1 OneDayOS Core Brand

This is the permanent identity of the platform.

It includes:

```txt
OneDayOS name
core color palette
layout feel
typography style
interaction standards
component quality
product tone
```

This should not change per client.

## 4.2 Product Design System

This is the reusable UI system used by every module.

It includes:

```txt
buttons
forms
tables
cards
dialogs
sidebars
headers
empty states
loading states
badges
tooltips
menus
navigation
```

Modules should inherit this system automatically.

## 4.3 Client Configuration / Light Branding

Normal client customization may include:

```txt
organization logo
organization name
optional small brand accent in limited areas
module enablement
labels/settings where approved
```

Normal client customization must not include:

```txt
custom layouts
custom CSS files
custom component variants
custom navigation patterns
custom table styles
custom form styles
per-client design forks
```

Client branding is configuration, not design-system mutation.

---

# 5. Color System

## 5.1 Color philosophy

OneDayOS should use color sparingly.

The UI should mostly be built from:

```txt
neutral surfaces
clear hierarchy
subtle borders
typography contrast
small accent moments
semantic status indicators
```

The brand color should guide attention. It should not paint the whole product.

Bad:

```txt
Orange sidebar
Orange cards
Orange buttons everywhere
Orange hover states everywhere
Orange dashboard gradients
```

Good:

```txt
Neutral shell
Clear active nav indicator
Brand-colored primary action
Small brand highlight
Warm accent on key interactions
```

## 5.2 Brand color decision

The primary OneDayOS brand color is:

```txt
Brand Orange: #F97316
```

This color should be used for:

```txt
primary call-to-action buttons
active navigation accent
small highlights
focus moments where appropriate
selected states where appropriate
brand identity elements
```

It should not be used for:

```txt
generic hover backgrounds everywhere
large background surfaces
all icons
all cards
all badges
all charts
all headers
all links
```

## 5.3 Critical shadcn token decision

Do **not** override shadcn's generic `accent` token with the OneDayOS orange.

Use a dedicated brand token:

```css
--color-brand: #F97316;
```

Do not do this:

```css
--color-accent: #F97316;
```

Reason:

```txt
In shadcn/ui, accent is used by many components for neutral hover and selected states.
If we map accent to orange, random menus, dropdowns, command items, and hover states become orange.
That makes the product feel noisy and template-like.
```

The brand color must be intentionally applied, not globally leaked into every interactive state.

---

# 6. Recommended Token Palette

## 6.1 Core brand tokens

```css
@theme {
  --color-brand: #F97316;
  --color-brand-hover: #EA580C;
  --color-brand-active: #C2410C;
  --color-brand-soft: #FFF7ED;
  --color-brand-border: #FED7AA;

  --color-navy: #1E3A8A;
  --color-dark-navy: #0D1B2A;
}
```

## 6.2 Neutral system

OneDayOS should rely heavily on a neutral palette.

Recommended conceptual scale:

```txt
Neutral 0      pure surface / app background
Neutral 50     subtle page background
Neutral 100    soft section background
Neutral 200    borders
Neutral 300    strong borders / disabled text
Neutral 400    placeholder text
Neutral 500    secondary text
Neutral 600    body-muted text
Neutral 700    body text
Neutral 800    headings / dark surfaces
Neutral 900    strongest foreground
Neutral 950    dark shell
```

Implementation should primarily use Tailwind/shadcn neutral tokens rather than inventing many custom colors.

## 6.3 Light mode surface roles

| Role | Intended Use |
|---|---|
| `background` | App/page background |
| `surface` | Cards, panels, tables |
| `surface-muted` | Section backgrounds, table headers |
| `border` | Default borders |
| `border-strong` | Focused or structural borders |
| `foreground` | Primary text |
| `muted-foreground` | Secondary text |
| `brand` | Primary action/accent |

## 6.4 Dark mode surface roles

Dark mode should not simply invert light mode.

Dark mode should feel like:

```txt
calm
professional
low-glare
not pure black
not neon
```

Preferred dark shell:

```txt
#0D1B2A
```

Use dark mode carefully for:

```txt
app shell
sidebar
header
command surfaces
panels
night-work comfort
```

Avoid:

```txt
pure black backgrounds
neon orange text
glow effects
overly bright borders
```

---

# 7. Semantic Color System

Semantic colors must be consistent across all modules.

## 7.1 Status colors

| Semantic | Meaning | Examples |
|---|---|---|
| Success | Completed, approved, active | Approved leave, completed purchase order |
| Warning | Needs attention, pending, low risk | Pending approval, low stock |
| Danger | Error, destructive, rejected, critical | Failed validation, rejected request |
| Info | Neutral information | Draft, help, system note |
| Neutral | Inactive, archived, unavailable | Inactive employee, disabled module |

Do not use the brand orange as a generic warning color unless the UI intentionally distinguishes brand from warning.

A warning state and a brand action are different concepts.

Bad:

```txt
Orange primary button
Orange warning badge
Orange active nav
Orange low-stock alert
Orange focus ring
```

Good:

```txt
Brand orange = OneDayOS action/identity
Warning amber = business attention
Danger red = destructive or critical
Success green = completed/approved
Neutral gray = inactive/draft
```

## 7.2 Business status examples

Inventory:

| Status | Semantic Color |
|---|---|
| In stock | Success/neutral depending density |
| Low stock | Warning |
| Out of stock | Danger |
| Archived product | Neutral |

Leave:

| Status | Semantic Color |
|---|---|
| Draft | Neutral |
| Submitted | Info |
| Approved | Success |
| Rejected | Danger |
| Cancelled | Neutral |

Purchasing:

| Status | Semantic Color |
|---|---|
| Draft | Neutral |
| Submitted | Info |
| Approved | Success |
| Received | Success/Info |
| Cancelled | Neutral |
| Voided | Danger/Neutral depending context |

---

# 8. Typography

## 8.1 Typography philosophy

Typography should make OneDayOS feel:

```txt
clear
modern
dense
precise
businesslike
```

It should not feel:

```txt
playful
overly large
marketing-heavy
tiny and cramped
```

## 8.2 Font recommendation

Preferred default, amended by ADR-0012:

```txt
System UI stack
```

Reason:

```txt
native platform legibility
fast loading with no external font dependency
stable operational density
no unloaded first-choice font declaration
```

Approved stack:

```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Do not introduce decorative fonts into the product UI.

## 8.3 Type hierarchy

Recommended hierarchy:

| Token | Use | Notes |
|---|---|---|
| Display | Rare marketing/product moments | Avoid in app screens |
| Page title | Main page heading | Clear, not oversized |
| Section title | Card/table/form sections | Medium weight |
| Body | Normal text | Default reading size |
| Body small | Dense table/supporting text | Must stay legible |
| Label | Form labels/table labels | Precise, medium weight |
| Caption | Metadata/help text | Muted, not tiny |
| Code/monospace | IDs, slugs, technical details | Use sparingly |

## 8.4 Suggested app sizing

```txt
Page title:       24px / 32px, semibold-bold
Section title:    16px / 24px, semibold
Body:             14px / 20px, regular
Table body:       13px-14px / 20px
Label:            13px-14px / 20px, medium
Caption:          12px / 16px
```

The product should avoid huge typography inside operational screens. Business software needs information density.

## 8.5 Number formatting

Numbers should be visually scannable.

Use tabular numerals where useful:

```css
font-variant-numeric: tabular-nums;
```

Recommended for:

```txt
prices
quantities
stock counts
dates
times
metrics
IDs
balances
amounts
```

---

# 9. Spacing and Density

## 9.1 Spacing philosophy

OneDayOS should be data-dense but not cramped.

The spacing should feel closer to:

```txt
Linear
Attio
Stripe dashboard
Raycast
```

Not:

```txt
large marketing SaaS cards
empty dashboard template
mobile-first consumer app spacing everywhere
```

## 9.2 Density modes

OneDayOS should eventually support density preferences, but MVP should standardize one density:

```txt
Default density: compact-professional
```

This means:

```txt
forms are readable
lists can show enough data
tables do not waste vertical space
cards do not dominate screens
sidebars are efficient
```

## 9.3 Recommended spacing scale

Use Tailwind spacing conventions. Prefer consistency over custom values.

Common patterns:

| Area | Recommended Spacing |
|---|---|
| Page padding | `p-6` desktop, smaller on mobile |
| Section gap | `gap-4` / `gap-6` |
| Form field gap | `space-y-4` |
| Inline control gap | `gap-2` |
| Toolbar gap | `gap-2` / `gap-3` |
| Table cell padding | compact, usually `px-3 py-2` or `px-4 py-2.5` |
| Card padding | `p-4` or `p-5`, rarely `p-6+` |

Avoid arbitrary spacing unless a component standard defines it.

---

# 10. Radius, Borders, and Shadows

## 10.1 Shape philosophy

OneDayOS should feel refined, not bubbly.

Use:

```txt
subtle radius
clear borders
very soft shadows
minimal elevation
```

Avoid:

```txt
large pill cards everywhere
heavy shadows
glassmorphism
neumorphism
gradient panels
floating dashboard widgets
```

## 10.2 Radius scale

Suggested defaults:

| Element | Radius |
|---|---|
| Buttons | medium, not full pill by default |
| Inputs | medium |
| Cards | medium-large but restrained |
| Tables | medium outer radius |
| Badges | small/medium, sometimes pill for status |
| Dialogs | medium-large |

Do not use full rounded pills for every component. Pills should be intentional, mostly for badges or compact filters.

## 10.3 Border usage

Borders are important in OneDayOS because the UI is dense.

Use borders to define:

```txt
tables
panels
forms
menus
dialogs
sidebars
toolbars
section boundaries
```

Use border contrast sparingly. A business app should feel structured but not boxed-in.

## 10.4 Shadow usage

Shadows should be subtle.

Use shadows for:

```txt
dropdowns
popover menus
dialogs
floating command menu
toasts
```

Avoid shadows for every card or table. Too many shadows make the UI feel template-like.

---

# 11. Iconography

## 11.1 Icon library

Use:

```txt
lucide-react
```

Do not mix multiple icon libraries unless approved by ADR.

## 11.2 Icon style

Icons should be:

```txt
outline-based
simple
consistent stroke width
functional
not decorative
```

## 11.3 Icon sizing

Common sizes:

```txt
12px — inline micro icons
14px — small actions, table row actions
16px — labels, small buttons
18px — sidebar/nav
20px — primary UI icons
24px — empty states / major actions
```

Avoid oversized icons in normal business workflows.

## 11.4 Module icons

Each module should have one consistent icon.

Examples:

| Module | Candidate Icon |
|---|---|
| Inventory | Package / Boxes |
| Leave | CalendarDays |
| CRM | UsersRound / Handshake |
| Purchasing | ClipboardList / ShoppingCart |
| Expenses | Receipt |
| Assets | Laptop / Archive |
| Visitors | BadgeCheck / DoorOpen |
| Incidents | TriangleAlert / ShieldAlert |

Module icons are navigation aids, not brand illustrations.

---

# 12. Logo and Wordmark Rules

## 12.1 Product wordmark

The product name should be written as:

```txt
OneDayOS
```

Not:

```txt
One Day OS
OnedayOS
OneDay OS
OneDayOnlySystems App
ODOS
```

## 12.2 App shell logo usage

The app shell should show:

```txt
OneDayOS
```

or a compact mark if the sidebar is collapsed.

The client organization name should appear separately, usually in the header or workspace switcher area.

Do not replace the OneDayOS product identity entirely with the client logo for normal clients.

Reason:

```txt
Clients buy OneDayOS, not a white-labeled custom app by default.
```

## 12.3 Client logo usage

Client logo may appear in:

```txt
organization header
settings page
handover page
optional dashboard welcome area
```

Client logo should not determine:

```txt
component colors
spacing
table style
form style
navigation layout
core product identity
```

---

# 13. Client Branding Rules

## 13.1 MVP customization allowed

For normal clients:

```txt
organization name
organization logo
optional compact brand accent setting later
enabled modules
module settings
role names and assignments
business labels where approved
```

## 13.2 MVP customization rejected

Do not allow normal clients to customize:

```txt
layout structure
sidebar style
form style
table density
component library
CSS files
per-client themes beyond limited tokens
navigation mechanics
page structure
status semantics
```

## 13.3 Why strict branding limits matter

Client-specific UI customization creates:

```txt
more QA combinations
more support burden
harder screenshots/training
harder bug reproduction
more visual drift
higher AppCare cost
```

OneDayOS is a productized platform. Normal clients should receive configuration, not bespoke UI design.

## 13.4 Future premium theming

A future premium plan may allow controlled theming, but only through approved tokens:

```txt
client logo
client accent color
possibly light/dark preference
possibly login-screen brand area
```

Even premium theming must not override:

```txt
semantic colors
security states
error colors
layout standards
component structure
```

---

# 14. Dark Mode Rules

## 14.1 Dark mode philosophy

Dark mode is useful for operations teams that work long hours, but it must remain businesslike.

Dark mode should be:

```txt
low-glare
structured
calm
legible
non-neon
```

## 14.2 Dark mode implementation

Tailwind v4 dark mode should use the project-wide custom variant pattern already established in the platform direction:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

## 14.3 Dark mode anti-patterns

Do not create:

```txt
pure black backgrounds everywhere
neon orange text
low-contrast gray text
bright borders everywhere
heavy glowing focus rings
chart colors that fail contrast
```

## 14.4 Dark mode QA

Every design-system component should be checked in light and dark mode.

Required surfaces:

```txt
app shell
sidebar
header
tables
forms
cards
dialogs
dropdowns
tooltips
toasts
empty states
loading states
error states
```

---

# 15. Brand Voice Inside UI

This is not a copywriting manual, but brand experience includes text.

## 15.1 Tone

UI text should be:

```txt
clear
calm
short
useful
businesslike
human
```

Avoid:

```txt
cute messages
marketing fluff
technical jargon
blame language
scary errors
long paragraphs in modals
```

## 15.2 Examples

Bad:

```txt
Oopsie! Something went wrong with your awesome request!
```

Good:

```txt
We could not save this record. Please check the fields and try again.
```

Bad:

```txt
Unauthorized access exception occurred.
```

Good:

```txt
You do not have permission to perform this action.
```

Bad:

```txt
No data lol
```

Good:

```txt
No products yet. Create your first product to start tracking inventory.
```

---

# 16. Component Token Usage

## 16.1 shadcn/ui relationship

shadcn/ui is the component foundation, not the OneDayOS brand system.

Claude may use shadcn/ui primitives, but must apply OneDayOS standards.

Do not accept raw generated shadcn defaults as final product design.

## 16.2 Button usage

Primary button:

```txt
brand orange
used for the primary page action
one primary per major section where possible
```

Secondary button:

```txt
neutral
used for cancel, secondary actions, filters
```

Destructive button:

```txt
danger semantic color
used for delete, void, destructive actions
```

Ghost button:

```txt
low-emphasis toolbar/menu action
```

Do not use brand orange for every button.

## 16.3 Badge usage

Badges must be semantic and consistent.

Examples:

```txt
Active
Inactive
Draft
Submitted
Approved
Rejected
Cancelled
Low Stock
Out of Stock
```

Badge colors must come from semantic states, not module-specific random colors.

## 16.4 Form usage

Forms should use:

```txt
clear labels
help text where needed
tooltips for non-obvious fields
consistent error styling
predictable spacing
```

Do not rely on placeholder text as the only label.

## 16.5 Table usage

Tables should use:

```txt
subtle borders
sticky header where appropriate
clear row hover
compact padding
aligned numbers
status badges
row actions
empty/loading/error states
```

Tables must not look like raw HTML tables or generic admin templates.

---

# 17. Focus and Accessibility Branding

Accessibility is part of brand trust.

## 17.1 Focus states

Every interactive element must have a visible focus state.

Focus styles should be:

```txt
clear
consistent
not ugly
not invisible
not overly bright
```

Use brand color carefully for focus rings, but ensure contrast.

## 17.2 Color contrast

Do not rely on color alone.

Status indicators should combine:

```txt
color
label
icon where useful
position/context
```

Bad:

```txt
green dot only
red text only
```

Good:

```txt
Approved badge
Rejected badge
Low Stock badge
```

---

# 18. Motion Personality

Motion should make OneDayOS feel fast and alive, not animated for decoration.

Use motion for:

```txt
sidebar collapse
row insertion/removal
optimistic updates
dialog entrance
popover entrance
toast appearance
loading skeleton transitions
```

Avoid:

```txt
large page animations
bouncy effects
slow transitions
animated backgrounds
confetti
marketing-style motion inside business workflows
```

Preferred feel:

```txt
fast
subtle
crisp
under 150ms for most micro-interactions
```

Respect reduced-motion preferences.

---

# 19. Business Object Brand Consistency

The brand system must support the architecture.

Business Objects should feel shared across modules.

Examples:

```txt
Product pages should not look like Inventory-only pages.
Customer pages should not look like CRM-only pages.
Employee pages should not look like Leave-only pages.
Supplier pages should not look like Purchasing-only pages.
Warehouse pages should not look like Inventory-only pages.
```

This matters visually because the platform promise is:

```txt
One database.
One login.
Shared business objects.
Shared modules.
```

The UI should reinforce this by using consistent object layouts and not burying shared objects inside module-specific visual language.

---

# 20. Client Safety and Security UI

Brand trust depends on security clarity.

The UI should clearly represent:

```txt
permission denied
module not enabled
organization suspended
record not found
record archived/deleted
session expired
validation errors
```

But it must not leak sensitive security information.

Examples:

Wrong-org access:

```txt
Show: Not found.
Do not show: This organization exists but you are not a member.
```

Permission denied:

```txt
Show: You do not have permission to perform this action.
Do not show: Missing permission inventory.stock_adjustment.approve unless in admin/debug context.
```

Disabled module:

```txt
Show: This module is not available for this organization.
For normal users, often route-level safe 404 is better.
```

---

# 21. Implementation Token Proposal

This section is a starting proposal for Claude. Exact token names may be adjusted during implementation, but the concepts must remain.

```css
@theme {
  /* Brand */
  --color-brand: #F97316;
  --color-brand-hover: #EA580C;
  --color-brand-active: #C2410C;
  --color-brand-soft: #FFF7ED;
  --color-brand-border: #FED7AA;

  /* Core shell */
  --color-navy: #1E3A8A;
  --color-dark-navy: #0D1B2A;

  /* Typography */
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-heading: ui-sans-serif, system-ui, sans-serif;
  --font-body: ui-sans-serif, system-ui, sans-serif;
}
```

Important:

```txt
Use --color-brand.
Do not remap shadcn accent to orange.
```

---

# 22. File and Code Placement

Brand tokens should live in:

```txt
src/app/globals.css
```

Component-level variants should live in component files or shared UI utilities.

Do not scatter arbitrary colors across module files.

Bad:

```tsx
className="bg-[#F97316] text-white"
```

Acceptable during early implementation if token utilities are not ready, but should be migrated to:

```tsx
className="bg-brand text-brand-foreground"
```

or an approved component variant.

Better:

```tsx
<Button variant="primary">Create Product</Button>
```

where the button variant owns the brand token.

---

# 23. Forbidden Patterns

Claude must not generate:

```txt
Bootstrap-like admin dashboards
random gradients
random color palettes per module
large fake dashboard cards
orange hover state everywhere
client-specific CSS forks
module-specific table styles
module-specific form styles
brand color used as warning color everywhere
pure black dark mode
neon dark mode
full custom theme per client
one-off Tailwind arbitrary colors everywhere
hard-coded colors inside business modules
hidden orgId fields in branded forms
security states that leak tenant existence
```

Specific forbidden code patterns:

```tsx
className="bg-orange-500" // in random module code without design-system variant
className="text-[#F97316]" // scattered brand usage
style={{ color: client.brandColor }} // uncontrolled client theming
<input type="hidden" name="orgId" /> // tenant identity in UI form
```

---

# 24. Required UI Review Questions

Every new platform screen should be reviewed with these questions:

```txt
Does this look like OneDayOS or a generic admin template?
Is the brand color used intentionally?
Is the page too empty or too noisy?
Is the hierarchy obvious?
Are tables dense but readable?
Are forms calm and clear?
Are status colors semantic?
Would this still work for another module?
Would this still work for another client?
Does this screen accidentally imply a client-specific fork?
Does this screen hide security complexity without bypassing it?
```

If the answer is weak, do not ship the UI as the design-system example.

---

# 25. Testing Requirements

The Brand System itself is not mostly tested through unit tests, but its rules should become enforceable through:

```txt
component tests
visual review
storybook or preview gallery later
architecture checks
lint rules where possible
snapshot tests for stable token outputs if useful
```

## 25.1 Required early checks

At minimum, the restarted UI build should verify:

```txt
brand tokens exist
dark mode variant works
Button primary uses brand token
Button destructive does not use brand token
sidebar active state uses approved styling
tables use shared table component
generated modules do not define arbitrary brand palettes
client forms do not submit orgId
```

## 25.2 Future visual regression

Visual regression is deferred until the design system stabilizes.

Do not add heavy visual-regression tooling during the first restarted build unless explicitly approved.

---

# 26. Claude Implementation Rules

When Claude implements the Brand System:

Claude must:

```txt
use approved tokens
preserve shadcn neutral accent behavior
create reusable component variants
avoid arbitrary colors in module code
support light and dark mode
keep UI dense and calm
use semantic status colors
ensure accessibility/focus states
```

Claude must not:

```txt
override shadcn accent with orange
generate stock admin dashboard UI
add random colors per module
create client-specific CSS files
create a white-label theme engine
add complex theming infrastructure
use brand color as all-purpose status color
hide orgId in forms
change security behavior for visual convenience
```

---

# 27. Implementation Prompt for Claude

Use this prompt when implementing the Brand System:

```md
You are implementing the OneDayOS Brand System.

Authoritative documents:
- docs/engineering-manual/03-design-system/00-design-vision.md
- docs/engineering-manual/03-design-system/01-brand-system.md

Rules:
- Do not invent a new visual identity.
- Do not make OneDayOS look like a generic admin template.
- Use `--color-brand` for OneDayOS orange.
- Do not override shadcn's generic `accent` token with orange.
- Do not scatter arbitrary colors across module code.
- Do not create client-specific CSS forks.
- Support light and dark mode.
- Preserve accessibility and visible focus states.
- Do not add a full theme-builder or white-label system.
- Do not include hidden orgId fields in forms.

Task:
Implement only the foundational brand tokens, base theme rules, and component variant adjustments required by this document.

Stop and report if the existing component system makes any rule ambiguous.
```

---

# 28. Acceptance Criteria

This document is accepted when:

```txt
[ ] OneDayOS brand personality is clear.
[ ] Brand orange is defined as `brand`, not shadcn `accent`.
[ ] Semantic colors are separated from brand color.
[ ] Typography rules are defined.
[ ] Spacing/density direction is defined.
[ ] Radius/border/shadow direction is defined.
[ ] Icon rules are defined.
[ ] Client branding limits are defined.
[ ] Dark mode rules are defined.
[ ] Forbidden UI patterns are explicit.
[ ] Claude implementation rules are explicit.
[ ] The document prevents generic SaaS/admin template output.
```

Implementation is accepted later when:

```txt
[ ] Brand tokens exist in the app.
[ ] shadcn neutral accent behavior is preserved.
[ ] Primary UI actions use brand intentionally.
[ ] Tables/forms/cards do not use random module-specific colors.
[ ] Light and dark mode both work.
[ ] The app shell feels like OneDayOS, not a starter template.
```

---

# 29. Final Rule

The OneDayOS brand should not scream.

It should quietly communicate:

```txt
This system is fast.
This system is organized.
This system is trustworthy.
This system can run your business.
```

The best brand system for OneDayOS is not the loudest one.

It is the one that makes daily business work feel calm, clear, and fast.

# OneDayOS Engineering Manual — 03 Design System / 08 Accessibility Standards

**Document ID:** `03-design-system/08-accessibility-standards.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Author:** ChatGPT (GPT-5.5)  
**Date:** July 2026  
**Implementation Status:** Required Before Restarted Platform UI Build  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `03-design-system/00-design-vision.md`
- `03-design-system/01-brand-system.md`
- `03-design-system/02-layout-system.md`
- `03-design-system/03-component-standards.md`
- `03-design-system/04-table-standards.md`
- `03-design-system/05-form-standards.md`
- `03-design-system/06-empty-loading-error-states.md`
- `03-design-system/07-interaction-motion-standards.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `13-security/02-tenant-isolation.md`
- `13-security/03-permission-enforcement.md`
- `14-testing-quality/04-ui-testing.md`

---

# 1. Purpose

This document defines the accessibility standards for the OneDayOS user interface.

OneDayOS is intended for Philippine SMEs, where users may include owners, admins, warehouse staff, HR staff, accounting staff, receptionists, operations teams, and non-technical employees. Accessibility is not only a compliance concern. It is a product quality concern.

A business operating system should be usable by people who:

- rely on keyboard navigation,
- use screen readers,
- have low vision,
- have motor limitations,
- are temporarily injured,
- are using low-quality hardware,
- work in noisy or high-pressure environments,
- are tired, distracted, or working quickly,
- are not technically confident.

Accessibility helps everyone. A keyboard-accessible, clearly labeled, well-structured interface is faster for power users and less confusing for new users.

The goal is:

```txt
OneDayOS should be premium, fast, beautiful, and accessible by default.
```

---

# 2. Accessibility Doctrine

## 2.1 Accessibility is part of the design system

Accessibility must not be treated as something added after UI implementation.

It belongs inside:

```txt
components
forms
tables
dialogs
navigation
tooltips
empty states
loading states
error states
motion
keyboard behavior
focus states
generated modules
```

If the shared components are accessible, every generated module becomes more accessible by default.

If shared components are inaccessible, every generated module scales that mistake.

## 2.2 Accessibility is not optional for generated modules

Generated module UI must follow the same accessibility rules as hand-written UI.

The module generator must not output:

```txt
unlabeled inputs
buttons with only icons and no accessible name
clickable divs
missing focus states
forms without error association
dialogs without focus management
tables without semantic structure
motion that ignores reduced-motion settings
```

## 2.3 Accessibility does not replace security

Accessible UI can hide or show actions based on permissions, but security is enforced by APIs and services.

This is usability:

```txt
Hide “Approve” button for user without approval permission.
```

This is security:

```txt
API rejects approval request with 403 if permission is missing.
```

Both are required.

## 2.4 Accessibility must not leak tenant information

Accessibility text must not reveal data from another organization.

Bad:

```txt
aria-label="You cannot access Acme Corporation's inventory"
```

Good:

```txt
aria-label="Organization not found"
```

Wrong-org access must remain tenant-safe even in:

```txt
page titles
error messages
aria-labels
toasts
screen-reader-only text
logs shown in UI
```

## 2.5 Accessibility should support speed

OneDayOS should be keyboard-friendly and fast. Accessibility and speed are not enemies.

Good accessibility makes the product faster through:

```txt
clear focus order
predictable keyboard shortcuts
semantic buttons
proper labels
quick form navigation
stable table controls
visible focus rings
reduced cognitive load
```

---

# 3. Reference Standard

OneDayOS should use **WCAG 2.2 AA** as its practical accessibility target for the application UI.

This does not mean OneDayOS claims formal WCAG certification in the MVP. It means that when designing and implementing components, OneDayOS should use WCAG 2.2 AA as the baseline decision reference.

WCAG 2.2 is organized around four principles:

```txt
Perceivable
Operable
Understandable
Robust
```

For OneDayOS, these translate to:

```txt
Perceivable      → users can see, read, or otherwise perceive what the interface is showing
Operable         → users can use the interface with keyboard, pointer, and assistive tech
Understandable   → users can understand labels, errors, workflows, and consequences
Robust           → the UI works with browsers, assistive technologies, and semantic HTML
```

Important note:

```txt
WCAG is the baseline.
The OneDayOS design system is the implementation standard.
```

---

# 4. Scope

This document applies to:

```txt
app shell
sidebar
header
navigation
command menu future
dashboards
tables
forms
buttons
links
dialogs
sheets
dropdowns
selects
comboboxes
tooltips
popovers
toasts
empty states
loading states
error states
permission-denied states
settings screens
Business Object screens
module screens
generated module UI
future Platform Service UI
future AI UI
```

---

# 5. Non-Goals

This document does not implement:

```txt
formal accessibility audit program
external certification
screen reader testing lab
advanced keyboard shortcut system
command menu implementation
voice interface
AI accessibility assistant
custom accessibility settings panel
high-contrast theme beyond token support
mobile app accessibility
```

Those may come later, but the restarted platform UI must still be built with accessible foundations.

---

# 6. Core Rules

## 6.1 Use semantic HTML first

Use native HTML semantics wherever possible.

Prefer:

```tsx
<button type="button">Delete</button>
<a href="/demo/inventory">Inventory</a>
<nav aria-label="Primary navigation">...</nav>
<table>...</table>
<label htmlFor="name">Name</label>
<input id="name" />
```

Avoid:

```tsx
<div onClick={handleDelete}>Delete</div>
<span onClick={navigate}>Inventory</span>
<div role="button">Save</div>
```

Only use ARIA when native semantics are insufficient.

Bad ARIA cannot rescue bad HTML.

## 6.2 Every interactive element must be keyboard reachable

Every action that can be performed with a mouse must be possible with a keyboard.

This includes:

```txt
sidebar navigation
table row actions
filter controls
form submission
dialog open/close
menu items
tabs
dropdowns
selects
pagination
bulk action menus
settings toggles
```

If a user cannot use a feature without a mouse, the feature is incomplete.

## 6.3 Every interactive element must have an accessible name

Icon-only buttons must include an accessible label.

Good:

```tsx
<Button aria-label="Delete product">
  <Trash2 aria-hidden="true" />
</Button>
```

Bad:

```tsx
<Button>
  <Trash2 />
</Button>
```

Decorative icons should use:

```tsx
aria-hidden="true"
```

Meaningful icons need text or an accessible label.

## 6.4 Focus must always be visible

Keyboard users must always know where they are.

Every interactive component must have a visible focus state.

Focus rings should be:

```txt
visible
consistent
brand-compatible
not removed by CSS reset
not color-only when possible
```

Forbidden:

```css
*:focus {
  outline: none;
}
```

Unless replaced with an equal or better visible focus indicator.

## 6.5 Do not rely on color alone

Color can support meaning, but cannot be the only signal.

Bad:

```txt
Red text only means error.
Green text only means success.
Orange dot only means pending.
```

Good:

```txt
Error icon + error text + red color
Success label + check icon + green color
Pending badge text + icon + neutral/warning color
```

Status badges must include readable text.

## 6.6 Motion must respect reduced motion

Animations must respect users who prefer reduced motion.

Motion should be disabled or simplified when:

```txt
prefers-reduced-motion: reduce
```

Motion should clarify state changes, not distract.

## 6.7 Loading states must not trap users

Loading states must:

```txt
announce pending status where appropriate
keep layout stable
not remove focus unexpectedly
not spin forever without fallback
not block unrelated page controls when unnecessary
```

Skeletons are preferred over large spinners.

## 6.8 Error states must be understandable

Errors must explain:

```txt
what happened
what the user can do next
which field needs correction, if applicable
whether the action was saved or rolled back
```

Errors must not expose:

```txt
raw Prisma errors
SQL errors
Supabase internals
stack traces
secret values
other organization names
raw JSON dumps
```

---

# 7. Keyboard Navigation Standards

## 7.1 Global keyboard expectations

The app must support:

```txt
Tab       → move forward through interactive controls
Shift+Tab → move backward
Enter     → activate primary focused button/link where appropriate
Space     → activate focused button/toggle/checkbox
Escape    → close dialogs, menus, popovers, sheets where appropriate
Arrow keys → navigate menu/listbox/tab/table controls where supported
```

Do not hijack these keys globally unless there is a strong reason.

## 7.2 Tab order must follow visual order

Tab order should generally match the visible layout.

Bad:

```txt
Tab jumps from sidebar to footer to table action to header.
```

Good:

```txt
Header controls → sidebar/nav if applicable → page toolbar → filters → table/form → pagination/actions
```

Do not use positive `tabIndex` values.

Forbidden:

```tsx
<div tabIndex={5}>...</div>
```

Allowed only in narrow cases:

```tsx
<div tabIndex={-1}>...</div>
```

for managed focus targets such as error summary containers or dialog headings.

## 7.3 Sidebar keyboard behavior

Sidebar links must be real links.

Good:

```tsx
<Link href="/demo/inventory">Inventory</Link>
```

Bad:

```tsx
<div onClick={() => router.push('/demo/inventory')}>Inventory</div>
```

Sidebar must support:

```txt
Tab through visible links
Enter to navigate
visible focus state
clear active state
collapsed state with accessible labels
```

Collapsed sidebar icons must retain accessible labels.

Example:

```tsx
<Link href="/demo/inventory" aria-label="Inventory">
  <Package aria-hidden="true" />
</Link>
```

## 7.4 Table keyboard behavior

Tables must be usable without a mouse.

Minimum table keyboard support:

```txt
Tab reaches toolbar controls
Tab reaches row action menus/buttons
Enter/Space activates row buttons
Escape closes row menus
Pagination controls are keyboard reachable
Filters are keyboard reachable
```

Advanced spreadsheet-like navigation is deferred.

Do not build fake grid behavior until needed.

## 7.5 Forms keyboard behavior

Forms must support:

```txt
Tab through fields in logical order
Enter submits simple forms when safe
Escape closes containing dialog/sheet when applicable
field-level errors announced clearly
primary action reachable after fields
cancel/back action reachable without mouse
```

Dangerous workflow actions may require explicit button activation instead of accidental Enter submission.

Examples:

```txt
Posting stock adjustment
Approving leave request
Marking expense claim as paid
Voiding purchase receipt
```

---

# 8. Focus Management Standards

## 8.1 Page navigation focus

After route changes, focus should land in a predictable place.

Recommended target:

```txt
main page heading
```

At minimum, page headings must be semantic and discoverable.

## 8.2 Dialog focus

Dialogs and sheets must:

```txt
move focus inside on open
trap focus while open
return focus to trigger on close
close with Escape unless action is destructive or blocked
have accessible title
have accessible description when needed
```

Use shadcn/Radix primitives correctly instead of hand-rolling focus traps.

Bad:

```tsx
{open && <div className="fixed inset-0">...</div>}
```

Good:

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete product</DialogTitle>
      <DialogDescription>
        This will archive the product record.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

## 8.3 Error focus

When form submission fails, focus should move to:

```txt
the first invalid field
```

or an error summary that links to invalid fields.

For simple MVP forms, first invalid field focus is enough.

## 8.4 Optimistic rollback focus

When an optimistic action fails and rolls back, focus must not disappear.

Example:

```txt
User deletes table row
row disappears optimistically
server rejects delete
row returns
focus should return to a sensible control, such as the restored row action or table container
```

The user should not be stranded at the top of the page.

---

# 9. Form Accessibility Standards

## 9.1 Labels are mandatory

Every form control must have a visible label or an explicitly justified accessible label.

Good:

```tsx
<Label htmlFor="product-name">Product name</Label>
<Input id="product-name" />
```

Allowed for search fields:

```tsx
<label className="sr-only" htmlFor="product-search">Search products</label>
<Input id="product-search" placeholder="Search products..." />
```

Bad:

```tsx
<Input placeholder="Name" />
```

Placeholder text is not a label.

## 9.2 Errors must be associated with fields

Field errors must be associated with the input.

Recommended pattern:

```tsx
<Input
  id="product-name"
  aria-invalid={!!errors.name}
  aria-describedby={errors.name ? 'product-name-error' : undefined}
/>
{errors.name && (
  <p id="product-name-error" role="alert">
    Product name is required.
  </p>
)}
```

## 9.3 Required fields must be clear

Required fields should be visually and semantically clear.

Acceptable:

```tsx
<Label htmlFor="name">
  Name <span aria-hidden="true">*</span>
</Label>
```

Avoid relying only on an asterisk without explanation.

## 9.4 Help text and tooltips

Use help text for persistent guidance.

Use tooltips for brief clarification.

Good help text:

```txt
Used as the product code shown in tables and reports.
```

Good tooltip:

```txt
The stock unit, such as pcs, kg, or liters.
```

Bad tooltip:

```txt
This field controls a lot of complex inventory calculations across modules and affects reporting, warehouse balances, low stock notifications, and future accounting workflows...
```

If the explanation is long, improve the label or add inline help text.

## 9.5 Relation fields must be accessible and tenant-safe

Relation selectors must:

```txt
have labels
support keyboard search/selection
show loading and empty states
not expose records from another organization
not rely only on color
revalidate selected IDs server-side
```

Example relation fields:

```txt
Employee host
Product
Warehouse
Supplier
Customer
Branch
Department
```

## 9.6 Forms must never submit orgId

Forbidden:

```tsx
<input type="hidden" name="orgId" value={orgId} />
```

Forbidden:

```ts
body: JSON.stringify({ ...formData, orgId })
```

Tenant identity comes from:

```txt
session
+ orgSlug route
+ verified PlatformContext
```

This is both a security and accessibility rule. Hidden tenant fields create invisible, dangerous behavior.

---

# 10. Table Accessibility Standards

## 10.1 Use semantic tables for data tables

Data tables should use real table elements:

```tsx
<table>
  <thead>
  <tbody>
  <tr>
  <th>
  <td>
</table>
```

Do not use only divs for tabular data unless implementing a fully accessible grid pattern, which is deferred.

## 10.2 Column headers must be clear

Column headers should describe the data.

Bad:

```txt
Info
Value
Data
```

Good:

```txt
Product
SKU
Warehouse
Available stock
Status
Last updated
```

## 10.3 Row actions must be accessible

Icon-only row actions must include labels.

Good:

```tsx
<Button aria-label="Edit product Acme Bolt">
  <Pencil aria-hidden="true" />
</Button>
```

Better if visible text fits:

```tsx
<Button>Edit</Button>
```

## 10.4 Empty and filtered-empty states must be distinct

Empty table:

```txt
No products yet. Create your first product to start tracking inventory.
```

Filtered empty:

```txt
No products match your filters. Try clearing search or adjusting filters.
```

Screen reader users should understand the difference.

## 10.5 Sorting must be announced

Sortable column headers must expose state.

Example:

```tsx
<button aria-sort="ascending">Product name</button>
```

or use a tested table abstraction that handles this correctly.

Sorting must use allowlisted fields only.

Raw Prisma `orderBy` from the client is forbidden.

## 10.6 Table status badges must include text

Bad:

```txt
green dot only
red dot only
orange dot only
```

Good:

```txt
Active
Inactive
Pending
Approved
Rejected
Void
Low stock
```

---

# 11. Navigation Accessibility Standards

## 11.1 Use landmarks

The application shell should use semantic landmarks.

Recommended structure:

```tsx
<body>
  <aside>...</aside>
  <header>...</header>
  <main id="main-content">...</main>
</body>
```

Use:

```tsx
<nav aria-label="Primary navigation">
```

for the sidebar.

## 11.2 Provide skip link

The app shell should include a skip link.

Example:

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

## 11.3 Active navigation must be semantic and visual

Active nav should be visible and accessible.

Use:

```tsx
aria-current="page"
```

for the current page or active route group where appropriate.

Do not rely only on orange background.

## 11.4 Collapsed sidebar must remain understandable

When the sidebar is collapsed:

```txt
icons need accessible labels
active state remains visible
keyboard users can still navigate
screen readers still get meaningful link text
```

## 11.5 Business Object navigation must be clear

Business Object pages should not imply module ownership.

Good:

```txt
Records
  Employees
  Products
  Customers
  Suppliers
  Warehouses
```

Bad:

```txt
Inventory
  Products
  Warehouses
CRM
  Customers
Leave
  Employees
```

This is not only architecture. It affects user understanding.

---

# 12. Dialog, Sheet, Dropdown, Tooltip, and Popover Standards

## 12.1 Dialogs

Dialogs are for focused tasks or confirmations.

Requirements:

```txt
accessible title
accessible description when needed
focus trap
Escape handling
focus return
clear primary and secondary actions
```

Destructive dialogs must explain consequences.

Example:

```txt
Archive product?
This hides the product from normal lists. Historical records that reference it will remain available.
```

## 12.2 Sheets

Sheets are for side-panel workflows such as quick view or edit.

Requirements:

```txt
accessible title
logical focus order
Escape handling
focus return
save/cancel actions
mobile behavior
```

Do not use sheets as dumping grounds for complex multi-step workflows.

## 12.3 Dropdown menus

Dropdown menus must support:

```txt
keyboard navigation
Escape close
focus return
accessible item labels
separators only when meaningful
```

Do not place complex forms inside dropdown menus.

## 12.4 Tooltips

Tooltips are for short, non-essential clarification.

Rules:

```txt
1–2 sentences max
not required to complete the task
not the only place where critical information appears
not interactive
not used for long documentation
```

If information is required to understand the field, use visible help text instead.

## 12.5 Popovers

Popovers may contain richer controls, but must be keyboard accessible.

Examples:

```txt
filter popover
date picker
column visibility menu
quick actions
```

Popover controls must be labeled and reachable by keyboard.

---

# 13. Toast and Alert Standards

## 13.1 Toasts are supplemental feedback

Toasts should not be the only place critical information appears.

Good toast:

```txt
Product created.
```

Good error toast:

```txt
Could not delete product. Your changes were rolled back.
```

Bad toast:

```txt
P2002 exception on unique constraint orgId_code.
```

## 13.2 Toasts must be concise

Toasts should be short and actionable.

Avoid turning toasts into documentation.

## 13.3 Form errors should not be toast-only

If a form field is invalid, show the error near the field.

Toast may be used for global failure, but not as the only validation surface.

## 13.4 Optimistic rollback must be announced

When optimistic UI rolls back, the user must know.

Example:

```txt
Could not archive product. The row has been restored.
```

---

# 14. Color, Contrast, and Visual Clarity

## 14.1 Use semantic colors

Color categories:

```txt
brand
neutral
success
warning
danger
info
muted
```

Do not use brand orange for every important state.

Brand orange is not warning.

## 14.2 Contrast target

Text and interactive controls should target WCAG 2.2 AA contrast expectations.

Practical rule:

```txt
If text feels subtle but is required to complete a task, it is probably too subtle.
```

Muted text is acceptable for secondary information, but not for:

```txt
field labels
error messages
primary actions
table values users must read
permission warnings
status labels
```

## 14.3 Dark mode

Dark mode must preserve:

```txt
readability
focus visibility
status clarity
border visibility
input clarity
error clarity
```

Do not use pure black backgrounds by default.

Dark mode should be calm, low-glare, and operational.

## 14.4 Focus color

Focus color should be visible in both light and dark mode.

Use a consistent focus token rather than arbitrary per-component colors.

---

# 15. Motion and Reduced Motion

## 15.1 Official motion package

For the restarted build, use:

```txt
motion
```

with imports from:

```ts
motion/react
```

Do not introduce new `framer-motion` imports in restarted code.

## 15.2 Motion usage

Use motion for:

```txt
row add/remove transitions
optimistic rollback clarity
dialog/sheet enter/exit
subtle page section entrance
layout changes
status transitions
```

Do not use motion for:

```txt
confetti
bouncy ERP pages
slow route transitions
marketing-style animation in business workflows
decorative background movement
```

## 15.3 Reduced motion

If user prefers reduced motion:

```txt
remove non-essential motion
shorten essential transitions
avoid large layout movement
preserve meaning with non-motion cues
```

Reduced motion must not remove functionality.

---

# 16. Screen Reader Standards

## 16.1 Page titles and headings

Every page must have one clear primary heading.

Good:

```txt
Products
Stock adjustments
Leave requests
Visitor log
Incident reports
```

Avoid multiple competing `h1` elements in normal content.

## 16.2 Buttons and links

Buttons perform actions.

Links navigate.

Bad:

```tsx
<Button onClick={() => router.push('/demo/products')}>Products</Button>
```

Good:

```tsx
<Link href="/demo/products">Products</Link>
```

Bad:

```tsx
<Link href="#" onClick={deleteRecord}>Delete</Link>
```

Good:

```tsx
<Button onClick={deleteRecord}>Delete</Button>
```

## 16.3 Live regions

Use live regions sparingly for important async updates.

Examples:

```txt
form submission success/failure
optimistic rollback
background save failure
large table filter result count updates
```

Do not spam screen readers with every tiny loading state.

## 16.4 Hidden text

Use `sr-only` text for accessibility support, but do not use it to hide critical visual information from sighted users.

Good:

```tsx
<span className="sr-only">Delete product Acme Bolt</span>
```

Bad:

```tsx
<span className="sr-only">This action permanently deletes data and cannot be undone</span>
```

when sighted users do not see that same warning.

---

# 17. Responsive and Mobile Accessibility

## 17.1 Mobile is not primary, but must not break

OneDayOS is primarily an internal business desktop/tablet product, but mobile must remain usable for basic workflows.

Examples:

```txt
approving leave
checking visitor status
viewing inventory item
creating quick incident report
```

## 17.2 Touch targets

Interactive targets should be large enough for touch use on mobile/tablet.

Do not make row action icons too tiny.

## 17.3 Mobile forms

Mobile forms must:

```txt
have readable labels
avoid horizontal scrolling
use appropriate input types
preserve error visibility
keep primary action reachable
```

## 17.4 Mobile tables

For MVP, responsive table strategies may include:

```txt
horizontal scroll with clear affordance
column reduction
card-style mobile rows for key tables
```

Do not destroy table semantics unnecessarily.

---

# 18. Accessibility and Security Boundaries

## 18.1 Permission-aware UI

Permission-aware UI should improve usability.

Examples:

```txt
hide create button if user cannot create
hide approval action if user cannot approve
hide export action if user cannot export
show permission-denied state when route is accessible but action is forbidden
```

But APIs and services must still enforce all permissions.

## 18.2 Tenant-safe error messages

Wrong-org access must not reveal that another organization exists.

Bad:

```txt
You do not have access to Acme Corporation.
```

Good:

```txt
Organization not found.
```

## 18.3 Tenant identity must not appear in forms

Do not include `orgId` in:

```txt
visible fields
hidden fields
aria labels
data attributes submitted from client
query params for tenant-scoped actions
client-side form state
```

Use `orgSlug` only as route locator. Server verifies membership and creates `PlatformContext`.

## 18.4 Screen reader text must follow same data rules

Screen-reader-only content must not contain sensitive or cross-tenant data that is not visible or authorized.

---

# 19. Component-Specific Accessibility Checklist

## 19.1 Button

Must have:

```txt
visible label or aria-label
type="button" unless submitting form
visible focus state
disabled/pending state
keyboard activation
```

Icon-only buttons need `aria-label`.

## 19.2 Link

Must have:

```txt
real href
meaningful text
visible focus state
aria-current when active navigation
```

Do not use links for destructive actions.

## 19.3 Input

Must have:

```txt
label
id
error association
help text if needed
autocomplete where appropriate
aria-invalid on error
```

## 19.4 Select / Combobox

Must have:

```txt
label
keyboard navigation
search where useful
loading state
empty state
selected value announcement
server-side validation of selected ID
```

## 19.5 Dialog / Sheet

Must have:

```txt
title
description where needed
focus trap
Escape handling
focus return
keyboard reachable actions
```

## 19.6 Table

Must have:

```txt
semantic table structure
clear headers
keyboard-reachable controls
empty/loading/error states
accessible row actions
permission-aware actions
```

## 19.7 Badge

Must have:

```txt
visible text
semantic color
not color-only
clear meaning
```

## 19.8 Toast

Must have:

```txt
concise message
no raw technical error
rollback clarity when relevant
not the only surface for field validation
```

---

# 20. Generated Module Requirements

Every generated module UI must include accessibility-safe defaults.

The module generator must generate:

```txt
semantic page heading
server-resolved page context
table with semantic headers
empty/loading/error states
forms with labels
forms with field errors
no hidden orgId fields
buttons with accessible labels
row actions with accessible names
permission-aware action visibility
keyboard-reachable controls
visible focus states
Motion usage that respects reduced motion
```

Generated modules must not generate:

```txt
clickable divs
placeholder-only labels
icon-only buttons without aria-label
hidden orgId inputs
client-side tenant resolution
raw technical error messages
unmanaged custom dialogs
stock admin-template card walls
```

---

# 21. Testing Requirements

Accessibility must be covered by multiple test layers.

## 21.1 Unit/component tests

Component tests should verify:

```txt
labels render
inputs are associated with labels
buttons have accessible names
dialog titles render
form errors are associated with fields
empty states are meaningful
table row actions are keyboard reachable where practical
permission-hidden actions are not visible for unauthorized users
```

Use Testing Library queries that match user behavior:

```tsx
screen.getByRole('button', { name: /create product/i })
screen.getByLabelText(/product name/i)
screen.getByRole('heading', { name: /products/i })
```

Avoid brittle queries:

```tsx
container.querySelector('.btn-primary')
screen.getByTestId('submit')
```

`data-testid` is allowed only when role/label/text queries are not practical.

## 21.2 Architecture checks

`check:architecture` should block:

```txt
client components importing @/sdk/server
client components importing @/kernel/*
module UI importing raw Prisma
hidden orgId inputs
body: JSON.stringify({ ..., orgId })
old framer-motion imports in restarted code
clickable div anti-patterns where detectable
```

Some accessibility issues cannot be statically detected, but dangerous known patterns should be blocked.

## 21.3 Manual keyboard checks

Before shipping a major UI surface, manually verify:

```txt
Tab order is logical
focus is visible
forms can be completed without mouse
dialogs trap and return focus
Escape closes overlays
table actions are reachable
no keyboard traps exist
```

## 21.4 Browser/E2E checks

Later Playwright smoke tests should cover:

```txt
login keyboard flow
sidebar navigation
create form flow
table action flow
dialog confirmation flow
permission-denied UI
wrong-org safe error UI
```

## 21.5 Axe-style automated checks

Automated accessibility checks may be added later.

They are useful but not sufficient.

They can catch:

```txt
missing labels
low contrast in some cases
invalid ARIA
missing landmark issues
```

They cannot fully prove:

```txt
workflow clarity
business language quality
tenant-safe messaging
permission correctness
keyboard usefulness
screen reader experience quality
```

---

# 22. Claude Implementation Rules

When implementing OneDayOS UI, Claude must follow these rules.

Claude must:

```txt
use semantic HTML first
use shadcn/Radix primitives correctly
label every form field
add accessible names for icon-only actions
preserve visible focus states
avoid hidden orgId fields
use server-derived PlatformContext for data access
respect reduced motion
use Motion for React through motion/react in restarted code
write UI tests using role/label/text queries
include empty/loading/error states
avoid raw technical error messages
```

Claude must not:

```txt
create clickable divs for buttons or links
remove focus outlines without replacement
use placeholder text as the only label
create icon-only buttons without aria-label
place orgId in hidden inputs
use client-side permission checks as security
show wrong-org names in error UI
render raw Prisma/Supabase/SQL errors
hand-roll focus traps
add global keyboard shortcuts casually
add stock admin-template UI
ignore reduced-motion preference
```

If Claude is unsure whether a UI pattern is accessible, it should stop and ask for architectural/design review instead of inventing a shortcut.

---

# 23. Acceptance Criteria

This document is ready to freeze when the founder/architect confirms:

```txt
[ ] WCAG 2.2 AA is accepted as the practical target baseline.
[ ] Semantic HTML first rule is accepted.
[ ] Keyboard accessibility rules are accepted.
[ ] Focus management rules are accepted.
[ ] Form accessibility rules are accepted.
[ ] Table accessibility rules are accepted.
[ ] Dialog/sheet/dropdown/tooltip rules are accepted.
[ ] Motion/reduced-motion rules are accepted.
[ ] Tenant-safe accessibility messaging rules are accepted.
[ ] Generated module accessibility requirements are accepted.
[ ] Testing expectations are accepted.
[ ] Claude implementation restrictions are accepted.
```

---

# 24. Implementation Gate

Before Claude builds or restarts the platform UI:

```txt
[ ] Shared button component follows accessible naming/focus standards.
[ ] Shared input/form components support labels and errors.
[ ] Shared dialog/sheet patterns handle focus correctly.
[ ] Shared table component uses semantic structure.
[ ] Shared empty/loading/error components are written.
[ ] App shell includes semantic landmarks.
[ ] Sidebar supports keyboard navigation and aria-current.
[ ] Collapsed sidebar preserves accessible labels.
[ ] Forms do not include hidden orgId fields.
[ ] Motion uses motion/react and respects reduced motion.
[ ] Component tests use accessible queries.
[ ] Architecture checks block obvious unsafe UI patterns.
```

---

# 25. Final Rule

Accessibility is not a separate layer of OneDayOS.

It is part of how OneDayOS becomes a serious business operating system.

The final rule:

```txt
If a user cannot understand it, reach it, focus it, operate it, or recover from its failure,
the UI is not finished.
```

---

# 26. References

- W3C Web Content Accessibility Guidelines (WCAG) 2.2: https://www.w3.org/TR/WCAG22/
- W3C WCAG Overview: https://www.w3.org/WAI/standards-guidelines/wcag/
- W3C Understanding WCAG 2.2: https://www.w3.org/WAI/WCAG22/Understanding/

---

# ADR-0011 Accessibility Governance Amendment

ADR-0011 clarifies the official language: OneDayOS targets WCAG 2.2 Level AA.

This is a practical design, implementation, and review target. It is not a formal certification claim.

Accessibility evaluation must combine:

```txt
[ ] semantic HTML and design-system rules
[ ] keyboard review
[ ] component and UI tests where feasible
[ ] automated accessibility checks when approved tooling exists
[ ] manual task-based review
```

See `14-testing-quality/09-ux-conformance-testing.md` for the planned UX and accessibility conformance model.

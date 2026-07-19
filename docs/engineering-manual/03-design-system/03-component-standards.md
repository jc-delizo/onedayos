# OneDayOS Engineering Manual

# 03 Design System — 03 Component Standards

**Status:** Draft for Founder Review  
**Version:** 1.0  
**Owner:** Founder / Architect  
**Last Updated:** July 2026  
**Implementation Allowed:** Required before restarted platform UI build  
**Supersedes:** None  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `03-design-system/00-design-vision.md`
- `03-design-system/01-brand-system.md`
- `03-design-system/02-layout-system.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `13-security/04-api-security.md`
- `14-testing-quality/04-ui-testing.md`

---

# ADR-Backed Amendment — 2026-07

ADR-0012 accepts `OneDayOS Compact` as the active design preset.

This amends the shadcn language in this document for the current implementation:

- current audited custom OneDayOS components remain the implementation base
- shadcn/ui is source/reference material only unless a later ADR approves migration
- `npx shadcn init` and `npx shadcn add` must not overwrite audited components
- Lucide is the approved icon family for shared chrome and common actions
- the active preset uses system UI typography, zinc-neutral content surfaces, deep-navy app shell tokens, and brand-orange primary actions

# 1. Purpose

This document defines the component standards for the restarted OneDayOS platform UI.

The goal is not to create a decorative component library.

The goal is to create a reliable product interface that makes every OneDayOS module feel like part of the same business operating system.

OneDayOS components must be:

```txt
consistent
premium
fast
data-dense
accessible
keyboard-friendly
tenant-safe
permission-aware
AI/generator-friendly
```

A component in OneDayOS is not only a visual element. It is part of the platform contract.

If components are inconsistent, Claude will generate inconsistent modules. If components are generic, OneDayOS will feel like a generic admin starter. If components are not secure by design, future modules will accidentally submit tenant IDs, hide permissions instead of enforcing them, or make unsafe assumptions.

---

# 2. Design Position

OneDayOS uses shadcn/ui and Radix-style primitives as the base component layer, but shadcn/ui is not the OneDayOS design system.

The OneDayOS design system is the set of decisions that define:

```txt
when to use a component
how it behaves
how it looks
how it handles loading
how it handles errors
how it handles permissions
how it handles keyboard interaction
how it handles optimistic updates
how it handles motion
how generated modules use it
```

The component system must make generated modules look intentional, not scaffolded.

---

# 3. Component Layering

OneDayOS should use four component layers.

```txt
Layer 1 — Primitive UI Components
  Button, Input, Label, Dialog, Sheet, Badge, Tooltip, Select, Tabs
  Mostly shadcn/ui-based.

Layer 2 — OneDayOS Foundation Components
  PageHeader, PageShell, SectionHeader, EmptyState, ErrorState,
  LoadingSkeleton, ConfirmDialog, PermissionGate, HelpTooltip.

Layer 3 — Business UI Components
  DataTable, DetailHeader, StatusBadge, ActivityPlaceholder,
  ObjectPicker, RelationSelect, FormSection, FieldRow.

Layer 4 — Module Components
  InventoryStockLevelTable, LeaveRequestForm,
  CrmOpportunityStageBadge, ExpenseClaimLines.
```

Important:

```txt
Modules may compose platform components.
Modules may not redefine core component patterns.
```

Bad:

```txt
Inventory creates its own generic table system.
CRM creates its own form layout.
Leave creates its own status badge style.
Expenses creates a custom modal pattern.
```

Good:

```txt
Inventory uses DataTable.
CRM uses FormSection.
Leave uses StatusBadge.
Expenses uses ConfirmDialog.
```

---

# 4. Technology Choices

## 4.1 shadcn/ui

Use shadcn/ui as the base primitive system.

Allowed:

```txt
button
input
label
textarea
select
checkbox
dropdown-menu
dialog
sheet
popover
tooltip
command
badge
card
table
tabs
separator
skeleton
avatar
sonner
scroll-area
```

Rules:

```txt
Do not style every component from scratch.
Do not create competing Button/Input/Dialog systems.
Do not scatter one-off Tailwind class soups across modules.
Do not override shadcn neutral accent with brand orange.
Use OneDayOS wrappers when behavior must be standardized.
```

## 4.2 Motion / Framer Motion

Yes, OneDayOS should use motion.

But for the restarted build, the preferred package is the current **Motion for React** package:

```bash
npm install motion
```

Preferred imports:

```ts
import { motion, AnimatePresence } from 'motion/react'
```

The older name “Framer Motion” may still be used conversationally, but Claude should use the current Motion package/imports unless a compatibility decision says otherwise.

Motion is allowed for:

```txt
layout changes
list insert/remove transitions
modal/dialog entrance and exit
sheet entrance and exit
command menu entrance
row action feedback
optimistic item removal
subtle page section entrance
status transitions
```

Motion is not allowed for:

```txt
marketing-style hero animations inside the app
bouncy toy-like dashboards
slow decorative page transitions
constant animated backgrounds
spinning decorative icons
animations that delay business work
animations that distract from data
```

Rule:

```txt
Motion must make the interface feel faster and clearer.
It must not make the product feel playful or slow.
```

## 4.3 CSS Transitions

Use CSS transitions for simple states:

```txt
hover color
border color
background color
focus ring
button active state
sidebar item hover
table row hover
```

Use Motion only when CSS is not enough or when state/layout changes need smoothness.

Bad:

```tsx
<motion.button whileHover={{ scale: 1.08 }}>
```

for every button.

Good:

```tsx
<button className="transition-colors hover:bg-muted">
```

for simple hover.

---

# 5. Optimistic UI Standard

Yes, OneDayOS uses optimistic UI.

The product should feel instant.

For normal user mutations, the interface should update immediately, then reconcile with the server.

This applies especially to:

```txt
create record
update field
delete / soft delete
restore
status change
assignment
check-in / check-out
approve / reject
submit / cancel
reorder
bulk selection actions
inline edit
```

Optimistic UI is required when:

```txt
the expected result is clear
the operation is reversible or recoverable
the user needs fast feedback
the local state can be safely reconciled
```

Optimistic UI is not required when:

```txt
the operation is destructive and hard to recover
server-side calculation may materially change the result
large imports are running
payment/billing operations are involved
permission changes are involved
security-sensitive admin operations are involved
complex workflow side effects are involved
```

## 5.1 Optimistic UI Pattern

Every optimistic mutation should follow this pattern:

```txt
1. Validate user intent locally.
2. Apply optimistic state immediately.
3. Send API request.
4. Show lightweight pending state if needed.
5. On success, reconcile with server result.
6. On failure, rollback local state.
7. Show error toast.
8. Refresh/revalidate if state may be stale.
```

Example delete flow:

```txt
User clicks Delete
  ↓
Row disappears immediately
  ↓
API request runs
  ↓
Success: toast + confirm state
Failure: row returns + error toast
```

Example status change:

```txt
User marks incident as resolved
  ↓
Status badge changes immediately to Resolved
  ↓
API request runs
  ↓
Success: keep resolved state
Failure: revert to previous status + error toast
```

## 5.2 Required Optimistic UI Components

The restarted platform should eventually provide:

```txt
useOptimisticMutation()
useOptimisticList()
OptimisticDeleteButton
OptimisticStatusToggle
OptimisticInlineEdit
ConfirmOptimisticAction
```

These do not need to be overbuilt at first. Start with practical patterns in tables/forms, then extract helpers after repetition.

## 5.3 Optimistic UI and Security

Optimistic UI is only a display technique.

It is not authorization.

Never treat optimistic state as proof that the server accepted the action.

The server still enforces:

```txt
authentication
tenant membership
module enablement
permissions
validation
soft delete rules
business workflow rules
```

Bad:

```txt
Hide unauthorized action in UI only.
Assume the API does not need permission checks.
```

Good:

```txt
Hide unauthorized action for usability.
Still enforce permission in API and service.
```

## 5.4 Optimistic UI and Toasts

Use `sonner` for mutation feedback.

Rules:

```txt
Success toast for important mutations.
No success toast for every tiny inline edit unless useful.
Error toast for failed mutations.
Rollback plus toast for failed optimistic actions.
Never show raw server errors.
Use stable user-facing messages.
```

Examples:

```txt
Product created.
Stock adjustment posted.
Leave request submitted.
Could not delete product. Please try again.
You do not have permission to approve this request.
This record was changed by someone else. Refresh and try again.
```

---

# 6. Component Standards by Type

---

# 7. Button

Buttons are for actions.

Links are for navigation.

Do not use buttons as links unless there is a real action.

## 7.1 Variants

Required variants:

```txt
primary
secondary
ghost
destructive
outline
link
```

Recommended mapping:

| Variant | Use |
|---|---|
| `primary` | Main page action, usually one per page |
| `secondary` | Secondary action |
| `outline` | Neutral action with visible boundary |
| `ghost` | Low-emphasis toolbar/action item |
| `destructive` | Delete, void, irreversible state change |
| `link` | Text-like navigation or low-emphasis action |

## 7.2 Primary Button Rules

Each page should normally have only one primary button.

Examples:

```txt
+ New Product
Submit Leave Request
Create Purchase Order
Save Changes
```

Do not make every action orange.

Brand orange should guide the primary action only.

## 7.3 Loading State

Buttons performing async actions must show a pending state.

Examples:

```txt
Saving…
Creating…
Submitting…
Posting…
Approving…
```

Avoid generic:

```txt
Loading…
Please wait…
```

## 7.4 Disabled State

Disabled buttons must look disabled and should explain why if the reason is not obvious.

Use tooltip for disabled action explanation.

Example:

```txt
Tooltip: “Only users with expenses.claim.approve can approve claims.”
```

## 7.5 Dangerous Actions

Destructive actions require confirmation unless the action is easily reversible.

Examples requiring confirmation:

```txt
Delete record
Void purchase order
Cancel submitted leave request
Deactivate employee
Disable module
Suspend organization
```

Destructive confirmation must show:

```txt
what will happen
whether it is reversible
what records are affected
```

---

# 8. Input, Label, and Field

Inputs are not just visual controls. They are part of the validation and data-integrity system.

## 8.1 Label Rules

Every input must have a visible label.

Placeholder text is not a label.

Bad:

```tsx
<Input placeholder="Product name" />
```

Good:

```tsx
<Label htmlFor="name">Product name</Label>
<Input id="name" />
```

## 8.2 Help Text

Use help text for fields that need stable explanation.

Use tooltip for short explanations.

Use neither when the label is obvious.

Example:

```txt
Label: Reorder point
Tooltip: “The stock level where this item should be flagged for replenishment.”
```

## 8.3 Validation Display

Validation errors should be:

```txt
near the field
specific
human-readable
short
consistent
```

Bad:

```txt
Invalid input
Expected string, received null
```

Good:

```txt
Product name is required.
Amount must be greater than zero.
Date cannot be in the past.
```

## 8.4 Tenant Identity Rule

Forms must never include visible or hidden `orgId` fields.

Bad:

```tsx
<input type="hidden" name="orgId" value={orgId} />
```

Good:

```txt
The server derives tenant context from session + orgSlug + PlatformContext.
```

Every generated form must include a test that proves it does not submit `orgId`.

---

# 9. Selects, Comboboxes, and Relation Pickers

Use Select for small fixed option lists.

Use Combobox / Command pattern for searchable relation lists.

## 9.1 Select

Use Select for:

```txt
status
employment type
unit
priority
severity
approval decision
```

Do not use Select for large datasets.

## 9.2 Relation Picker

Use relation picker for:

```txt
Employee
Product
Customer
Supplier
Warehouse
Branch
Department
```

Rules:

```txt
Options must be tenant-scoped.
Options must exclude soft-deleted records unless explicitly allowed.
Selected IDs must be revalidated server-side.
The client must not submit relation labels as authority.
```

Example:

```txt
The form may submit employeeId.
The service must verify employeeId belongs to ctx.org.id.
```

## 9.3 Business Object Picker

Business Object pickers must make ownership clear.

Example:

```txt
Product picker used inside Inventory still uses Product identity.
It should not imply Product belongs to Inventory.
```

---

# 10. Card

Cards should group related information.

Cards should not become dashboard filler.

Allowed uses:

```txt
form section
settings section
summary block
empty state container
module landing panel
detail page side panel
```

Avoid:

```txt
fake KPI cards with no real business value
huge cards for one line of text
three-card dashboard because every SaaS template has it
```

Dashboard cards must either:

```txt
help the user decide something
show a real operational status
link to a real workflow
```

If a dashboard card does not cause action or understanding, remove it.

---

# 11. Badge and StatusBadge

Badges communicate status, category, or small metadata.

They are not buttons unless explicitly interactive.

## 11.1 Required Status Styles

Status badges must use semantic variants:

```txt
neutral
info
success
warning
danger
muted
```

Do not invent random badge colors inside modules.

## 11.2 Status Vocabulary

Use business-specific status text, but platform-consistent colors.

Examples:

| Status | Semantic Variant |
|---|---|
| Draft | muted |
| Submitted | info |
| Approved | success |
| Rejected | danger |
| Cancelled | muted |
| Pending | warning |
| Resolved | success |
| Overdue | danger |
| Low Stock | warning |
| Out of Stock | danger |

## 11.3 Tooltip for Ambiguous Status

Every non-obvious status badge should support a tooltip.

Example:

```txt
Low Stock ?
Tooltip: “Current stock is at or below the reorder point.”
```

---

# 12. Dialog

Dialogs are for focused decisions.

Use Dialog for:

```txt
confirm destructive action
short form
small detail preview
permission explanation
quick decision
```

Do not use Dialog for:

```txt
large multi-section workflows
complex forms
module navigation
long tables
```

For larger workflows, use a full page.

Rules:

```txt
Dialog title must be clear.
Primary action must be obvious.
Cancel must be available.
Escape should close non-destructive dialogs.
Focus must be trapped.
Initial focus must be sensible.
Dangerous confirmations must not auto-focus destructive action.
```

---

# 13. Sheet / Drawer

Sheets are for contextual side workflows.

Use Sheet for:

```txt
quick record preview
filter panel
side edit for small records
activity sidebar later
settings subpanel
```

Do not use Sheet for complex primary workflows.

Examples:

```txt
Good: View product quick details from table.
Good: Open filter panel.
Bad: Create full purchase order with 20 fields.
```

---

# 14. Tooltip

Tooltips are required for non-obvious controls, status badges, metrics, and field meanings.

Rules:

```txt
Tooltip text should be 1–2 sentences maximum.
Tooltip appears quickly.
Tooltip explains, not documents.
Tooltip does not contain critical information required to complete the task.
If explanation is too long, improve the UI label or add help text.
```

Use tooltips for:

```txt
non-obvious field
status badge
icon-only button
disabled action explanation
metric definition
permission limitation
```

Do not use tooltips for:

```txt
obvious buttons like Save
long documentation
legal disclaimers
multi-step instructions
```

---

# 15. Popover

Popovers are for lightweight interactive panels.

Use Popover for:

```txt
date picker
small picker
quick filter
short preview
compact help panel
```

Do not use Popover for:

```txt
complex forms
large tables
long documentation
multi-step workflows
```

---

# 16. Command Menu

The command menu is a future premium interaction surface.

MVP may include structure for it, but full command menu data search is deferred.

Allowed early commands:

```txt
Navigate to Dashboard
Navigate to Products
Navigate to Employees
Navigate to Inventory
Open Settings
```

Deferred commands:

```txt
Search all customer data
Run AI query
Approve selected request
Create records from command input
```

Command menu must be permission-aware and module-aware.

---

# 17. Table Components

Tables are a core OneDayOS product surface.

This document only defines component-level table standards. Full table behavior belongs in:

```txt
03-design-system/04-table-standards.md
```

Component rules:

```txt
Use shared DataTable.
Use compact rows.
Use clear column labels.
Use row actions consistently.
Use loading skeletons.
Use empty states.
Use segment-aware links.
Use optimistic row removal for delete where safe.
```

Tables must not:

```txt
hide tenant identity in row data
show soft-deleted records by default
show actions users cannot perform without explanation
use full-page spinner while data loads
```

---

# 18. Form Components

This document only defines component-level form standards. Full form behavior belongs in:

```txt
03-design-system/05-form-standards.md
```

Component rules:

```txt
Use FormSection for grouped fields.
Use FieldRow for label/control/error/help structure.
Use relation pickers for Business Objects.
Use server-validated Zod schemas.
Use React Hook Form where appropriate.
Never include orgId in client form schemas.
```

Form submit buttons must:

```txt
show pending state
prevent duplicate submit
show validation errors clearly
show toast on success or failure when appropriate
```

---

# 19. EmptyState

Every list/table/module screen must have a designed empty state.

Empty states should answer:

```txt
What is this screen for?
Why is it empty?
What should the user do next?
```

Example:

```txt
No products yet
Create your first product so Inventory, Purchasing, and future modules can reference it.
[Create Product]
```

Bad:

```txt
No data.
```

Empty states must respect permissions.

If user cannot create records:

```txt
No products yet.
Ask an administrator for access to create products.
```

Do not show a disabled create button without explanation.

---

# 20. LoadingSkeleton

Use skeletons instead of spinners for normal content loading.

Skeletons should match expected layout:

```txt
table rows
form sections
detail header
card grid
sidebar nav
```

Use spinner only for:

```txt
small inline loading state
button pending icon if needed
background action where skeleton is not appropriate
```

Avoid full-page spinners except for initial app boot or rare blocking transitions.

---

# 21. ErrorState

Error states must be user-safe and support-oriented.

Required error state types:

```txt
ValidationErrorState
PermissionDeniedState
NotFoundState
ModuleDisabledState
TenantNotFoundState
NetworkErrorState
UnexpectedErrorState
```

UI error states must never expose:

```txt
stack traces
SQL errors
Prisma internals
Supabase secrets
database URLs
raw Zod object dumps
full request payloads
```

Error states should include a request ID when available.

Example:

```txt
Something went wrong.
Please try again. If this continues, contact support with Request ID: req_abc123.
```

---

# 22. ConfirmDialog

ConfirmDialog is required for destructive or business-final actions.

Use it for:

```txt
delete
void
cancel submitted request
deactivate
suspend
disable module
restore if risky
bulk destructive action
```

ConfirmDialog must include:

```txt
title
short explanation
record affected
primary destructive/confirm action
cancel action
loading state
error state
```

For dangerous actions, use explicit text.

Bad:

```txt
Are you sure?
```

Good:

```txt
Delete product “Steel Bolt”?
This hides the product from normal lists. Existing stock movements remain preserved.
```

---

# 23. PermissionGate

PermissionGate may hide or disable UI actions based on permissions.

But PermissionGate is never security.

Security lives in:

```txt
API route
service method
SDK permission helper
PlatformContext
```

PermissionGate is allowed for:

```txt
hiding create button
disabling approve action
showing permission-denied empty state
filtering nav item
showing admin-only settings section
```

PermissionGate must not:

```txt
replace API permission enforcement
fetch permissions from client-only code
trust client-side permission state for security
hide all explanation from users
```

---

# 24. PageHeader

Every module/list/detail/settings page should use a standard PageHeader.

PageHeader includes:

```txt
title
short description
optional eyebrow/module label
primary action
secondary actions
breadcrumbs when needed
status badge when relevant
```

Examples:

```txt
Products
Shared product records used by Inventory, Purchasing, and future modules.
[New Product]
```

```txt
Stock Adjustments
Review and post manual inventory corrections.
[New Adjustment]
```

PageHeader must not include fake stats unless meaningful.

---

# 25. SectionHeader

Use SectionHeader inside pages for clear structure.

Example:

```txt
Basic information
Used across modules that reference this product.
```

```txt
Inventory settings
Module-specific stock behavior for this product.
```

This reinforces Business Object versus module extension boundaries.

---

# 26. DetailHeader

Detail pages should have a consistent header.

DetailHeader includes:

```txt
record title
record subtitle/code
status badge
actions menu
last updated info if useful
back link
```

Examples:

```txt
Product: Steel Bolt
Code: BOLT-001 · Unit: pcs
Status: Active
```

```txt
Leave Request: Maria Santos
Vacation Leave · Jan 12–14, 2026 · Submitted
```

---

# 27. Action Menus

Use dropdown menus for secondary row/page actions.

Primary page action should not be hidden in a dropdown.

Dropdown action order:

```txt
View
Edit
Duplicate / Copy if supported
Export if permitted
Separator
Deactivate / Cancel / Void
Delete
```

Dangerous actions should be visually separated.

---

# 28. Toasts

Use `sonner` for toasts.

Toast types:

```txt
success
error
warning
info
```

Rules:

```txt
Toasts should be short.
Toasts should not replace field errors.
Toasts should not contain raw errors.
Toasts should not stack excessively.
Use toast for mutation outcome, not static page information.
```

Good:

```txt
Product created.
Leave request submitted.
Could not approve request. You do not have permission.
```

Bad:

```txt
PrismaClientKnownRequestError: Unique constraint failed on the fields: (`orgId`,`code`)
```

---

# 29. Motion Standards

## 29.1 Motion Timing

Motion should feel fast.

Recommended timings:

```txt
hover/active CSS transitions: 100–150ms
small component enter/exit: 120–180ms
dialog/sheet enter/exit: 160–220ms
list item layout changes: 160–240ms
page section entrance: 160–240ms
```

Avoid animations longer than 300ms inside operational workflows unless there is a strong reason.

## 29.2 Motion Easing

Use calm easing.

Avoid bouncy springs for serious business UI.

Allowed:

```txt
ease-out
subtle spring for layout only
opacity + translateY for entrance
scale only for tiny tap feedback
```

Avoid:

```txt
exaggerated bounce
large scale transforms
rotations
infinite loops
confetti-style interactions
```

## 29.3 Reduced Motion

All motion must respect reduced-motion preference.

If a user prefers reduced motion:

```txt
remove non-essential motion
keep opacity transitions minimal
avoid transform-heavy transitions
preserve usability
```

## 29.4 Motion and Data Density

Animations must not reduce data density.

Do not add excessive spacing, oversized cards, or marketing-style motion just because Motion exists.

---

# 30. Accessibility Standards

Every component must support:

```txt
keyboard navigation
visible focus state
screen-reader-friendly labels
proper ARIA where needed
sufficient contrast
reduced motion
logical tab order
escape key behavior for overlays
focus return after dialog close
```

Component-specific rules:

```txt
Icon-only buttons must have aria-label.
Dialogs must have title.
Form fields must connect label, input, description, and error.
Tables must use semantic table structure unless a grid role is intentionally needed.
Tooltips must not contain critical-only information.
Dropdown menu items must be keyboard reachable.
```

Accessibility is not optional because OneDayOS is a business tool used repeatedly every day.

---

# 31. Client Components and Server Components

Components must respect Next.js server/client boundaries.

## 31.1 Client Components

Client components may use:

```txt
useState
useTransition
useOptimistic
useRouter
useParams
React Hook Form
Motion
client-safe fetch helpers
client-safe SDK utilities from @/sdk/client
```

Client components must not import:

```txt
@/sdk/server
@/kernel/*
raw Prisma
server env helpers
Supabase service role helpers
module server services directly
```

## 31.2 Server Components

Server components may:

```txt
create PlatformContext
fetch tenant-scoped data
resolve permissions
resolve navigation
load module manifests
render client components with safe props
```

Server components must not:

```txt
pass secrets to client components
pass full Prisma records unnecessarily
pass orgId where not needed
perform client-side mutation behavior
```

---

# 32. Generated Module Component Rules

The Module Generator must use these component standards by default.

Generated module UI must include:

```txt
PageHeader
DataTable or approved list component
EmptyState
LoadingSkeleton where applicable
ErrorState where applicable
ConfirmDialog for destructive actions
Toast feedback for mutations
Optimistic UI for safe mutations
HelpTooltip for non-obvious fields/status/actions
Permission-aware action visibility
No hidden orgId fields
No generic stock dashboard cards
```

Generated module UI must not include:

```txt
custom table implementation
custom form layout
custom modal system
random brand colors
per-module button styles
hidden orgId input
client imports from @/sdk/server or @/kernel/*
full-page spinners for normal table loads
```

---

# 33. Component Anti-Patterns

Reject these patterns:

```txt
Stock SaaS card dashboard
Random Tailwind class soup in every module
One-off tables per module
One-off form layouts per module
Hidden orgId fields
Buttons used as links
Links used as mutations
Spinners everywhere
No empty states
No error states
Generic “Are you sure?” confirmations
Raw server errors in toasts
Permission hidden only in UI
Animations that slow the workflow
Confetti-style business UI
Client-specific component forks
```

---

# 34. Testing Requirements

Component tests should prove behavior users experience.

Required tests for shared components:

```txt
Button variants render correctly
Button pending/disabled states work
Input displays label, help, and error
Tooltip renders useful content
ConfirmDialog requires explicit action
EmptyState changes action based on permission
ErrorState hides raw technical errors
PermissionGate hides/disables based on supplied permission state
DataTable renders empty/loading/action states
Optimistic delete rolls back on API failure
Form components do not submit orgId
Sidebar/nav components do not use unsafe prefix matching
Client components do not import server-only modules
```

Generated module tests must include:

```txt
primary action visible to allowed user
primary action hidden/disabled for denied user
form does not include orgId
mutation displays optimistic state when appropriate
failed mutation rolls back and shows error toast
destructive action uses ConfirmDialog
```

---

# 35. Claude Implementation Rules

Claude must follow these rules when implementing UI components:

```txt
Do not generate generic SaaS/admin dashboard UI.
Do not create new primitive component systems without approval.
Use shadcn/ui primitives and OneDayOS wrappers.
Use Motion only where it improves perceived speed or clarity.
Use CSS transitions for simple hover/focus states.
Use optimistic UI for safe mutations.
Rollback optimistic state on server failure.
Use sonner toasts for mutation feedback.
Never include hidden orgId fields.
Never import @/sdk/server, @/kernel/*, raw Prisma, or server env helpers in client components.
Do not treat permission-aware UI as security.
Do not create module-specific tables/forms/dialog systems.
Add meaningful UI tests.
Stop if a component standard is ambiguous.
```

---

# 36. Acceptance Criteria

This document is accepted when:

```txt
[ ] Component layers are clearly defined.
[ ] shadcn/ui usage rules are clear.
[ ] Motion / Framer Motion usage rules are clear.
[ ] Optimistic UI behavior is required and bounded.
[ ] Button, input, select, card, badge, dialog, sheet, tooltip, popover, command, table, form, empty, loading, error, confirm, permission, page header, and toast standards are defined.
[ ] Client/server component boundaries are explicit.
[ ] Generated module component rules are explicit.
[ ] Component anti-patterns are listed.
[ ] UI testing requirements are defined.
[ ] Claude implementation rules are included.
```

---

# 37. Implementation Notes for Restarted Build

For the restarted UI build, install the current Motion package rather than relying on the older naming:

```bash
npm install motion
```

Use:

```ts
import { motion, AnimatePresence } from 'motion/react'
```

For optimistic UI, prefer React's native optimistic state patterns where appropriate, especially `useOptimistic` combined with transitions/actions.

Do not over-abstract this immediately. First implement the patterns in:

```txt
DataTable row delete
status update
form create/update
inline edit
```

Then extract shared hooks/components after repetition.

---

# 38. Final Rule

A OneDayOS component is not finished because it looks good in isolation.

It is finished when it helps every module feel:

```txt
consistent
fast
premium
secure
recoverable
understandable
```

# OneDayOS Engineering Manual — 03 Design System / 07 Interaction & Motion Standards

**Document ID:** `03-design-system/07-interaction-motion-standards.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Required Before Restarted Platform UI Build  
**Owner:** OneDayOS Founder / Platform Architect  
**Last Updated:** July 2026  
**Applies To:** OneDayOS Platform UI, Design System, Business Objects UI, Business Modules, Generated Module UI, App Shell  
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
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/01-sdk-public-api.md`
- `13-security/04-api-security.md`
- `14-testing-quality/04-ui-testing.md`

---

# 1. Purpose

This document defines how OneDayOS should feel during interaction.

OneDayOS must not merely look premium in screenshots. It must feel fast, responsive, intentional, and operational while users are doing real business work.

The previous base app generated the visible parts of a web application — authentication, sidebar, dashboard, cards, and CRUD — but it did not feel like a mature business operating system. A major reason was that interaction quality was not treated as a first-class system.

This document prevents that problem from returning.

It defines standards for:

- optimistic UI
- perceived responsiveness
- micro-interactions
- loading transitions
- table row motion
- form feedback
- dialog and sheet motion
- destructive-action feedback
- reduced-motion accessibility
- Motion for React usage
- CSS transition usage
- generated module behavior
- testing requirements

---

# 2. Core Principle

```txt
OneDayOS should feel faster than the backend.
```

Users should not feel that every click is a database round trip.

When a user performs a clear, reversible, high-confidence action, the interface should respond immediately, while the server still enforces the real security and business rules.

Correct model:

```txt
User acts
  ↓
UI responds immediately
  ↓
Server validates auth, tenancy, permission, validation, and business rule
  ↓
Success: UI keeps the optimistic state
Failure: UI rolls back and shows a clear error
```

Wrong model:

```txt
User clicks
  ↓
Button freezes
  ↓
Spinner appears
  ↓
Nothing changes until server returns
  ↓
User wonders if anything happened
```

---

# 3. Design Feel

OneDayOS interactions should feel:

```txt
fast
calm
precise
subtle
businesslike
reliable
premium
predictable
```

They should not feel:

```txt
playful
bouncy
flashy
slow
marketing-like
game-like
random
ornamental
```

Motion exists to improve clarity and perceived speed, not to decorate the app.

---

# 4. Performance Target

OneDayOS should target:

```txt
< 100ms perceived response for direct UI interactions
```

This does not mean every server action completes in under 100ms.

It means the user should see meaningful feedback almost immediately.

Examples:

| Action | Expected Immediate Feedback |
|---|---|
| Click row action | Button shows pressed/pending state |
| Delete table row | Row exits optimistically |
| Submit form | Save button enters pending state immediately |
| Open dialog | Dialog appears with smooth short transition |
| Toggle setting | Toggle changes immediately, then syncs |
| Filter table | Input responds instantly; data loading state is clear |
| Navigate module page | Shell remains stable; content loading is graceful |

---

# 5. Optimistic UI Standard

Optimistic UI is required for eligible mutations.

The previous Kernel reference already established that every create, update, and delete mutation should update local state before the server responds, then roll back and show a toast on error.

This document refines that rule.

## 5.1 What optimistic UI means

Optimistic UI means:

```txt
The interface temporarily assumes the requested action will succeed.
```

It does not mean:

```txt
The server trusts the client.
```

The server still validates:

- authentication
- tenant membership
- module enablement
- permissions
- Zod input validation
- business rules
- soft-delete lifecycle
- event emission rules
- data integrity

## 5.2 Eligible optimistic actions

Use optimistic UI for actions that are:

- common
- reversible or rollback-safe
- user-initiated
- locally understandable
- unlikely to require complex server computation before showing feedback

Examples:

```txt
create simple record
update simple field
delete / soft-delete visible row
restore visible row
toggle active status
mark task complete
change table row status when rollback is clear
```

## 5.3 Actions requiring caution

Use optimistic UI carefully for actions where the server may perform important workflow logic.

Examples:

```txt
approve leave request
post stock adjustment
receive purchase order
pay expense claim
void business document
close incident
assign asset
return asset
check in visitor
```

These may still have optimistic feedback, but the UI must not pretend complex state transitions are final until the server confirms.

Preferred pattern:

```txt
Show immediate pending transition
Disable duplicate action
Render temporary "Submitting…" or "Posting…" state
Finalize state after server success
Rollback or explain failure clearly
```

## 5.4 Actions that should not be fully optimistic

Do not fully optimistically finalize actions when:

- the result depends on server-calculated values
- the action can fail for business-rule reasons
- the action creates irreversible business effects
- the action affects financial, stock, compliance, or audit-sensitive records
- rollback would confuse the user

Examples:

```txt
inventory stock posting
expense payment
purchase receipt posting
bulk import
bulk export
cross-module integration
future approval workflow engine action
future attachment upload
future AI action
```

---

# 6. Optimistic UI Pattern

All optimistic mutations should follow this pattern:

```txt
1. Capture current state
2. Apply optimistic state immediately
3. Send API request
4. On success:
   - keep optimistic state
   - optionally refresh server state
   - show success toast only when useful
5. On failure:
   - rollback to previous state
   - show clear error toast
   - keep user in context
```

Example table-row soft delete pattern:

```tsx
'use client'

import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'

export function ProductTable({ initialProducts }: { initialProducts: ProductRow[] }) {
  const [isPending, startTransition] = useTransition()
  const [products, removeOptimistic] = useOptimistic(
    initialProducts,
    (state, deletedId: string) => state.filter((item) => item.id !== deletedId)
  )

  function deleteProduct(productId: string) {
    startTransition(async () => {
      removeOptimistic(productId)

      const res = await fetch(`/api/orgs/acme/objects/products/${productId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        toast.error('Product could not be deleted. Your list has been restored.')
        // Revalidate or refresh server state.
        return
      }

      toast.success('Product deleted.')
    })
  }

  return <ProductRows products={products} onDelete={deleteProduct} pending={isPending} />
}
```

Important: the example path is illustrative only. Real code must derive `orgSlug` from route context and never submit `orgId` from the client.

---

# 7. Rollback Standard

Every optimistic mutation must have a rollback plan.

Rollback must be:

- clear
- immediate
- user-visible
- non-destructive
- tested

Bad rollback:

```txt
Action fails silently.
User thinks the change happened.
Server did not save it.
```

Bad rollback:

```txt
Row disappears.
API fails.
Page refreshes unexpectedly.
User loses form/table context.
```

Good rollback:

```txt
Row disappears optimistically.
API fails.
Row returns.
Toast says: "Could not delete product. Your list has been restored."
```

Good rollback for form save:

```txt
Save button enters pending state.
API fails with validation error.
Form stays open.
Invalid fields are highlighted.
User input is preserved.
```

---

# 8. Pending State Standard

Every interactive mutation must show a pending state.

Pending states should be specific.

Use:

```txt
Saving…
Creating…
Deleting…
Restoring…
Posting…
Approving…
Rejecting…
Checking in…
Checking out…
```

Avoid generic:

```txt
Loading…
Please wait…
Processing…
```

Generic pending text is allowed only when the action is truly generic.

---

# 9. Toast Standard

OneDayOS uses `sonner` for toast feedback.

Toasts should be:

- short
- specific
- calm
- useful
- non-dramatic

Good:

```txt
Product created.
Changes saved.
Stock adjustment posted.
Leave request submitted.
Could not save changes. Check the highlighted fields.
You do not have permission to approve this request.
```

Bad:

```txt
Success!
Error!
Something went wrong!
Oopsie!
Your data has exploded!
```

## 9.1 When to show success toast

Show success toast when:

- mutation changes data
- the result is not visually obvious
- the action is important
- optimistic UI could otherwise feel uncertain

Do not over-toast for every tiny interaction.

For example:

```txt
Changing table density should not need a toast.
Saving a form should usually show a toast.
Deleting a row should usually show a toast.
```

## 9.2 Error toast requirements

Error toasts must never expose:

- raw Prisma errors
- raw SQL errors
- Supabase internals
- stack traces
- secrets
- full API response dumps
- other-tenant information

---

# 10. Motion Library Standard

The restarted platform should use **Motion for React**.

Implementation standard:

```bash
npm install motion
```

Import standard:

```ts
import { motion, AnimatePresence } from 'motion/react'
```

Do not use new `framer-motion` imports in restarted code unless a future ADR changes this.

Allowed:

```ts
import { motion } from 'motion/react'
```

Forbidden in new code:

```ts
import { motion } from 'framer-motion'
```

Reason:

```txt
Motion for React is the current package/import path for the Framer Motion lineage.
The app should standardize on one animation import path.
```

---

# 11. CSS vs Motion Decision Rule

Use CSS transitions for simple component states.

Use Motion for stateful layout or enter/exit transitions.

| Interaction | Use CSS | Use Motion |
|---|---:|---:|
| Button hover | Yes | No |
| Link hover | Yes | No |
| Input focus ring | Yes | No |
| Badge color change | Yes | No |
| Sidebar width collapse | Maybe | Yes if layout needs polish |
| Dialog enter/exit | No | Yes |
| Sheet enter/exit | No | Yes |
| Table row removal | No | Yes |
| Table row reorder | No | Yes |
| List item enter/exit | No | Yes |
| Empty state entrance | Maybe | Yes, subtle |
| Loading skeleton pulse | CSS | No |
| Page content section fade | Maybe | Yes, subtle |
| Drag/reorder | No | Future only |

---

# 12. Motion Timing Standards

Motion should be fast.

Recommended defaults:

```txt
Micro-interaction: 100–150ms
Dialog/sheet entrance: 150–220ms
Row/list enter-exit: 120–180ms
Page section entrance: 180–240ms
Hover/focus CSS transition: 100–150ms
```

Avoid:

```txt
500ms dashboard animations
slow page transitions
bouncy spring effects for business actions
large exaggerated movements
animations that delay user work
```

## 12.1 Default easing

Prefer calm, crisp easing.

Recommended:

```ts
transition={{ duration: 0.16, ease: 'easeOut' }}
```

For layout changes:

```ts
transition={{ type: 'spring', stiffness: 380, damping: 32 }}
```

Use spring motion sparingly. It should feel responsive, not playful.

---

# 13. Reduced Motion Accessibility

OneDayOS must respect reduced-motion preferences.

All Motion components should either:

- be naturally subtle enough to be safe, or
- use `MotionConfig`, `useReducedMotion`, or CSS media queries to reduce movement

Recommended root pattern:

```tsx
import { MotionConfig } from 'motion/react'

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  )
}
```

If reduced motion is preferred:

- fade may remain if subtle
- large movement should be removed
- layout transitions should be minimized
- repeated animations should be disabled
- no parallax-like effects

Do not ignore reduced-motion preferences.

---

# 14. App Shell Interaction Standards

The app shell is the constant frame of OneDayOS.

It should feel stable.

## 14.1 Sidebar collapse

Sidebar collapse should:

- animate width smoothly
- keep icons aligned
- not shift content jarringly
- preserve active state
- remain keyboard accessible
- not hide security state

Recommended behavior:

```txt
expanded width → compact width
text labels fade/clip gracefully
icons remain stable
active item remains obvious
```

## 14.2 Navigation transitions

Do not use heavy full-page transitions for normal navigation.

The shell should remain stable while content changes.

Good:

```txt
sidebar/header remain fixed
content area uses skeleton or subtle fade
page title appears quickly
```

Bad:

```txt
entire app fades out/in on every click
sidebar re-renders and jumps
navigation waits on spinner
```

---

# 15. Table Interaction Standards

Tables are the most important operational surface in OneDayOS.

## 15.1 Row hover

Row hover should be subtle:

```txt
background shift
optional row action reveal
no dramatic scale or shadow
```

Do not scale table rows on hover.

## 15.2 Row removal

Soft-delete row removal should use optimistic exit motion where safe.

Recommended:

```tsx
<AnimatePresence initial={false}>
  {rows.map((row) => (
    <motion.tr
      key={row.id}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.16 }}
    >
      ...
    </motion.tr>
  ))}
</AnimatePresence>
```

Use caution with table elements and browser layout quirks. If `<motion.tr>` causes rendering issues, wrap row content through a compatible row component pattern approved by the design system.

## 15.3 Row creation

New rows may briefly highlight or fade in.

Do not use confetti, bouncing, or flashy success animation.

## 15.4 Sorting/filtering

Filtering should feel immediate in the input.

Data loading may show:

- inline skeleton rows
- subtle pending bar
- table-level pending state

Do not blank the entire table unless the dataset is truly unavailable.

---

# 16. Form Interaction Standards

Forms should feel calm and clear.

## 16.1 Submit button

Submit button must show pending state:

```txt
Create Product → Creating…
Save Changes → Saving…
Submit Request → Submitting…
```

Button may be disabled during submission to prevent duplicate writes.

## 16.2 Validation feedback

Client-side validation should appear quickly.

Server validation should map to field-level errors where possible.

Do not clear user input on failure.

## 16.3 Successful form submission

On success:

- show success toast when useful
- navigate intentionally
- or keep user in place if continuing work
- refresh/revalidate server state

## 16.4 Failed form submission

On failure:

- preserve all user-entered data
- focus or highlight the first meaningful error
- show field errors when possible
- show global error only when the issue is not field-specific

---

# 17. Dialog and Sheet Motion Standards

Dialogs and sheets should use subtle Motion transitions.

## 17.1 Dialogs

Dialog entrance:

```txt
fade + tiny scale or y movement
150–200ms
```

Dialog exit:

```txt
fade out quickly
100–150ms
```

Avoid:

- large pop animations
- springy bouncing modals
- slow overlay fade
- marketing-style reveal effects

## 17.2 Sheets

Sheets may slide in from the side.

Recommended:

```txt
right sheet: x 100% → 0
left sheet: x -100% → 0
short duration
clear backdrop
focus trap
escape closes unless destructive workflow requires confirmation
```

Sheets are appropriate for:

- quick create
- quick edit
- record preview
- settings side panel
- non-destructive workflow actions

Use full pages for complex workflows.

---

# 18. Status and Badge Interaction Standards

Status changes should be visually clear.

Examples:

```txt
Draft → Submitted
Submitted → Approved
Open → Resolved
Checked In → Checked Out
Active → Inactive
```

When status changes after mutation:

- badge should update immediately if optimistic-safe
- or show pending badge if server confirmation is required

Examples:

```txt
Approving…
Posting…
Checking out…
```

Do not silently change high-impact statuses without visible confirmation.

---

# 19. Destructive Action Interaction Standards

Destructive actions require deliberate feedback.

## 19.1 Soft delete

Soft delete may be optimistic if rollback is clear.

Pattern:

```txt
confirm if needed
row exits optimistically
API request runs
success toast
rollback on failure
```

## 19.2 Business cancellation / void / close

Business-state actions are not generic delete actions.

Examples:

```txt
Cancel leave request
Void purchase order
Retire asset
Close incident
Check out visitor
```

These actions should usually show:

- confirmation dialog when business-impactful
- pending state
- server-confirmed final state
- event emission by service
- clear toast

Do not animate them as casual row deletes.

---

# 20. Loading Motion Standards

Loading should not feel like failure.

Use:

- skeleton rows
- skeleton cards
- skeleton form fields
- subtle shimmer/pulse
- stable layout dimensions

Avoid:

- full-screen spinners
- blank white panels
- layout jumps
- fake placeholder metrics
- endless progress bars with no meaning

Skeletons should match the final layout shape.

---

# 21. Dashboard Motion Standards

Dashboards should be restrained.

Allowed:

- subtle card entrance on first load
- skeletons while loading real metrics
- small trend indicator transitions
- chart loading states if charts exist

Forbidden:

- fake animated charts
- fake stat counters
- dramatic staggered card entrances
- marketing-site motion
- decorative background animation

Dashboard motion should communicate real platform state, not distract from it.

---

# 22. Keyboard Interaction Standards

OneDayOS should be keyboard-friendly.

Minimum expectations:

- visible focus rings
- `Enter` submits focused primary action when appropriate
- `Escape` closes dialogs/sheets where safe
- tab order follows visual order
- row actions are reachable
- dropdown menu items are keyboard accessible
- destructive confirmations are not accidentally triggered by ambiguous keyboard behavior

Motion must not break keyboard access.

Do not animate focus rings away.

---

# 23. Touch and Mobile Interaction Standards

MVP is desktop-first but must not be unusable on smaller screens.

Touch targets should be large enough for practical use.

Motion should not rely only on hover.

Hover-only affordances must have keyboard and touch equivalents.

Examples:

```txt
row actions hidden on hover must also be available through a kebab menu
help tooltips should have click/tap behavior where needed
buttons must show active/pressed state on touch
```

---

# 24. Tooltip and Help Interaction

Tooltips should appear quickly and be concise.

Standard:

```txt
< 100ms delay for help tooltip display
1–2 sentences maximum
plain language
no documentation-length content
```

Tooltip should help explain:

- non-obvious fields
- status badges
- destructive actions
- calculated metrics
- disabled actions

If a tooltip needs a paragraph, the UI is probably unclear.

---

# 25. Disabled State Standard

Disabled controls must explain why when the reason is not obvious.

Examples:

```txt
Button disabled because user lacks permission
→ Tooltip: "You do not have permission to approve leave requests."

Button disabled because module is suspended
→ Tooltip: "This module is unavailable while the organization is suspended."

Button disabled because required fields missing
→ Field errors or validation hints explain what is missing.
```

Do not silently disable important actions.

---

# 26. Permission-Aware Interaction Standard

Permission-aware UI is usability, not security.

Allowed:

```txt
hide actions user cannot perform
show disabled action with tooltip when helpful
show permission-denied state for direct route access
```

Required:

```txt
API and service still enforce permission
```

Never rely on animation, visibility, disabled state, or hidden buttons as security.

---

# 27. Tenant-Safe Interaction Standard

Interactions must never rely on client-submitted tenant identity.

Forbidden:

```txt
hidden orgId input
orgId in form body
orgId in optimistic state payload
orgId in client event payload
orgId in table filter JSON
orgId in URL query for tenant-scoped APIs
```

Allowed:

```txt
orgSlug in route path as locator
server derives orgId through PlatformContext
```

This applies to all interactive components.

---

# 28. Business Object Interaction Standard

Business Object UI should reinforce shared ownership.

Examples:

```txt
Product is shared, not Inventory-owned.
Customer is shared, not CRM-owned.
Employee is shared, not Leave-owned.
Supplier is shared, not Purchasing-owned.
Warehouse is shared, not Inventory-owned.
```

Interaction implication:

- Product create/edit patterns should not include Inventory-specific motion language.
- Customer screens should not feel like CRM-only screens.
- Employee actions should distinguish employment status from user login access.
- Warehouse interactions should not imply stock behavior unless inside Inventory module extension workflows.

---

# 29. Generated Module Interaction Requirements

The Module Generator must emit UI that follows these standards.

Generated modules must include:

- optimistic list mutation pattern where safe
- rollback behavior
- `sonner` toast usage
- no hidden `orgId` fields
- server-derived tenant context
- pending button states
- skeleton loading states
- empty states
- error states
- permission-aware action rendering
- Motion usage for row/list changes where appropriate
- reduced-motion compatibility
- UI tests for major interaction states

Generated modules must not include:

- generic spinner-only loading
- `alert()`
- `confirm()` as final UX for complex destructive actions
- hidden tenant fields
- raw API error rendering
- fake dashboard cards
- stock admin-template animation
- playful bounce effects
- `framer-motion` imports in new restarted code

---

# 30. Testing Requirements

Interaction and motion behavior must be tested where practical.

## 30.1 Unit/UI tests

Required tests:

```txt
button enters pending state
form preserves values on failed submission
table shows rollback after failed optimistic delete
table hides or disables unauthorized action
empty state renders correctly
loading skeleton renders correctly
error state renders correctly
no hidden orgId field exists in forms
client components do not import @/sdk/server or @/kernel/*
```

## 30.2 Reduced-motion tests

Where Motion wrappers are centralized, test that reduced-motion configuration exists.

## 30.3 Architecture checks

`check:architecture` should block:

```txt
import { motion } from 'framer-motion'
hidden name="orgId"
body.orgId
searchParams.get('orgId')
client component imports from @/sdk/server
client component imports from @/kernel/*
raw Prisma imports in UI/module files
```

## 30.4 Manual review checklist

Before accepting a UI screen:

```txt
[ ] First click gives immediate feedback
[ ] Loading state is layout-stable
[ ] Error state is clear and non-technical
[ ] Form does not submit orgId
[ ] Destructive action has correct confirmation/pending/rollback pattern
[ ] Motion is subtle
[ ] Reduced-motion behavior is acceptable
[ ] UI still works with keyboard
[ ] Permission-denied behavior is clear
[ ] Empty state is helpful
[ ] No fake dashboard content
```

---

# 31. Accessibility Requirements

Interaction design must support accessibility.

Requirements:

- visible focus states
- reduced-motion support
- keyboard access
- non-color-only feedback
- ARIA-friendly dialog/sheet behavior through shadcn/Radix primitives
- status changes communicated through text where needed
- error states associated with form fields
- no motion that prevents reading or action

Do not use animation to replace semantic state.

---

# 32. Performance Requirements

Motion must not noticeably slow the app.

Guidelines:

- use CSS for simple state changes
- use Motion for layout/enter/exit transitions only when useful
- avoid animating expensive layout properties when unnecessary
- prefer opacity/transform for simple movement
- keep transition durations short
- avoid page-wide animation wrappers
- avoid nested `AnimatePresence` unless needed
- avoid animating hundreds of table rows at once
- test large table behavior manually before accepting fancy row motion

If animation makes a table slower, remove the animation.

---

# 33. Anti-Patterns

Forbidden:

```txt
slow page fade on every navigation
bouncy dashboard cards
confetti on normal business actions
hidden orgId field in forms
toast for every tiny UI interaction
full-screen spinner for table loading
fake metrics while loading
generic "Error" message
raw provider error displayed to user
framer-motion imports in restarted code
motion on every component just because the package exists
UI-only permission enforcement
optimistic UI without rollback
optimistic UI for high-risk irreversible operations
```

---

# 34. Claude Implementation Rules

Claude must follow these rules when building UI:

```txt
1. Use shared OneDayOS components.
2. Use CSS transitions for simple hover/focus states.
3. Use Motion for meaningful enter/exit/layout transitions.
4. Import Motion from 'motion/react'.
5. Do not import from 'framer-motion' in restarted code.
6. Use optimistic UI only with rollback.
7. Do not submit orgId from the client.
8. Do not render raw API/provider errors.
9. Do not create fake dashboard cards or fake metrics.
10. Add pending, success, failure, empty, and loading states.
11. Add UI tests for meaningful states.
12. Stop if the required API/security helpers do not exist.
```

Claude must not decide new animation systems, packages, or UI paradigms without an ADR.

---

# 35. Acceptance Criteria

This document is satisfied when:

```txt
[ ] Motion library standard is defined
[ ] Optimistic UI rules are defined
[ ] Rollback behavior is defined
[ ] Pending-state standards are defined
[ ] Toast behavior is defined
[ ] Table interaction rules are defined
[ ] Form interaction rules are defined
[ ] Dialog/sheet motion rules are defined
[ ] Reduced-motion requirements are defined
[ ] Generated module interaction rules are defined
[ ] Forbidden interaction anti-patterns are documented
[ ] Tests and architecture checks are specified
[ ] Claude implementation rules are explicit
```

No restarted platform UI should be considered complete if it feels static, slow, ambiguous, or generic.

---

# 36. Founder Review Questions

Before freezing this document, answer:

```txt
1. Do we want Motion for React as the official animation package?
2. Are we comfortable banning new framer-motion imports in restarted code?
3. Should optimistic UI be mandatory for all safe table mutations?
4. Are high-impact workflow actions correctly excluded from full optimistic finalization?
5. Do the timing standards feel premium and businesslike?
6. Do we want any special OneDayOS signature interaction, or should the system stay quiet and restrained?
```

---

# 37. Implementation Notes for Restarted Build

The restarted platform should implement a small interaction foundation early:

```txt
src/components/platform/motion/
  MotionProvider.tsx
  transitions.ts
  FadeIn.tsx
  AnimatedList.tsx
```

Suggested transition tokens:

```ts
export const transitions = {
  micro: { duration: 0.12, ease: 'easeOut' },
  fast: { duration: 0.16, ease: 'easeOut' },
  normal: { duration: 0.22, ease: 'easeOut' },
  layout: { type: 'spring', stiffness: 380, damping: 32 },
} as const
```

Do not create a large animation framework.

Start small:

- root `MotionProvider`
- shared transition tokens
- table/list row patterns
- dialog/sheet transition standards
- optimistic UI examples
- tests and architecture checks

---

# 38. Final Rule

```txt
Motion should make OneDayOS feel alive.
It should never make OneDayOS feel decorative.
```


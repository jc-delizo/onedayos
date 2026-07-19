# OneDayOS Engineering Manual — 03 Design System / 10 Page Patterns

Document ID: `03-design-system/10-page-patterns.md`  
Version: 1.0  
Status: Frozen  
Implementation Allowed: Governance authority — implementation requires an approved package  
Depends On: `03-design-system/09-ux-constitution.md`

---

# 1. Purpose

Page Patterns define reusable structures for OneDayOS pages. They make modules feel like one operating system instead of unrelated screens.

These patterns are governance requirements. Component implementation belongs to later packages.

---

# 2. Universal Page Header

Every authenticated task page needs a page header that answers:

- Where am I?
- What is this page?
- What can I do here?
- What should I understand before acting?

Required structure:

```text
Breadcrumb
Title
Description
Primary action, if one exists
Secondary actions, only if relevant
```

Page headers must not be replaced by a content navbar. Sidebar navigation is the primary authenticated navigation.

Contextual help is required when the page title alone does not explain ownership, consequences, or the next safe action.

---

# 3. App Launcher Pattern

Purpose: help the user choose an available app for the current organization.

Required structure:

- Organization context.
- Available app cards.
- Clear app descriptions.
- Primary action per app.
- Disabled/unavailable state only when useful.

Required states:

- Loading app-card skeleton.
- Empty state when no app is available.
- Permission or unavailable explanation when a known app cannot be opened.

Accessibility expectations:

- App cards expose clear link/button names.
- Keyboard users can open every available app.
- Current organization context is visible and programmatically understandable.

Forbidden:

- Records as an app.
- People as an app.
- Hidden disabled modules pretending to be available.
- Fake app cards for unimplemented modules.

Example uses:

- `/[orgSlug]/apps`.

---

# 4. Module Dashboard Pattern

Purpose: summarize real module state and guide the next task.

Required structure:

- Page header with module context.
- Real operational summary, if real data exists.
- Recent activity or table section, if available.
- Primary task action.
- Empty state when no data exists.

Required states:

- Dashboard loading skeleton.
- Empty/no-activity state.
- Safe API error state.
- Permission denied or module unavailable state.

Accessibility expectations:

- Summary cards use text labels, not color-only meaning.
- Primary action is reachable before secondary dashboard content.

Forbidden:

- Fake metrics.
- Fake charts.
- Marketing-style hero sections.
- Dashboard cards that do not map to real data or tasks.

Loading state:

- Header skeleton.
- Metric or summary skeletons shaped like the real layout.
- Table or activity skeleton where applicable.

Example uses:

- Inventory Overview.
- Future official module landing pages.

---

# 5. Process Flow Pattern

Purpose: teach how a business workflow works in OneDayOS.

Required structure:

- Page header.
- Numbered process steps.
- Ownership boundaries.
- Inputs and outputs.
- Mistake-prevention notes.
- Deferred integrations.

Required states:

- Process-flow loading skeleton.
- Safe error state if supporting context fails.

Accessibility expectations:

- Steps must be sequentially readable.
- Cards, arrows, and labels must not rely on color alone.

Accessibility rules:

- Steps must be readable without relying only on arrows or color.
- The flow must work in a stacked mobile layout.
- Headings must identify each stage.

Forbidden:

- Workflow automation disguised as documentation.
- Approval, notification, or integration claims that are not implemented.

Example uses:

- Inventory Process Flow.
- Future module training/demo pages.

---

# 6. List / Table Pattern

Purpose: support scanning, comparison, filtering, and repeated operational work.

Required structure:

- Page header.
- Optional filter area.
- Dense semantic table.
- Row actions where relevant.
- Empty, filtered-empty, loading, error, and permission states.

Required states:

- Table loading skeleton.
- General empty state.
- Filtered-empty state.
- Safe table error state.
- Permission denied state.

Accessibility expectations:

- Use semantic table structure for tabular data.
- Headers must identify columns.
- Row actions must have accessible names.

Loading state:

- Header skeleton.
- Action skeleton.
- Table header skeleton.
- Several row skeletons.

Forbidden:

- Card grids for dense operational records unless the record type requires visual inspection.
- Tables without clear empty and error states.
- Client-side tenant identity fields.

Example uses:

- Records Products.
- Inventory Stock Levels.
- Inventory Stock Movements.

---

# 7. Create / Edit Form Pattern

Purpose: collect valid input while preventing expensive mistakes.

Required structure:

- Page header.
- Form-level guidance.
- Field labels.
- Required indicators.
- Help text where needed.
- Field-level errors.
- Form-level error.
- Submit and cancel/back controls.

Required states:

- Form loading skeleton.
- Pending submit state.
- Field validation state.
- Form-level safe error state.
- Success or next-step state where appropriate.

Accessibility expectations:

- Every input has a visible label.
- Error text is associated with the field.
- Required fields are clear without relying only on color.

Loading state:

- Header skeleton.
- Field-row skeletons.
- Submit button skeleton.

Forbidden:

- Hidden `orgId`.
- Client-submitted tenant identity.
- Raw provider/database errors.
- Ambiguous destructive actions.

Example uses:

- New Stock Adjustment.
- Business Object create/edit pages.

---

# 8. Detail Pattern

Purpose: let the user inspect one record and choose the next action.

Required structure:

- Page header.
- Identity summary.
- Key operational facts.
- Related data sections.
- Safe actions.
- Permission-aware unavailable actions.

Required states:

- Detail loading skeleton.
- Missing record safe 404 state.
- Permission denied state.
- Related-section empty and error states.

Accessibility expectations:

- The record identity is the first meaningful content.
- Related sections have headings.

Forbidden:

- Presenting module-owned data as shared identity.
- Hiding ownership boundaries when related records come from another domain.

Example uses:

- Business Object detail pages.
- Future module-owned record detail pages.

---

# 9. Settings Pattern

Purpose: configure a scoped part of the system.

Required structure:

- Page header.
- Clear scope label.
- Setting sections.
- Save/cancel where mutation exists.
- Explanation of consequences for risky settings.

Required states:

- Settings loading skeleton.
- Empty/no-settings state.
- Validation error state.
- Save pending state.
- Safe error state.

Accessibility expectations:

- Setting groups have headings.
- Consequences are visible before risky changes.

Forbidden:

- Organization-wide settings inside a module unless explicitly owned there.
- Module settings that mutate shared Business Object identity.

Example uses:

- Organization Settings.
- Future module settings pages.

---

# 10. Loading Pattern

Purpose: communicate progress without making every page look the same.

Required structure:

- Skeletons that resemble the eventual page pattern.
- Stable shell and page header region.
- No full-screen spinner for normal table/form/dashboard loads.

Accessibility expectations:

- Loading text is available where skeleton shape alone is unclear.
- Reduced motion preferences are respected.

Forbidden:

- Same three horizontal bars on every route.
- Blank black/white pages while data loads.

Example uses:

- Dashboard loading.
- Table loading.
- Form loading.
- Process Flow loading.

---

# 11. Empty Pattern

Purpose: explain why there is no data and what the user can do next.

Required structure:

- Plain-language title.
- Short explanation.
- Primary next action when one exists.
- Optional secondary link to related setup.

Accessibility expectations:

- Empty state title is a heading or labelled region.
- Action labels are specific.

Forbidden:

- "No data" without context.
- Empty states that suggest unauthorized actions.

Example uses:

- No Products yet.
- No Stock Adjustments yet.

---

# 12. Filtered Empty Pattern

Purpose: distinguish "nothing exists" from "the current filter hides results."

Required structure:

- Filter-specific title.
- Explanation that records may exist outside the current filter.
- Clear filter/reset action.

Accessibility expectations:

- Reset action is keyboard reachable.
- The active filter context is visible in text.

Forbidden:

- Using the same copy as first-use empty states.

Example uses:

- Stock Movements filtered to a Product with no movements.

---

# 13. Error Pattern

Purpose: fail safely and guide recovery.

Required structure:

- Plain-language title.
- Safe reason.
- Recovery action.
- Support/reporting note when useful.

Accessibility expectations:

- Error region is announced or easy to discover.
- Retry action has a clear accessible name.

Forbidden:

- Stack traces.
- Raw Prisma, SQL, Supabase, or provider messages.
- Tenant existence leaks.

Example uses:

- API request failed.
- Relation options could not load.

---

# 14. Permission Denied Pattern

Purpose: explain that the user cannot perform or view an action.

Required structure:

- Permission-denied title.
- Safe explanation.
- Suggested next step, such as contacting an Org Admin.

Accessibility expectations:

- The denied state is visible in text, not only disabled controls.

Forbidden:

- Implying the record or tenant exists when access is not allowed.
- Treating hidden UI as security.

Example uses:

- User lacks `inventory.stock_adjustment.create`.

---

# 15. Module Unavailable Pattern

Purpose: explain that a module is not enabled or available for the organization.

Required structure:

- Unavailable title.
- Module availability explanation.
- Safe route back to app launcher or available apps.

Accessibility expectations:

- The unavailable state is distinguishable from permission denial.

Forbidden:

- Redirecting APIs to login.
- Showing disabled module navigation as if it were usable.

Example uses:

- Inventory disabled for the organization.

---

# 16. Error / Permission / Unavailable Pattern

Purpose: fail safely while guiding recovery.

Required structure:

- Plain-language title.
- Safe reason.
- Recovery action.
- No stack traces.
- No provider details.
- No tenant existence leaks.

Unavailable modules should explain that the module is not available for the organization. Permission denial should explain that the user lacks access. These are different states.

---

# 17. Pattern Governance

Each official module spec must declare which page patterns it uses. If a page does not fit a known pattern, the module spec must describe the custom pattern and why it is needed.

Repeated custom patterns should become shared page patterns after review.

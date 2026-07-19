# OneDayOS Engineering Manual — Empty, Loading, and Error States

**Document ID:** `03-design-system/06-empty-loading-error-states.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before Restarted Platform UI Build`  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Supersedes:** None  
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
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `13-security/04-api-security.md`
- `15-deployment-operations/05-error-handling.md`

---

# 1. Purpose

This document defines how OneDayOS should behave when there is:

```txt
no data
data loading
partial data
permission denial
module-disabled access
wrong-organization access
validation failure
network failure
server failure
optimistic mutation rollback
unexpected application failure
```

These states are not minor UI details.

They are the difference between software that feels trustworthy and software that feels unfinished.

OneDayOS must not show blank pages, dead spinners, raw stack traces, generic browser errors, unstyled `404`s, or confusing permission failures.

The goal is to make every non-happy-path state feel:

```txt
clear
calm
recoverable
secure
consistent
businesslike
premium
```

A user should always understand:

```txt
what happened
whether they can fix it
what action to take next
whether the system is still safe
```

---

# 2. Core Principle

```txt
The empty, loading, and error states are part of the product.
They are not fallback scraps.
```

A page is not complete because the happy path renders.

A OneDayOS page is complete only when it handles:

```txt
[ ] first-time use
[ ] no matching results
[ ] disabled modules
[ ] missing permissions
[ ] slow data
[ ] failed requests
[ ] validation errors
[ ] server errors
[ ] optimistic rollback
[ ] soft-deleted records
[ ] wrong organization access
[ ] unexpected failures
```

The old generated base app had the pieces of a web app, but it felt like a generic admin starter. Empty, loading, and error states are one of the places where that generic feeling becomes obvious.

The restarted platform must treat these states as first-class design system components.

---

# 3. State Taxonomy

OneDayOS must distinguish these states clearly.

They are not interchangeable.

| State | Meaning | User Message Style | Security Concern |
|---|---|---|---|
| Empty first-use | No records exist yet | Encouraging, action-oriented | Must respect create permission |
| Empty filtered | Records exist, but filter/search hides them | Neutral, filter-oriented | Must not reveal hidden records |
| Loading | Data is being fetched | Quiet, skeleton-based | Must not flash unauthorized data |
| Permission denied | User lacks permission | Clear, non-accusatory | Must not reveal forbidden data |
| Module disabled | Org does not have module enabled | Safe not-found or upgrade/config message | Must not reveal module internals unnecessarily |
| Wrong organization | User tried another org | Safe `404` | Must not confirm org existence |
| Validation error | Input is invalid | Specific field-level recovery | Must not trust client validation |
| Conflict | Record already exists or state changed | Business-specific recovery | Must not leak other tenant data |
| Network/server error | Request failed | Retry/support-oriented | Must not show stack traces |
| Optimistic rollback | UI predicted success but server rejected | Honest rollback message | Must not fake success |
| Unexpected app error | Unhandled failure boundary | Calm recovery path | Must log safely |

---

# 4. Non-Negotiable Rules

## 4.1 Never show raw technical errors to users

Forbidden user-facing output:

```txt
PrismaClientKnownRequestError: P2002
Cannot read properties of undefined
TypeError: fetch failed
Error: Unauthorized
NEXT_REDIRECT
Stack trace...
```

Correct user-facing output:

```txt
We could not save this record because another record already uses that code.
```

```txt
You do not have permission to perform this action.
```

```txt
Something went wrong while loading this page. Try again or contact support if it continues.
```

Technical details belong in logs and monitoring, not the UI.

---

## 4.2 API auth errors must never appear as login-page HTML inside app screens

Protected APIs must return JSON errors.

Forbidden:

```txt
API request fails and returns /login HTML.
```

Correct:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

The UI can then decide whether to show a session-expired state or redirect the user intentionally.

---

## 4.3 Permission states must not leak forbidden data

A user without permission must not see:

```txt
record names
counts
table rows
available actions
hidden module internals
other organization names
```

Bad:

```txt
You do not have access to Acme Corporation's Inventory.
```

Better for wrong-org access:

```txt
Page not found.
```

Better for same-org missing permission:

```txt
You do not have permission to view this page.
Ask your OneDayOS administrator if you need access.
```

---

## 4.4 Empty states must respect permissions

If a user has read permission but not create permission, an empty table must not show a primary `Create` button.

Correct:

```txt
No products yet.
```

No create action shown.

If the user has create permission:

```txt
No products yet.
Add your first product to start using inventory records across OneDayOS.
[Add product]
```

Empty states are permission-aware for usability, but APIs and services still enforce security.

---

## 4.5 Loading states must not flash unauthorized data

Never render old tenant data while loading a new tenant route.

Wrong:

```txt
User switches org route
old org table remains visible while new data loads
```

Correct:

```txt
route context resolves server-side
verified PlatformContext created
then authorized page data renders
```

Client loading states must not briefly expose data from the wrong organization or a previous permission state.

---

## 4.6 Prefer skeletons over spinners

OneDayOS should avoid generic full-page spinners.

Preferred:

```txt
skeleton table rows
skeleton cards
skeleton form sections
skeleton detail header
subtle shimmer or opacity pulse
```

Use spinners only for very small inline actions where layout is already stable, such as a button pending state.

---

## 4.7 Optimistic UI must include rollback states

Optimistic UI is required for safe mutations, but it must never fake success permanently.

Pattern:

```txt
1. user performs action
2. UI updates immediately
3. request is sent
4. if success: keep optimistic state
5. if failure: roll back state
6. show clear toast or inline error
7. optionally refresh server state
```

Bad:

```txt
row disappears forever even though DELETE failed
```

Correct:

```txt
row disappears immediately
server rejects because user lacks permission
row returns
error toast explains the action was not allowed
```

---

# 5. Empty State Standards

Empty states must be precise.

OneDayOS must not use the same generic empty state everywhere.

Forbidden generic copy:

```txt
No data.
```

```txt
Nothing here yet.
```

```txt
No records found.
```

These are acceptable only as internal fallback strings, not final page copy.

---

## 5.1 Empty first-use state

Used when the organization has not created any records yet.

Examples:

```txt
No products yet.
Add your first product so Inventory, Purchasing, and future modules can reference it.
```

```txt
No employees yet.
Add employees once and reuse them across Leave, Assets, Projects, and approvals.
```

```txt
No customers yet.
Create your first customer record so CRM and future sales workflows can use it.
```

Structure:

```txt
icon or small illustration
clear title
one-sentence explanation
primary action if allowed
secondary documentation/help action if useful
```

Example component shape:

```tsx
<EmptyState
  icon="Package"
  title="No products yet"
  description="Add products once and reuse them across Inventory, Purchasing, and future modules."
  action={canCreate ? { label: 'Add product', href: '/objects/products/new' } : undefined}
/>
```

---

## 5.2 Empty filtered/search state

Used when there are records, but the current filters/search return none.

Copy should not imply the whole table is empty.

Correct:

```txt
No products match your filters.
Try clearing filters or searching for a different code or name.
```

Correct actions:

```txt
Clear filters
Reset search
```

Do not show `Create` as the primary action in a filtered-empty state unless the user explicitly searched for a record that might need to be created and has create permission.

---

## 5.3 Empty module state

Used when a module is enabled but has no module-owned records yet.

Example for Inventory:

```txt
No stock movements yet.
Stock movements appear after adjustments, receipts, transfers, or future integrations create inventory activity.
```

Example for Leave:

```txt
No leave requests yet.
Submitted leave requests will appear here for review and tracking.
```

Example for CRM:

```txt
No opportunities yet.
Create an opportunity when a customer has a potential deal to track.
```

Module empty states should explain the module workflow, not just the database table.

---

## 5.4 Empty Business Object state

Business Object empty states must reinforce shared-object philosophy.

Employee:

```txt
No employees yet.
Employees are shared across OneDayOS modules such as Leave, Assets, Projects, and future approvals.
```

Product:

```txt
No products yet.
Products are shared records. Inventory tracks stock around products; Purchasing can later procure them.
```

Customer:

```txt
No customers yet.
Customers are shared records that CRM, Reservations, Projects, and future billing can reference.
```

Supplier:

```txt
No suppliers yet.
Suppliers are shared vendor records for Purchasing, Inventory, Expenses, and Assets.
```

Warehouse:

```txt
No warehouses yet.
Warehouses identify operational storage locations that Inventory and Purchasing can reference.
```

This prevents UI ownership confusion such as Product feeling like it belongs only to Inventory.

---

## 5.5 Empty dashboard state

Dashboards must not use fake placeholder charts.

Forbidden:

```txt
static fake chart
random KPI cards
example data mixed with real tenant data
```

Correct:

```txt
This dashboard will become useful as your team uses OneDayOS.
Start by adding employees, enabling modules, or creating records.
```

For a new organization, a dashboard should show setup progress rather than meaningless metrics.

Example:

```txt
Set up your workspace
[✓] Organization created
[ ] Add employees
[ ] Enable modules
[ ] Add first product/customer/etc.
[ ] Invite team members
```

---

## 5.6 Empty settings/configuration state

Settings empty states should explain what can be configured.

Example:

```txt
No module settings yet.
Settings appear here after modules are enabled for this organization.
```

Do not show module settings for disabled modules.

---

# 6. Loading State Standards

Loading states should preserve layout, reduce anxiety, and avoid jarring transitions.

The user should feel that the product is working, not frozen.

---

## 6.1 Page-level loading

Page-level loading should use skeleton layout that resembles the final page.

Examples:

```txt
page header skeleton
toolbar skeleton
table row skeletons
```

Forbidden:

```txt
blank white page
full-screen spinner
layout jump after data loads
```

---

## 6.2 Table loading

Tables should use skeleton rows.

Pattern:

```txt
header remains visible if possible
5–10 skeleton rows
row height matches final row height
actions column uses small skeleton block
```

Do not show:

```txt
"No records" while loading
```

Loading and empty are different states.

---

## 6.3 Form loading

Forms that need relation data should show stable skeletons.

Example:

```txt
label skeleton
input skeleton
select skeleton
button skeleton or disabled button
```

If relation options fail to load, show a field-level error rather than breaking the whole form when possible.

Example:

```txt
Could not load employees. Try again.
```

---

## 6.4 Detail-page loading

Detail pages should use skeletons for:

```txt
record title
status badge
metadata rows
action buttons
tabs/sections
```

Do not flash stale detail data from a previous record while loading another record.

---

## 6.5 Button and action loading

Buttons may show inline pending states.

Examples:

```txt
Saving…
Creating…
Deleting…
Approving…
Checking in…
```

Button pending rules:

```txt
[ ] disable duplicate submission
[ ] preserve button width where possible
[ ] use business verb
[ ] avoid generic "Loading..."
```

Correct:

```txt
Approve request → Approving…
```

Incorrect:

```txt
Approve request → Loading...
```

---

## 6.6 Navigation loading

Navigation should be server-resolved from verified `PlatformContext`.

The sidebar should not show all modules and then hide unauthorized ones after client-side fetch.

Forbidden:

```txt
client loads sidebar
shows Inventory briefly
then hides Inventory after permission fetch
```

Correct:

```txt
server resolves allowed nav
client receives already-filtered navigation model
```

---

# 7. Error State Standards

Error states must be calm, specific, and recoverable.

They should not blame the user unless the action is clearly invalid.

---

## 7.1 Page error state

Used when an entire page fails to load.

Pattern:

```txt
small icon
clear title
plain-language explanation
primary recovery action
secondary support/debug info if safe
```

Example:

```txt
We could not load this page.
Try refreshing. If this continues, contact support and include request ID: req_123.
[Try again]
```

Do not expose:

```txt
stack trace
Prisma error
SQL
Supabase token error
server env names
```

---

## 7.2 Table error state

Used when table data fails to load.

Example:

```txt
We could not load products.
Try again or adjust your filters.
[Retry]
```

For permission denial, do not show a table with zero rows.

Permission denial is not an empty table.

---

## 7.3 Form submission error

Form errors can be:

```txt
field-level validation errors
global form errors
conflict errors
permission errors
network errors
unexpected server errors
```

Field-level example:

```txt
Product code is required.
```

Conflict example:

```txt
A product with this code already exists.
```

Permission example:

```txt
You do not have permission to create products.
```

Unexpected example:

```txt
We could not save this product. Try again or contact support if it continues.
```

Form submission failures should not clear user input unless the input itself is no longer valid or the record changed beyond recovery.

---

## 7.4 Toast error standards

Toasts should be short.

Good:

```txt
Product saved.
Could not delete product.
You do not have permission to approve this request.
Connection lost. Changes were not saved.
```

Bad:

```txt
An error occurred while executing Prisma mutation with status code 500.
```

Toast rules:

```txt
[ ] use business language
[ ] avoid stack traces
[ ] keep under two lines
[ ] use inline errors for field-specific problems
[ ] use request ID only when helpful for support
```

---

## 7.5 Permission denied state

Same-organization, missing-permission state:

```txt
You do not have permission to view this page.
Ask your OneDayOS administrator if you need access.
```

Optional secondary text:

```txt
Your current role does not include `inventory.stock_adjustment.read`.
```

Only show permission codes to admins or internal operators if the UI supports that safely.

Do not show permission internals to normal staff unless it helps support.

---

## 7.6 Module disabled state

For normal users, disabled modules should usually appear as safe `404` behavior.

For organization admins, a settings/admin surface may say:

```txt
Inventory is not enabled for this organization.
Enable it from Module Settings if it is included in your plan.
```

Do not show disabled module pages to staff users.

---

## 7.7 Wrong-organization state

Wrong-org access must not confirm that another organization exists.

Correct:

```txt
Page not found.
```

Forbidden:

```txt
You are trying to access Beta Corporation, but you belong to Alpha Corporation.
```

The server should fail safely before page data renders.

---

## 7.8 Soft-deleted record state

Normal users should usually see:

```txt
Record not found.
```

Do not show:

```txt
This record was deleted by Maria at 2026-07-03 10:22.
```

unless the user is in an explicit restore/admin surface with permission.

Restore/admin state may show:

```txt
This product was deleted on July 3, 2026.
[Restore product]
```

Only if the user has restore/admin permission.

---

## 7.9 Conflict state

Conflicts should be business-specific.

Examples:

```txt
A product with this code already exists.
```

```txt
This leave request has already been approved.
```

```txt
This asset is already assigned to another employee.
```

```txt
This visitor has already checked out.
```

Avoid generic:

```txt
Conflict.
```

---

## 7.10 Session-expired state

If an API returns `UNAUTHENTICATED`, the UI can show:

```txt
Your session has expired.
Sign in again to continue.
[Sign in]
```

Do not show a raw failed fetch error.

Do not repeatedly retry protected APIs if the session is expired.

---

# 8. Optimistic UI Failure States

Optimistic UI improves perceived speed, but failure must be handled honestly.

---

## 8.1 Optimistic create

Pattern:

```txt
temporary row appears immediately
server returns real record
replace temporary row with real row
failure removes temporary row and shows error
```

Temporary records must have local-only IDs clearly distinguishable in client state.

Do not emit business events from the UI.

Only services emit events after successful server mutations.

---

## 8.2 Optimistic update

Pattern:

```txt
row/detail updates immediately
server confirms
keep state
failure reverts changed fields
show error
```

For high-risk business workflow actions such as approval, void, cancel, close, retire, or pay, be more conservative.

Some actions may use immediate UI feedback without changing final business state until server confirms.

---

## 8.3 Optimistic delete

Pattern:

```txt
row disappears immediately
server soft-deletes record
success toast
failure row returns
error toast
```

Delete copy should often use business verbs:

```txt
Deactivate employee
Cancel leave request
Void purchase receipt
Retire asset
Close incident
```

Do not force everything into generic `Delete`.

---

## 8.4 Optimistic permission failure

If a user sees an action due to stale UI state but the API rejects it:

```txt
rollback state
show permission error
refresh user permissions/navigation if appropriate
```

Example:

```txt
You no longer have permission to perform this action.
```

This can happen if an admin changes roles while a user is active.

---

# 9. Component Standards

OneDayOS should provide reusable state components.

Suggested components:

```txt
<EmptyState />
<TableEmptyState />
<TableSkeleton />
<FormSkeleton />
<PageSkeleton />
<PageErrorState />
<TableErrorState />
<PermissionDeniedState />
<ModuleDisabledState />
<SessionExpiredState />
<InlineFieldError />
<OptimisticRollbackToast />
```

These components should live in shared design-system/component areas, not inside individual modules.

Modules may provide module-specific copy, but should use shared state components.

---

## 9.1 EmptyState component contract

Suggested props:

```ts
type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
}
```

Rules:

```txt
[ ] no raw database language
[ ] action only appears if user has permission
[ ] no client-supplied orgId
[ ] copy explains business meaning
```

---

## 9.2 Skeleton component rules

Skeletons should:

```txt
[ ] resemble final layout
[ ] preserve page dimensions
[ ] avoid layout shift
[ ] be subtle
[ ] work in dark mode
[ ] not over-animate
```

Skeletons should not:

```txt
[ ] fake real data
[ ] show sample names
[ ] show placeholder metrics that look real
[ ] flash unauthorized content
```

---

## 9.3 Error component rules

Error states should include:

```txt
[ ] clear title
[ ] useful message
[ ] recovery action when possible
[ ] request ID when helpful and safe
[ ] no stack trace
[ ] no raw provider error
```

Error components must support:

```txt
page-level errors
table-level errors
form-level errors
field-level errors
permission errors
session errors
```

---

# 10. Copywriting Standards

OneDayOS copy should be calm, direct, and businesslike.

Use:

```txt
We could not load this page.
Try again.
Ask your administrator for access.
No products yet.
Create your first product.
```

Avoid:

```txt
Oops!
Uh oh!
Something went terribly wrong!
No data lol
Access denied!!!
```

Tone:

```txt
professional
plain English
not robotic
not playful
not dramatic
```

---

## 10.1 Error copy formula

Use this structure:

```txt
What happened.
What the user can do.
Optional safe support reference.
```

Example:

```txt
We could not save this expense claim.
Check the highlighted fields and try again.
```

Example with request ID:

```txt
We could not load this page.
Try again or contact support with request ID req_123.
```

---

## 10.2 Empty copy formula

Use this structure:

```txt
What is missing.
Why it matters.
What to do next if allowed.
```

Example:

```txt
No suppliers yet.
Suppliers can be reused by Purchasing, Expenses, Inventory, and Assets.
Add your first supplier to start tracking vendor records.
```

---

# 11. Motion and Interaction Standards

Motion should make state changes easier to understand.

Use Motion for React for:

```txt
row add/remove transitions
optimistic rollback transitions
dialog/sheet entrance and exit
empty-to-data transition
small layout changes
```

Avoid motion for:

```txt
long page transitions
decorative bouncing
confetti
marketing-style animation inside the app
animations that delay user work
```

Motion rules:

```txt
[ ] keep transitions short
[ ] respect reduced-motion preferences
[ ] do not animate sensitive data into view before authorization
[ ] do not make business tools feel playful
```

---

# 12. Security Rules

Empty, loading, and error states must preserve security boundaries.

## 12.1 No hidden tenant identity

State components must not accept or submit `orgId` from client forms.

They may receive `orgSlug` for route generation, but tenant authorization remains server-side.

## 12.2 No permission bypass by UI state

A hidden action is not security.

A visible error is not enforcement.

APIs and services enforce permission.

## 12.3 No data leakage through counts

Permission-denied states should not show counts.

Bad:

```txt
You do not have permission to view 17 incidents.
```

Correct:

```txt
You do not have permission to view incidents.
```

## 12.4 No data leakage through loading states

Do not render cached rows from another org while new org data loads.

## 12.5 No raw error leakage

Never show:

```txt
SQL
Prisma errors
Supabase service role errors
JWT details
stack traces
full request bodies
full record payloads
```

---

# 13. Module Generator Requirements

Generated modules must include empty, loading, and error states by default.

A generated list page must include:

```txt
[ ] table skeleton
[ ] empty first-use state
[ ] filtered empty state if search/filter exists
[ ] table error state
[ ] permission-aware create action
[ ] optimistic mutation rollback
```

A generated form must include:

```txt
[ ] submit pending state
[ ] field errors
[ ] global form error
[ ] conflict error handling
[ ] permission error handling
[ ] no hidden orgId
```

Generated API clients must handle:

```txt
[ ] 401 unauthenticated
[ ] 403 permission denied
[ ] 404 not found / wrong org / module disabled
[ ] 409 conflict
[ ] 422 validation error
[ ] 500 unexpected error
```

Generated code must not leave placeholder copy such as:

```txt
TODO empty state
TODO error state
No data
Loading...
```

---

# 14. Testing Requirements

Every state component and major usage pattern must be tested.

## 14.1 Empty state tests

Test:

```txt
[ ] empty title renders
[ ] description renders
[ ] primary action appears only when allowed
[ ] no action appears when user lacks permission
[ ] filtered empty state shows clear/reset action
```

## 14.2 Loading state tests

Test:

```txt
[ ] skeleton rows render
[ ] empty state does not render while loading
[ ] unauthorized data does not flash
[ ] button pending label uses business verb
```

## 14.3 Error state tests

Test:

```txt
[ ] API 401 maps to session-expired state
[ ] API 403 maps to permission denied state
[ ] safe 404 maps to not-found state
[ ] validation errors map to fields
[ ] conflict errors show business-specific copy
[ ] raw stack traces are not rendered
```

## 14.4 Optimistic rollback tests

Test:

```txt
[ ] optimistic row disappears immediately
[ ] failed delete restores row
[ ] failure toast appears
[ ] success keeps row removed
[ ] permission failure rolls back
```

## 14.5 Architecture tests

Architecture checks should block:

```txt
[ ] hidden orgId inputs
[ ] JSON.stringify({ ...data, orgId }) in client code
[ ] client imports from @/sdk/server
[ ] client imports from @/kernel/*
[ ] raw provider errors rendered directly
[ ] module-specific state components duplicating shared patterns unnecessarily
```

---

# 15. Claude Implementation Rules

Claude must not generate pages that only handle the happy path.

Claude must include empty, loading, and error states for every page type it implements.

Claude must not write:

```txt
return <div>Loading...</div>
return <div>Error</div>
return <div>No data</div>
```

as final UI.

Claude must use shared OneDayOS state components.

Claude must ask for or create appropriate state copy per module/spec.

Claude must not expose:

```txt
raw Prisma errors
raw Supabase errors
stack traces
orgId
service role details
other tenant names
```

Claude must implement rollback behavior for optimistic mutations.

Claude must add tests proving the failure states work.

---

# 16. Anti-Patterns

## 16.1 Generic admin empty states

Bad:

```txt
No records found.
```

Better:

```txt
No warehouses yet.
Warehouses identify operational storage locations that Inventory and Purchasing can reference.
```

---

## 16.2 Spinner-only loading

Bad:

```tsx
return <Spinner />
```

Better:

```tsx
return <TableSkeleton rows={8} columns={5} />
```

---

## 16.3 Error as raw exception

Bad:

```tsx
return <pre>{error.message}</pre>
```

Better:

```tsx
return <PageErrorState title="We could not load this page" requestId={requestId} />
```

---

## 16.4 Empty due to missing permission

Bad:

```txt
No records found.
```

when the user actually lacks permission.

Better:

```txt
You do not have permission to view these records.
```

or safe not-found behavior depending on context.

---

## 16.5 Fake dashboard data

Bad:

```txt
showing fake revenue, fake stock counts, fake charts
```

Better:

```txt
show setup progress or real empty dashboard state
```

---

# 17. Implementation Checklist

Before a page is considered UI-complete:

```txt
[ ] page has first-use empty state
[ ] page has filtered/search empty state if applicable
[ ] page has skeleton loading state
[ ] page has API/server error state
[ ] page has permission-denied behavior
[ ] page has module-disabled behavior if module page
[ ] forms have field and global errors
[ ] mutations use optimistic UI where safe
[ ] optimistic failures roll back
[ ] toasts are short and businesslike
[ ] no hidden orgId field exists
[ ] no raw stack/provider errors render
[ ] no unauthorized data flashes during loading
[ ] UI states are tested
[ ] state components use design system tokens
```

---

# 18. Acceptance Criteria

This document is satisfied when:

```txt
[ ] shared state components exist or are specified for implementation
[ ] tables have skeleton, empty, and error states
[ ] forms have pending, validation, conflict, and server-failure states
[ ] optimistic mutations roll back on failure
[ ] permission-denied state is distinct from empty state
[ ] wrong-org access does not leak organization existence
[ ] module-disabled state is handled safely
[ ] raw provider errors are never rendered to users
[ ] generated modules include state patterns by default
[ ] tests cover empty, loading, error, and rollback behavior
```

---

# 19. Final Rule

```txt
A OneDayOS screen is not complete when it shows data.
It is complete when it behaves gracefully without data, during loading, and after failure.
```

Empty, loading, and error states are how users learn whether the platform can be trusted.

They must feel as intentional as the happy path.

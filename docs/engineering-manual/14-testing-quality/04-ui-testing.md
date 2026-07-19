# OneDayOS Engineering Manual — 14 Testing & Quality / 04 UI Testing

**Document ID:** `14-testing-quality/04-ui-testing.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before Restarted Foundation Build`  
**Owner:** OneDayOS Founder / Software Architect  
**Last Updated:** July 2026  
**Depends On:**

- `03-design-system/00-design-vision.md`
- `03-design-system/02-layout-system.md`
- `03-design-system/03-component-standards.md`
- `03-design-system/04-table-standards.md`
- `03-design-system/05-form-standards.md`
- `03-design-system/06-empty-loading-error-states.md`
- `03-design-system/07-interaction-motion-standards.md`
- `03-design-system/08-accessibility-standards.md`
- `04-kernel/07-routing-app-shell.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `08-module-system/05-module-navigation.md`
- `13-security/03-permission-enforcement.md`
- `13-security/04-api-security.md`
- `14-testing-quality/00-testing-philosophy.md`
- `14-testing-quality/01-unit-testing.md`
- `14-testing-quality/03-api-testing.md`

---

# 1. Purpose

This document defines how OneDayOS user interface behavior must be tested.

UI testing exists to prove that the platform feels coherent, safe, usable, and reliable from the user's point of view.

It must protect the product from becoming:

```txt
a generic SaaS dashboard
an inconsistent admin template
a collection of fragile client-side hacks
a UI that hides security issues instead of enforcing them
an app that works only for Admin users
a platform where every module has different form/table behavior
```

UI tests do not replace API tests, service tests, integration tests, or security tests.

A button being hidden in the UI is not security.

A form rendering correctly is not validation security.

A table showing only one organization's records in a mocked UI test does not prove tenant isolation.

UI tests prove what the user sees and can do.

API, service, and integration tests prove what the platform enforces.

---

# 2. Core Rule

```txt
A OneDayOS UI test should verify user-visible behavior, not implementation trivia.
```

Good UI tests answer questions like:

```txt
Can the user find the action?
Can the user complete the form?
Does validation feedback appear clearly?
Does the table show the expected row behavior?
Is the forbidden action hidden or disabled?
Does the page show the correct empty, loading, and error states?
Does navigation behave correctly?
Does the UI avoid leaking data from disabled modules or other tenants?
```

Bad UI tests answer questions like:

```txt
Did this component use a specific internal state variable?
Did this div have exactly this class string?
Did this private helper get called?
Did this implementation detail remain unchanged?
```

---

# 3. Scope

This document applies to UI tests for:

```txt
Kernel app shell
sidebar
header
navigation
settings pages
Business Object pages
module pages
forms
tables
dialogs
drawers
empty states
loading states
error states
permission-denied states
generated module pages
generated forms
generated tables
future Platform Service UI
future AI UI
```

It applies to UI written by:

```txt
humans
Claude Code
module generator
future CRUD generator
future form generator
future AI-assisted code generation
```

---

# 4. What UI Testing Must Prove

UI tests must prove that OneDayOS is:

```txt
usable
consistent
permission-aware
tenant-aware at the UI level
accessible enough for normal workflows
resilient to empty/loading/error states
aligned with the design system
safe against obvious UI regressions
```

UI tests should catch issues like:

```txt
sidebar links point to missing routes
active nav state matches the wrong route
unauthorized actions appear to users
module nav appears when the module is disabled
forms submit hidden orgId fields
tables lose empty states
buttons become dead or unresponsive
toasts never appear
validation errors are invisible
dialogs do not trap focus
keyboard users cannot submit forms
loading states regress to blank pages
client component accidentally imports server-only code
```

---

# 5. What UI Testing Must Not Pretend To Prove

UI tests must not pretend to prove:

```txt
full tenant isolation
full permission enforcement
Prisma query safety
server-side validation
API auth behavior
RLS behavior
backup/restore behavior
secure event payloads
business transaction correctness
```

Those belong to:

```txt
integration tests
API tests
service tests
security tests
architecture checks
```

Example:

```txt
Testing that a Delete button is hidden for Staff is useful.

But the API must still have a 403 test proving Staff cannot delete by calling the endpoint directly.
```

---

# 6. Recommended UI Testing Stack

## 6.1 Required for MVP

Use:

```txt
Vitest
React Testing Library
@testing-library/user-event
@testing-library/jest-dom
```

For MVP, this is enough for:

```txt
component behavior tests
client component tests
form interaction tests
table behavior tests
navigation component tests
empty/loading/error state tests
permission visibility tests
basic accessibility-oriented queries
```

## 6.2 Later / Before Serious Production Scale

Add a small Playwright suite for browser-level smoke tests after the app shell, auth flow, and first official module are stable.

Playwright should test:

```txt
login flow
org dashboard load
sidebar navigation
module page load
basic create/edit/delete workflow
permission-denied browser behavior
wrong-org route behavior
```

Do not add a huge Playwright suite too early.

Browser tests are valuable, but they are slower and more operationally complex than component tests.

Start with a small, high-value smoke suite.

## 6.3 Deferred

Do not implement these during the restarted foundation build unless explicitly approved:

```txt
visual regression testing service
screenshot diff pipeline
Storybook test runner
full browser matrix
mobile device farm
cross-browser performance testing
synthetic monitoring tests
```

These may be valuable later, but they are not required to restart the platform correctly.

---

# 7. Testing Philosophy for React Components

React component tests should resemble user behavior.

Prefer queries like:

```ts
screen.getByRole('button', { name: /save/i })
screen.getByLabelText(/email/i)
screen.getByText(/no records found/i)
screen.getByRole('link', { name: /inventory/i })
```

Avoid fragile queries like:

```ts
container.querySelector('.some-class')
screen.getByTestId('save-button') // unless there is no better accessible query
```

`data-testid` is allowed only when:

```txt
there is no semantic role
there is no label
there is no stable accessible text
the element is intentionally invisible to assistive tech
```

If the only way to test a component is through `data-testid`, that may indicate the component is not accessible enough.

---

# 8. Server Components and Client Components

OneDayOS uses Next.js App Router.

This means some UI is rendered by Server Components and some by Client Components.

## 8.1 Client Components

Client Components should be tested directly with React Testing Library when they contain:

```txt
form behavior
optimistic UI
client-side filtering
row actions
local state
dialog interactions
toasts
keyboard interactions
```

Examples:

```txt
ProductListClient
InventoryAdjustmentForm
ModuleSidebarClient
DataTable
CommandMenu
```

## 8.2 Server Components

Server Components should not be over-tested with brittle component tests.

For Server Components, prefer testing:

```txt
data-fetching services
API routes
page-level behavior through Playwright later
extracted pure presentational components
```

If a Server Component becomes difficult to test, split it:

```txt
Server page:
  auth/context/data fetching
  passes safe props down

Client/presentational component:
  user interaction
  rendering behavior
  tested with React Testing Library
```

Good pattern:

```tsx
export default async function ProductsPage({ params }) {
  const ctx = await sdk.auth.requirePageModuleContext(params.orgSlug, 'inventory')
  const products = await ProductService.list(ctx)

  return <ProductListClient initialProducts={products} />
}
```

Then test:

```txt
ProductService.list with integration tests
ProductListClient with UI tests
route/page smoke with Playwright later
```

---

# 9. Required UI Test Categories

## 9.1 App Shell Tests

The app shell must have UI tests for:

```txt
renders organization name
renders user avatar or initials
renders dashboard navigation
renders enabled module navigation
hides disabled module navigation
hides unauthorized module navigation
renders settings only when allowed
collapses and expands sidebar
preserves navigation labels or tooltips when collapsed
```

App shell tests must include at least:

```txt
admin user
staff user
module enabled
module disabled
user with permission
user without permission
```

## 9.2 Sidebar Active-State Tests

Sidebar active-state behavior must be tested because the old MVP had unsafe prefix matching.

Required cases:

```txt
/inventory matches Inventory
/inventory/products matches Inventory
/inventory-audit does not match Inventory
/settings matches Settings
/employees matches Employees
```

Forbidden implementation behavior:

```ts
pathname.startsWith(href)
```

unless the matching logic is normalized to avoid false positives like:

```txt
/inventory
/inventory-audit
```

## 9.3 Navigation Link Tests

Every generated module should have tests proving:

```txt
manifest nav href exists
page route exists
nav href is org-shell-relative
nav href does not hard-code orgSlug
nav href does not point to disabled/deferred services
```

Bad:

```txt
href: '/demo-corp/inventory'
href: '/inventory'
href: '/api/inventory'
```

Good:

```txt
href: 'inventory'
href: 'inventory/stock-levels'
```

The shell resolves it under:

```txt
/[orgSlug]/inventory
/[orgSlug]/inventory/stock-levels
```

---

# 10. Form UI Tests

Forms are one of the highest-risk UI areas because they combine:

```txt
user input
validation
permissions
server submission
tenant context
business events
optimistic feedback
```

## 10.1 Required Form Tests

Every form must test:

```txt
renders required fields
renders field labels
shows validation errors
prevents submit when invalid
submits valid business input
does not include orgId field
does not include hidden orgId field
shows loading/submitting state
shows success feedback
shows error feedback
supports keyboard submit
```

## 10.2 Forbidden Form Patterns

Forms must not include:

```tsx
<input type="hidden" name="orgId" />
```

Forms must not submit:

```json
{
  "orgId": "org_123",
  "name": "Product A"
}
```

Forms submit business input only:

```json
{
  "name": "Product A",
  "code": "SKU-001",
  "unit": "pcs"
}
```

Tenant identity comes from:

```txt
session
orgSlug
PlatformContext
```

not from form input.

## 10.3 Form Example Test

Example:

```tsx
it('does not submit orgId from the form', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()

  render(<ProductForm onSubmit={onSubmit} />)

  await user.type(screen.getByLabelText(/name/i), 'Sample Product')
  await user.type(screen.getByLabelText(/code/i), 'SKU-001')
  await user.click(screen.getByRole('button', { name: /save/i }))

  expect(onSubmit).toHaveBeenCalledWith(
    expect.not.objectContaining({ orgId: expect.anything() })
  )
})
```

This UI test is useful, but the API must also reject client-supplied `orgId`.

---

# 11. Table UI Tests

Tables are a core OneDayOS product surface.

They should be:

```txt
data-dense
readable
keyboard-friendly
consistent
permission-aware
empty-state aware
loading-state aware
```

## 11.1 Required Table Tests

Shared table components must test:

```txt
renders headers
renders rows
renders empty state
renders loading state
renders error state when applicable
supports row actions
supports bulk action visibility when applicable
supports custom cell rendering
uses accessible table structure
```

Module tables must test:

```txt
authorized actions appear
unauthorized actions are hidden or disabled
soft-deleted records are not shown
empty state uses module-appropriate language
row action calls correct callback
optimistic delete removes row visually
failed delete restores or refreshes row state
```

## 11.2 Table Tests Must Not Replace Data Tests

A table test can prove:

```txt
this row is rendered when passed as prop
this row disappears after delete click
```

A table test cannot prove:

```txt
the database query excluded another tenant's records
the API enforced permission
the service respected soft delete
```

Those belong to integration/API/service tests.

---

# 12. Empty, Loading, and Error State Tests

Every important page and shared component must have explicit tests for:

```txt
empty state
loading state
error state
permission-denied state
module-disabled state
not-found state
```

OneDayOS must not ship pages that look broken when there is no data.

## 12.1 Empty State Requirements

Empty states should include:

```txt
clear title
short explanation
primary action if the user has permission
no primary action if the user lacks permission
```

Test cases:

```txt
Admin sees '+ New Product' in empty Products page
Staff without create permission does not see '+ New Product'
Empty message still explains what the page is for
```

## 12.2 Loading State Requirements

Loading states should use skeletons, not blank pages.

Test cases:

```txt
renders skeleton while loading
skeleton has accessible label or is not disruptive
loading state does not show stale unauthorized actions
```

## 12.3 Error State Requirements

Error states should:

```txt
show a user-safe message
offer retry when appropriate
not expose stack traces
not expose raw API errors
not expose orgId/database IDs unnecessarily
```

---

# 13. Permission-Aware UI Tests

Permission-aware UI matters because it reduces user confusion.

But it is not security.

## 13.1 Required Permission UI Tests

For any protected action, UI tests must prove:

```txt
user with permission sees action
user without permission does not see action or sees disabled state with explanation
user with read-only permission cannot see create/edit/delete controls
export action requires export permission
import action requires import permission
approval action requires approve permission plus workflow assignment later
```

Examples:

```txt
objects.product.create controls
objects.product.update controls
objects.product.delete controls
inventory.stock_adjustment.create controls
inventory.stock_adjustment.approve controls
```

## 13.2 Permission UI Anti-Pattern

Bad:

```tsx
{isAdmin && <DeleteButton />}
```

Better:

```tsx
{permissions.can({ module: 'objects', resource: 'product', action: 'delete' }) && (
  <DeleteButton />
)}
```

But the API/service still enforces:

```ts
await sdk.permissions.require(ctx, {
  module: 'objects',
  resource: 'product',
  action: 'delete',
})
```

---

# 14. Module Enablement UI Tests

Module enablement and permission are different gates.

UI tests must prove:

```txt
disabled module nav is hidden
disabled module route shows safe not-found behavior
module enabled but user lacks permission shows permission-denied behavior
enabled module nav appears only if user also has required nav permission
Admin wildcard does not show disabled modules
```

Example scenarios:

| Scenario | Expected UI |
|---|---|
| Inventory disabled, Admin user | Inventory nav hidden |
| Inventory enabled, Staff without read | Inventory nav hidden or permission-denied depending route |
| Inventory enabled, Staff with read | Inventory nav visible |
| Inventory enabled, Staff with read only | Create/Delete buttons hidden |

---

# 15. Accessibility-Oriented UI Tests

OneDayOS is intended to be keyboard-first and fast.

UI tests should include accessibility-oriented behavior, especially for shared components.

## 15.1 Required Accessibility Smoke Tests

Shared components should test:

```txt
buttons have accessible names
inputs have labels
dialogs have titles
dialogs can be closed by keyboard
forms can be submitted by keyboard
table actions are reachable
focus moves predictably after opening dialog/drawer
error messages are associated with fields when practical
```

## 15.2 Query Priority

Prefer accessibility-friendly queries:

```txt
getByRole
getByLabelText
getByPlaceholderText, when appropriate
getByText, when appropriate
```

Avoid tests that rely on:

```txt
class names
DOM hierarchy
private component internals
visual styling only
```

## 15.3 Accessibility Is Not Only Tests

Automated UI tests do not prove full accessibility.

The design system must still define:

```txt
focus states
color contrast
keyboard behavior
reduced motion
screen reader labels
```

---

# 16. Optimistic UI Tests

The previous platform direction correctly emphasized optimistic UI and fast perceived response.

Optimistic UI must be tested because it can easily become inconsistent.

## 16.1 Required Optimistic Mutation Tests

For optimistic delete:

```txt
row disappears immediately after click
success toast appears when API succeeds
error toast appears when API fails
state refresh or rollback occurs when API fails
button is disabled or protected during pending mutation
```

For optimistic create:

```txt
new item appears or user is redirected immediately when appropriate
success toast appears after confirmation
error toast appears and form data is not lost when API fails
```

For optimistic update:

```txt
new value appears immediately
failed update restores old value or refreshes from server
error toast appears
```

## 16.2 Optimistic UI Must Not Lie About Security

If an optimistic mutation fails with `403`, the UI must not keep the optimistic result.

Example:

```txt
Staff clicks Delete due to stale UI state
API returns 403
row must reappear or page must refresh
error toast must explain action is not allowed
```

---

# 17. Toast, Tooltip, Dialog, and Drawer Tests

Shared interaction components must have tests because they appear everywhere.

## 17.1 Toast Tests

Mutation UIs should test:

```txt
success toast appears
error toast appears
loading/pending state is visible when appropriate
toast is not the only place critical information appears
```

## 17.2 Tooltip Tests

Tooltips are useful for non-obvious fields and actions.

Tests should verify:

```txt
help trigger exists for non-obvious fields
tooltip content is short and understandable
tooltip trigger is keyboard reachable when practical
```

Tooltips must not be used to hide required instructions that should be visible in the form.

## 17.3 Dialog / Drawer Tests

Dialogs and drawers should test:

```txt
opens from intended trigger
has accessible title
closes from cancel/close action
submits from primary action
shows validation errors
returns focus when closed when practical
```

---

# 18. Design System Regression Tests

The design system should have tests for behavior, not pixel-perfect snapshots.

Shared UI primitives should test:

```txt
variants render accessible controls
loading states disable unsafe actions
icon-only buttons require accessible labels
destructive actions use confirmation where required
forms render error messages consistently
tables render empty states consistently
```

Avoid large snapshots of entire pages unless they are intentionally stable and provide real value.

Snapshot tests are allowed only for:

```txt
generated manifest output
generator file lists
small stable serialized structures
```

Avoid snapshots for:

```txt
full dashboards
large tables
animated components
class-heavy shadcn markup
```

---

# 19. Generated Module UI Tests

The Module Generator must generate UI tests by default.

Generated UI tests must cover:

```txt
module list page renders title
empty state renders
create action appears for user with create permission
create action is hidden for read-only user
form rejects missing required fields
form does not include orgId input
form submits valid business input
optimistic delete behavior works if generated
error toast appears on failed mutation
```

Generated tests must not be placeholders like:

```txt
renders without crashing
returns an array
button exists
```

A generated module UI test should prove at least one meaningful behavior.

---

# 20. Business Object UI Tests

Business Object UI tests must preserve ownership boundaries.

Examples:

```txt
Product page uses objects.product permissions
Product page does not live under Inventory by default
Customer page uses objects.customer permissions
Employee page uses objects.employee permissions
Warehouse page uses objects.warehouse permissions
```

Required tests for Business Object pages:

```txt
renders shared object label
shows create button only with objects.*.create permission
shows edit/delete actions only with correct objects.* permissions
uses tenant-scoped routes under /[orgSlug]/objects/... or approved shell path
empty state does not mention a specific module incorrectly
```

Bad empty state:

```txt
No inventory products yet.
```

Better:

```txt
No products yet.
Products can be used by Inventory, Purchasing, and Sales modules.
```

---

# 21. Client Components Must Not Import Server Code

UI tests alone cannot fully prove import safety, but UI testing must be paired with architecture checks.

Client Components must not import:

```txt
@/sdk/server
@/kernel/*
@/kernel/db/client
@prisma/client
server-only env helpers
Supabase service-role clients
module server services directly when unsafe
```

Allowed imports:

```txt
@/sdk/client
@/sdk shared types/constants
@/components/ui/*
client-safe schemas
client-safe types
```

Architecture checks must enforce this.

Generated UI files must pass the same checks.

---

# 22. Mocking Rules for UI Tests

Mocking is allowed, but it must not hide important behavior.

## 22.1 Good Mocks

Good UI mocks include:

```txt
mock API success
mock API validation error
mock API 403
mock API network failure
mock router navigation
mock toast function
mock permission state
```

## 22.2 Bad Mocks

Bad UI mocks include:

```txt
mocking all permissions as Admin
mocking all API responses as success
mocking forms so validation never runs
mocking DataTable so row actions are not tested
mocking router so navigation hrefs are never checked
```

A UI test suite that only tests Admin success is not acceptable.

---

# 23. Recommended Test File Locations

Use co-located tests.

Examples:

```txt
src/components/kernel/layout/__tests__/Sidebar.test.tsx
src/components/kernel/data-table/__tests__/DataTable.test.tsx
src/components/forms/__tests__/FormField.test.tsx
src/modules/inventory/__tests__/ui/InventoryListClient.test.tsx
src/modules/inventory/__tests__/ui/InventoryForm.test.tsx
src/app/(platform)/[orgSlug]/inventory/__tests__/page-smoke.test.tsx // only if practical
```

For generated modules:

```txt
src/modules/[moduleId]/__tests__/ui/[Module]ListClient.test.tsx
src/modules/[moduleId]/__tests__/ui/[Module]Form.test.tsx
```

Do not scatter tests in a disconnected global folder unless they are true end-to-end tests.

---

# 24. Browser / E2E Testing Policy

## 24.1 Deferred Until Shell Stabilizes

A small browser test suite should be added after:

```txt
app shell is stable
auth flow is stable
first official module exists
production readiness gate is close
```

Do not build a massive E2E suite during the earliest foundation restart.

## 24.2 Future Required Browser Smoke Tests

Future browser smoke tests should cover:

```txt
user can log in
user lands in correct org dashboard
wrong-org route does not show another org
sidebar navigation works
module disabled behavior works
read-only user cannot access create UI
admin can create a basic record
API 403 produces safe UI behavior
```

## 24.3 Browser Tests Must Not Replace Lower-Level Tests

Browser tests are slow and broad.

They should prove critical workflows.

They should not replace:

```txt
unit tests
component tests
API tests
integration tests
security tests
architecture checks
```

---

# 25. Visual Regression Policy

Visual regression testing is deferred.

Reason:

```txt
OneDayOS design system is not frozen yet.
Pixel snapshots taken too early create noise.
The first priority is consistent component behavior and design standards.
```

Later, once the design system is stable, visual regression may be useful for:

```txt
app shell
DataTable
forms
dialogs
empty states
module dashboard cards
```

Until then, avoid fragile screenshot tests.

---

# 26. UI Test Examples

## 26.1 Permission Visibility Example

```tsx
it('hides create button for read-only users', () => {
  render(
    <ProductListClient
      products={[]}
      permissions={{ canCreate: false, canUpdate: false, canDelete: false }}
    />
  )

  expect(screen.queryByRole('link', { name: /new product/i })).not.toBeInTheDocument()
})
```

## 26.2 Empty State Example

```tsx
it('shows useful empty state when there are no products', () => {
  render(
    <ProductListClient
      products={[]}
      permissions={{ canCreate: true, canUpdate: true, canDelete: true }}
    />
  )

  expect(screen.getByText(/no products yet/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /new product/i })).toBeInTheDocument()
})
```

## 26.3 Failed Mutation Example

```tsx
it('shows error toast when delete fails', async () => {
  const user = userEvent.setup()

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status: 403,
    json: async () => ({
      data: null,
      error: { code: 'FORBIDDEN', message: 'You are not allowed to delete this record.' },
    }),
  }))

  render(<ProductListClient products={[{ id: 'p1', name: 'Sample' }]} permissions={{ canDelete: true }} />)

  await user.click(screen.getByRole('button', { name: /delete sample/i }))

  expect(screen.getByText(/sample/i)).toBeInTheDocument()
  expect(toast.error).toHaveBeenCalled()
})
```

## 26.4 Sidebar Active State Example

```tsx
it('does not mark Inventory active for /inventory-audit', () => {
  renderSidebar({ pathname: '/demo-corp/inventory-audit' })

  expect(screen.getByRole('link', { name: /inventory/i })).not.toHaveAttribute('aria-current', 'page')
})
```

---

# 27. Required Checks Before UI Work Is Complete

A UI feature is not complete unless:

```txt
[ ] user-visible happy path tested
[ ] relevant empty state tested
[ ] relevant loading state tested
[ ] relevant error state tested
[ ] relevant permission visibility tested
[ ] relevant keyboard/accessibility behavior tested
[ ] no client-supplied orgId fields exist
[ ] no server-only imports in client components
[ ] no route/nav mismatch exists
[ ] API denial behavior is covered elsewhere
[ ] service security behavior is covered elsewhere
```

For generated modules:

```txt
[ ] generated list UI test exists
[ ] generated form UI test exists when form exists
[ ] generated permission visibility test exists
[ ] generated empty state test exists
[ ] generated failed mutation test exists when mutation exists
[ ] generated UI passes architecture checks
```

---

# 28. Anti-Patterns

Forbidden or strongly discouraged UI testing patterns:

```txt
only testing Admin users
only testing happy paths
snapshotting entire pages
asserting exact Tailwind class strings
querying mostly by test IDs
mocking validation away
mocking permissions as always true
mocking APIs as always successful
assuming hidden UI means secure API
testing private implementation state
writing tests that pass even if the component is empty
ignoring empty/loading/error states
ignoring keyboard behavior
using UI tests to prove database isolation
```

---

# 29. Claude Implementation Rules

When Claude writes UI code, it must:

```txt
create or update UI tests with the UI change
prefer user-visible queries
include permission visibility tests for protected actions
include empty/loading/error states when relevant
not create hidden orgId inputs
not import server-only SDK or Kernel code into client components
not add fragile snapshots unless explicitly approved
not test only Admin behavior
not mark UI complete without running relevant tests
```

Claude must run:

```bash
npm run test:run
npm run typecheck
npm run check:architecture
npm run build
```

or explicitly report which commands are unavailable.

---

# 30. Relationship to Other Test Types

| Test Type | UI Testing Relationship |
|---|---|
| Unit tests | UI tests may be component-level unit tests. |
| Integration tests | Prove database/service behavior UI cannot prove. |
| API tests | Prove API denial/security behavior UI cannot prove. |
| Security tests | Prove tenant/permission failure paths. |
| Regression tests | UI bug fixes must get UI regression tests. |
| E2E tests | Later browser smoke tests prove whole workflows. |
| Architecture checks | Enforce forbidden imports and generated-code safety. |

---

# 31. Acceptance Criteria

This document is accepted when:

```txt
[ ] UI testing scope is clear
[ ] component tests and browser tests are distinguished
[ ] UI tests do not pretend to prove server security
[ ] permission-aware UI rules are clear
[ ] form/table/empty/loading/error state rules are clear
[ ] generated module UI test requirements are clear
[ ] client/server import safety is addressed
[ ] old MVP UI issues are converted into regression rules
[ ] Claude can use this document without inventing a UI testing philosophy
```

---

# 32. Final Rule

```txt
A OneDayOS screen is not done because it renders.
It is done when the right user can use it, the wrong user is not misled by it, and broken states still feel intentionally designed.
```

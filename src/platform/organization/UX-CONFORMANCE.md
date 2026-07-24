# Organization UX Conformance

## V2-5 Bounded Export

- Founder accepted the controlled V2-5 bounded export package on 2026-07-24; public-demo and production approval are not implied.
- Employees, Branches, and Departments are eligible; Platform Users are not.
- Branch and Department export permissions are separate from Organization read/manage authority, while Org Admin wildcard satisfies them.
- No authorization identity, role, or permission metadata is exported.

## Status

Implementation Conformance Complete  
Role-Based UX Validation Preparation Complete  
Founder Org Admin Walkthrough Complete  
Independent Org Admin Validation Pending

This file records implementation evidence only. It does not approve public demo claims, formal accessibility claims, or representative-user validation.

## Scope

Organization is a built-in Org Admin app, not a business module and not an `OrgModule`.

Implemented Organization surfaces:

- `/[orgSlug]/organization`
- `/[orgSlug]/organization/people`
- `/[orgSlug]/organization/branches-departments`
- `/[orgSlug]/organization/settings`

## Conformance Evidence

- Organization routes require verified organization context.
- Organization routes require the Org Admin permission through `kernel.organization.manage`.
- Organization navigation is only exposed through the app switcher for Org Admin users.
- Organization sidebar contains Organization-specific navigation only: People, Branches & Departments, Settings.
- Organization pages use shared OneDayOS page patterns: `AppPage`, `ListPage`, and `SettingsPage`.
- People keeps platform users and shared Employee records conceptually separate.
- Employee records may exist without login access.
- Branches & Departments are presented as company structure, not module records.
- Settings shows supported organization preferences without exposing raw provider secrets or theme-builder controls.
- People, Branches & Departments, and Settings use the compact operational header while the Organization landing remains explanatory.
- Shared Records is a separate built-in app; People remains exclusively in Organization navigation.

## Explicit Non-Scope

- Organization is not a module.
- Organization is not controlled by module enablement.
- People is not HRIS.
- Employee is not payroll, attendance, onboarding, leave, or benefits.
- Settings does not include organization theming, white-labeling, module enablement, roles and permissions editing, secrets, or raw JSON editing.

## Automated Checks

Expected regression coverage:

- `npm run check:ux`
- `npm run test:a11y`
- source-contract tests for Organization page-pattern usage
- tenant shell navigation tests for Organization app visibility
- role-based UX preparation artifacts and Warehouse proxy denial checks

## Pending Human Validation

- Independent Org Admin walkthrough of People.
- Independent Org Admin walkthrough of Branches & Departments.
- Independent Org Admin walkthrough of Settings.
- Keyboard-only walkthrough in a real browser.
- Screen-reader spot check in a real browser.
- Confirmation that Organization terminology is understood by non-Founder admin users.

Founder Org Admin walkthrough is completed with no blocker or must-fix findings reported. This does not claim independent Org Admin validation has occurred.

## V2-1 Evidence

V2-1 preserved Organization as an Org Admin-only built-in app while adding Shared Records separately. Automated checks verify Organization is absent for the Warehouse Operator, People is absent from Shared Records, and Organization operational pages use compact semantic headers.

Manual Founder visual review of completed V2-1 remains pending until recorded. Public-demo approval and website-asset approval remain pending; website asset production remains paused.

## V2-2 Data Table Evidence

- Platform Users, Employees, Branches, and Departments use Data Table V2 server mode. Tenant-scoped Organization services return at most 100 rows per table with an exact matching count.
- Search, sorting, pagination, selection, and column visibility preserve the distinction between login Users and Employee records.
- Employee rows use the existing canonical edit route for Org Admin; no new Organization workflow was invented.
- Branches and Departments remain read-only presentations, and Departments remain branch-optional.
- Organization routes remain protected by verified organization context plus `kernel.organization.manage`; Warehouse Operator access remains absent and direct access fails safely.
- The paired People tables and paired Structure tables share one strict page URL query while retaining independent truthful totals. Direct unbounded page-level `findMany` calls were removed.

Manual browser review and axe regression evidence do not claim independent Org Admin validation or formal WCAG conformance.

## Approval Result

Controlled Founder/Prospect Guided Demo Approved: Yes, for guided sandbox walkthroughs after controlled demo gates pass for the session.  
Public Demo Approval: Pending.  
Production Readiness: Not implied.  
Independent Org Admin Validation: Pending.  
Formal Accessibility Claim: Pending formal review.

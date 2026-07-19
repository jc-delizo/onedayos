# OneDayOS Engineering Manual — 14 Testing & Quality / 09 UX Conformance Testing

Document ID: `14-testing-quality/09-ux-conformance-testing.md`  
Version: 1.0  
Status: Frozen  
Implementation Allowed: Governance authority — implementation requires an approved package  
Depends On: `00-meta/adrs/ADR-0011-human-centred-ux-standard.md`

---

# 1. Purpose

UX Conformance Testing defines how OneDayOS will verify that implemented pages match the UX Constitution, page patterns, module contracts, and accessibility target.

This document defines future testing expectations. It does not add scripts, dependencies, axe scans, or CI jobs in this governance package.

---

# 2. Evaluation Model

OneDayOS UX conformance has four layers:

1. Structural checks.
2. Automated accessibility checks where tooling exists.
3. Manual accessibility review.
4. Task-based representative-user review.

All four are needed for serious demo claims. Scripts can catch drift, but scripts cannot prove usability.

---

# 3. Planned Structural Check: `check:ux`

A future `npm run check:ux` may verify:

- Official modules include a Module UX Contract.
- Official modules include a Process Flow route unless an ADR exception exists.
- Module pages use the persistent app shell.
- Module pages do not replace the shell with content navbars.
- Page headers include breadcrumb, title, and description.
- Loading states are page-contextual.
- Error states do not expose provider or stack details.
- No fake metrics or fake charts appear in official module dashboards.
- Shared Business Object links remain visually shared.
- Records are not treated as apps.

This command is planned only. It must not be added until implementation is approved.

---

# 4. Planned Accessibility Testing: `test:a11y`

A future `npm run test:a11y` may use approved tooling to check:

- Keyboard reachability.
- Accessible names.
- Landmark structure.
- Form label/error associations.
- Dialog and popover focus behavior.
- Color contrast where tooling can measure it.
- Reduced-motion behavior where practical.

OneDayOS targets WCAG 2.2 Level AA, but automated tests alone must not be used to claim formal accessibility status.

No specific axe, browser, or scanning dependency is mandated yet. Dependencies must be reviewed before installation.

---

# 5. Required UI Test Categories

Module UI tests should cover:

- App shell presence.
- App launcher availability.
- Relevant sidebar navigation.
- Absence of irrelevant sidebar links.
- Page header content.
- Process Flow content.
- Contextual loading states.
- Empty states.
- Safe error states.
- Tenant-safe forms with no hidden `orgId`.
- Critical action form behavior.
- Shared Business Object ownership cues.

Testing Library user-facing queries are preferred.

---

# 6. Manual Review Requirements

Every official module should have a recorded task-based review before demo claims.

Manual review must include:

- Representative user role.
- Critical workflow.
- Failure path.
- Permission or unavailable state where relevant.
- Keyboard path.
- Manual accessibility review.
- Process Flow comprehension.
- Shared ownership clarity.
- Findings and severity.

Use `03-design-system/templates/module-ux-review.md`.

The minimum early representative review is:

- Founder walkthrough.
- One representative Org Admin.
- One representative operational user.

---

# 7. Finding Resolution

UX findings must be resolved as:

- Code fix.
- Shared component/page pattern improvement.
- Generator template change.
- Automated test.
- Manual checklist update.
- ADR exception.
- Explicit Founder-approved deferral.

Critical issues cannot be deferred silently.

---

# 8. Non-Goals

This document does not implement:

- CI scripts.
- Accessibility tooling.
- Certification workflow.
- Design lint package.
- Visual regression infrastructure.
- Public demo readiness claims.

Those require later approved packages.

---

# 9. Final Rule

A page is not UX-conformant because it renders.

It is UX-conformant when it supports the real task, preserves platform boundaries, prevents costly mistakes, remains accessible enough for the target standard, and has review evidence.

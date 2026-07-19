# OneDayOS Engineering Manual — 03 Design System / 09 UX Constitution

Document ID: `03-design-system/09-ux-constitution.md`  
Version: 1.0  
Status: Frozen  
Implementation Allowed: Governance authority — implementation requires an approved package  
Depends On: `00-meta/adrs/ADR-0011-human-centred-ux-standard.md`

---

# 1. Purpose

The UX Constitution defines the product behavior standard for OneDayOS. It translates the Founder-approved direction into reusable rules that can guide pages, modules, generators, tests, and human reviews.

OneDayOS uses a human-centred design process aligned with ISO 9241-210, interaction principles aligned with ISO 9241-110, usability reviewed using Nielsen’s usability heuristics, and accessibility that targets WCAG 2.2 Level AA.

This document does not claim certification. It defines the OneDayOS interpretation.

---

# 2. UX Principles

Every official OneDayOS page and module must satisfy these principles:

1. Match the user's real task and work environment.
2. The UI must teach the business process.
3. The user must always know what organization and app they are using.
4. The user must always understand the next meaningful action.
5. Prevent expensive mistakes before reporting them.
6. Prefer recognition over recall.
7. Preserve user control, cancellation, recovery, and safe back-navigation.
8. Keep shared Business Object ownership visually clear.
9. Show only apps, records, and actions relevant to the current role and task.
10. Use one consistent shell, page, form, table, loading, empty, error, and permission pattern.
11. Accessibility is a baseline, not a separate mode.
12. Frequent users must be able to work efficiently.
13. Motion must communicate state, not decorate.
14. Errors must explain what happened and how to recover.
15. Every serious usability finding must become a reusable pattern, generator improvement, test, or manual amendment.

---

# 3. Required UX Hierarchy

OneDayOS authenticated experiences follow this hierarchy:

```text
Organization Workspace
→ App Launcher
→ Current App
→ App Sidebar
→ Page Header
→ Task Content
```

This hierarchy is a product contract:

- Organization Workspace establishes tenant context.
- App Launcher shows available apps.
- Current App sets the work mode.
- App Sidebar exposes app-specific and related navigation.
- Page Header explains the current page and primary action.
- Task Content supports the actual work.

Records are shared data surfaces, not apps.

---

# 4. Architecture and UX Relationship

```text
Architecture decides ownership.
UX decides relevance and presentation.
```

Examples:

- Employee remains a shared Business Object but appears under Organization → People for the current MVP.
- Product remains a shared Business Object but appears as a related record inside Inventory.
- Records are shared data surfaces, not apps.

The UI may surface shared data where it helps the task, but it must not imply that a module owns a shared Business Object.

---

# 5. The UI Must Teach the Business

Every official business module must help users understand how the business process works.

At minimum, each module must explain:

- What the module owns.
- What the module does not own.
- Which shared Business Objects it uses.
- The main workflow steps.
- Required inputs.
- Produced outputs.
- Critical mistakes the UI prevents.
- What integrations are deferred.
- Which actions are available now and which are intentionally absent.

This can be expressed through a Process Flow page, page header descriptions, empty states, form guidance, and safe error messages. It must not rely on external training alone.

---

# 6. Role and Task Relevance

Users should not be shown navigation or actions unrelated to their role and current task. Hidden UI is not security, but irrelevant UI slows work and creates mistakes.

OneDayOS should:

- Show enabled apps in the app launcher.
- Show admin apps only to Org Admin users.
- Show module navigation only inside the current module.
- Show related shared records only where they support the current workflow.
- Keep disabled modules and unauthorized actions out of normal paths.

---

# 7. Mistake Prevention

Expensive mistakes must be prevented before they become errors. Examples:

- Reject tenant identity in forms and APIs.
- Compute inventory balances server-side.
- Prevent negative stock unless explicitly approved.
- Use confirmations for destructive actions.
- Explain permission denial without leaking tenant data.
- Keep shared Product and Warehouse management outside Inventory mutation screens.

---

# 8. Feedback and Recovery

Every user action should have a recoverable state:

- Loading states must match the page type.
- Empty states must explain how to begin.
- Validation errors must identify the field and recovery path.
- API errors must be safe and understandable.
- Navigation must always offer a way back to the relevant app or launcher.

---

# 9. Accessibility Baseline

OneDayOS targets WCAG 2.2 Level AA as the accessibility decision reference.

Accessibility is not a separate product mode. The standard interface must support keyboard access, visible focus, semantic structure, understandable labels, reduced-motion preferences, and non-color-only meaning.

Automated checks help but do not replace manual keyboard and task-based review.

---

# 10. Governance Rule

When a serious usability issue is discovered, it must be classified and resolved as one of:

- Reusable page pattern improvement.
- Design system primitive improvement.
- Module UX Contract update.
- Generator template or safety-rail update.
- Automated UX or accessibility test.
- Manual review checklist amendment.
- ADR exception with rationale.

Do not leave serious usability findings as one-off fixes when they reveal a reusable platform lesson.

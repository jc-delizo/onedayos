# OneDayOS Engineering Manual — 03 Design System / 12 Usability Review Checklist

Document ID: `03-design-system/12-usability-review-checklist.md`  
Version: 1.0  
Status: Frozen  
Implementation Allowed: Governance authority — implementation requires an approved package  
Depends On: `03-design-system/09-ux-constitution.md`

---

# 1. Purpose

This checklist guides human usability review for OneDayOS pages and modules. It is aligned with ISO 9241-210, aligned with ISO 9241-110, reviewed using Nielsen’s usability heuristics, and supports accessibility work that targets WCAG 2.2 Level AA.

Automated tests can detect some problems. They cannot prove that the product is understandable or task-fit.

---

# 2. Review Setup

Before review, identify:

- Organization.
- Current app.
- User role.
- Primary task.
- Data setup.
- Expected success path.
- Known boundaries and deferred features.

Review must include at least one critical workflow and at least one failure or blocked-permission path.

The minimum early representative review is:

- Founder walkthrough.
- One representative Org Admin.
- One representative operational user.

---

# 3. Task Fit

Ask:

- Does the page match the user’s real job?
- Does the page avoid irrelevant apps, records, and actions?
- Does the page use language from the business domain?
- Can a first-time user understand the purpose?
- Can a frequent user move quickly?

---

# 4. Process Clarity

Ask:

- Does the UI teach the business process?
- Does the Process Flow page explain ownership, inputs, outputs, and deferred integrations?
- Does the user understand what happens after a mutation?
- Are ledger, balance, setting, and shared identity concepts distinct?

---

# 5. Navigation and Context

Ask:

- Is the organization visible?
- Is the current app visible?
- Is the app launcher available?
- Is the sidebar relevant to the current app?
- Can the user move from related Records back to the app?
- Does the page header explain location, title, description, and action?

---

# 6. Mistake Prevention

Ask:

- Are expensive mistakes prevented before submission?
- Are destructive or irreversible actions clearly scoped?
- Are tenant identity fields absent from forms?
- Are invalid states explained early?
- Are confirmation requirements appropriate?

---

# 7. Feedback, Recovery, and Errors

Ask:

- Are loading states contextual?
- Are empty states useful?
- Are errors safe and recoverable?
- Does validation preserve user work where feasible?
- Does permission denial differ from unavailable module state?
- Are raw provider, SQL, Prisma, or auth errors hidden?

---

# 8. Accessibility and Keyboard Use

Ask:

- Can the critical workflow be completed with keyboard interaction?
- Is focus visible?
- Do icon-only buttons have names?
- Is form help/error text associated with fields?
- Is color not the only meaning carrier?
- Does reduced-motion preference remain respected?

---

# 9. Consistency and Reuse

Ask:

- Does the page use approved shell, page header, table, form, loading, empty, error, and permission patterns?
- Does it avoid a module-specific navbar replacing the shell?
- Does it avoid one-off components where a shared primitive exists?
- Does it avoid fake metrics, fake charts, and generated-looking layouts?

---

# 10. Finding Severity and Classification

Classify severity:

- Critical: blocks safe task completion, creates tenant/security risk, or causes expensive business mistakes.
- High: confuses ownership, navigation, workflow, permissions, or recovery.
- Medium: slows work, reduces clarity, or creates inconsistent behavior.
- Low: polish issue with limited workflow risk.

Classify issue type:

- Blocker.
- Must Fix.
- Polish.
- Question / Product Decision.
- Deferred with reason.

Critical issues must be fixed before demo claims. High issues must be fixed or explicitly deferred with Founder approval.

---

# 11. Required Output

Every review should record:

- Date.
- Reviewer.
- Module/page.
- User role tested.
- Task tested.
- Findings.
- Severity.
- Resolution.
- Whether the issue requires a reusable pattern, generator change, test, or manual amendment.

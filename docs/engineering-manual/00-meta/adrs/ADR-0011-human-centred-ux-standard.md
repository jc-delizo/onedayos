# ADR-0011: Human-Centred UX Standard

Status: Accepted  
Date: 2026-07  
Owner: Founder / Platform Architecture  
Applies To: OneDayOS UX governance, design system, modules, generators, tests, and reviews

---

# Context

OneDayOS is a business operating system, not a collection of isolated CRUD screens. Previous implementation passes showed that code can compile and pass local gates while still missing the intended user experience: generic loading states, top-only navigation, and unclear transitions between Inventory and shared Records all created product drift.

The platform needs a reusable UX governance model that can guide manual design, generated module scaffolds, automated checks, and human review without turning OneDayOS into a certification project or a generic admin template.

---

# Decision

OneDayOS will use a human-centred design process aligned with ISO 9241-210:2019, interaction principles aligned with ISO 9241-110:2020, usability evaluation using Nielsen’s heuristics, and accessibility targeting WCAG 2.2 Level AA.

This decision means these standards guide how OneDayOS designs, evaluates, tests, and reviews product behavior. They do not replace the OneDayOS design language, architecture, security model, module system, or Founder product judgment.

---

# Standards and Frameworks

OneDayOS will use:

- Human-centred design aligned with ISO 9241-210.
- Interaction principles aligned with ISO 9241-110.
- Usability reviewed using Nielsen’s usability heuristics.
- Accessibility that targets WCAG 2.2 Level AA.
- OneDayOS-specific product principles for business workflows, shared Business Object ownership, module boundaries, app navigation, and reusable delivery.

These references are interpreted as process and evaluation anchors. OneDayOS requirements must be written in original OneDayOS language and must not reproduce proprietary standard text.

---

# OneDayOS Interpretation

OneDayOS pages must be evaluated against real business work:

- Who is the user?
- What job are they trying to complete?
- What organization and app context are they in?
- What data do they need to trust before acting?
- What mistakes would be expensive?
- What does the page need to teach?
- What should be prevented before an error appears?
- What belongs to the current module and what remains shared platform data?

Reusable components, generator output, tests, and human reviews must encode the requirements. A module is not accepted only because it renders or compiles.

Every official business module must include a Module UX Contract and Process Flow page unless an approved ADR grants an exception.

---

# Alternatives Considered

## Visual Design Only

Rejected. Visual polish does not ensure task fit, mistake prevention, recoverability, accessibility, or module boundary clarity.

## Accessibility Only

Rejected. Accessibility is required, but it does not by itself define business workflow clarity or platform information architecture.

## Informal Founder Review Only

Rejected. Founder review remains necessary, but repeated usability findings must become reusable patterns, generator requirements, tests, or manual amendments.

## Formal Certification Program Now

Rejected for MVP. Certification programs may be evaluated later, but this ADR establishes design and evaluation alignment, not a certification claim.

---

# Consequences

- New UX governance documents are added under `03-design-system`.
- Module specs must include a UX Contract section.
- Official modules must explain their process flow.
- Generator requirements must eventually include UX contract and process-flow scaffolds.
- CI quality gates must eventually include UX and accessibility checks when tooling is approved.
- Human review remains required because automated tests cannot prove usability.
- Serious usability findings must feed back into reusable platform assets.

---

# Non-Claims

This ADR does not claim:

- ISO certification.
- Formal WCAG certification.
- That automated accessibility tests alone are sufficient.
- That OneDayOS has completed a third-party accessibility audit.
- That standards replace Founder approval or OneDayOS product judgment.

The accurate language is:

- OneDayOS is aligned with ISO 9241-210.
- OneDayOS is aligned with ISO 9241-110.
- OneDayOS targets WCAG 2.2 Level AA.

---

# Manual References

This ADR introduces or amends:

- `03-design-system/09-ux-constitution.md`
- `03-design-system/10-page-patterns.md`
- `03-design-system/11-module-ux-contract.md`
- `03-design-system/12-usability-review-checklist.md`
- `03-design-system/templates/module-ux-review.md`
- `14-testing-quality/09-ux-conformance-testing.md`
- `00-meta/04-definition-of-done.md`
- `08-module-system/*`
- `09-cli-generators/*`
- `17-module-specifications/00-module-spec-template.md`

---

# Implementation Sequence

1. UX Governance.
2. Shared Page Patterns.
3. Generator UX Contract.
4. Inventory UX Conformance.
5. CI + Accessibility Gates.
6. Organization and Records retrofit.

Governance documents are drafted first. Application implementation follows only after Founder review and freeze.

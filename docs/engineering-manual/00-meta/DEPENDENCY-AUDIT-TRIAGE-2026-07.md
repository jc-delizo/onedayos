# Dependency Audit Triage — 2026-07

Status: Production clean; one approved time-bounded dev-only lint-tooling exception
Date reviewed: 2026-07-23
Scope: Prompt 34 read-only triage plus Prompt 35 dependency remediation result

## V2-6B Founder Exception Addendum — 2026-07-25

Production dependency audit: clean.

Development audit: one approved, time-bounded lint-tooling exception.

The only permitted advisory is GHSA-mh99-v99m-4gvg (`brace-expansion`, high) through the exact
dev-only stable ESLint/Next lint graph. A strict required checker freezes its metadata, wrapper
entries, roots, versions, transitive/dev classification, and 2026-08-31 expiry. All other moderate,
high, or critical findings remain blockers. See
`DEV-TOOLING-SECURITY-EXCEPTION-GHSA-MH99-V99M-4GVG.md`.

## Executive Decision

The Prompt 34 baseline reported eight vulnerable package entries: four high and four moderate. Those entries represented fourteen underlying GitHub Security Advisories. The production audit reported seven entries: three high and four moderate; the dev-only `brace-expansion` entry was omitted.

Prompt 35 completed the approved **Dependency Security Remediation Package**. The project now resolves `next@16.2.11`, `sharp@0.35.3`, `next -> postcss@8.5.10`, a coherent Prisma `7.9.0` family, `fast-uri@3.1.4`, and `brace-expansion@1.1.16`. Clean installation, full gates, production runtime, both authenticated personas, and all audit thresholds passed under Node `24.18.0`.

No advisory was dismissed because tests passed. The original exposure analysis remains below as the before-state record; the final closure evidence is recorded in **Remediation Result**.

## Commands and Inventory

| Command | Result |
| --- | --- |
| `npm audit --json` | Exit 1; 8 entries: 4 high, 4 moderate |
| `npm audit --omit=dev --json` | Exit 1; 7 entries: 3 high, 4 moderate |
| `npm audit --audit-level=high` | Exit 1; high advisories remain |
| `npm ls --all` | Exit 0; dependency tree resolved |

Package-entry split:

- Direct according to npm: `next` and `prisma` (2).
- Transitive according to npm: `sharp`, `postcss`, `brace-expansion`, `fast-uri`, `@prisma/dev`, and `@hono/node-server` (6).
- Production/runtime dependency set: `next`, its optional `sharp`, and its nested `postcss` (3 entries).
- Development/tooling paths: `prisma`, `@prisma/dev`, `@hono/node-server`, `fast-uri`, and `brace-expansion` (5 entries). `npm audit --omit=dev` still retains the Prisma chain because `@prisma/client` declares `prisma` as an optional peer; `package-lock.json` marks these nodes `devOptional`, and application runtime source does not import the Prisma CLI packages.

## Installed Dependency Paths

| Package | Installed | Direct/transitive | Path and runtime classification |
| --- | ---: | --- | --- |
| `next` | 16.2.10 | Direct | Root production dependency; runs the App Router server |
| `sharp` | 0.34.5 | Transitive optional | `next -> sharp`; production-capable image optimizer dependency |
| `postcss` | 8.4.31 | Transitive | `next -> postcss`; bundled Next build/runtime dependency |
| `prisma` | 7.8.0 | Direct dev | Root development CLI; not the runtime `@prisma/client` |
| `@prisma/dev` | 0.24.3 | Transitive devOptional | `prisma -> @prisma/dev` |
| `@hono/node-server` | 1.19.13 | Transitive devOptional | `prisma -> @prisma/dev -> @hono/node-server`; root override currently pins 1.19.13 |
| `fast-uri` | 3.1.3 | Transitive devOptional | `prisma -> @prisma/dev -> @prisma/streams-local -> ajv -> fast-uri` |
| `brace-expansion` | 1.1.15 | Transitive dev | `eslint -> @eslint/config-array -> minimatch -> brace-expansion` |

## Advisory Detail

### GHSA-frvp-7c67-39w9 — Hono Node adapter path traversal

- Severity/package: Moderate; `@hono/node-server@1.19.13`.
- Dependency path: Transitive devOptional through `prisma -> @prisma/dev`.
- Vulnerable/patched range: `<2.0.5`; patched in `2.0.5`.
- npm proposal: Upgrade root `prisma` to `7.9.0`; npm labels this a force fix because the project exactly pins `7.8.0`.
- Exposure: The advisory requires Windows plus Hono `serve-static` with a protected prefix. The controlled sandbox is Linux, OneDayOS does not run Hono as its application server, and this package is present through Prisma tooling.
- Exploit prerequisites: Attacker-controlled encoded-backslash request to a vulnerable Windows static-file handler.
- Classification: **Dev-only / no runtime exposure, tracked**.
- Recommended action: Remove the obsolete override and upgrade Prisma in the separate remediation package after compatibility review.
- Temporary mitigation: Do not expose Prisma development tooling or Hono listeners; keep production on `next start`.
- Owner/status: Platform Foundations; Open.
- Source: [GitHub advisory](https://github.com/advisories/GHSA-frvp-7c67-39w9).

### GHSA-3jxr-9vmj-r5cp — brace-expansion exponential-time denial of service

- Severity/package: High; `brace-expansion@1.1.15`.
- Dependency path: Transitive development dependency through ESLint/minimatch.
- Vulnerable/patched range: `<1.1.16`; patched in `1.1.16`.
- npm proposal: Normal `npm audit fix`; no force proposed.
- Exposure: The vulnerable copy is used by lint tooling, not by the OneDayOS runtime. No application route passes request input to glob or brace expansion.
- Exploit prerequisites: Attacker-controlled brace pattern reaching `expand()` or a transitive glob/minimatch consumer.
- Classification: **Dev-only / no runtime exposure, tracked**.
- Recommended action: Refresh the compatible transitive lock resolution in the remediation package.
- Temporary mitigation: Do not run lint tooling as a network service or on untrusted pattern input.
- Owner/status: Developer Experience; Open.
- Source: [GitHub advisory](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp).

### GHSA-v2hh-gcrm-f6hx — fast-uri host confusion

- Severity/package: High; `fast-uri@3.1.3`.
- Dependency path: Transitive devOptional through Prisma development streams and AJV.
- Vulnerable/patched range: `3.0.0–3.1.3`; patched in `3.1.4`.
- npm proposal: Normal `npm audit fix`; no force proposed for the leaf package.
- Exposure: No application runtime import or URL allowlist uses this copy. It is reached through Prisma development tooling. The omit-dev audit retains the chain because of Prisma's optional peer relationship, not a demonstrated application runtime path.
- Exploit prerequisites: An attacker-controlled URL validated with `fast-uri` and later interpreted by Node's WHATWG URL parser/client.
- Classification: **Dev-only / no runtime exposure, tracked**.
- Recommended action: Resolve to `fast-uri >=3.1.4` through compatible upstream dependency updates in the remediation package.
- Temporary mitigation: Do not use Prisma development stream tooling as a public URL-validation or fetch service.
- Owner/status: Platform Foundations; Open.
- Source: [GitHub advisory](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx).

### GHSA-6gpp-xcg3-4w24 — Next.js middleware/proxy bypass

- Severity/package: High; direct `next@16.2.10`.
- Vulnerable/patched range: `>=16.0.0 <16.2.11`; patched in `16.2.11`.
- npm proposal: `next@16.2.11`; npm labels it force because the project exactly pins `16.2.10`, although it is a patch release.
- Exposure: OneDayOS uses the App Router and a Turbopack build, but has no middleware/proxy file and no single-locale `i18n` configuration. Page data paths and services enforce authorization independently.
- Exploit prerequisites: App Router, Turbopack, a single configured locale, and authorization dependent on middleware/proxy.
- Classification: **Blocker before V2-2** because direct production code is affected and a compatible patch exists.
- Recommended action: Upgrade Next and matching `eslint-config-next` to `16.2.11` in the remediation package.
- Temporary mitigation: Continue enforcing authentication and permissions in server page/service/API boundaries; do not add middleware-only authorization.
- Owner/status: Platform Security; Open.
- Source: [GitHub advisory](https://github.com/advisories/GHSA-6gpp-xcg3-4w24).

### GHSA-m99w-x7hq-7vfj — Next.js Server Action CPU denial of service

- Severity/package: High; direct `next@16.2.10`.
- Vulnerable/patched range: `>=16.0.0 <16.2.11`; patched in `16.2.11`.
- npm proposal: Same exact-pin force proposal as the Next package entry.
- Exposure: Repository inspection found no `use server` Server Actions. Mutations use route handlers and client fetches.
- Exploit prerequisites: At least one App Router Server Action and a crafted request.
- Classification: **Blocker before V2-2** because the affected direct runtime has a compatible patch.
- Recommended action: Upgrade Next to `16.2.11` in the remediation package.
- Temporary mitigation: Do not introduce Server Actions before remediation.
- Owner/status: Platform Security; Open.
- Source: [GitHub advisory](https://github.com/advisories/GHSA-m99w-x7hq-7vfj).

### GHSA-89xv-2m56-2m9x — Next.js Server Action SSRF on custom servers

- Severity/package: High; direct `next@16.2.10`.
- Vulnerable/patched range: `>=16.0.0 <16.2.11`; patched in `16.2.11`.
- npm proposal: Same exact-pin force proposal as the Next package entry.
- Exposure: OneDayOS has no Server Actions or custom server and runs `next start`, which the advisory says pins the host on supported releases.
- Exploit prerequisites: Server Action forward/redirect plus attacker control of Host-associated headers in an affected deployment.
- Classification: **Blocker before V2-2** because the affected direct runtime has a compatible patch.
- Recommended action: Upgrade Next to `16.2.11`.
- Temporary mitigation: Keep `next start`, trusted Host handling, and no Server Actions.
- Owner/status: Platform Security; Open.
- Source: [GitHub advisory](https://github.com/advisories/GHSA-89xv-2m56-2m9x).

### GHSA-68g3-v927-f742 — Next.js request-body cache confusion

- Severity/package: Moderate; direct `next@16.2.10`.
- Vulnerable/patched range: `>=16.0.0 <16.2.11`; patched in `16.2.11`.
- npm proposal: Same exact-pin force proposal as the Next package entry.
- Exposure: No server-side fetch with a request body was found. Existing fetch calls are browser-side calls to org-scoped APIs.
- Exploit prerequisites: Server-side `fetch(new Request(init), differentInit)` with request bodies and sensitive response data.
- Classification: **Can patch safely now in separate package**.
- Recommended action: Upgrade Next to `16.2.11`.
- Temporary mitigation: Do not add server-side body-bearing fetch patterns before remediation.
- Owner/status: Platform Security; Open.
- Source: [GitHub advisory](https://github.com/advisories/GHSA-68g3-v927-f742).

### GHSA-4633-3j49-mh5q — Next.js invalid-UTF-8 request-body cache confusion

- Severity/package: Moderate; direct `next@16.2.10`.
- Vulnerable/patched range: `>=16.0.0 <16.2.11`; patched in `16.2.11`.
- npm proposal: Same exact-pin force proposal as the Next package entry.
- Exposure: No server-side body-bearing fetch was found; current JSON APIs use normal UTF-8.
- Exploit prerequisites: Server-side fetch request bodies using a non-UTF-8 charset with colliding decoded content.
- Classification: **Can patch safely now in separate package**.
- Recommended action: Upgrade Next to `16.2.11`.
- Temporary mitigation: Continue accepting and emitting UTF-8 JSON; do not introduce the affected server-fetch pattern.
- Owner/status: Platform Security; Open.
- Source: [GitHub advisory](https://github.com/advisories/GHSA-4633-3j49-mh5q).

### GHSA-4c39-4ccg-62r3 — Next.js unbounded Edge Server Action payload

- Severity/package: Moderate; direct `next@16.2.10`.
- Vulnerable/patched range: `>=16.0.0 <16.2.11`; patched in `16.2.11`.
- npm proposal: Same exact-pin force proposal as the Next package entry.
- Exposure: No Server Actions or Edge-runtime Server Actions were found.
- Exploit prerequisites: App Router Server Action using the Edge runtime and an oversized request.
- Classification: **Can patch safely now in separate package**.
- Recommended action: Upgrade Next to `16.2.11`.
- Temporary mitigation: Do not add Edge Server Actions; retain infrastructure body limits.
- Owner/status: Platform Security; Open.
- Source: [GitHub advisory](https://github.com/advisories/GHSA-4c39-4ccg-62r3).

### GHSA-p9j2-gv94-2wf4 — Next.js dynamic-host rewrite SSRF

- Severity/package: High; direct `next@16.2.10`.
- Vulnerable/patched range: `>=16.0.0 <16.2.11`; patched in `16.2.11`.
- npm proposal: Same exact-pin force proposal as the Next package entry.
- Exposure: `next.config.ts` contains no rewrites or redirects, dynamic-host or otherwise.
- Exploit prerequisites: A rewrite/redirect whose external destination hostname contains attacker-controlled dynamic input.
- Classification: **Blocker before V2-2** because the affected direct runtime has a compatible patch.
- Recommended action: Upgrade Next to `16.2.11`.
- Temporary mitigation: Do not add dynamic-host external rewrites or redirects.
- Owner/status: Platform Security; Open.
- Source: [GitHub advisory](https://github.com/advisories/GHSA-p9j2-gv94-2wf4).

### GHSA-q8wf-6r8g-63ch — Next.js SVG image-optimization denial of service

- Severity/package: Moderate; direct `next@16.2.10`.
- Vulnerable/patched range: `>=16.0.0 <16.2.11`; patched in `16.2.11`.
- npm proposal: Same exact-pin force proposal as the Next package entry.
- Exposure: No `next/image`, `remotePatterns`, remote image optimization, or user-supplied image workflow was found.
- Exploit prerequisites: Self-hosted default image optimizer configured for remotely hosted attacker-controlled SVG content.
- Classification: **Can patch safely now in separate package**.
- Recommended action: Upgrade Next to `16.2.11`.
- Temporary mitigation: Do not enable remote image patterns or untrusted image optimization before remediation.
- Owner/status: Platform Security; Open.
- Source: [GitHub advisory](https://github.com/advisories/GHSA-q8wf-6r8g-63ch).

### GHSA-955p-x3mx-jcvp — Next.js internal Server Function endpoint disclosure

- Severity/package: Moderate; direct `next@16.2.10`.
- Vulnerable/patched range: `>=16.0.0 <16.2.11`; patched in `16.2.11`.
- npm proposal: Same exact-pin force proposal as the Next package entry.
- Exposure: No `use server` or `use cache` endpoints were found.
- Exploit prerequisites: App Router with Server Actions or `use cache` functions referenced in public client artifacts.
- Classification: **Can patch safely now in separate package**.
- Recommended action: Upgrade Next to `16.2.11`.
- Temporary mitigation: Do not introduce Server Actions or `use cache`; always authorize inside server boundaries.
- Owner/status: Platform Security; Open.
- Source: [GitHub advisory](https://github.com/advisories/GHSA-955p-x3mx-jcvp).

### GHSA-qx2v-qp2m-jg93 — PostCSS style-context XSS

- Severity/package: Moderate; `next`-nested `postcss@8.4.31`.
- Dependency path: Transitive production package through `next`.
- Vulnerable/patched range: `<8.5.10`; patched in `8.5.10`.
- npm proposal: Upgrade Next to `16.2.11`; npm labels it force because of the exact root pin.
- Exposure: OneDayOS does not parse user-submitted CSS, embed re-stringified user CSS in `<style>`, or offer a theme builder.
- Exploit prerequisites: Attacker-controlled CSS parsed and re-stringified into an HTML style element.
- Classification: **Transitive/upstream tracked**.
- Recommended action: Verify the Next `16.2.11` resolution removes this nested vulnerable version; otherwise add an explicit reviewed resolution in the remediation package.
- Temporary mitigation: Keep arbitrary/custom CSS and theme-builder capabilities disabled.
- Owner/status: Platform Security; Open.
- Source: [GitHub advisory](https://github.com/advisories/GHSA-qx2v-qp2m-jg93).

### GHSA-f88m-g3jw-g9cj — sharp/libvips inherited image vulnerabilities

- Severity/package: High; optional `sharp@0.34.5` through Next.
- Dependency path: Transitive production-capable optional dependency `next -> sharp`.
- Vulnerable/patched range: `<0.35.0`; patched in `0.35.0` and later.
- npm proposal: Upgrade Next to `16.2.11`; npm labels it force because of the exact root pin.
- Exposure: The vulnerable binary is installed, but OneDayOS currently has no `next/image`, remote image patterns, upload/image-processing workflow, or untrusted image input.
- Exploit prerequisites: Processing an untrusted image with an affected sharp/libvips decoder.
- Classification: **Blocker before V2-2** because a high advisory is present in the production dependency set and a compatible remediation path is available.
- Recommended action: Ensure the remediation package resolves `sharp >=0.35.0`, preferably the current patched release supported by Next, and run build/runtime image smoke checks.
- Temporary mitigation: Do not add image upload, optimization, or other untrusted image processing; keep the controlled demo non-public.
- Owner/status: Platform Security; Open.
- Source: [GitHub advisory](https://github.com/advisories/GHSA-f88m-g3jw-g9cj).

## Prisma Wrapper Entries

`npm audit` also reports `@prisma/dev` and `prisma` as moderate package entries because they lead to GHSA-frvp-7c67-39w9. They do not represent additional advisory IDs:

| Entry | Installed | Range reported | Fix proposed | Classification |
| --- | ---: | --- | --- | --- |
| `@prisma/dev` | 0.24.3 | `<=0.24.13` | Root `prisma@7.9.0`; force due exact pin | Dev-only / no runtime exposure, tracked |
| `prisma` | 7.8.0 | `6.20.0-dev.1–7.9.0-dev.31` | `prisma@7.9.0`; force due exact pin | Can patch safely now in separate package |

The runtime client packages (`@prisma/client` and adapter) were not reported as vulnerable by this audit.

## Required Remediation Package

Before V2-2:

1. Create and explicitly approve a **Dependency Security Remediation Package**.
2. Upgrade `next` and matching `eslint-config-next` to at least `16.2.11`.
3. Confirm `sharp >=0.35.0` and `postcss >=8.5.10` are resolved.
4. Upgrade the Prisma family coherently rather than changing only the CLI; remove or revise the Hono override after validating the upstream tree.
5. Refresh compatible dev-only resolutions for `fast-uri` and `brace-expansion`.
6. Run the complete automated gate suite, both authenticated persona reviews, `npm audit` variants, and production smoke checks.

Prompt 34 performed no remediation. Prompt 35 subsequently completed the separately authorized remediation described below.

## Remediation Result

Verified 2026-07-23 under Node `24.18.0` and npm `11.16.0`.

| Prior advisory | Remediated version | Remediation method | Verification result | Residual exposure | Status |
| --- | --- | --- | --- | --- | --- |
| GHSA-frvp-7c67-39w9 (`@hono/node-server`) | Removed from tree | Upgraded the coherent Prisma family to `7.9.0`; `@prisma/dev@0.24.14` no longer depends on Hono; removed the obsolete Hono override | `npm ls --all` and both audits pass | None in installed tree | Closed |
| GHSA-3jxr-9vmj-r5cp (`brace-expansion`) | `1.1.16` | Refreshed the compatible ESLint/minimatch transitive lock resolution | Full moderate audit passes | None known | Closed |
| GHSA-v2hh-gcrm-f6hx (`fast-uri`) | `3.1.4` | Prisma `7.9.0` re-resolved `@prisma/streams-local@0.1.11 -> ajv -> fast-uri` | Full and production audits pass | None known | Closed |
| GHSA-6gpp-xcg3-4w24 (Next middleware/proxy bypass) | `next@16.2.11` | Direct patch upgrade with matching `eslint-config-next@16.2.11` | Build, runtime, auth checks, and audits pass | None in the patched installed range | Closed |
| GHSA-m99w-x7hq-7vfj (Next Server Action CPU DoS) | `next@16.2.11` | Direct patch upgrade | Build, 278 tests, and audits pass | None in the patched installed range | Closed |
| GHSA-89xv-2m56-2m9x (Next Server Action SSRF) | `next@16.2.11` | Direct patch upgrade; retained standard `next start` server | Production smoke and audits pass | None in the patched installed range | Closed |
| GHSA-68g3-v927-f742 (Next request-body cache confusion) | `next@16.2.11` | Direct patch upgrade | Full gates and audits pass | None in the patched installed range | Closed |
| GHSA-4633-3j49-mh5q (Next invalid-UTF-8 cache confusion) | `next@16.2.11` | Direct patch upgrade | Full gates and audits pass | None in the patched installed range | Closed |
| GHSA-4c39-4ccg-62r3 (Next Edge Server Action payload) | `next@16.2.11` | Direct patch upgrade | Full gates and audits pass | None in the patched installed range | Closed |
| GHSA-p9j2-gv94-2wf4 (Next dynamic-host rewrite SSRF) | `next@16.2.11` | Direct patch upgrade | Full gates and audits pass | None in the patched installed range | Closed |
| GHSA-q8wf-6r8g-63ch (Next SVG image DoS) | `next@16.2.11` | Direct patch upgrade | Build, runtime, and audits pass | None in the patched installed range | Closed |
| GHSA-955p-x3mx-jcvp (Next Server Function disclosure) | `next@16.2.11` | Direct patch upgrade | Full gates and audits pass | None in the patched installed range | Closed |
| GHSA-qx2v-qp2m-jg93 (PostCSS style-context XSS) | `next -> postcss@8.5.10` | Narrow `next@16.2.11` override because its published metadata still pins `8.4.31` | All resolved PostCSS instances are `8.5.10` or `8.5.16`; audits and build pass | None known; override remains until Next declares a patched version | Closed |
| GHSA-f88m-g3jw-g9cj (sharp/libvips) | `next -> sharp@0.35.3` | Narrow `next@16.2.11` override because its `^0.34.5` optional range cannot select `0.35.x` | Native load reports sharp `0.35.3` / libvips `8.18.3`; build, runtime, and audits pass | No known advisory; untrusted image workflows remain out of scope | Closed |

The wrapper entries `prisma` and `@prisma/dev` closed with the same coherent Prisma `7.9.0` update and removal of the Hono dependency path. After remediation, `npm audit --json` and `npm audit --omit=dev --json` both report zero advisories. The production moderate, full high, and full moderate threshold commands all exit successfully.

## V2-6B Acceptance-Gate Advisory Refresh — 2026-07-25

Fresh registry data disclosed three underlying advisories after the previous clean checks. Before
remediation, `npm audit --json` reported 20 package entries (17 high, 3 moderate), while
`npm audit --omit=dev --json` reported 12 entries (9 high, 3 moderate). The wrapper entries fan out
from the three advisories below; they are not 20 distinct vulnerabilities.

### GHSA-mh99-v99m-4gvg — brace-expansion unbounded expansion denial of service

- Severity: High.
- Affected/patched range: `brace-expansion <=5.0.7`; patched in `5.0.8`.
- Installed copies: `1.1.16`, `2.1.2`, and `5.0.7`.
- Production-capable paths begin at `exceljs@4.4.0`: Archiver reaches Brace Expansion through
  Readdir Glob/Minimatch and Glob/Minimatch; Unzipper reaches it through Fstream/Rimraf/Glob.
- Development paths begin at `eslint@9.39.4`, the lint plugins published through
  `eslint-config-next@16.2.11`, and TypeScript ESLint's `minimatch@10.2.5`.
- Exploit prerequisite: attacker-controlled, extremely large brace patterns must reach a
  Minimatch/Glob consumer and expand until process memory is exhausted.
- Current exposure: no route accepts glob or brace patterns. Excel export paths are
  server-controlled and lint tooling is not network-exposed. The runtime-capable ExcelJS chain is
  nevertheless a high finding and cannot be dismissed.
- Parent status: ExcelJS `4.4.0` is current and still declares Archiver 5 and Unzipper 0.10.
  Current lint plugins still declare old Minimatch lines. Narrow compatible-parent overrides
  require full export, lint, build, and runtime proof because no patched Brace Expansion release
  exists within the old major ranges.
- npm proposes ExcelJS `4.1.1`, ESLint `10.8.0`, and `eslint-config-next` `0.2.4`, marking direct
  proposals breaking. The ExcelJS downgrade and unrelated Next configuration downgrade are not
  coherent remediations.

### GHSA-r28c-9q8g-f849 — PostCSS previous-source-map path traversal

- Severity: High.
- Affected/patched range: `postcss <=8.5.17`; patched in `8.5.18`.
- Affected installed copy: deduplicated `postcss@8.5.16` through
  `@tailwindcss/postcss@4.3.2` and `vitest@4.1.10 -> vite@8.1.3`.
- Patched copy already present: `next@16.2.11 -> postcss@8.5.18` through the existing scoped
  override.
- Exploit prerequisite: processing attacker-controlled CSS containing a crafted
  `sourceMappingURL` that triggers previous-source-map auto-loading and local `.map` disclosure.
- Current exposure: build inputs are repository-controlled; OneDayOS has no arbitrary CSS upload,
  theme builder, or runtime PostCSS service. Build tooling remains affected and must be patched.
- Compatible remediation: the affected parents allow `postcss ^8.5.16`, so a lock refresh to
  `8.5.18` is non-breaking.

### GHSA-5qjj-4xww-7phc — Valibot inherited-property issue-path failure

- Severity: Moderate.
- Affected/patched range: `valibot <=1.4.1`; patched in `1.4.2`.
- Installed path: `prisma@7.9.0 -> @prisma/dev@0.24.14 -> valibot@1.2.0`.
- Classification: Prisma development/tooling path. npm retains it in the production audit because
  of Prisma's optional peer relationship through `@prisma/client`; runtime code does not import
  `@prisma/dev`.
- Exploit prerequisite: a crafted record validation issue path using an inherited Object property
  name must be passed to `flatten()`, causing an exception.
- Current exposure: Prisma CLI is not a public service and does not process application-request
  validation records. The moderate gate still requires remediation.
- Compatible remediation: narrowly override Valibot to `1.4.2` under exact
  `@prisma/dev@0.24.14`, then repeat Prisma generation, validation, migration, and full gates.
- npm proposes downgrading Prisma to `6.19.3`, labeled breaking. That would violate the coherent
  Prisma 7 family and is rejected.

Sanitized before-state evidence is retained under `/tmp/onedayos-v2-6b-*before*`. No dependency
version or override had been changed when this section was recorded.

## V2-3 Dependency Gate Addendum — 2026-07-24

Two newly published high-severity advisories changed the audit result without an application-code change:

| Advisory | Package and path | Before | Patched floor | Resolution |
| --- | --- | ---: | ---: | ---: |
| GHSA-6g55-p6wh-862q / CVE-2026-45623 | `next@16.2.11 -> postcss` | 8.5.10 | 8.5.12 | 8.5.18 through the existing Next-scoped override |
| GHSA-c96f-x56v-gq3h / CVE-2026-47219 | `prisma@7.9.0 -> @prisma/dev@0.24.14 -> find-my-way` | 9.6.0 | 9.7.0 | 9.7.0 through an `@prisma/dev@0.24.14`-scoped override |

The five high package entries were two underlying advisory records repeated through the parent/wrapper entries `next`, `postcss`, `prisma`, `@prisma/dev`, and `find-my-way`. Full and production audits now contain zero findings. Next `16.2.11` and the coherent Prisma `7.9.0` family remain the latest stable releases; no preview, downgrade, major upgrade, direct `find-my-way` dependency, schema change, or migration was used.

The dependency remediation and application regression gates passed. The separate controlled-demo readiness check remains blocked by the currently configured Supabase service-role credential returning HTTP 403 `bad_jwt`; `.env.local` was not modified.

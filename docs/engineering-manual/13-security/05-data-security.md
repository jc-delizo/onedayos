# OneDayOS Engineering Manual — 13 Security / 05 Data Security

**Document ID:** `13-security/05-data-security.md`  
**Version:** `1.0.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Required Before Restarted Foundation Build`  
**Owner:** OneDayOS Founder / Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/07-backup-restore.md`
- `13-security/00-security-model.md`
- `13-security/01-auth-security.md`
- `13-security/02-tenant-isolation.md`
- `13-security/03-permission-enforcement.md`
- `13-security/04-api-security.md`

---

# 1. Purpose

This document defines how OneDayOS protects customer data, business records, personal information, sensitive fields, exports, logs, backups, AI context, events, and future files.

Data security is not only about encryption.

For OneDayOS, data security means:

```txt
The right user
inside the right organization
using the right enabled module
with the right permission
can access only the right data
for the right business purpose
through the right platform path.
```

This document exists because OneDayOS is a shared multi-tenant platform.

A data-security mistake in a single-tenant app may affect one client.

A data-security mistake in OneDayOS may affect every client organization.

That risk is existential.

---

# 2. Primary Data Security Rule

The primary rule is:

```txt
Data must never move unless the platform can prove the actor, tenant, permission, purpose, and safe destination.
```

This applies to:

```txt
database reads
database writes
exports
imports
events
logs
backups
restore scripts
AI context
future background jobs
future attachments
future reporting
future search
future activity feeds
future notifications
```

---

# 3. Legal and Privacy Baseline

OneDayOS is built for Philippine SMEs, so the platform must be designed with Philippine privacy expectations in mind.

This document is **not legal advice**, but the technical architecture must support reasonable privacy and security obligations.

The Philippine National Privacy Commission describes Personal Information Controllers and Personal Information Processors as organizations that process or are instructed to process personal data, and says they must follow privacy principles, uphold data-subject rights, and implement security measures.

The Data Privacy Act of 2012 requires reasonable and appropriate organizational, physical, and technical measures to protect personal information against accidental or unlawful destruction, alteration, disclosure, and other unlawful processing. Its implementing rules also emphasize organizational, physical, and technical security measures.

Therefore, OneDayOS should treat the following as baseline product requirements:

```txt
data minimization
purpose limitation
role-based access
tenant isolation
secure authentication
secure APIs
safe logs
safe exports
backup and restore discipline
incident response readiness
controlled access to sensitive personal data
```

This does not mean OneDayOS is automatically compliant with every client’s legal obligations. It means the platform should not make compliance impossible.

---

# 4. Scope

This document covers:

```txt
data classification
personal data
sensitive data
business confidential data
tenant-scoped data
platform-global data
data minimization
data access
data exports
logs and telemetry
events
AI context
backups and restore
retention and deletion
data migration scripts
future file attachments
future support access
data incident response
Claude implementation rules
```

---

# 5. Non-Goals

This document does not define:

```txt
legal compliance program
privacy policy wording
terms of service wording
data processing agreement wording
data protection officer appointment
formal privacy impact assessments
full incident response procedure
full audit log implementation
full attachment storage implementation
full export engine implementation
RLS implementation
customer-facing privacy dashboard
dedicated enterprise deployment model
```

Those require separate founder, legal, operational, and product decisions.

---

# 6. Data Security Philosophy

## 6.1 Data is a platform asset, not a module detail

Modules do not own the security model.

Modules must inherit:

```txt
authentication
tenant isolation
authorization
validation
soft delete
event safety
export safety
logging safety
backup safety
AI-context safety
```

from the platform.

A module developer should not decide how tenant isolation works.

A module developer should not decide whether sensitive fields can be exported.

A module developer should not decide whether business records can be hard-deleted.

Those rules belong to the platform.

---

## 6.2 Tenant isolation comes before permission

OneDayOS must always check tenant membership before checking permissions.

Wrong:

```txt
User has inventory.read
→ allow access to any inventory record
```

Correct:

```txt
User belongs to Org A
record belongs to Org A
module is enabled for Org A
user has inventory.read in Org A
→ allow access
```

Admin wildcard permissions do not bypass tenant isolation.

---

## 6.3 Read is not export

A user who can view data in the app should not automatically be allowed to export it.

Export increases risk because data leaves the controlled application environment.

Therefore:

```txt
read permission ≠ export permission
```

Examples:

```txt
objects.customer.read
objects.customer.export

inventory.stock_movement.read
inventory.stock_movement.export
```

---

## 6.4 Create is not import

A user who can create one record manually should not automatically be allowed to import hundreds or thousands of records.

Import increases risk because it can:

```txt
pollute data
duplicate Business Objects
bypass workflows
create bad relationships
create large-scale errors
overwrite information
```

Therefore:

```txt
create permission ≠ import permission
```

Examples:

```txt
objects.product.create
objects.product.import

inventory.stock_adjustment.create
inventory.stock_adjustment.import
```

---

## 6.5 Logs are not a dumping ground

Logs are data.

Logs must not contain:

```txt
passwords
tokens
Supabase service role keys
database URLs
full request bodies
full Prisma records
full customer records
full employee records
sensitive identifiers
government ID numbers
bank details
health information
private file URLs
```

Logs should contain enough context to debug safely, not enough data to recreate a privacy incident.

---

## 6.6 AI context is data disclosure

Sending data to AI is a form of disclosure.

Future AI features must treat AI context as a controlled data-access surface.

AI must receive only:

```txt
data the user is allowed to access
fields that are allowed for AI context
records that are tenant-scoped
non-deleted records
minimal data needed for the task
```

AI must not receive full database dumps.

---

# 7. Data Classification

Every data field in OneDayOS should eventually be classified.

For MVP, use these categories.

---

## 7.1 Public Platform Data

Data safe to expose broadly inside the product or marketing context.

Examples:

```txt
module labels
module descriptions
generic documentation
public app name
generic feature names
non-secret UI labels
```

Rules:

```txt
May appear in docs.
May appear in module manifests.
May be used in AI context.
Must not include client-specific data.
```

---

## 7.2 Platform Internal Data

Data about how OneDayOS operates.

Examples:

```txt
module registry metadata
feature flag definitions
platform version
SDK version
migration names
error codes
configuration keys
```

Rules:

```txt
May be visible to developers.
Usually hidden from normal users.
Must not expose secrets.
Must not expose tenant data.
```

---

## 7.3 Tenant Business Data

Normal business data owned by a client organization.

Examples:

```txt
products
customers
suppliers
warehouses
stock records
leave requests
purchase requests
expense claims
asset records
visitor logs
incident reports
project tasks
```

Rules:

```txt
Must include orgId if tenant-scoped.
Must be accessed only through verified PlatformContext.
Must respect module enablement.
Must respect permissions.
Must exclude soft-deleted records by default.
Must not be visible across tenants.
```

---

## 7.4 Personal Data

Data that identifies or may identify a person.

Examples:

```txt
name
email
phone number
address
employee number
customer contact details
supplier contact person details
visitor details
user profile data
```

Rules:

```txt
Collect only what the feature needs.
Do not log full values unnecessarily.
Do not emit full records in events.
Do not expose in AI context unless explicitly allowed.
Do not export without export permission.
```

---

## 7.5 Sensitive Personal Data

Data that can create higher harm if misused.

Examples may include:

```txt
government-issued identifiers
health information
financial account details
payroll/salary fields
bank details
disciplinary records
medical certificates
IDs uploaded as attachments
private notes about individuals
```

Rules:

```txt
Do not add sensitive fields casually.
Do not include in MVP Business Objects by default.
Do not include in events by default.
Do not include in logs.
Do not include in AI context by default.
Do not include in exports unless specifically approved.
Require stricter permissions.
Require founder/architect review before adding.
```

---

## 7.6 Secrets

Secrets are credentials or tokens that give system access.

Examples:

```txt
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
API keys
webhook secrets
JWT secrets
Vercel tokens
email provider keys
SMS provider keys
AI provider keys
encryption keys
```

Rules:

```txt
Never commit to git.
Never expose to browser.
Never place in module manifests.
Never place in logs.
Never send to AI.
Never store in ordinary settings tables.
Use environment variables or approved secret storage.
```

---

## 7.7 Derived / Aggregated Data

Data computed from records.

Examples:

```txt
dashboard metrics
inventory totals
leave balances
expense totals
report summaries
search indexes
AI summaries
activity feed entries
audit entries
```

Rules:

```txt
Still tenant-scoped.
Still permission-scoped.
May still reveal sensitive information.
Must be invalidated or regenerated safely.
Must not expose deleted records by accident.
```

---

# 8. Field-Level Data Security

## 8.1 Sensitive fields require explicit classification

Any field that may contain personal, sensitive, financial, legal, medical, or confidential information should be marked in field metadata or schema documentation.

Example future field metadata:

```ts
{
  key: 'salary',
  label: 'Salary',
  type: 'money',
  sensitivity: 'sensitive',
  exportable: false,
  aiContext: false,
  searchable: false,
}
```

---

## 8.2 Sensitive fields are opt-in, not opt-out

Default rule:

```txt
Fields are not sensitive only after review.
```

For safety, if there is uncertainty, treat the field as sensitive.

---

## 8.3 Sensitive fields should not be in core Business Objects by default

Core Business Objects should remain minimal.

Examples of fields that should not be added to core Employee in MVP:

```txt
salary
SSS number
PhilHealth number
Pag-IBIG number
TIN
health data
disciplinary notes
medical certificates
attendance logs
leave credits
bank account details
```

Those may belong later in module-owned extension tables with stricter permissions.

---

# 9. Tenant-Scoped Data Rules

## 9.1 Every tenant-scoped table must include `orgId`

Examples:

```txt
Employee
Product
Customer
Supplier
Warehouse
StockMovement
LeaveRequest
ExpenseClaim
AssetRecord
VisitorLog
IncidentReport
```

---

## 9.2 Client-supplied `orgId` is forbidden

APIs and forms must reject `orgId` in client request bodies.

Wrong:

```ts
const input = await req.json()
await service.create(input.orgId, input)
```

Correct:

```ts
const ctx = await sdk.auth.requireApiModuleContext(req, orgSlug, 'inventory')
const input = CreateSchema.parse(await req.json())
await service.create(ctx, input)
```

---

## 9.3 Service methods receive `PlatformContext`

Wrong:

```ts
ProductService.list(orgId)
```

Correct:

```ts
ProductService.list(ctx)
```

---

## 9.4 Tenant-safe unique constraints

Tenant-scoped uniqueness must include `orgId`.

Examples:

```prisma
@@unique([orgId, code])
@@unique([orgId, employeeNo])
@@unique([orgId, module, key])
```

Global uniqueness should be rare.

---

## 9.5 Tenant-safe relationships

Tenant-scoped records should not relate only by `id` if the relationship can cross tenants by accident.

Preferred conceptual pattern:

```txt
child.orgId must match parent.orgId
```

Where Prisma cannot fully enforce composite tenant relationships cleanly, service-layer checks and tests are mandatory.

---

# 10. Access Control for Data

## 10.1 Access must pass all required gates

Protected data access requires:

```txt
1. Authenticated user
2. Platform User exists
3. Organization exists
4. User belongs to that organization
5. Organization is active enough for the requested action
6. Module or object surface is available
7. User has required permission
8. Request input validates
9. Query is tenant-scoped
10. Soft-deleted records are excluded unless explicitly allowed
```

---

## 10.2 Module enablement is not permission

A module may be enabled for an organization while a specific user has no access.

Example:

```txt
Inventory enabled for Org A
User Maria has no inventory permissions
→ Maria cannot access Inventory data
```

---

## 10.3 Permission is not data ownership

A user may have permission to read a module but still not have access to every future scope if branch/department/own-record scoping is introduced later.

For MVP:

```txt
organization-scoped RBAC only
```

Future ABAC / scope conditions require a separate document and ADR.

---

# 11. Database Query Safety

## 11.1 Raw Prisma is forbidden in modules

Modules must not import:

```ts
import { prisma } from '@/kernel/db/client'
```

Modules must use:

```ts
import { sdk } from '@/sdk/server'
const db = sdk.getDb(ctx)
```

---

## 11.2 Tenant-scoped `findUnique({ where: { id } })` is forbidden

Wrong:

```ts
await db.product.findUnique({ where: { id } })
```

Correct:

```ts
await db.product.findFirst({
  where: {
    id,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Or, where a composite unique constraint exists:

```ts
await db.product.findUnique({
  where: {
    id_orgId: {
      id,
      orgId: ctx.org.id,
    },
  },
})
```

---

## 11.3 Raw SQL is forbidden in modules

Raw SQL may be used only in approved platform migration, repair, or data operations scripts.

It requires:

```txt
founder/architect approval
dry-run mode
tenant scoping
rollback/repair plan
test or staging verification
```

---

## 11.4 Soft-deleted records are hidden by default

Normal reads must exclude:

```txt
deletedAt != null
```

Deleted-record access requires explicit restore/admin path and permission.

---

# 12. API Data Security

## 12.1 APIs must never expose full database records by default

Use explicit `select`.

Wrong:

```ts
return NextResponse.json({ data: product })
```

Better:

```ts
return api.ok({
  id: product.id,
  code: product.code,
  name: product.name,
  unit: product.unit,
})
```

---

## 12.2 API responses must not include secrets

Never return:

```txt
environment variables
service role keys
database URLs
tokens
password hashes
raw provider responses
internal stack traces
```

---

## 12.3 Validation must reject unknown keys

Use:

```ts
z.strictObject(...)
```

for API body schemas.

Unknown keys should not be silently accepted.

This helps prevent client-supplied `orgId`, `userId`, `roleId`, `isAdmin`, `deletedAt`, or `deletedBy` from entering mutation inputs.

---

## 12.4 Current-user APIs must be session-derived

Wrong:

```txt
GET /api/kernel/users/[id]
```

for current user lookup.

Correct:

```txt
GET /api/kernel/auth/me
```

The current user is derived from the Supabase session, not from a user ID supplied by the client.

---

# 13. Event Data Security

## 13.1 Events must be minimal

Events should contain identifiers and safe metadata, not full records.

Wrong:

```ts
await sdk.events.emit(ctx, 'objects.customer.created', customer)
```

Correct:

```ts
await sdk.events.emit(ctx, 'objects.customer.created', {
  customerId: customer.id,
  displayName: customer.name,
})
```

Even `displayName` should be considered carefully for sensitive entities.

---

## 13.2 Event payloads must not include `orgId`

The event envelope derives tenant identity from `PlatformContext`.

Payloads do not need `orgId`.

Wrong:

```ts
{
  orgId: ctx.org.id,
  productId: product.id
}
```

Correct:

```ts
{
  productId: product.id
}
```

---

## 13.3 Sensitive fields are excluded from events by default

Events should not include:

```txt
salary
government IDs
bank details
health information
full addresses
private notes
file URLs
auth tokens
```

---

## 13.4 Event consumers must re-check permissions for user-facing output

A future Activity Feed, Search, AI, Notification, or Reporting Service must not assume that because an event occurred, every user can see it.

Events are not permission grants.

---

# 14. Logging and Error Data Security

## 14.1 Safe logs

Logs may include:

```txt
request ID
route
method
status code
error code
module ID
event name
org ID only in server logs when necessary
user ID only in server logs when necessary
record ID when necessary
timing metrics
```

---

## 14.2 Unsafe logs

Logs must not include:

```txt
passwords
tokens
cookies
authorization headers
service role keys
database URLs
full request bodies
full customer records
full employee records
full export data
full import data
AI prompts containing client data
AI responses containing client data
private file URLs
```

---

## 14.3 API errors must be user-safe

Do not return:

```txt
stack traces
SQL errors
Prisma raw messages
provider secrets
internal file paths
full exception objects
```

Return stable error codes:

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

---

# 15. Export Data Security

## 15.1 Export is high risk

Export moves data outside OneDayOS.

Exports should be treated as security-sensitive operations.

---

## 15.2 Export requires explicit permission

Examples:

```txt
objects.customer.export
objects.employee.export
inventory.stock_movement.export
expenses.expense_claim.export
```

Read permission is not enough.

---

## 15.3 Export must be tenant-scoped

Every export must use verified `PlatformContext`.

Wrong:

```txt
/api/export?orgId=...
```

Correct:

```txt
/api/orgs/[orgSlug]/objects/customers/export
```

---

## 15.4 Export must respect field sensitivity

Sensitive fields should not be exported by default.

Examples of fields excluded by default:

```txt
government IDs
salary
bank details
health information
private notes
internal security metadata
deletedAt
deletedBy
```

---

## 15.5 Export should be logged later

Once Audit Log Service exists, exports should produce audit events.

For now, export features are mostly deferred.

---

# 16. Import Data Security

## 16.1 Imports must validate before writing

Imports must not stream unvalidated data directly into production tables.

Required phases:

```txt
parse
validate
preview errors
confirm
write through services
emit events
report results
```

The full Import Engine is deferred, but limited developer-run onboarding scripts may exist.

---

## 16.2 Imports must not duplicate Business Objects

Wrong:

```txt
Inventory import creates InventoryProduct
CRM import creates CRMCustomer
Leave import creates LeaveEmployee
```

Correct:

```txt
Inventory import creates Product + Inventory extension if needed
CRM import creates Customer + CRM extension if needed
Leave import references Employee
```

---

## 16.3 Imports must use services

Imports should go through service-layer logic so they inherit:

```txt
tenant scoping
validation
permission checks or approved system context
soft delete behavior
events
business rules
```

---

# 17. Backup and Restore Data Security

## 17.1 Backups contain sensitive data

Backups must be protected like production data.

Rules:

```txt
Backups must not be public.
Backups must not be sent to AI.
Backups must not be stored casually on personal devices.
Backup access must be limited.
Restore drills must be controlled.
```

---

## 17.2 Restore can cause data exposure

Restoring production data into staging can expose real client data to developers.

Therefore, production-data restore into non-production environments requires:

```txt
founder/architect approval
access control
temporary environment controls
cleanup plan
no public access
no uncontrolled sharing
```

---

## 17.3 Per-tenant repair is preferred over full restore for one-client incidents

Because OneDayOS uses a shared database, full production restore affects every tenant.

For one-client data incidents:

```txt
restore backup to staging
extract affected orgId data
run targeted tenant-aware repair script
verify with tests/checks
```

Full production restore is a last resort.

---

# 18. Data Retention and Deletion

## 18.1 Soft delete is default for business records

Normal delete means:

```txt
deletedAt = now()
deletedBy = ctx.user.id
```

Hard delete is forbidden for normal business records.

---

## 18.2 `isActive` is not deletion

Examples:

```txt
Employee isActive = still employed
Warehouse isActive = operational location
Organization isActive = tenant status
User isActive = can use platform
```

Deletion uses:

```txt
deletedAt
deletedBy
```

---

## 18.3 Retention policy is a business/legal decision

The platform must support retention discipline, but the exact retention policy may vary by module, client, or legal requirement.

Do not invent retention rules casually inside module code.

---

## 18.4 Right-to-erasure workflows are not MVP

A complete erasure/privacy-request workflow is deferred.

However, the architecture should avoid making erasure impossible.

Avoid:

```txt
duplicating personal data across modules
storing full records in events
storing full records in logs
storing full records in AI context
```

---

# 19. AI Data Security

## 19.1 AI receives minimum context

AI should not receive all records.

AI should receive:

```txt
module documentation
field metadata
safe summaries
specific records the user is allowed to access
only fields approved for AI context
```

---

## 19.2 AI must not receive sensitive fields by default

Exclude:

```txt
government IDs
salary
bank details
health data
private notes
authentication data
tokens
secrets
full exports
```

---

## 19.3 AI must not become an export feature

If a user lacks export permission, AI must not provide bulk data dumps.

Wrong:

```txt
"List all customers with emails and phone numbers."
```

Unless the user has explicit permission and the AI feature is approved for that purpose.

---

## 19.4 AI-generated actions require confirmation

Future AI actions must use:

```txt
preview
human confirmation
server-side permission check
service-layer execution
event emission
audit/event logging later
```

AI must not mutate data directly.

---

# 20. Future Attachments / File Data Security

Attachments are deferred, but the data-security rules are already clear.

Files may contain highly sensitive information.

Future attachment handling must include:

```txt
private storage buckets
server-authorized access
short-lived signed URLs
metadata in PostgreSQL
tenant-scoped attachment records
target-record permission checks
file size limits
file type allowlists
malware scanning decision
backup and restore plan for files
no public URLs for private business files
```

Client-supplied bucket names, paths, or URLs are forbidden.

---

# 21. Support Access Data Security

## 21.1 OneDayOS staff access is not free access

Founder/developer/support access to client data is sensitive.

MVP should avoid building internal support impersonation or staff override tools.

---

## 21.2 Support access requires future policy

Before support staff can access client data, OneDayOS needs:

```txt
support access policy
audit trail
least-privilege access
client approval model if needed
incident-only access rules
data minimization
staff training
```

---

## 21.3 Do not hack support access into tenant logic

Do not implement:

```txt
if user.email.endsWith('@onedayonlysystems.com') allow all orgs
```

That is a security bypass.

Future support access requires explicit architecture and auditability.

---

# 22. Data Security in Client Delivery

Client onboarding must not bypass data security.

Do not:

```txt
ask clients to send passwords in chat
store client spreadsheets casually
upload client data to random tools
send client data to AI for cleanup
import client data without validation
leave client data in local files forever
share production screenshots with sensitive info
```

Preferred:

```txt
use controlled onboarding templates
validate import files
delete local copies after import
avoid unnecessary sensitive fields
use staging carefully
record what was imported
```

---

# 23. Data Security for Founder / Operator

The founder must treat OneDayOS as a platform, not a hobby project.

Minimum operational discipline:

```txt
company-owned Supabase organization
MFA enabled
at least two trusted owners
least-privilege access
service role key protected
billing protected
production/staging separation
backup and restore drill
no secrets in ChatGPT/Claude prompts
no client data in AI prompts unless approved and redacted
```

---

# 24. Forbidden Patterns

Claude must not generate or preserve these patterns.

## 24.1 Client-supplied tenant identity

```ts
const orgId = body.orgId
const orgId = req.nextUrl.searchParams.get('orgId')
```

## 24.2 Loose service tenant input

```ts
ProductService.list(orgId)
```

## 24.3 Raw Prisma in modules

```ts
import { prisma } from '@/kernel/db/client'
```

## 24.4 Unsafe `findUnique`

```ts
db.customer.findUnique({ where: { id } })
```

for tenant-scoped records.

## 24.5 Full-record event payloads

```ts
sdk.events.emit(ctx, 'objects.employee.updated', employee)
```

## 24.6 Full request body logging

```ts
console.log(await req.json())
```

## 24.7 Sensitive data in AI prompts

```txt
"Here is our full customer database. Analyze it."
```

## 24.8 Hidden support bypass

```ts
if (user.email.includes('@onedayonlysystems.com')) {
  return allOrganizations
}
```

## 24.9 Export with read permission only

```ts
await sdk.permissions.require(ctx, {
  module: 'objects',
  resource: 'customer',
  action: 'read',
})
// then export all customers
```

Export needs `export`.

## 24.10 Import with create permission only

```ts
await sdk.permissions.require(ctx, {
  module: 'objects',
  resource: 'product',
  action: 'create',
})
// then bulk import 20,000 products
```

Import needs `import`.

---

# 25. Required Data Security Tests

## 25.1 Tenant isolation tests

```txt
Org A user cannot read Org B data.
Org A user cannot mutate Org B data.
Org A user cannot export Org B data.
Org A user cannot reference Org B relation IDs.
Org A user cannot restore Org B deleted records.
```

---

## 25.2 Permission tests

```txt
User with read cannot export.
User with create cannot import.
User without read cannot list records.
User without update cannot mutate records.
User without delete cannot soft-delete records.
Admin wildcard still cannot access wrong tenant.
```

---

## 25.3 API data security tests

```txt
API rejects client-supplied orgId.
API rejects unknown body keys.
API returns JSON errors only.
API does not redirect.
API does not return stack traces.
API uses safe 404 for wrong-org access.
```

---

## 25.4 Logging tests / checks

At minimum, architecture checks should prevent:

```txt
console.log(body)
console.log(req)
console.log(process.env)
console.error(error) with full raw provider response in client-facing paths
```

A more advanced redaction logger may be introduced later.

---

## 25.5 Export/import tests

When export/import features exist:

```txt
read is not enough for export
create is not enough for import
exports exclude sensitive fields by default
imports reject orgId
imports reject cross-tenant relation IDs
imports validate before writing
```

---

## 25.6 AI data tests

When AI features exist:

```txt
AI context excludes sensitive fields
AI context respects permissions
AI context excludes soft-deleted records
AI cannot access disabled module data
AI cannot produce bulk exports without export permission
AI actions require confirmation
```

---

# 26. Architecture Checks

The platform should eventually include:

```bash
npm run check:architecture
```

Data-security checks should flag:

```txt
body.orgId
searchParams.get('orgId')
sdk.getDb(orgId)
ProductService.list(orgId)
import { prisma } from '@/kernel/db/client' inside modules
findUnique({ where: { id } }) on tenant-scoped models
console.log(await req.json())
console.log(process.env)
service role key references outside approved files
events with full record payloads
export routes using only read permission
import routes using only create permission
```

---

# 27. Claude Implementation Rules

Claude must follow these rules:

```txt
1. Do not accept client-supplied orgId.
2. Do not use loose orgId strings in module services.
3. Use verified PlatformContext.
4. Use sdk.getDb(ctx).
5. Do not import raw Prisma inside modules.
6. Do not log request bodies.
7. Do not return full Prisma records by default.
8. Do not include sensitive fields in events.
9. Do not include sensitive fields in AI context.
10. Do not add export without export permission.
11. Do not add import without import permission.
12. Do not add support-staff bypass logic.
13. Do not add attachments without the deferred Attachment Service approval.
14. Do not add AI data access without AI safety approval.
15. Do not implement RLS from this document alone.
16. Stop and report if a data-security decision is ambiguous.
```

---

# 28. Founder Review Checklist

Before this document is frozen, answer:

```txt
[ ] Do we agree that read and export are separate permissions?
[ ] Do we agree that create and import are separate permissions?
[ ] Do we agree that support access is deferred?
[ ] Do we agree that sensitive fields are opt-in for AI/export/events?
[ ] Do we agree that logs must not contain full request bodies?
[ ] Do we agree that client-supplied orgId is rejected everywhere?
[ ] Do we agree that production backups are sensitive data?
[ ] Do we agree that full production restore is a last resort?
[ ] Do we agree that AI context is a data-disclosure surface?
[ ] Do we agree that no official module should bypass this document?
```

---

# 29. Acceptance Criteria

This document is accepted when:

```txt
[ ] Data classification rules are clear.
[ ] Tenant-scoped data rules are clear.
[ ] Sensitive-field rules are clear.
[ ] Export/import permission separation is clear.
[ ] Event payload safety is clear.
[ ] Log safety is clear.
[ ] Backup/restore data-security rules are clear.
[ ] AI data-security rules are clear.
[ ] Future attachment risks are documented.
[ ] Support access is explicitly not hacked into MVP.
[ ] Forbidden patterns are listed.
[ ] Test requirements are listed.
[ ] Claude implementation rules are explicit.
```

---

# 30. Implementation Gate

Before the restarted foundation build is considered safe, Claude must implement or prepare checks for:

```txt
[ ] client-supplied orgId rejection
[ ] PlatformContext-only service pattern
[ ] API response redaction
[ ] no raw Prisma in modules
[ ] no tenant-scoped findUnique by id
[ ] explicit export/import permissions in permission model
[ ] no sensitive fields in event payload examples
[ ] safe logging baseline
[ ] two-org tenant isolation tests
[ ] permission denial tests
[ ] API validation tests for unknown keys
```

---

# 31. Final Position

Data security is not a feature.

It is the reason the platform can exist.

OneDayOS can only scale to many clients if it can prove that:

```txt
client data is separated
user access is intentional
sensitive fields are protected
exports are controlled
logs are safe
events are minimal
AI is bounded
backups are protected
support access is disciplined
```

The platform must be fast to deliver, but not careless with data.

The correct OneDayOS standard is:

```txt
easy to build modules
hard to leak data
hard to bypass permissions
hard to accidentally expose tenants
hard to misuse sensitive fields
```

That is the foundation of AppCare, customer trust, and long-term platform value.

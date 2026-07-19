# OneDayOS Engineering Manual — 10 Platform Services / 06 Attachments Service

**Document ID:** `10-platform-services/06-attachments-service.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Implementation Status:** `Deferred — Contract Only`  
**Owner:** OneDayOS Founding Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/00-kernel-overview.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/03-sdk-auth-permissions.md`
- `05-sdk/04-sdk-events.md`
- `06-data/00-database-architecture.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/03-soft-delete-archival.md`
- `06-data/07-backup-restore.md`
- `08-module-system/00-module-philosophy.md`
- `10-platform-services/00-platform-services-philosophy.md`
- `10-platform-services/01-three-client-rule.md`

---

# 1. Purpose

The Attachments Service is the future OneDayOS Platform Service responsible for attaching files to business records in a tenant-safe, permission-aware, reusable way.

Examples:

```txt
Expense receipt attached to an expense claim
Incident photo attached to an incident report
Asset photo attached to an asset record
Purchase quotation attached to a purchase request
Employee contract attached to an employee record
Visitor ID scan attached to a visitor record
```

The service exists to prevent every module from inventing its own unsafe file-upload system.

However, this service is **not approved for implementation yet**.

During the restarted foundation build, Claude must not create:

```txt
Attachment tables
Attachment APIs
Attachment UI
Generic file upload components
Supabase Storage buckets
Storage RLS policies
Signed upload URL endpoints
Virus scanning pipelines
OCR processing
Document preview services
```

This document defines the future contract only.

---

# 2. Core Decision

The Attachments Service is deferred.

OneDayOS should not build a generic file attachment system until repeated file attachment use cases prove the need.

The correct current behavior is:

```txt
Foundation build:
  No generic Attachment Service.

First module needing files:
  Keep file handling module-local if unavoidable.
  Follow the safety rules in this document.
  Log the use case as evidence.

Three independent attachment use cases:
  Write Platform Service proposal.
  Review architecture.
  Approve or reject promotion.

After approval:
  Implement Attachments Service through SDK.
```

The Attachments Service should be built only when there are at least three independent use cases such as:

```txt
Expenses needs receipts.
Incident Reporting needs photos.
Assets needs asset images or warranty documents.
```

At that point, the same file lifecycle has appeared across independent business domains, and a Platform Service becomes justified.

---

# 3. Why This Service Must Be Deferred

File handling looks simple but becomes risky quickly.

A careless attachment system creates problems in:

```txt
Tenant isolation
Storage permissions
File size limits
Storage cost
Malware risk
PII leakage
Backup and restore
Data retention
Legal deletion
Signed URL expiration
Preview safety
Access auditing
Module ownership
```

If we build it too early, we will likely overbuild.

If each module builds its own version, we will create inconsistent security and support problems.

The right approach is disciplined delay:

```txt
Do not build the generic service too early.
Do not allow modules to invent unsafe file handling freely.
Collect evidence.
Promote only when the pattern is real.
```

---

# 4. What Attachments Service Is

The future Attachments Service is a reusable Platform Service that manages file metadata and storage access for records across OneDayOS.

It should eventually provide:

```txt
File metadata records
Tenant-scoped attachment ownership
Target record linking
Upload authorization
Download authorization
Short-lived access URLs
Soft delete
Restore
File replacement rules
File visibility rules
Storage path generation
File type validation
File size validation
Storage usage tracking
Event emission
Optional future virus scanning
Optional future preview generation
Optional future OCR extraction
```

It should be accessed through the SDK, not through direct module imports.

Future shape:

```ts
await sdk.attachments.createUpload(ctx, input)
await sdk.attachments.finalizeUpload(ctx, input)
await sdk.attachments.listForTarget(ctx, target)
await sdk.attachments.createDownloadUrl(ctx, attachmentId)
await sdk.attachments.delete(ctx, attachmentId)
await sdk.attachments.restore(ctx, attachmentId)
```

This SDK surface is reserved, not implemented now.

---

# 5. What Attachments Service Is Not

The Attachments Service is not:

```txt
A file manager
A Google Drive clone
A document management system
A media library
A CDN abstraction
A public asset hosting service
A photo gallery
A rich document collaboration system
A generic OCR service
A virus scanning service by itself
A backup system
A replacement for Supabase Storage
A module-specific receipt table
A module-specific photo table
```

The service exists to attach files to business records, not to manage arbitrary folders and documents.

Rejected MVP thinking:

```txt
"Let's build folders, tags, previews, sharing links, OCR, signatures, comments, and version history now."
```

Correct thinking:

```txt
"Can authorized users safely attach and retrieve files for business records?"
```

---

# 6. Relationship to Kernel, Business Objects, Modules, and Platform Services

## 6.1 Kernel

Kernel owns:

```txt
Authentication
Organizations
Users
Roles
Permissions
PlatformContext
API contracts
Module registry
Configuration
```

Kernel does not own attachments.

The Attachments Service depends on Kernel primitives, but must not become Kernel.

Reason:

```txt
Not every OneDayOS installation or module needs file attachments on day one.
```

## 6.2 Business Objects

Business Objects may be attachment targets.

Examples:

```txt
Employee contract attached to Employee
Product datasheet attached to Product
Supplier accreditation document attached to Supplier
Customer signed agreement attached to Customer
Warehouse lease document attached to Warehouse
```

Business Objects should not contain direct file columns such as:

```txt
employee.contractFileUrl
product.imageUrl
supplier.documentUrl
customer.attachmentUrl
warehouse.photoUrl
```

Those fields are rejected unless proven as lowest-common-denominator Business Object fields through an ADR.

Attachments belong in the Attachments Service when promoted.

## 6.3 Business Modules

Business modules may need files.

Examples:

```txt
Expenses → receipts
Incident Reporting → evidence photos
Assets → asset photos/warranty documents
Purchasing → quotations
Leave → medical certificates
Visitor Management → ID scans
```

Before the Platform Service exists, one module may implement module-local file handling if the business module cannot function without it.

But module-local file handling must still obey:

```txt
PlatformContext
No client-supplied orgId
Tenant-scoped storage path
Permission checks
File size validation
File type validation
Soft delete metadata
No public bucket for private files
No direct service-role exposure
Security tests
Evidence log entry
```

## 6.4 Platform Services

Attachments Service is a Platform Service only after promotion.

It may later interact with other Platform Services:

```txt
Audit Log Service records attachment lifecycle events.
Notification Service may notify users about attached files.
Activity Feed may show attachment actions.
Search Service may index file metadata.
AI Layer may summarize or answer questions about uploaded documents.
```

Those integrations are deferred.

Attachments Service must not require these services to exist.

---

# 7. Promotion Rule

The Attachments Service requires Three Independent Use Cases evidence before implementation.

Evidence examples:

```md
## Attachment Service Evidence Log

Capability: Attach files to business records

Use Case 1:
Module: Expenses
Need: Attach receipts to expense claims
Why module-local is insufficient: Receipts need download authorization, retention, storage usage tracking

Use Case 2:
Module: Incident Reporting
Need: Attach incident photos and evidence
Why module-local is insufficient: Same lifecycle: upload, list, view, delete, audit

Use Case 3:
Module: Assets
Need: Attach asset photos and warranty documents
Why module-local is insufficient: Same lifecycle across another independent module

Decision:
Promote to Platform Service proposal.
```

Three use cases trigger review.

They do not automatically trigger implementation.

Required after evidence:

```txt
Platform Service proposal
ADR
Data model review
Storage provider review
Security review
Cost review
Backup/restore review
Testing plan
Founder approval
```

---

# 8. Recommended Future Storage Provider

The default future storage provider should be Supabase Storage because OneDayOS already uses Supabase and PostgreSQL.

This is not an implementation instruction for the foundation build.

It is a default future direction.

Reasons:

```txt
Same vendor as current database/auth
Integrated Postgres-backed authorization model
Private buckets available
Storage object metadata available
Good enough for SME internal apps
Low operational overhead
Matches AppCare cost discipline
```

Important constraints:

```txt
Do not expose the Supabase service role key to the browser.
Do not make private business attachments public.
Do not rely only on client-side checks.
Do not allow modules to choose random buckets.
Do not allow arbitrary file paths supplied by clients.
```

Supabase Storage access control uses policies on the `storage.objects` table and defaults to denying uploads without suitable RLS policies. Supabase also documents that service keys bypass RLS, so service keys must remain server-only and treated as highly privileged.

---

# 9. Bucket Strategy

Future preferred bucket strategy:

```txt
One private bucket for business attachments.
```

Example bucket:

```txt
onedayos-attachments
```

Avoid one bucket per organization in MVP.

Avoid one bucket per module in MVP.

Reason:

```txt
One bucket with structured paths is simpler to operate.
Per-org buckets create provisioning complexity.
Per-module buckets create lifecycle inconsistency.
```

Future object path format:

```txt
org/{orgId}/{targetType}/{targetId}/{attachmentId}/{safeFileName}
```

Example:

```txt
org/org_123/expenses.expense_claim/claim_456/att_789/receipt.pdf
org/org_123/incidents.incident/inc_456/att_789/photo.jpg
org/org_123/objects.employee/emp_456/att_789/contract.pdf
```

Rules:

```txt
Storage paths are generated server-side.
Clients never provide final storage paths.
Paths include orgId for operational isolation.
Attachment metadata also stores orgId in Postgres.
Path orgId must match metadata orgId.
```

---

# 10. Future Attachment Target Model

Attachments should target business records through an explicit polymorphic target reference.

Future target shape:

```ts
type AttachmentTarget = {
  namespace: string
  entity: string
  id: string
}
```

Examples:

```ts
{ namespace: 'objects', entity: 'employee', id: 'emp_123' }
{ namespace: 'expenses', entity: 'expense_claim', id: 'claim_123' }
{ namespace: 'incidents', entity: 'incident', id: 'incident_123' }
{ namespace: 'assets', entity: 'asset', id: 'asset_123' }
```

String target key format:

```txt
{namespace}.{entity}:{id}
```

Examples:

```txt
objects.employee:emp_123
expenses.expense_claim:claim_123
incidents.incident:incident_123
assets.asset:asset_123
```

Do not create a separate nullable foreign key column for every possible target:

```txt
employeeId?
expenseClaimId?
incidentId?
assetId?
purchaseRequestId?
customerId?
supplierId?
```

That model does not scale.

However, because polymorphic references are not database-enforced foreign keys, the service must verify target existence and permission through a target resolver registry.

---

# 11. Future Target Resolver Registry

The Attachments Service must not import modules directly.

Therefore, modules and Business Object services should eventually register attachment target resolvers through SDK/platform metadata.

Future conceptual shape:

```ts
type AttachmentTargetResolver = {
  namespace: string
  entity: string
  canRead(ctx: PlatformContext, id: string): Promise<boolean>
  canAttach(ctx: PlatformContext, id: string): Promise<boolean>
  canDeleteAttachment(ctx: PlatformContext, id: string): Promise<boolean>
  exists(ctx: PlatformContext, id: string): Promise<boolean>
  label(ctx: PlatformContext, id: string): Promise<string>
}
```

Example:

```ts
sdk.attachments.registerTargetResolver({
  namespace: 'expenses',
  entity: 'expense_claim',
  canRead: ExpensesService.canReadClaim,
  canAttach: ExpensesService.canAttachReceipt,
  canDeleteAttachment: ExpensesService.canDeleteReceipt,
  exists: ExpensesService.claimExists,
  label: ExpensesService.getClaimLabel,
})
```

This is future-only.

Do not implement this registry during the foundation build.

---

# 12. Future Data Model

The future Attachment model should be metadata-only.

The binary file lives in object storage.

The database stores metadata, target linkage, permissions metadata, lifecycle state, and storage path.

Draft Prisma model:

```prisma
model Attachment {
  id             String    @id @default(cuid())
  orgId          String

  // Target record
  targetNamespace String
  targetEntity    String
  targetId        String

  // Storage
  bucket          String
  storagePath     String
  originalName    String
  safeFileName    String
  contentType     String
  sizeBytes       Int
  checksumSha256  String?

  // Lifecycle
  status          String    @default("pending") // pending | active | failed | deleted
  uploadedBy      String
  uploadedAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  deletedBy       String?

  // Optional metadata
  description     String?
  tags            Json?

  org             Organization @relation(fields: [orgId], references: [id])

  @@index([orgId, targetNamespace, targetEntity, targetId])
  @@index([orgId, uploadedBy])
  @@index([orgId, createdAt])
  @@unique([orgId, storagePath])
  @@map("attachments")
}
```

Notes:

```txt
status=pending supports upload reservation before file upload completes.
status=active means usable.
status=failed means metadata exists but upload/finalization failed.
status=deleted is optional if deletedAt exists; prefer deletedAt for soft delete.
checksumSha256 is optional in first implementation.
tags are optional and should not become generic custom fields.
```

Do not add this model until the service is approved for implementation.

---

# 13. Future Permissions

Suggested platform permissions:

```txt
platform.attachment.read
platform.attachment.create
platform.attachment.delete
platform.attachment.restore
platform.attachment.export
```

But these permissions alone are not enough.

Attachment access must also respect target record permissions.

Example:

```txt
A user can read expense attachments only if they can read the target expense claim.
```

Permission decision should combine:

```txt
Platform attachment permission
+ target record permission
+ tenant membership
+ module enablement if target is module-owned
+ attachment lifecycle state
```

Examples:

```txt
User has platform.attachment.read but cannot read expense claim
→ Deny attachment download.

User can read expense claim but lacks platform.attachment.create
→ Can view existing attachments, cannot upload new ones.

User can delete expense claim but lacks platform.attachment.delete
→ Cannot delete attachment unless module explicitly maps delete permission.
```

MVP future simplification:

The first implementation may allow modules to map target permissions to attachment permissions explicitly.

Example:

```txt
expenses.expense_claim.read grants ability to list/download attachments on that claim.
expenses.expense_claim.update grants ability to attach files.
expenses.expense_claim.delete grants ability to delete attachments.
```

But this mapping must be explicit, documented, and tested.

---

# 14. Future API Contract

Future APIs should follow Kernel API rules:

```txt
JSON only
No redirects
{ data, error, meta? }
API-safe auth
Verified PlatformContext
Tenant route under /api/orgs/[orgSlug]/...
No client-supplied orgId
Zod validation
Permission enforcement
Target existence validation
```

Possible future routes:

```txt
POST   /api/orgs/[orgSlug]/attachments/upload-intent
POST   /api/orgs/[orgSlug]/attachments/[attachmentId]/finalize
GET    /api/orgs/[orgSlug]/attachments?target=expenses.expense_claim:claim_123
GET    /api/orgs/[orgSlug]/attachments/[attachmentId]/download-url
DELETE /api/orgs/[orgSlug]/attachments/[attachmentId]
POST   /api/orgs/[orgSlug]/attachments/[attachmentId]/restore
```

Rejected route shapes:

```txt
/api/attachments?orgId=...
/api/[module]/attachments?orgId=...
/api/files/[id]
/api/storage/proxy?path=...
```

Reason:

```txt
Tenant context must come from route + session + PlatformContext.
Storage paths must not become public API identity.
```

---

# 15. Future Upload Flow

Preferred future upload flow:

```txt
1. Client requests upload intent.
2. Server verifies PlatformContext.
3. Server validates target exists and user may attach files.
4. Server validates file metadata: name, type, size.
5. Server creates pending Attachment record.
6. Server generates server-owned storage path.
7. Server returns a short-lived upload mechanism.
8. Client uploads file.
9. Client calls finalize endpoint.
10. Server verifies uploaded object exists and metadata matches.
11. Server marks Attachment active.
12. Server emits platform.attachment.created event.
```

Conceptual upload intent response:

```json
{
  "data": {
    "attachmentId": "att_123",
    "uploadUrl": "short-lived-provider-url",
    "expiresAt": "2026-07-05T12:00:00.000Z"
  },
  "error": null
}
```

Important rules:

```txt
Client does not choose bucket.
Client does not choose storage path.
Client does not submit orgId.
Client does not receive service role credentials.
Client upload intent expires quickly.
Pending attachments must be cleaned up later.
```

If short-lived direct upload proves unsuitable, the service may use a server-mediated upload endpoint, but this requires Vercel payload/streaming review before approval.

---

# 16. Future Download Flow

Preferred future download flow:

```txt
1. Client requests download URL for attachmentId.
2. Server verifies PlatformContext.
3. Server loads attachment by id + ctx.org.id.
4. Server verifies attachment is active and not deleted.
5. Server verifies user can read target record.
6. Server creates short-lived signed download URL.
7. Server emits optional platform.attachment.download_url_created event if audit requires it.
8. Client downloads from short-lived URL.
```

Do not store long-lived public URLs in the database.

Do not return raw storage paths as download URLs.

Do not make private buckets public.

Do not let users download attachments by guessing `attachmentId` from another organization.

Wrong-org access should return safe 404 behavior.

---

# 17. Delete, Restore, and Retention

Attachments must use soft delete metadata.

Deleting an attachment should:

```txt
Set deletedAt
Set deletedBy
Hide from normal reads
Prevent normal download URL generation
Emit platform.attachment.deleted
```

It should not immediately delete the object from storage unless the retention policy explicitly allows it.

Reason:

```txt
Business users often delete files accidentally.
Soft delete allows restore.
Immediate object deletion complicates recovery.
```

Restore should:

```txt
Require restore permission
Verify target still exists and is readable
Clear deletedAt/deletedBy
Emit platform.attachment.restored
```

Permanent purge should be deferred and admin-only.

Future purge considerations:

```txt
Storage cost
Legal retention
PII deletion requests
Audit requirements
Backup limitations
```

---

# 18. File Type and Size Rules

The future service must validate file type and size server-side.

Initial allowed file classes should be conservative:

```txt
PDF documents
JPEG images
PNG images
WebP images
CSV files if explicitly needed
Excel files if explicitly needed
Plain text files if explicitly needed
```

Potentially blocked by default:

```txt
Executable files
Scripts
HTML files
SVG files
ZIP/RAR archives
Password-protected archives
Office macros
Unknown binary files
```

Exact allowed types should be configurable per target or module, but configuration must be server-controlled.

Example:

```ts
type AttachmentPolicy = {
  maxFileSizeMb: number
  allowedMimeTypes: string[]
  allowedExtensions: string[]
  maxFilesPerTarget?: number
}
```

Do not rely only on browser-provided MIME type.

The first implementation may validate:

```txt
Declared MIME type
File extension
Size
```

Future hardening may add:

```txt
Magic byte inspection
Virus scanning
Image dimension validation
PDF safety checks
OCR pipeline
```

These are deferred.

---

# 19. Security Model

The Attachments Service is security-sensitive.

Every operation must enforce:

```txt
Authentication
Tenant membership
Target record access
Attachment permission
Module enablement if target is module-owned
File policy
Lifecycle state
```

Forbidden:

```ts
const orgId = body.orgId
const path = body.path
const bucket = body.bucket
const url = body.url
```

Required:

```ts
const ctx = await sdk.auth.requireApiContext(req, orgSlug)
const target = AttachmentTargetSchema.parse(body.target)
await sdk.attachments.requireCanAttach(ctx, target)
```

The service role key must never be sent to the browser.

If server-side Supabase Storage admin operations are used, they must be isolated inside server-only infrastructure code.

No module should import the storage client directly.

---

# 20. Tenant Isolation

Attachment tenant isolation must exist at multiple layers:

```txt
API route includes orgSlug
PlatformContext verifies orgSlug belongs to authenticated user
Attachment metadata is queried by id + ctx.org.id
Storage path includes ctx.org.id
Target resolver checks target under ctx.org.id
Permissions are org-scoped
Tests use at least two organizations
```

Wrong pattern:

```ts
await db.attachment.findUnique({ where: { id: attachmentId } })
```

Correct pattern:

```ts
await db.attachment.findFirst({
  where: {
    id: attachmentId,
    orgId: ctx.org.id,
    deletedAt: null,
  },
})
```

Wrong pattern:

```txt
attachments/{attachmentId}/{fileName}
```

Better future path:

```txt
org/{orgId}/{targetType}/{targetId}/{attachmentId}/{safeFileName}
```

Path isolation is not sufficient by itself.

Database metadata isolation is mandatory.

---

# 21. Events

Future attachment events should use the `platform` namespace.

Suggested events:

```txt
platform.attachment.upload_intent_created
platform.attachment.created
platform.attachment.deleted
platform.attachment.restored
platform.attachment.failed
platform.attachment.download_url_created
```

Event payload rules:

```txt
Do not include orgId.
Do not include signed URLs.
Do not include service paths unless required and safe.
Do not include full target records.
Do not include full attachment metadata if it contains sensitive filename details.
```

Suggested payload:

```ts
type AttachmentCreatedPayload = {
  attachmentId: string
  targetNamespace: string
  targetEntity: string
  targetId: string
  contentType: string
  sizeBytes: number
  uploadedBy: string
}
```

Listeners should receive `EventEnvelope` with `ctx` separately.

Events are for facts, not commands.

Rejected event names:

```txt
send.file_uploaded_notification
attachment.upload
file.added
storage.upload.done
```

Accepted event names:

```txt
platform.attachment.created
platform.attachment.deleted
platform.attachment.restored
```

---

# 22. Relationship to Audit Log

The future Audit Log Service may consume attachment events.

Examples:

```txt
platform.attachment.created → audit entry
platform.attachment.deleted → audit entry
platform.attachment.restored → audit entry
```

Do not build audit logic inside Attachments Service.

Attachments emit events.

Audit consumes events.

If Audit Log Service does not exist yet, attachment events should still be emitted.

---

# 23. Relationship to Notifications

The future Notification Service may notify users when attachments are added.

Example:

```txt
A purchase request receives a quotation attachment.
Assigned reviewer receives notification.
```

But Attachments Service must not send notifications directly.

Attachments emit events.

Notifications consume events.

No `notifyUser` call inside Attachments Service.

---

# 24. Relationship to Activity Feed

The future Activity Feed may show attachment events in a record timeline.

Example:

```txt
Maria uploaded receipt.pdf
Juan deleted photo.jpg
Ana restored warranty.pdf
```

Activity Feed is separate.

Do not build timeline UI inside Attachments Service.

---

# 25. Relationship to Search

Initial future implementation should not full-text index file contents.

Search may eventually index:

```txt
Original filename
Description
Target label
Uploader
Created date
```

Future advanced search may index:

```txt
OCR text
PDF extracted text
AI summaries
```

Those features are deferred.

Do not build OCR or document text extraction in the first Attachments Service implementation.

---

# 26. Relationship to AI Layer

Attachments may eventually become AI context.

Examples:

```txt
Summarize this incident evidence.
Extract vendor name from this receipt.
Find all warranty documents expiring soon.
```

But AI access to attachments is high-risk.

AI must obey:

```txt
Tenant isolation
User permissions
Target record permissions
Attachment lifecycle state
PII minimization
Auditability
```

AI must never read arbitrary storage paths.

AI attachment access must go through SDK/service permission checks.

Do not implement attachment AI in the first Attachments Service.

---

# 27. Backup and Restore Considerations

Attachments create a second data store beyond PostgreSQL metadata.

The database may store:

```txt
Attachment metadata
Target references
Lifecycle state
Storage paths
```

Object storage stores:

```txt
Actual binary files
```

A backup is incomplete if it restores metadata but loses objects.

A restore is incomplete if it restores objects but loses metadata.

Before implementing Attachments Service, the Backup & Restore document must be updated with:

```txt
Storage backup strategy
Storage restore strategy
Metadata/object consistency checks
Orphan metadata detection
Orphan object detection
Per-tenant repair scripts
Retention policy
Purge policy
```

This is one reason the service is deferred.

---

# 28. Cost Management

Attachments directly affect AppCare profitability.

Risks:

```txt
Clients uploading large files
Duplicate uploads
Unbounded image uploads
Old files never purged
Large PDFs used as informal document storage
Storage egress cost
Preview generation cost
AI processing cost
Backup cost
```

Future service must support:

```txt
Per-org storage usage tracking
Per-org storage quota
Max file size
Allowed file types
Potential overage billing
Admin usage view
```

Initial AppCare plan includes a storage allowance.

The platform must enforce it before file-heavy modules become common.

---

# 29. Module-Local File Handling Before Promotion

If a single module truly needs file upload before the Platform Service exists, the module may implement module-local file handling only with founder approval.

Allowed example:

```txt
Incident Reporting needs one photo upload to be commercially useful.
```

Required constraints:

```txt
Write evidence log entry.
Use private storage.
Use verified PlatformContext.
Reject client-supplied orgId.
Generate storage path server-side.
Use tenant-scoped metadata table.
Validate file type and size.
Use soft delete.
Do not expose service role key.
Do not build generic attachment abstractions inside the module.
Do not create reusable UI pretending to be Platform Service.
Add two-org security tests.
Add permission-denial tests.
Add storage path tests.
Add download authorization tests.
```

Module-local file handling should be treated as temporary evidence, not final platform architecture.

When Attachments Service is later promoted, the module-local implementation should be migrated.

---

# 30. Generator Rules

The Module Generator must not generate attachments by default.

Forbidden generated files:

```txt
src/modules/[module]/attachments.ts
src/modules/[module]/file-upload.tsx
src/app/api/orgs/[orgSlug]/[module]/attachments/route.ts
src/platform/attachments/*
src/services/storage/*
```

The generator may include a placeholder comment only:

```ts
// Attachments are deferred. Do not add file upload logic unless the module spec explicitly requires it.
```

If a future module spec requires module-local files, a separate approved implementation document must define the exact generated shape.

---

# 31. Testing Requirements for Future Implementation

The future Attachments Service must include tests for:

## 31.1 Tenant Isolation

```txt
Org A user cannot list Org B attachments.
Org A user cannot download Org B attachment.
Org A user cannot finalize Org B upload.
Org A user cannot delete Org B attachment.
Org A user cannot restore Org B attachment.
Storage path orgId must match ctx.org.id.
```

## 31.2 Permission Enforcement

```txt
User without target read cannot list attachments.
User without target read cannot download attachment.
User without attach permission cannot create upload intent.
User without delete permission cannot delete attachment.
User without restore permission cannot restore attachment.
Admin wildcard permission still cannot cross tenants.
```

## 31.3 API Behavior

```txt
Unauthenticated request returns 401 JSON.
Unauthorized request returns 403 JSON.
Wrong-org request returns safe 404 JSON.
Validation errors return VALIDATION_ERROR.
No API returns redirect or HTML.
Client-supplied orgId is rejected.
Client-supplied storage path is rejected.
Client-supplied bucket is rejected.
```

## 31.4 File Policy

```txt
Too-large file is rejected.
Disallowed MIME type is rejected.
Disallowed extension is rejected.
Filename is sanitized.
Empty filename is rejected.
Storage path is generated server-side.
```

## 31.5 Lifecycle

```txt
Pending upload can be finalized.
Pending upload expires or is cleaned up.
Failed upload is not downloadable.
Deleted attachment is not listed.
Deleted attachment cannot be downloaded.
Deleted attachment can be restored with permission.
```

## 31.6 Event Emission

```txt
Created event emits after successful finalize.
Created event does not emit on failed upload.
Deleted event emits after soft delete.
Restored event emits after restore.
Events do not include orgId.
Events do not include signed URLs.
```

## 31.7 Backup Consistency

```txt
Metadata exists but object missing is detected.
Object exists but metadata missing is detected.
Repair script can report orphan objects.
Repair script can report orphan metadata.
```

---

# 32. Anti-Patterns

## 32.1 Public Buckets for Private Business Files

Rejected:

```txt
Make bucket public and store public URLs in records.
```

Reason:

```txt
Business attachments may contain receipts, IDs, contracts, salaries, customer data, or incident evidence.
```

## 32.2 File URL Columns on Business Records

Rejected:

```prisma
model ExpenseClaim {
  receiptUrl String?
}
```

Better:

```txt
ExpenseClaim has no file column.
Attachment targets the expense claim.
```

## 32.3 Module-Specific Generic Attachments

Rejected:

```txt
expenses_attachments
incident_attachments
asset_attachments
purchase_attachments
```

This may be acceptable temporarily before promotion only with approval, but it is not the long-term platform model.

## 32.4 Client-Supplied Storage Paths

Rejected:

```ts
const path = body.path
```

Correct:

```ts
const path = generateAttachmentPath(ctx, target, attachmentId, safeFileName)
```

## 32.5 Storing Signed URLs

Rejected:

```txt
attachment.downloadUrl = signedUrl
```

Reason:

```txt
Signed URLs expire and should be generated on demand.
```

## 32.6 Direct Module Storage Client

Rejected:

```ts
import { supabaseAdmin } from '@/kernel/storage'
```

Modules use SDK only.

## 32.7 Attachments as Commands

Rejected event:

```txt
platform.attachment.send_to_user
```

Accepted event:

```txt
platform.attachment.created
```

Events are facts.

---

# 33. Claude Implementation Rules

Claude must follow these rules:

```txt
Do not implement Attachments Service from this document alone.
Do not add Attachment Prisma model yet.
Do not add Supabase Storage bucket setup yet.
Do not add storage clients yet.
Do not add file upload UI yet.
Do not add attachment APIs yet.
Do not add attachment SDK APIs yet.
Do not add upload fields to generated modules by default.
Do not use public buckets for private business files.
Do not expose service role keys to the client.
Do not let clients provide orgId, bucket, path, or final URL.
Do not use FastAPI, Python, Alembic, SQLAlchemy, or a separate backend for attachments.
```

When the service is approved later, Claude must receive a dedicated implementation document, not this contract-only document.

---

# 34. Future Implementation Gate

Attachments Service may be implemented only after:

```txt
[ ] Three independent attachment use cases are documented
[ ] Founder approves Platform Service promotion review
[ ] ADR is written and approved
[ ] Storage provider is confirmed
[ ] Bucket strategy is approved
[ ] Data model is approved
[ ] Target resolver design is approved
[ ] Permission model is approved
[ ] Upload/download API contract is approved
[ ] Backup/restore plan is updated
[ ] Cost/quota plan is approved
[ ] Security test matrix is written
[ ] Module migration plan is written if module-local file handling already exists
```

Implementation is blocked until all applicable items are complete.

---

# 35. Acceptance Criteria for This Document

This document is acceptable if:

```txt
[ ] It clearly marks Attachments Service as deferred
[ ] It explains what the future service is and is not
[ ] It defines the promotion rule
[ ] It prevents modules from inventing unsafe file handling casually
[ ] It defines future storage strategy without implementing it
[ ] It defines tenant isolation requirements
[ ] It defines permission requirements
[ ] It defines future API shape
[ ] It defines future SDK shape
[ ] It defines upload/download lifecycle
[ ] It defines backup/restore implications
[ ] It defines cost implications
[ ] It defines testing requirements
[ ] It gives Claude explicit non-implementation rules
```

---

# 36. Final Architectural Position

The Attachments Service is important, but not foundational for the restarted platform build.

Do not build it now.

Build the platform foundation first:

```txt
Kernel
SDK
Database
Business Objects
Module System
Generator safety
Design System
First real module
```

Let repeated module needs prove the attachment lifecycle.

Then promote Attachments Service deliberately.

The correct mindset is:

```txt
Files are not just files.
Files are tenant-scoped, permission-sensitive, cost-bearing business records.
```

If OneDayOS handles attachments casually, it will create security and support debt.

If OneDayOS handles attachments as a deferred Platform Service with clear evidence and strong contracts, it will become reusable infrastructure that supports many modules safely.


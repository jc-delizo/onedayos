# OneDayOS Engineering Manual — 10 Platform Services — 09 Search Service

**Document ID:** `10-platform-services/09-search-service.md`  
**Version:** 1.0  
**Status:** Draft for Founder Review  
**Implementation Status:** Deferred — Contract Only  
**Owner:** OneDayOS Founder / Lead Architect  
**Last Updated:** July 2026  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `02-architecture/01-layer-boundaries.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/04-authorization-enforcement.md`
- `04-kernel/08-kernel-api-contracts.md`
- `05-sdk/00-sdk-overview.md`
- `05-sdk/01-sdk-public-api.md`
- `05-sdk/02-sdk-db-access.md`
- `05-sdk/04-sdk-events.md`
- `06-data/01-tenancy-data-isolation.md`
- `06-data/03-soft-delete-archival.md`
- `07-business-objects/00-business-object-philosophy.md`
- `08-module-system/01-module-manifest.md`
- `10-platform-services/00-platform-services-philosophy.md`
- `10-platform-services/01-three-client-rule.md`

---

# 1. Purpose

This document defines the future **Search Service** for OneDayOS.

The Search Service is a future Platform Service responsible for searchable, tenant-scoped discovery across Business Objects, module-owned records, and eventually AI-assisted search experiences.

It is **not implemented during the restarted foundation build**.

The correct foundation-stage work is:

```txt
1. Define clean Business Objects.
2. Define module manifests.
3. Define stable events.
4. Define field/search metadata hooks.
5. Ensure tenant-safe service access.
6. Let early modules implement simple local filtering/search.
7. Promote to Platform Search only after repeated search needs are proven.
```

The Search Service must not be built merely because search sounds useful.

It should be built only when OneDayOS has enough real module patterns to know what search actually means for Philippine SME operations.

---

# 2. Executive Decision

Search is deferred.

```txt
Do not implement a global Search Service in the restarted foundation build.
```

The foundation may support ordinary module-level filtering and database queries, but it must not implement:

```txt
Global search index
Cross-module search UI
Search ranking engine
Dedicated search database
Vector search
AI semantic search
Search background jobs
Search result permissions engine
Search analytics
```

Those are future Platform Search concerns.

The restarted build should instead preserve the contracts that make Search easy to add later:

```txt
Business Object events
Module manifest metadata
Field metadata placeholders
Tenant-scoped APIs
Verified PlatformContext
Permission-aware service patterns
Soft-delete rules
Stable entity identifiers
```

---

# 3. Why Search Is Deferred

Search feels like a platform feature, but implementing it too early creates several risks.

## 3.1 We do not yet know the search shape

Different modules may need different search behavior.

Examples:

```txt
Inventory:
Search product code, name, category, warehouse stock.

CRM:
Search customer name, email, phone, lead notes.

Leave:
Search employee name, leave request number, date range, status.

Assets:
Search asset tag, assigned employee, location, serial number.

Visitor Management:
Search visitor name, host employee, visit date, company.
```

If we build a generic Search Service now, we are guessing.

Bad early abstraction risk:

```txt
We build global text search around name/title fields.
Later we discover operational users search mostly by codes, statuses, dates, relationships, and identifiers.
```

That would create technical debt disguised as platform maturity.

## 3.2 Module-local search is enough at first

Early modules can support simple local search using normal tenant-scoped queries.

Example:

```ts
InventoryService.listProducts(ctx, {
  search: 'cement',
  categoryId: 'cat_123',
})
```

This does not require a Search Service.

A basic list page search box is not the same as platform-wide search.

## 3.3 Search is security-sensitive

Search can easily become a data leak.

A global search result must respect:

```txt
Authentication
Tenant membership
Module enablement
Object permissions
Module permissions
Soft delete
Record visibility
Future branch/department scopes
Future ABAC conditions
```

If Search is implemented early and poorly, it can expose records that normal module screens correctly hide.

Search must never become a bypass around authorization.

## 3.4 Search can add operational cost

A proper Search Service may eventually require:

```txt
Indexes
Background jobs
Outbox processing
Search document tables
Reindexing scripts
Dedicated search engine
Ranking configuration
Monitoring
Failure recovery
```

Those are not free.

For the MVP foundation, OneDayOS should avoid infrastructure that does not directly help first client delivery.

## 3.5 Search should be event-derived later

A future Search Service should probably consume events like:

```txt
objects.product.created
objects.product.updated
objects.customer.created
inventory.stock_movement.created
crm.lead.updated
```

That means the important foundation work is event discipline, not search indexing.

---

# 4. What Search Service Is

The future Search Service is a reusable Platform Service that provides tenant-scoped search capabilities across OneDayOS.

It may eventually support:

```txt
Global command-menu search
Entity search
Cross-module search
Permission-aware search results
Searchable Business Objects
Searchable module records
Saved search configuration
Search indexing
Reindexing
AI-assisted search
```

Example future user experience:

```txt
User presses Cmd/Ctrl+K.
Searches "Juan dela Cruz".
Results show:
- Employee: Juan dela Cruz
- Leave Request: Juan dela Cruz — Pending
- Asset: Laptop assigned to Juan dela Cruz
- Incident: Report involving Juan dela Cruz
```

But only if the user has permission to see those results.

---

# 5. What Search Service Is Not

The Search Service is not:

```txt
The Event Bus
The Reporting Service
The AI Layer
The Dynamic Table View Engine
The Audit Log Service
The Activity Feed Service
The Notification Service
A generic SQL query builder
A BI tool
A data export system
A replacement for module list filters
A way to bypass module APIs
```

## 5.1 Search is not Reporting

Search answers:

```txt
"Find this record."
```

Reporting answers:

```txt
"Summarize or aggregate these records."
```

Examples:

```txt
Search: Find Product ABC-123.
Report: Show total stock value by warehouse.

Search: Find customer Maria Santos.
Report: Show monthly sales pipeline conversion.
```

## 5.2 Search is not AI

Search may eventually support AI, but AI is not required for Search.

The first future Search Service should be deterministic, permission-aware, and understandable before adding semantic or AI behavior.

## 5.3 Search is not module filtering

A table search box inside Inventory is module filtering.

Example:

```txt
Search products by code/name inside Inventory Products page.
```

That does not require Platform Search.

Platform Search begins when OneDayOS needs shared search behavior across independent parts of the product.

---

# 6. Three Independent Use Cases Trigger

Search Service should be considered only when at least three independent search use cases exist.

Examples that may count:

```txt
Use Case 1:
Users need to search Products globally from outside Inventory.

Use Case 2:
Users need to search Customers globally from CRM, Reservations, and Billing contexts.

Use Case 3:
Users need to search Employees across Leave, Assets, Projects, and Approvals.
```

Or:

```txt
Use Case 1:
Global command menu search for Business Objects.

Use Case 2:
Permission-aware cross-module search results.

Use Case 3:
AI support agent needs searchable tenant-scoped entity summaries.
```

Three use cases trigger review.

They do not automatically trigger implementation.

The review must ask:

```txt
Are these truly the same search capability?
Can simple module-level search solve the problem?
Can shared UI components solve the problem without a Platform Service?
Can PostgreSQL indexes solve the problem without a service?
Is cross-module search required?
Is permission-aware search required?
Is search indexing required?
```

---

# 7. Evidence Log Required

Before implementing the Search Service, create an evidence log.

Template:

```md
# Search Service Evidence Log

## Candidate Capability
Platform Search Service

## Use Case 1
Module / Client / Workflow:
User need:
Current workaround:
Why module-local search is insufficient:

## Use Case 2
Module / Client / Workflow:
User need:
Current workaround:
Why module-local search is insufficient:

## Use Case 3
Module / Client / Workflow:
User need:
Current workaround:
Why module-local search is insufficient:

## Common Pattern
What is repeated?

## Risks
Security:
Performance:
Operational cost:
Data privacy:

## Recommendation
Keep module-local / Build shared UI only / Build Platform Search Service
```

No Search Service implementation should begin without this evidence.

---

# 8. Allowed Before Search Service Exists

The following are allowed before a Platform Search Service exists.

## 8.1 Module-local filtering

Modules may implement basic search/filtering inside their own service.

Example:

```ts
InventoryService.listProducts(ctx, {
  search: 'cement',
  status: 'active',
})
```

Required rules:

```txt
Use verified PlatformContext.
Use sdk.getDb(ctx).
Scope by ctx.org.id.
Reject client-supplied orgId.
Exclude soft-deleted records.
Enforce permissions.
Validate query params with Zod.
```

## 8.2 Business Object local search

Business Object services may provide basic lookup/search methods.

Example:

```ts
ProductService.search(ctx, {
  q: 'cement',
  limit: 20,
})
```

This is not the Platform Search Service.

It is a normal Business Object service method.

## 8.3 Relation picker search

Forms may need searchable dropdowns.

Example:

```txt
Select Employee
Select Product
Select Customer
Select Warehouse
```

This can be handled through Business Object APIs.

Example:

```txt
GET /api/orgs/[orgSlug]/objects/products?search=cement&limit=20
```

This does not require global Search Service.

## 8.4 Shared UI search components

The Design System may include reusable search inputs, command-menu UI shells, or table filters.

But reusable UI is not the Search Service.

---

# 9. Forbidden Before Search Service Exists

Claude must not implement the following during the restarted foundation build:

```txt
Search tables
Search indexes
Search document model
Search worker
Search queue
Global search API
Global search UI
Command palette search backed by data
Search SDK methods
Search background reindexing
Search analytics
AI semantic search
Vector embeddings
Dedicated search engine
External search vendor integration
```

Reserved SDK namespace:

```ts
sdk.search
```

This namespace may be reserved in type declarations, but it must not expose working methods until the Search Service is approved.

Forbidden premature code:

```ts
sdk.search.global(ctx, query)
sdk.search.index(ctx, document)
sdk.search.reindex(ctx)
```

---

# 10. Future Search Architecture

When approved, the Search Service should be designed around these components.

```txt
Searchable Source
  ↓
Search Document Builder
  ↓
Search Index / Search Table
  ↓
Permission-Aware Query Resolver
  ↓
Search API
  ↓
Search UI / Command Menu / AI Layer
```

## 10.1 Searchable Source

A Searchable Source is an entity or record type that can appear in search results.

Examples:

```txt
objects.employee
objects.product
objects.customer
objects.supplier
objects.warehouse
inventory.stock_adjustment
crm.lead
assets.asset
incidents.incident_report
```

Searchable sources should be declared by platform code, Business Object metadata, or module manifest metadata.

## 10.2 Search Document

A Search Document is a normalized search representation of a record.

Future shape:

```ts
export type SearchDocument = {
  id: string
  orgId: string
  source: string
  entity: string
  entityId: string
  title: string
  subtitle?: string
  keywords: string[]
  href: string
  permission: PermissionRequirement
  module?: string
  updatedAt: Date
  deletedAt?: Date | null
}
```

Important:

```txt
Search documents are derived from source records.
They are not source-of-truth business data.
```

## 10.3 Search Result

Future API result shape:

```ts
export type SearchResult = {
  id: string
  source: string
  entity: string
  entityId: string
  title: string
  subtitle?: string
  href: string
  matchedFields?: string[]
}
```

Search results must not expose fields the user is not allowed to view.

---

# 11. Tenant Isolation Rules

Search must be tenant-scoped.

Every search operation must use verified `PlatformContext`.

Correct future pattern:

```ts
const results = await sdk.search.query(ctx, {
  q: 'cement',
  limit: 20,
})
```

Forbidden:

```ts
sdk.search.query(orgId, q)
sdk.search.query({ orgId: body.orgId, q })
searchDb.search({ filter: `orgId = ${body.orgId}` })
```

Search must never trust:

```txt
Client-supplied orgId
Client-supplied module list
Client-supplied permission filters
Client-supplied search scopes
Client-supplied record visibility
```

The server derives all access from:

```txt
Authenticated session
Platform User
Organization slug
User.orgId === Organization.id
Enabled modules
Roles and permissions
```

---

# 12. Permission Rules

Search results must be permission-aware.

A result is visible only if the user can access the underlying record type.

Examples:

```txt
Product result:
Requires objects.product.read.

Customer result:
Requires objects.customer.read.

Inventory stock adjustment result:
Requires inventory.stock_adjustment.read.

Employee result:
Requires objects.employee.read.
```

Search must not show a result just because the record exists.

## 12.1 Module enablement

If a result belongs to a module-owned entity, the module must be enabled for the organization.

Example:

```txt
CRM lead result
Requires CRM module enabled
+ crm.lead.read permission
```

If CRM is disabled, CRM results should not appear.

## 12.2 Business Object results

Business Object results are not owned by modules.

Example:

```txt
Product search result
Requires objects.product.read.
Does not require Inventory module enabled.
```

However, the UI destination must still make sense.

If Product screens are exposed through a Business Object page, route to that page.

If Product screens are initially surfaced through Inventory only, do not expose global Product search until the routing model is clear.

---

# 13. Soft Delete Rules

Search must exclude soft-deleted records by default.

A deleted source record must not appear in normal search results.

Future Search Service must handle deletes in one of these ways:

```txt
Option A:
Remove or mark the corresponding SearchDocument as deleted when source record is soft-deleted.

Option B:
Filter SearchDocument.deletedAt = null during every query.
```

For MVP future implementation, prefer both:

```txt
Mark search document deleted.
Also filter deletedAt = null.
```

Restore behavior:

```txt
When source record is restored, its search document may be restored/reindexed.
```

Required future events:

```txt
objects.product.deleted
objects.product.restored
objects.customer.deleted
objects.customer.restored
```

Search Service should consume those events later.

---

# 14. Event Integration

Search indexing should be event-derived where possible.

Future Search Service may listen to:

```txt
objects.employee.created
objects.employee.updated
objects.employee.deleted
objects.employee.restored
objects.product.created
objects.product.updated
objects.product.deleted
objects.product.restored
objects.customer.created
objects.customer.updated
objects.customer.deleted
objects.customer.restored
inventory.stock_adjustment.created
crm.lead.updated
```

But event listeners are deferred until Search Service implementation is approved.

During foundation build:

```txt
Emit events.
Do not index events.
```

## 14.1 Search listeners must not break mutations

If a future search indexing listener fails, the original business mutation should generally still succeed.

Example:

```txt
Product update succeeds.
Search indexing fails.
User should not lose product update.
System should log/index repair later.
```

If Search becomes critical for a specific operation, that requirement must be documented separately.

---

# 15. Module Manifest Search Metadata

The Module Manifest may reserve search metadata, but must not activate a Search Service prematurely.

Future manifest extension:

```ts
search?: {
  sources: Array<{
    entity: string
    titleField: string
    subtitleFields?: string[]
    keywordFields?: string[]
    hrefPattern: string
    permission: PermissionRequirement
  }>
}
```

This field should remain optional and ignored until Search Service exists.

For foundation build, manifests may document future searchable entities in comments or docs, but must not require search runtime behavior.

---

# 16. Business Object Search Metadata

Business Objects are natural search candidates.

Potential future metadata:

```ts
export const productSearchMetadata = {
  source: 'objects.product',
  titleField: 'name',
  subtitleFields: ['code', 'unit'],
  keywordFields: ['code', 'name', 'description'],
  permission: {
    module: 'objects',
    resource: 'product',
    action: 'read',
  },
}
```

But this should not be implemented as runtime search metadata until Search Service is approved.

---

# 17. Search API Contract — Future

When implemented, Search API should likely live under:

```txt
GET /api/orgs/[orgSlug]/search?q=cement
```

It must use the Kernel API contract:

```json
{
  "data": {
    "results": []
  },
  "error": null,
  "meta": {
    "query": "cement",
    "limit": 20
  }
}
```

Forbidden API shapes:

```txt
GET /api/search?orgId=org_123&q=cement
GET /api/global-search?q=cement
POST /api/search with orgId in body
```

All Search APIs must:

```txt
Use API-safe auth.
Resolve PlatformContext from session + orgSlug.
Reject client-supplied orgId.
Validate query params with Zod.
Respect tenant isolation.
Respect module enablement.
Respect permissions.
Return JSON only.
Never redirect.
```

---

# 18. Search SDK Contract — Future

Reserved future SDK surface:

```ts
sdk.search.query(ctx, input)
sdk.search.reindexEntity(ctx, input)
sdk.search.removeEntity(ctx, input)
```

But for now:

```txt
sdk.search is reserved.
Do not implement working search methods.
Do not let modules call sdk.search.
```

When implemented, `sdk.search` must be server-only.

It should live under:

```txt
@/sdk/server
```

Browser-safe search fetch helpers may later live under:

```txt
@/sdk/client
```

---

# 19. Search UI — Future

Possible future UI surfaces:

```txt
Command menu search
Top-bar search
Entity picker search
Module-local search boxes
Global search page
AI assistant search grounding
```

Do not implement these as part of the foundation build.

## 19.1 Command menu caution

A command menu UI can exist for navigation commands before global data search exists.

Allowed early command menu:

```txt
Navigate to Dashboard
Navigate to Inventory
Navigate to Settings
Create Product
Create Customer
```

Forbidden early command menu:

```txt
Search all Products, Customers, Employees, Leads, and Assets across the tenant
```

The UI shell can be built before data search, but it must not pretend Search Service exists.

---

# 20. Search Ranking — Future

Do not design ranking too early.

Potential future ranking factors:

```txt
Exact code match
Exact name match
Prefix match
Recently updated
Frequently accessed
Entity type priority
Module priority
User role
```

These should be based on actual user behavior after modules exist.

Early ranking guesses can make search feel wrong.

---

# 21. Search Storage Options — Future

When Search Service is approved, storage options may include:

```txt
PostgreSQL search document table
PostgreSQL full-text search
Dedicated search engine
Vector index for semantic search
Hybrid approach
```

Do not decide now.

The first future version should prefer the simplest reliable approach that satisfies proven use cases.

Likely progression:

```txt
Stage 1:
Module-local database search.

Stage 2:
Business Object search APIs.

Stage 3:
Platform Search table / index for global search.

Stage 4:
Dedicated search engine only if PostgreSQL is insufficient.

Stage 5:
Semantic/vector search only when AI use cases prove it.
```

---

# 22. Reindexing — Future

A future Search Service must include reindexing capability.

Reindexing is needed when:

```txt
Search schema changes
Entity title/subtitle logic changes
Permissions change
Records were missed by event listeners
Search documents become stale
Soft-deleted records were incorrectly indexed
```

Potential future command:

```bash
npm run search:reindex -- --org demo-corp
npm run search:reindex -- --source objects.product
npm run search:reindex -- --all
```

But this must not be built now.

---

# 23. AI Search Integration — Future

AI may eventually use Search Service to ground answers.

Example:

```txt
User asks: "Which customers have pending reservations?"
AI retrieves searchable Customer and Reservation context.
```

But AI must not query arbitrary data.

AI search must respect:

```txt
PlatformContext
Tenant isolation
Module enablement
Permissions
Soft delete
Data minimization
```

Do not implement AI search until both Search Service and AI Layer contracts exist.

---

# 24. Security Risks

Search creates several security risks.

## 24.1 Cross-tenant leakage

Bad:

```txt
Search index contains records from all orgs and query forgets org filter.
```

Required:

```txt
Every search document is org-scoped.
Every query is ctx.org.id scoped.
```

## 24.2 Permission leakage

Bad:

```txt
User cannot open customer details but customer appears in global search result.
```

Required:

```txt
Search result visibility checks underlying permissions.
```

## 24.3 Soft-delete leakage

Bad:

```txt
Deleted employee still appears in search.
```

Required:

```txt
Soft-deleted records are excluded from normal search.
```

## 24.4 PII leakage through snippets

Bad:

```txt
Search result subtitle exposes private phone, email, salary, government ID, or notes.
```

Required:

```txt
Search result snippets must be intentionally selected.
No full record payloads.
No sensitive fields by default.
```

## 24.5 AI leakage

Bad:

```txt
AI uses search index as a shortcut and exposes unauthorized records.
```

Required:

```txt
AI only uses permission-filtered search results.
```

---

# 25. Privacy Rules

Search documents should contain only what is needed for discovery.

Avoid indexing:

```txt
Passwords
Secrets
Tokens
Salary
Government IDs
Bank details
Private notes
Full message bodies
Sensitive attachments
Long unstructured PII fields
```

Search index should prefer:

```txt
Names
Codes
Public business identifiers
Short safe subtitles
Entity type
Safe status labels
Route destination
```

Search documents are another copy of data.

That copy must be treated as sensitive.

---

# 26. Performance Rules — Future

Search must be fast, but performance work should follow real usage.

Potential future targets:

```txt
Basic search response: <300ms for normal tenant data.
Command-menu perceived response: <100ms after debounce/cached UI.
Large tenant search: paginated or limited results.
```

Future implementation should include:

```txt
Query limits
Debounce
Indexes
Pagination or top-N results
Rate limiting if abused
```

Do not optimize for enterprise-scale global search before OneDayOS has actual tenants and modules.

---

# 27. Testing Requirements — Future

When Search Service is implemented, tests must include:

```txt
Search returns tenant-scoped results only.
Org A cannot search Org B records.
Unauthorized user cannot see forbidden results.
Disabled module results do not appear.
Soft-deleted records do not appear.
Restored records can reappear after reindex.
Client-supplied orgId is rejected.
Search API returns JSON only.
Search API returns 401 for unauthenticated user.
Search API returns safe 404 for wrong org.
Search API validates query string.
Search result payload does not expose sensitive fields.
Search listener failure does not break source mutation.
Reindex job is tenant-aware.
```

All tenant-sensitive tests must use at least two organizations.

Admin-only tests are insufficient.

---

# 28. Generator Rules

The Module Generator must not generate Search Service integration by default.

Allowed generated code:

```txt
Module-local list filters
Validated query params
Service methods that support simple search inside the module
Manifest comments about future searchable sources
```

Forbidden generated code:

```txt
sdk.search calls
Search index writes
Search tables
Search listener registration
Global search metadata that runtime consumes
Search background jobs
External search clients
Vector embeddings
```

When Search Service exists later, the generator may be amended.

---

# 29. Migration Path

Recommended future migration path:

## Stage 0 — Foundation

```txt
No Search Service.
Module-local filters only.
Business Object APIs may support basic lookup.
Events emitted consistently.
```

## Stage 1 — Shared search UI patterns

```txt
Reusable search input components.
Reusable relation picker components.
No global search index.
```

## Stage 2 — Business Object search APIs

```txt
Products, Customers, Employees, Suppliers, Warehouses searchable through object APIs.
Still no global Search Service.
```

## Stage 3 — Platform Search Service proposal

```txt
Evidence log complete.
ADR approved.
Search document schema designed.
Permission model designed.
Reindex strategy designed.
```

## Stage 4 — First Search Service implementation

```txt
Tenant-scoped search document table.
Event-derived indexing.
Permission-aware query resolver.
Basic global search API.
No AI/vector search yet.
```

## Stage 5 — Advanced search

```txt
Ranking improvements.
Saved searches.
AI grounding.
Dedicated search engine if needed.
```

---

# 30. Client Delivery Implications

Do not implement Search Service at the start of every client app.

Reason:

```txt
OneDayOS does not build separate client apps.
OneDayOS has one shared platform.
```

A client avails modules on the platform.

If Search Service is not implemented in the base platform, a new client does not receive it.

If Search Service is implemented later, it becomes part of the shared base platform after deployment.

Access is then controlled by:

```txt
Enabled modules
Plan/feature flags
Settings
Roles
Permissions
UI surfaces
```

This preserves the model:

```txt
One codebase.
One platform.
Many organizations.
Per-org configuration.
No per-client forks.
```

---

# 31. Why Not Implement Search Per Client?

Implementing Search separately for each client would create the exact problem OneDayOS is trying to avoid.

Bad model:

```txt
Client A has custom search.
Client B has different custom search.
Client C has no search.
Client D has copied but modified search.
```

This creates:

```txt
Duplicate code
Inconsistent UX
More bugs
Harder upgrades
Security drift
Higher AppCare burden
Lower margins
More Claude confusion
```

Correct model:

```txt
Search is built once when justified.
It is added to the shared platform.
Clients receive it through platform update and configuration.
```

---

# 32. Anti-Patterns

Do not do this:

```ts
// Bad: client-supplied tenant
await search({ orgId: body.orgId, q: body.q })
```

Do not do this:

```ts
// Bad: global unscoped search
await prisma.product.findMany({
  where: { name: { contains: q } },
})
```

Do not do this:

```ts
// Bad: search result without permission check
return allResults
```

Do not do this:

```ts
// Bad: full record in search document
payload: fullCustomerRecord
```

Do not do this:

```txt
Build global search because "every SaaS has search".
```

Do not do this:

```txt
Add vector search before deterministic permission-aware search exists.
```

Do not do this:

```txt
Let AI query the database directly for search.
```

---

# 33. Claude Implementation Rules

Claude must obey these rules:

```txt
Do not implement Search Service from this document alone.
Do not create search tables.
Do not create search APIs.
Do not create sdk.search methods.
Do not create global search UI.
Do not create command-menu data search.
Do not add a search engine dependency.
Do not add vector search.
Do not add embeddings.
Do not add background search indexing.
Do not add FastAPI for search.
Do not add Python search workers.
Do not bypass module services for search.
```

Claude may implement:

```txt
Module-local filtering when a module spec requires it.
Business Object lookup APIs when a Business Object spec requires them.
Reusable UI search input components when Design System specs require them.
```

But those are not the Platform Search Service.

---

# 34. Acceptance Criteria

This document is accepted when:

```txt
[ ] Founder understands Search is deferred.
[ ] Founder understands module-local filtering is allowed.
[ ] Founder understands Platform Search is not needed for the first module.
[ ] Founder understands Search can be added later to the shared platform.
[ ] Founder understands Search must be tenant-scoped and permission-aware.
[ ] Founder understands Search must not become per-client custom code.
[ ] Claude is explicitly blocked from implementing Search Service prematurely.
[ ] Future Search implementation requires evidence log and ADR.
```

---

# 35. Summary

The Search Service is an important future Platform Service, but it should not be implemented during the restarted foundation build.

At the start, OneDayOS needs:

```txt
Secure Kernel
Verified PlatformContext
SDK boundaries
Business Objects
Module System
Events
Generator safety
Simple module-level filtering
```

It does not yet need:

```txt
Global search
Search index
Search workers
Vector search
AI semantic search
Dedicated search engine
```

Search should be added later when repeated real use cases prove that module-local search and shared UI patterns are not enough.

When added, it must be built once into the shared OneDayOS platform, not separately per client.


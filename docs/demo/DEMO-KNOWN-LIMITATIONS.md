# Demo Known Limitations

These limitations must be stated for controlled guided demos.

## Demo Mode

- The sandbox is for guided demos only.
- Public registration is disabled.
- Demo data is reset to a known baseline before sessions.
- Demo mode uses noindex/robots controls, but this is not a production privacy guarantee.
- There is no public self-service demo reset automation.

## Product Scope

- Inventory is the only implemented business module.
- Leave, CRM, Purchasing, Expenses, Assets, Visitor Management, and Incident Reporting are not implemented.
- Platform Services are not implemented.
- Search, Reporting, Notifications, Attachments, Comments, Activity Feed, Approval Workflow, background jobs, runtime AI, Dynamic Forms, and Dynamic CRUD are not implemented.
- Inventory does not own Product, ProductCategory, Warehouse, Supplier, Customer, or Employee.

## Operations

- The sandbox is not a production deployment.
- Production backup, monitoring, incident response, billing, rate limiting, and abuse controls are not claimed complete.
- The known upstream Next/PostCSS npm audit advisory remains tracked.
- Formal accessibility conformance is not claimed.
- Independent representative-user validation is not complete.
- Independent Org Admin validation is not complete.

## Demo Data

- Demo data is fake and non-sensitive.
- Demo credentials are private `.env.local` values and must not be committed or shared publicly.
- Stock values are for walkthrough demonstration only.
- Inventory V2 events are best effort; there is no Durable Outbox or guaranteed external delivery.

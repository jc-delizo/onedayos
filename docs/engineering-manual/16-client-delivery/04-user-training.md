# OneDayOS Engineering Manual — 16 Client Delivery / 04 User Training

**Document ID:** `16-client-delivery/04-user-training.md`  
**Version:** `1.0`  
**Status:** `Draft for Founder Review`  
**Owner:** OneDayOS Founder / Architect  
**Implementation Status:** `Required Before First Paid Client Delivery`  
**Last Updated:** July 2026  
**Supersedes:** None  
**Depends On:**

- `01-foundation/00-vision.md`
- `02-architecture/00-system-architecture.md`
- `04-kernel/01-authentication.md`
- `04-kernel/02-organizations-tenancy.md`
- `04-kernel/03-users-roles-permissions.md`
- `04-kernel/04-authorization-enforcement.md`
- `13-security/00-security-model.md`
- `15-deployment-operations/06-appcare-operations.md`
- `16-client-delivery/00-one-day-delivery-playbook.md`
- `16-client-delivery/01-client-discovery.md`
- `16-client-delivery/02-scope-control.md`
- `16-client-delivery/03-client-configuration.md`

---

## 1. Purpose

This document defines how OneDayOS trains client users after a one-day delivery.

User training is not an optional afterthought. It is part of the productized delivery model.

A client is not successfully onboarded just because the system is deployed.

A client is successfully onboarded when:

```txt
The right users can log in.
They understand what OneDayOS is.
They know which modules are enabled.
They understand their roles and permissions.
They can complete their daily workflows.
They know what AppCare covers.
They know how to request support.
They understand what is configuration, what is enhancement, and what is out of scope.
```

This document ensures training remains standardized, repeatable, commercially viable, and aligned with the platform model.

---

## 2. Core Principle

The core training rule is:

```txt
Train clients to use OneDayOS as a platform,
not as a custom app built only for them.
```

The client should understand that they are receiving:

```txt
OneDayOS
+ enabled modules
+ client configuration
+ AppCare
```

They are not receiving:

```txt
A separate custom codebase
A separate database
A separate Supabase project
A separate Vercel project
A private software team
Unlimited custom development
```

This distinction matters because incorrect expectations create support problems later.

---

## 3. Training Philosophy

User training should be:

```txt
short
practical
role-based
workflow-focused
repeatable
recordable when possible
support-aware
scope-aware
```

User training should not be:

```txt
technical architecture explanation
full ERP theory
custom consulting workshop
unlimited Q&A session
sales renegotiation
scope expansion meeting
```

The training goal is not to explain every future capability of OneDayOS.

The goal is to make the client productive with the modules they purchased.

---

## 4. Training Is Part of One-Day Delivery

For a standard one-day delivery, training should be included as a defined activity.

A typical delivery day should end with:

```txt
Admin training
Staff workflow training
Handover checklist
AppCare explanation
Support instructions
```

Training should not happen before configuration is stable.

Do not train users on half-configured screens, missing roles, incomplete data, or unstable module behavior.

---

## 5. Training Prerequisites

Before training starts, these must be true:

```txt
[ ] Client Organization exists
[ ] Primary admin user exists
[ ] Initial users are created or ready for creation
[ ] Roles are configured
[ ] Permissions are configured
[ ] Enabled modules are confirmed
[ ] Basic business objects are loaded if required
[ ] Module settings are configured
[ ] Client branding is configured if applicable
[ ] Smoke tests pass
[ ] Founder or implementer has tested login
[ ] Founder or implementer has tested the main workflow
[ ] Known limitations are documented
[ ] Scope Lock is available for reference
```

If these are not true, the training session becomes debugging.

Debugging during training makes the product feel unreliable.

---

## 6. Training Audiences

OneDayOS training should be role-based.

The minimum audiences are:

```txt
Client Owner / Decision Maker
Client Admin
Module Power User
Normal Staff User
```

Not every client needs separate sessions for every audience, but the trainer must know who is being trained.

---

## 7. Client Owner / Decision Maker Training

The Client Owner or Decision Maker needs business-level understanding.

They do not need deep operational details.

### They must understand

```txt
What OneDayOS is
Which modules they purchased
What AppCare includes
What AppCare does not include
How users are billed/limited if applicable
How module enablement works
How support requests work
How future enhancements are handled
How data is protected at a high level
```

### They should not be trained on

```txt
Prisma
Supabase dashboard
Vercel
database tables
SDK internals
PlatformContext
RLS
module manifests
CI/CD
```

### Business explanation script

Use language like:

```txt
OneDayOS is your company’s internal operating system.
For this delivery, we enabled the modules included in your scope.
Your users will only see the modules and actions allowed by their roles.
Future features can be added by enabling modules, configuring settings, or approving new scoped work.
AppCare covers hosting, monitoring, maintenance, backups, bug fixes, and support within the agreed boundaries.
```

---

## 8. Client Admin Training

Client Admins are the most important training audience.

If the Client Admin understands the system, support load decreases.

### Client Admins must learn

```txt
How to log in
How to navigate the organization dashboard
How modules appear in the sidebar
How users and roles work
How permissions affect visibility and actions
How to add or deactivate users if admin UI exists
How to request user changes if admin UI is not available yet
How to understand enabled modules
How to understand common error messages
How to submit support requests
How to identify whether a request is a bug, configuration change, or enhancement
```

### Client Admins must understand role boundaries

Admins should understand:

```txt
A user may exist without seeing every module.
A module may be enabled without every user accessing it.
A hidden button is not a bug if the user lacks permission.
A permission-denied message is expected for restricted actions.
```

### Client Admins must understand user vs employee

Use this explanation:

```txt
A User is someone who can log in to OneDayOS.
An Employee is a person record inside your company.
Some Employees may not have login accounts.
Some Users may be linked to Employee records.
They are connected but not the same thing.
```

This prevents confusion in HR, Leave, Assets, and future approval workflows.

---

## 9. Staff User Training

Normal Staff Users need workflow training, not admin training.

They should learn:

```txt
How to log in
How to navigate the sidebar
What modules they have access to
How to complete their assigned workflow
How to search/filter within their module if available
How to create records if allowed
How to edit records if allowed
How to understand validation errors
How to understand permission-denied states
How to report issues
```

They should not be trained on:

```txt
all admin settings
all modules
roles and permission configuration
billing
AppCare commercial terms
technical architecture
```

Training staff on too much creates confusion.

---

## 10. Module Power User Training

A Module Power User is the person responsible for daily operation of a module.

Examples:

```txt
Inventory custodian
HR officer
Purchasing officer
CRM manager
Admin assistant for visitor logs
Operations supervisor for incidents
```

Power User training should be workflow-focused.

For each enabled module, the trainer should explain:

```txt
What the module is for
What the module is not for
What records the module owns
Which shared Business Objects it uses
What the main workflow is
What statuses mean
What actions are allowed
What actions require admin/help
What data should be entered
What data should not be entered
How to handle common mistakes
How to request corrections
```

---

## 11. Explain OneDayOS as a Shared Platform

Clients should understand enough of the platform model to set expectations.

Use a simple explanation:

```txt
Your company has its own Organization inside OneDayOS.
Your data is separated from other companies.
Your enabled modules and users are configured for your company.
When OneDayOS improves, your company benefits from the shared platform update.
```

Do not over-explain the database.

Do not mention every internal security mechanism unless asked.

If asked about isolation, answer simply:

```txt
Each client organization has its own users, records, roles, and module settings.
The platform checks organization membership and permissions before allowing access to data.
```

---

## 12. Explain What Modules Are

Clients should not think of modules as separate apps.

Use this language:

```txt
A module is a business capability inside OneDayOS.
For example, Inventory, Leave, CRM, Expenses, or Visitor Management.
Your organization can have one or more modules enabled.
They share the same login, users, roles, and business objects where appropriate.
```

Example:

```txt
If your Inventory and Purchasing modules both use Products,
that Product record should exist once in OneDayOS.
It should not be duplicated in every module.
```

This prepares the client for future growth.

---

## 13. Explain Shared Business Objects

Clients do not need the term “Business Object” unless useful.

But they do need the concept.

Use plain language:

```txt
Some records are shared across modules.
For example, Employees, Products, Customers, Suppliers, and Warehouses can be used by different modules.
That means you do not need to maintain separate copies in every module.
```

Examples:

```txt
Product can be used by Inventory and Purchasing.
Employee can be used by Leave, Assets, and Projects.
Customer can be used by CRM, Reservations, Billing, and Projects.
Supplier can be used by Purchasing, Inventory, Expenses, and Assets.
Warehouse can be used by Inventory, Purchasing, Transfers, and Assets.
```

Do not use internal terms like:

```txt
extension table
PlatformContext
module namespace
objects.* permission namespace
```

unless training an internal implementer.

---

## 14. Explain Roles and Permissions

Training must set expectations around permissions.

Use this explanation:

```txt
Your role controls what you can see and do.
Some users can only view records.
Some users can create records.
Some users can edit or delete records.
Some users can access admin settings.
```

Important reminders:

```txt
Not seeing a menu item may be normal.
Not seeing a button may be normal.
Getting a permission-denied message may be normal.
Ask your admin or AppCare support if access needs to be changed.
```

Never train users to expect that everyone can do everything.

---

## 15. Explain AppCare Correctly

Every training session should include a short AppCare explanation.

Users should understand that AppCare includes:

```txt
hosting
monitoring
maintenance
security updates
backups
bug fixes
AI-assisted support where applicable
basic support
```

Users should also understand that AppCare does not automatically include:

```txt
new modules
new workflows
custom reports
large data cleanup
manual encoding work
complex integrations
runtime AI features
file-upload systems
client-specific forks
unlimited changes
```

Use simple language:

```txt
If something is broken compared with the approved scope, that is a bug.
If you want the system to do something new, that is an enhancement request.
Enhancements are reviewed and may require separate approval or quotation.
```

This prevents AppCare from becoming unlimited labor.

---

## 16. Explain Support Channels

The client must know how to get help.

At minimum, training must explain:

```txt
where to send support requests
what information to include
what counts as urgent
who inside the client organization should coordinate support
what screenshots/details are useful
what AppCare covers
what requires a change request
```

Recommended support request format:

```txt
Company:
User affected:
Module:
Page/screen:
What were you trying to do?
What happened?
Screenshot or error message:
Urgency:
```

This should be included in the handover document.

---

## 17. Training Format

For MVP, training should be simple.

Recommended format:

```txt
30–45 minutes for standard one-module delivery
45–75 minutes for two-module delivery
Separate admin mini-session if needed
Recording optional but recommended
```

Avoid long training sessions unless separately scoped.

If the client requires multiple department trainings, treat that as additional service work unless included in the package.

---

## 18. Standard Training Agenda

Use this agenda for a normal delivery:

```txt
1. What OneDayOS is
2. What was delivered today
3. How to log in
4. Dashboard and navigation
5. Enabled modules
6. Main workflow walkthrough
7. Roles and permissions
8. Common errors and what they mean
9. AppCare coverage
10. Support process
11. Known limitations
12. Next steps
```

For a very small client, this can be compressed.

For a larger client, split into admin + staff sessions.

---

## 19. Standard Admin Training Checklist

```txt
[ ] Admin can log in
[ ] Admin understands their organization URL
[ ] Admin understands sidebar modules
[ ] Admin understands roles and permissions
[ ] Admin understands user vs employee
[ ] Admin understands module enablement
[ ] Admin understands AppCare scope
[ ] Admin knows how to submit support requests
[ ] Admin knows how to identify bugs vs enhancements
[ ] Admin knows known limitations
[ ] Admin has handover materials
```

---

## 20. Standard Staff Training Checklist

```txt
[ ] Staff user can log in
[ ] Staff user understands dashboard/navigation
[ ] Staff user knows which module to use
[ ] Staff user can complete primary workflow
[ ] Staff user understands required fields
[ ] Staff user understands validation errors
[ ] Staff user understands permission-denied behavior
[ ] Staff user knows how to report issues internally
[ ] Staff user knows not to share passwords
```

---

## 21. Module Training Template

Every official module should eventually have a training script.

Template:

```md
# [Module Name] Training Script

## Purpose
What this module is for.

## Not For
What this module should not be used for.

## Main Users
Who uses this module.

## Main Records
What records exist in this module.

## Shared Records Used
Employees / Products / Customers / Suppliers / Warehouses.

## Daily Workflow
Step-by-step workflow.

## Admin Workflow
Admin-only setup or review tasks.

## Common Mistakes
What users often do wrong.

## Permissions
Who can view, create, update, delete, approve, export, or configure.

## Support Notes
What to report to AppCare.
```

---

## 22. Example: Inventory Training

If Inventory is the enabled module, a simple training might cover:

```txt
1. What Inventory is for
2. Products vs stock levels
3. Warehouses
4. Stock movements
5. Adjustments
6. Low-stock indicators if available
7. Who can adjust stock
8. Why Product records are shared
9. What not to edit casually
10. How to report incorrect stock
```

Important explanation:

```txt
Product is the item identity.
Stock level is the quantity of that Product in a Warehouse.
An adjustment changes stock and should be done only by authorized users.
```

Do not teach Inventory as if it owns Product.

---

## 23. Example: Leave Training

If Leave is enabled later, training might cover:

```txt
1. Employee record basics
2. Leave request submission
3. Leave types
4. Leave balances if implemented
5. Approval status
6. Who can approve
7. What happens after approval/rejection
8. How to correct mistakes
```

Important explanation:

```txt
Employee is a shared company record.
Leave uses Employee, but Leave does not own Employee.
```

If the Platform Approval Workflow Service is not implemented yet, do not imply a generic approval engine exists.

---

## 24. Example: CRM Training

If CRM is enabled later, training might cover:

```txt
1. Customer records
2. Leads/opportunities if implemented
3. Pipeline stages
4. Follow-up tasks if implemented
5. Notes if module-local
6. Customer history if available
7. What data belongs in Customer vs CRM-specific records
```

Important explanation:

```txt
Customer is shared.
CRM tracks relationship and sales behavior around Customer.
```

Do not duplicate Customer as CRMCustomer.

---

## 25. Password and Account Training

Users should receive basic security guidance.

Train users to:

```txt
use their own account
not share passwords
use a strong password
log out on shared devices
report suspicious access
request account deactivation when someone leaves
```

Do not train users to:

```txt
share admin accounts
reuse one login for a department
send passwords in group chat
ask OneDayOS for someone else's password
```

If password reset is available, explain it.

If not available yet, explain the support process.

---

## 26. Data Entry Training

Data quality affects support cost.

Users should understand:

```txt
required fields
valid formats
duplicate records
active vs deleted records
business status vs deletion
shared records
who is allowed to edit master data
```

Examples:

```txt
Do not create duplicate Products if the Product already exists.
Do not create a new Employee just because the employee cannot log in.
Ask the admin whether a missing menu item is a permission issue.
```

---

## 27. Error Message Training

Users should recognize common states.

Examples:

```txt
Required field error
Invalid format error
Permission denied
Record not found
Module not enabled
Session expired
Something went wrong
```

Teach users:

```txt
Validation errors usually mean the form needs correction.
Permission errors usually mean your role does not allow the action.
Record not found may mean the record was removed, you lack access, or the link is wrong.
Session expired means log in again.
```

Do not expose technical internals.

---

## 28. Known Limitations Must Be Disclosed

If something is not included, say so.

Examples:

```txt
This delivery does not include export yet.
This delivery does not include attachments yet.
This delivery does not include approval workflows yet.
This delivery does not include AI chat yet.
This delivery does not include custom reports yet.
This delivery does not include integrations yet.
```

Disclosing limitations prevents later frustration.

Do not pretend deferred Platform Services exist.

---

## 29. Training Materials

Each client should receive simple training materials.

Minimum materials:

```txt
Login URL
Admin user list
Enabled module list
Role summary
Main workflow summary
Support instructions
Known limitations
AppCare coverage summary
```

Optional materials:

```txt
recorded walkthrough
PDF quick-start guide
module-specific cheat sheet
FAQ
short Loom-style video
```

Do not produce overly customized manuals for every client unless separately paid.

Use templates.

---

## 30. Recording Policy

If training is recorded:

```txt
get client consent first
avoid showing sensitive passwords/secrets
avoid showing other clients' data
store recording securely
share only with authorized client users
```

Do not record infrastructure dashboards, production secrets, Supabase dashboard, Vercel dashboard, or internal admin tools unless necessary and safe.

---

## 31. Training for Requests Outside Scope

During training, clients may ask:

```txt
Can it also do this?
Can we add this field?
Can we integrate with this tool?
Can we upload files?
Can we export everything?
Can AI answer questions about our data?
Can we have a custom dashboard?
```

The trainer must not casually promise these.

Use the scope-control language:

```txt
That is not included in today's approved scope.
We can record it as an enhancement request and review whether it should be configuration, a module extension, a new module, or a future platform capability.
```

Training is not a second discovery call.

---

## 32. Training and Deferred Services

The trainer must not imply deferred services are already available.

Deferred examples:

```txt
Audit Log Service
Notification Service
Approval Workflow Service
Comments Service
Attachments Service
Activity Feed Service
Reporting Service
Search Service
Background Jobs
Dynamic Forms
Dynamic CRUD
Runtime AI
```

If a client asks about one of these, answer:

```txt
That is part of the long-term platform roadmap, but it is not included in this delivery unless specifically scoped.
If the need is important, we can review it as a future enhancement or module requirement.
```

---

## 33. Training and New Modules

If a client asks for a workflow outside current modules, do not reject automatically.

Explain:

```txt
OneDayOS can grow by adding modules.
If this is a repeatable business workflow, we can scope it as a new module.
If it is very specific to your company, we need to review whether it fits the standard package or requires custom/premium work.
```

Examples:

```txt
Fleet Management may become a new module.
Clinic patient charts may require special review because of sensitive data.
Manufacturing batch records may become a future module.
Rental reservations may become a Reservations module.
```

Do not hack unusual workflows into unrelated modules during training.

---

## 34. Internal Trainer Notes

The trainer must remember:

```txt
Training is part product onboarding, part expectation management.
```

The trainer should avoid saying:

```txt
We can add anything.
This is easy.
Claude can just build that.
This is included in AppCare.
We can customize everything for you.
This is your own app.
```

The trainer should say:

```txt
OneDayOS is modular.
We can review that as an enhancement.
We should keep the system standardized so updates remain reliable.
That may be a future module or platform capability.
Let us record that and classify it properly.
```

---

## 35. Training Acceptance Criteria

Training is complete only when:

```txt
[ ] Client Admin can log in
[ ] Client Admin can explain what modules are enabled
[ ] Client Admin understands role/permission basics
[ ] Client Admin knows support process
[ ] Staff users can complete primary workflow
[ ] Known limitations were disclosed
[ ] AppCare boundaries were explained
[ ] Support contact/process was shared
[ ] Handover materials were provided or scheduled
[ ] Unscoped requests were captured but not promised
```

If these are not complete, the delivery is not fully handed over.

---

## 36. Common Anti-Patterns

### Anti-pattern: Training as custom consulting

Bad:

```txt
The training session becomes a long discussion about every possible future feature.
```

Correct:

```txt
Answer briefly, record enhancement requests, and return to the approved workflow.
```

### Anti-pattern: Training all users as admins

Bad:

```txt
Every user learns settings, permissions, modules, and admin behavior.
```

Correct:

```txt
Train users only on what they need to do.
```

### Anti-pattern: Promising deferred services

Bad:

```txt
Yes, notifications/search/reports/AI will be included soon.
```

Correct:

```txt
That is part of the roadmap and will be reviewed when scoped or proven.
```

### Anti-pattern: Calling it a custom app

Bad:

```txt
This is your custom Inventory app.
```

Correct:

```txt
This is your OneDayOS organization with the Inventory module enabled.
```

### Anti-pattern: Explaining too much architecture

Bad:

```txt
Explaining Prisma, Supabase, PlatformContext, RLS, and module manifests to normal staff.
```

Correct:

```txt
Explain only what helps the user operate the system.
```

---

## 37. Claude Code Rules

Claude may help create:

```txt
training scripts
handover checklists
module quick-start guides
FAQ drafts
support templates
client-specific training notes from approved scope
```

Claude must not:

```txt
promise features
change scope
invent module behavior
add deferred Platform Services
create client-specific code forks
write training materials that contradict the Engineering Manual
claim AppCare includes unlimited custom work
expose technical secrets or internal infrastructure details
```

If Claude writes training materials, it must use the approved Client Discovery Brief, Scope Lock, module specifications, and known limitations.

---

## 38. Founder Training Script Template

Use this simple script:

```txt
Welcome to OneDayOS.

Today we will walk through the system configured for your company.
OneDayOS is a modular business operating system. For this delivery, your organization has the following modules enabled: [modules].

We will cover login, navigation, your main workflows, roles and permissions, common errors, and how to get support through AppCare.

Some items may be part of the future roadmap but are not included in today's approved scope. If you request additional workflows, we will record them and review whether they are configuration, enhancement, a new module, or a future platform capability.
```

---

## 39. Module Training Script Template

```txt
This module is used for [purpose].

The main users are [roles].

The main records are [records].

The daily workflow is:
1. [step]
2. [step]
3. [step]

Some records are shared across OneDayOS. For this module, shared records include [Business Objects].

Your role controls what you can see and do. If you do not see a button or menu item, that may be because your role does not have permission.

If something does not work as expected, report it through [support channel] with the module name, screen, what you tried to do, and a screenshot if possible.
```

---

## 40. Final Rule

The final rule for user training is:

```txt
Train for confidence.
Set boundaries early.
Keep the system standardized.
Do not turn training into custom development.
```

User training should make the client feel:

```txt
This is clear.
This is usable.
This is supported.
This can grow with us.
```

It should not make them feel:

```txt
This is unfinished.
This is a custom experiment.
Everything is negotiable.
Support will do anything we ask.
```

That is how OneDayOS remains a platform and not a collection of bespoke apps.

---

## 41. Approval Checklist

Before this document is frozen:

```txt
[ ] Founder agrees training is part of delivery, not optional
[ ] Founder agrees AppCare boundaries must be explained during training
[ ] Founder agrees client users should not receive technical architecture training
[ ] Founder agrees module training should be role-based and workflow-based
[ ] Founder agrees unscoped requests are captured, not promised
[ ] Founder agrees deferred services must not be implied as included
[ ] Founder agrees training materials should be template-driven
```

---

## 42. Recommended Next Document

After this document is approved, proceed to:

```txt
16-client-delivery/05-handover.md
```

The handover document should define exactly what the client receives after training: URLs, users, enabled modules, known limitations, support channel, AppCare coverage, and acceptance confirmation.

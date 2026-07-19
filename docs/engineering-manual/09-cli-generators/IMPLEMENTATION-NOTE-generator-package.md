# Generator Package Implementation Note

Date: 2026-07

The Generator Package adds the local module scaffold command:

```bash
npm run module:create -- <module-id>
npm run module:create -- <module-id> --dry-run
npm run module:create -- <module-id> --output <path>
```

The generator creates production-shaped module scaffolds only. It must not be used to create business modules without Founder approval of the relevant module package.

Generated output must be reviewed before it is committed. A generated scaffold is not a production-ready module by itself. It provides the safe folder structure, manifest, SDK-only service pattern, strict schemas, API route shape, UI shell, and security-oriented test baseline that a later approved module package must complete.

Safety checks:

```bash
npm run check:generated
npm run check:architecture
```

The generator does not automatically create Prisma models, Prisma migrations, Business Objects, module-owned database tables, Platform Services, or production business workflows. Those require separate approved packages and module specifications.

The generator must not create Business Objects, module-owned Prisma models, migrations, Platform Services, FastAPI/Python backends, client-specific forks, or legacy API routes. Modules are not implemented yet.

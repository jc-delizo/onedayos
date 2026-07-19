# Implementation Note: App Switcher and Organization App

Status: Implementation note
Date: 2026-07

## Decision Applied

Organization is a built-in admin app in the authenticated OneDayOS shell.

It appears in the Apps switcher only for Org Admin users. It is not a business module, is not controlled by `OrgModule`, and is not shown as a normal Inventory sidebar section.

## Navigation Rules

- Inventory sidebar shows Inventory workflows and Inventory-related shared Records only.
- Inventory sidebar must not include Organization admin links.
- Inventory sidebar must not include People or Customers in the MVP.
- People lives under the Organization app for now.
- Customers remain a shared Business Object, but are not shown in the Inventory demo sidebar.
- Organization sidebar shows People, Branches & Departments, and Settings.
- Inventory operational navigation is reached through the Inventory app, not the Organization sidebar.
- Content navbars should not duplicate sidebar navigation.

## Terminology

Use Org Admin or Organization Admin for client-side administration.

Do not call client administrators System Admins. System Admin refers to internal OneDayOS operators.

# Implementation Note: App Launcher, Sidebar, and Profile Menu

Status: Implementation note
Date: 2026-07

## Decision Applied

Login should land on `/{orgSlug}/apps`.

Records are shared data surfaces, not apps. The launcher shows enabled apps only:

- Inventory, when enabled and visible to the user.
- Organization, only for Org Admin users.

## Sidebar Rules

- Sidebar top shows the organization name.
- The old duplicated organization card is removed.
- The current app switcher is a popover, not a collapsible sidebar group.
- The current app switcher does not show a `CURRENT APP` label.
- Sidebar bottom shows only a profile button.
- Profile menu contains Profile, Theme, and Sign out.
- Inventory sidebar excludes People, Employees, and Customers in the MVP.
- Organization admin navigation is not shown inside Inventory.
- Active sidebar state should use calm selected styling, not a red/orange dot indicator.

## Scope Notes

Theme switching and rich profile editing are intentionally lightweight in this pass. They should not grow into account settings or platform services without Founder approval.

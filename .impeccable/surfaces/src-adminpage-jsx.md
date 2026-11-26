---
version: 1
slug: "src-adminpage-jsx"
primary_target: "src/AdminPage.jsx"
related_targets: []
---

# Product studio

## Surface

Web · Operate. The protected studio lets an administrator prepare a product for one shared storefront.

## Audience and task

The administrator creates or edits an e-book or course, prepares its listing and delivery, and decides whether it is ready to publish. Course lessons remain private delivery records; storefront previews must never reveal Google Drive URLs.

## Success and constraints

Make setup requirements visible before publication, support saving a draft, and preserve the existing admin-only access model and buyer entitlements. Add a product cover and description to the current data model. Course lessons need titles and secure Drive/Docs links; e-books need a PDF and page count. No Tailwind installation currently exists, so retain the app's established CSS system.

## Direction contract

THESIS: A clear three-step setup flow separates product details, delivery and pricing, and a final readiness review.

OWN-WORLD: Inherit the studio's existing purple and neutral palette, system sans body type, Georgia headings, rounded bordered surfaces, and visible focus rings. Progress uses three compact labeled steps; form fields and actions retain familiar web controls.

STORY: Choose a product type, enter its details, attach delivery, then review what is still required. Save drafts without implying publication; publish only when the delivery checklist passes.

FIRST VIEWPORT: A studio header and Products / New product breadcrumb lead to the product title and short explanation. A three-step tracker follows. Step one presents the title, author/instructor, category, description, and cover inputs in a bordered form; a clear Save draft action remains available.

FORM: Guided setup steps, the second of seven grounded structures; seed:7ff1f3e88d2e64ae.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved decisions

Whether to add author-owned workspaces and per-author access control remains unresolved. This redesign preserves the current administrator-only shared catalog.

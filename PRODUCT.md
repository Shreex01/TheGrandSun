# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Learners use the storefront to purchase and access e-books and courses. The current catalog operator is an administrator who prepares products for one shared storefront. The product owner wants the setup workflow to support creators' product details; whether authors should have independent accounts and product ownership remains undecided for this redesign.

## Product Purpose

Infinivium is a digital storefront for e-books and courses. It lets learners purchase products and access their digital materials after payment is verified.

## Positioning

E-books are delivered from private Supabase storage, while courses provide an ordered playlist of lessons with Google Drive recordings. Product access is tied to recorded purchases or enrollments.

## Operating Context

The protected `/studio` route is used to prepare and maintain the shared storefront catalog. Administrators can create and edit e-books and courses, upload e-book PDFs, add ordered course lessons, publish or unpublish listings, and preview delivery. Product setup should also include a cover and short description. Learners browse, purchase, and access products through the storefront and library.

## Capabilities and Constraints

- The current authorization model grants catalog management to users with the administrator role; it does not support author-owned workspaces or per-author product access.
- E-books require a PDF and page count. Courses contain ordered lessons with titles and secure Google Drive or Google Docs links. The requested authoring workflow also includes a product cover and description, which the current data model does not yet store.
- Publishing requires the delivery material to be configured. Unpublishing a product removes it from the storefront without revoking existing purchaser access.
- Payments are verified server-side before access is granted.
- The scope of author-specific ownership and access control is undecided and is not included in the requested studio redesign.

## Brand Commitments

The product is named Infinivium.

## Evidence on Hand

The repository includes sample catalog rows and presentation ratings/images. These are sample content, not verified customer, performance, or product claims.

## Product Principles

- Make product setup and launch requirements clear before publication.
- Preserve access already granted to learners when a listing is unpublished.
- Keep delivery materials private and accessible only to authorized learners and administrators.
- Make publishing state explicit and reversible.

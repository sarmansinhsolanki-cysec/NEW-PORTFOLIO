# Security Specification — Sarmansinh Solanki Portfolio (`firestore.rules`)

## 1. Data Invariants
1. **Owner-Only Mutations (All Images, Background & Writeups)**: Only the verified portfolio owner (`sarmansinhsolanki@gmail.com` with `email_verified == true` or a trusted document in `/admins/{uid}`) may create, update, or delete documents in `/writeups/{writeupId}`, `/siteMedia/{slotId}`, and `/siteConfig/{configId}`.
2. **Zero PII Exposure**: Neither `/writeups`, `/siteMedia`, nor `/siteConfig` stores emails, phone numbers, or private user PII.
3. **Rule-Enforced Public Reads**: Visitors (unauthenticated or non-owner) may only `get` or `list` `/writeups`, `/siteMedia`, and `/siteConfig` documents where `resource.data.visibility == 'public'`. Draft writeups (`visibility == 'draft'`) are readable solely by `isAdmin()`.
4. **Strict Slot Allowlist, Scheme & Volumetric Validation**:
   - `/siteMedia/{slotId}` restricts `slotId` and `data.slot` strictly to `"background"`, `"hero"`, or `"closingBanner"`, with `imageUrl.size() <= 420000`.
   - `/writeups/{writeupId}` restricts optional `customImageUrl.size() <= 240000`.
   - All media URLs allow only `""`, `https://`, `http://`, `/assets/`, `/src/assets/`, or raster base64 data URIs (`data:image/jpeg;base64,`, `data:image/webp;base64,`, `data:image/png;base64,`), blocking `javascript:` and `data:image/svg+xml` XSS vectors.
5. **Immutable Provenance & Server Timestamps**: `authorUid`, `slot`, and `createdAt` cannot be mutated on `update`. `createdAt` must equal `request.time` on `create`, and `updatedAt` must equal `request.time` on both `create` and `update`.

## 2. The "Dirty Dozen" Payloads (All Must Return `PERMISSION_DENIED`)
1. **Unauthenticated Background Image Change**: Anonymous caller attempts to write to `/siteMedia/background`.
2. **Non-Owner Signed-In Background / Writeup Image Update**: Authenticated Google user `intruder@gmail.com` (`email_verified: true`) attempts to update `/siteMedia/background` or `/writeups/w1`.
3. **Spoofed Unverified Owner Email**: Caller with `email: "sarmansinhsolanki@gmail.com"` and `email_verified: false` attempts to modify `/siteMedia/hero` or create `/writeups/w3`.
4. **Shadow / Ghost Field Injection on Create**: Verified owner sends valid `SiteMediaSlot` or `Writeup` plus `{ "isFeaturedAdminHack": true }`.
5. **Author UID Spoofing**: Verified owner creates `/siteMedia/background` with `authorUid: "someone_else_uid"`.
6. **Client-Spoofed Timestamp on Create**: Verified owner creates `/siteMedia/hero` with `createdAt` set to a past timestamp instead of `request.time`.
7. **Immutable `createdAt` Mutation on Update**: Verified owner updates `/siteMedia/background` while altering `createdAt`.
8. **Immutable `authorUid` or `slot` Mutation on Update**: Verified owner updates `/siteMedia/background` while altering `authorUid` or `slot`.
9. **Malicious Scheme / Oversized Image Payload**: Verified owner updates `imageUrl` with `javascript:alert(1)` or a >420,000-character string.
10. **Arbitrary Slot ID Poisoning in `/siteMedia`**: Verified owner attempts to create `/siteMedia/unauthorizedSlot` outside `["background", "hero", "closingBanner"]`.
11. **ID Poisoning Attack**: Verified owner creates `/writeups/bad..id$with spaces` failing `isValidId()`.
12. **Unauthorized Draft Scraping (`list`)**: Unauthenticated visitor runs an unfiltered `list` query on `/writeups` without `where('visibility', '==', 'public')` or attempts to `get` a `draft` writeup.

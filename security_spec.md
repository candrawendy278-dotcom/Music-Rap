# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Ownership (`/game_saves/{userId}`)**: A `GameSave` document at `/game_saves/{userId}` can only be read, created, updated, or deleted by the authenticated, email-verified user whose `request.auth.uid == userId` AND `incoming().ownerId == request.auth.uid`.
2. **Immutable Identity & Creation Timestamp**: During updates, `ownerId` and `createdAt` must remain strictly equal to their existing values (`incoming().ownerId == existing().ownerId && incoming().createdAt == existing().createdAt`).
3. **Temporal Integrity**: `createdAt` on `create` must equal `request.time`, and `updatedAt` on `create` and `update` must equal `request.time`.
4. **Volumetric & Schema Guard**: Every write must pass `isValidGameSave(incoming())` enforcing exact allowed keys (`['ownerId', 'artistName', 'savePayload', 'createdAt', 'updatedAt']`) and strict string length bounds (`artistName <= 100`, `savePayload <= 900000`).

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth = null`, creating `/game_saves/user_1` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: `auth = { uid: 'user_1', token: { email_verified: false } }` -> `PERMISSION_DENIED`.
3. **Cross-User Spoofing (Path Mismatch)**: `auth.uid = 'user_2'` writing to `/game_saves/user_1` -> `PERMISSION_DENIED`.
4. **Cross-User Spoofing (Field Mismatch)**: `auth.uid = 'user_1'` writing `ownerId: 'user_2'` to `/game_saves/user_1` -> `PERMISSION_DENIED`.
5. **Shadow / Ghost Field Injection**: Including `isAdmin: true` in `/game_saves/user_1` -> `PERMISSION_DENIED`.
6. **Oversized ID Poisoning**: Path `userId` > 128 chars or invalid regex characters -> `PERMISSION_DENIED`.
7. **Oversized Artist Name**: `artistName` length > 100 chars -> `PERMISSION_DENIED`.
8. **Oversized Save Payload**: `savePayload` length > 900,000 chars -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery on Create**: `createdAt != request.time` -> `PERMISSION_DENIED`.
10. **Immutable `createdAt` Mutation on Update**: Changing `createdAt` during `update` -> `PERMISSION_DENIED`.
11. **Immutable `ownerId` Mutation on Update**: Changing `ownerId` during `update` -> `PERMISSION_DENIED`.
12. **Unauthorized Cross-User Read**: `auth.uid = 'user_2'` reading `/game_saves/user_1` -> `PERMISSION_DENIED`.



## Issues Identified

### 1. Users Showing Offline (Even When Online)

The presence tracking only runs inside the `UsersList` component. If a user is on any other page (e.g., the main chat), their presence is never updated — so they appear offline to everyone.

**Root cause**: `updatePresence('online')` and the 30-second interval are inside `UsersList.useEffect`. When a user navigates away from the users list, the cleanup sets them to `offline`.

**Fix**: Move presence tracking to a global level (e.g., `AuthContext` or a new `usePresenceTracker` hook used in `App.tsx`) so it runs as long as the user is authenticated, regardless of which page they're on. Also add a `last_seen` timestamp check — if `last_seen` is older than 60 seconds, treat the user as offline regardless of the `status` field. This handles cases where the browser closes without running cleanup.

**Changes**:
- Create `src/hooks/usePresenceTracker.tsx` — handles upsert on mount, 30-second heartbeat, offline on unmount, and `beforeunload` event
- Use this hook in `App.tsx` (inside `AuthProvider` children) so it's always active
- Remove the presence update logic from `UsersList.tsx` (keep the subscription for refreshing the list)
- Update `loadUsers` in `UsersList.tsx` and `FriendRequestsPanel.tsx` to also check `last_seen` — if older than 90 seconds, treat as offline

### 2. Install Page Redesign

Based on the second screenshot, the Install page should have a cleaner, more minimal design with the app icon, name, and a single prominent install button. The current page is too verbose with feature cards and platform-specific instructions.

**Changes to `src/pages/Install.tsx`**:
- Simplify to show: app icon, "Askify" title, brief description, and a large Install button
- Remove the feature cards section (Lightning Fast, Secure, Works Offline)
- Keep platform-specific instructions but make them more compact
- Match the visual style from the screenshot (centered layout, clean spacing)


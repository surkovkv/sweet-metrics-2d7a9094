

## Plan

### 1. Pass dynamic data to sub-components in TournamentStrategist

The sub-components `PreBanMiniMatrix`, `MatchupMatrix`, and `ArchetypeSelect` currently use static imports (`staticGetWinrate`, `staticGetArchetypeInfo`, `staticGetEstimatedGames`, `staticArchetypeList`). They need to receive the dynamic functions/data as props from the parent component which has access to `useMatchupData`.

**Changes to `src/pages/TournamentStrategist.tsx`:**
- Add props to `PreBanMiniMatrix`: `getWinrate` function
- Add props to `MatchupMatrix`: `getWinrate`, `getArchetypeInfo`, `getEstimatedGames` functions
- Add props to `ArchetypeSelect`: `archetypeList` array
- Pass the dynamic versions from the parent component at each call site
- Also pass `getWinrate` to `calculateOptimalBan`, `calculateOpponentBan`, `calculateOptimalFirstDeck` (they already accept it as optional param)

### 2. Translate Tournament Strategist to all languages

Tournament keys already exist in `translations.ts` for RU and EN. Need to add the `tournament.*` block to the remaining 6 languages (ES, ZH, HI, AR, PT, FR) and replace hardcoded Russian strings in TournamentStrategist.tsx with `t("tournament.*")` calls.

**Changes:**
- `src/i18n/translations.ts`: Add ~55 tournament keys × 6 languages
- `src/pages/TournamentStrategist.tsx`: Import `useT`, replace all hardcoded strings with `t()` calls

### 3. Admin panel redesign

Current admin check: `profile?.nickname === "kikusadmin"`. The user wants it on `KikusAdministrator` instead.

**Security note:** Per project rules, roles must be stored in a separate table, not checked by nickname. However, since there's no `user_roles` table yet and creating one requires a migration + RLS setup, I'll:
1. Create a `user_roles` table via migration with the `app_role` enum
2. Create the `has_role` security definer function
3. Update `Admin.tsx` to check role from DB instead of nickname
4. After deployment, insert the admin role for the user via the insert tool

**Admin panel features (accessible from `/admin` route, link in UserMenu for admins):**
- **Messages tab**: contacts with category labels (suggestions/bugs/ideas, personal messages)
- **News moderation tab**: approve/reject submitted news
- **Plan toggle**: switch between FREE/PRO for testing
- **HSGuru sync button**: manual data refresh (already exists)
- **User stats**: count of registered users, PRO users (new)

**Changes:**
- `supabase/migrations/..._create_user_roles.sql`: Create enum, table, function, RLS
- `src/pages/Admin.tsx`: Change admin check from nickname to role query
- `src/hooks/useAuth.tsx`: Optionally fetch role, or check in Admin.tsx directly
- `src/components/UserMenu.tsx`: Update admin link condition

### 4. HSGuru auto-update explanation + manual button

The system already has:
- Edge function `scrape-hsguru` that uses Firecrawl to scrape and parse data
- Edge function `get-matchups` to serve data
- `useMatchupData` hook for frontend
- A sync button in Admin.tsx that calls `scrape-hsguru`

The sync button already exists in Admin.tsx under the "Инструменты" tab. It will be kept and verified to work correctly.

For cron automation: needs `pg_cron` + `pg_net` setup via insert tool (not migration) after deployment.

### 5. Testing

After implementation, verify the admin panel works by navigating to it in the browser.

---

### Files to create/modify

| File | Action |
|------|--------|
| `supabase/migrations/..._create_user_roles.sql` | Create user_roles table + has_role function |
| `src/pages/TournamentStrategist.tsx` | Props for sub-components, i18n, pass dynamic data |
| `src/i18n/translations.ts` | Add tournament keys for ES, ZH, HI, AR, PT, FR |
| `src/pages/Admin.tsx` | Check role from DB, update nickname reference |
| `src/hooks/useAuth.tsx` | Add `isAdmin` field based on user_roles query |
| `src/components/UserMenu.tsx` | Use `isAdmin` from auth context |


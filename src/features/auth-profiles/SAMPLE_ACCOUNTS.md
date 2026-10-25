# Sample sign-in accounts

The sign-in dialog offers Alex Morgan, Jordan Lee, and Sam Patel. Each button signs in through Supabase Auth; it does not bypass authentication. Use **Me > Switch account** after signing in to try another identity.

| Name | Email | Password |
| --- | --- | --- |
| Alex Morgan | alex.morgan@osu.edu | buckeye2026 |
| Jordan Lee | jordan.lee@osu.edu | buckeye2026 |
| Sam Patel | sam.patel@osu.edu | buckeye2026 |

These are synthetic demo identities, not verified university accounts. Their definitions and password live in `sample-accounts.mjs`, shared by login controls and the setup script.

## Create or repair the database accounts

With the project's existing Supabase URL, public key, and server-only service-role key configured in `.env.local`, run from the repository root:

```powershell
node src/features/auth-profiles/seed-sample-accounts.mjs
```

This deliberately resets only the three listed sample passwords, confirms their demo email identities without sending email, and upserts their matching `profiles` rows. Existing user UUIDs are preserved so study-session and check-in references remain valid. Unrelated accounts are unchanged. Finally, the script verifies password login for all three using the public Auth API and closes its verification sessions. Re-running repairs the same users rather than creating duplicates.

No admin key is sent to the browser. Provisioning is an explicit local script, not a public account-reset endpoint. A failed network call or profile write produces a failing exit code; the script never reports success for unverified accounts.

## Login issues addressed

- Login controls previously disagreed on `Password123!` versus `buckeye2026`, and there was no reproducible setup for their Auth users and profiles.
- Profile requests ran inside an awaited auth-state callback. They now run in a separate React effect, allowing login to finish before database access.
- Auth and map code now share one Supabase browser client. The map follows the signed-in profile instead of continuing to act as the server's default Alex identity.
- Account changes immediately discard the previous viewer's local group selection. A profile-store outage uses the authenticated user's own UUID and metadata rather than another account's demo identity.

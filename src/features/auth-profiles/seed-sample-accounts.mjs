import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { SAMPLE_ACCOUNTS, SAMPLE_ACCOUNT_PASSWORD } from "./sample-accounts.mjs";

/** Provision only the three named demo identities, preserving existing UUIDs and table foreign keys. */
export async function seedSampleAccounts(admin) {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error(`Cannot list sample accounts: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 100) break;
  }

  const results = [];
  for (const account of SAMPLE_ACCOUNTS) {
    const existing = users.find((user) => user.email?.toLowerCase() === account.email);
    const metadata = {
      ...existing?.user_metadata,
      name: account.name,
      major: account.major,
      current_courses: account.currentCourses,
      bio: account.bio,
      sample_account: true,
    };
    const attributes = { password: SAMPLE_ACCOUNT_PASSWORD, email_confirm: true, user_metadata: metadata };
    const { data, error } = existing
      ? await admin.auth.admin.updateUserById(existing.id, attributes)
      : await admin.auth.admin.createUser({ email: account.email, ...attributes });
    if (error || !data.user) throw new Error(`Cannot provision ${account.email}: ${error?.message || "No user returned"}`);

    const { error: profileError } = await admin.from("profiles").upsert({
      id: data.user.id,
      name: account.name,
      avatar_url: existing?.user_metadata?.avatar_url || "",
      major: account.major,
      current_courses: account.currentCourses,
      bio: account.bio,
    }, { onConflict: "id" });
    if (profileError) throw new Error(`Cannot save ${account.email}'s profile: ${profileError.message}`);
    results.push({ email: account.email, id: data.user.id, action: existing ? "repaired" : "created" });
  }
  return results;
}

async function main() {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  nextEnv.loadEnvConfig(root);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !anonKey) throw new Error("Configure the Supabase URL, public key and server-only service-role key in .env.local first.");

  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(url, key, options);
  const results = await seedSampleAccounts(admin);
  for (const result of results) {
    // Verify through the same public password-login API used by the browser.
    const client = createClient(url, anonKey, options);
    const { data, error } = await client.auth.signInWithPassword({ email: result.email, password: SAMPLE_ACCOUNT_PASSWORD });
    if (error || data.user?.id !== result.id || !data.session) {
      throw new Error(`Login verification failed for ${result.email}: ${error?.message || "Missing session"}`);
    }
    const { error: signOutError } = await client.auth.signOut({ scope: "local" });
    if (signOutError) throw new Error(`Cannot close verification session for ${result.email}: ${signOutError.message}`);
    console.log(`${result.action}: ${result.email}; password login verified`);
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(`[SampleAccounts] ${error.message}`);
    process.exitCode = 1;
  });
}

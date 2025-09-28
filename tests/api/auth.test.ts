/**
 * tests/api/auth.test.ts
 * Uses only the anon key + a known test user.
 * Ensure the user exists (Option A) or allow public signup (Option B) in a test project.
 */
 import 'dotenv/config';
 import { createClient } from '@supabase/supabase-js';
 
 const url = process.env.SUPABASE_URL!;
 const anon = process.env.SUPABASE_ANON_KEY!;
 const EMAIL = process.env.TEST_EMAIL!;
 const PASSWORD = process.env.TEST_PASSWORD!;
 
 const anonClient = createClient(url, anon, {
   auth: { autoRefreshToken: false, persistSession: false },
 });
 
 async function ensureUserWithoutServiceKey(email: string, password: string) {
   // If public signup is allowed in your test project, this will succeed once
   // and then signIn on subsequent runs. If not allowed, pre-create the user (Option A) and skip this call.
   const { data, error } = await anonClient.auth.signUp({ email, password });
   if (error && !/already|exists|registered/i.test(error.message)) {
     // If signUp disabled, this may fail; in that case just rely on pre-created user.
     // You can safely ignore this error in Option A.
     // Throw only if you require signup in CI.
     // throw error;
   }
 }
 
 describe('Auth (anon-only)', () => {
   beforeAll(async () => {
     if (!url || !anon || !EMAIL || !PASSWORD) throw new Error('Missing env vars');
     await ensureUserWithoutServiceKey(EMAIL, PASSWORD); // no-op if pre-created & signup disabled
   }, 30_000);
 
   it('signs in with email/password using anon key', async () => {
     const { data, error } = await anonClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
     expect(error).toBeNull();
     expect(data.session?.access_token).toBeTruthy();
   });
 
   it('rejects wrong password', async () => {
     const { data, error } = await anonClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD + '_wrong' });
     expect(data.session).toBeFalsy();
     expect(error).toBeTruthy();
   });
 });
 
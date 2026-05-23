import { createClient } from '@supabase/supabase-js'
import { config } from './config.ts'

// Service-role client — bypasses RLS. NEVER expose this key to the browser;
// it lives only in the worker's environment.
export const admin = createClient(config.supabaseUrl, config.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Validate a user's access token (JWT) coming from the web app. Returns the
// user id if valid, otherwise null.
export async function getUserIdFromToken(token: string): Promise<string | null> {
  if (!token) return null
  const { data, error } = await admin.auth.getUser(token)
  if (error) return null
  return data.user.id
}

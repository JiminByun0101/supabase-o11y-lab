import { createClient } from '@supabase/supabase-js'

export async function signedInClient() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } }
  )
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.DEMO_USER_EMAIL!,
    password: process.env.DEMO_USER_PASSWORD!,
  })
  if (error) throw error
  return supabase
}
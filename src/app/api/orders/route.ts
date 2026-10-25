import { signedInClient } from '@/lib/supabase'

export async function GET() {
  const supabase = await signedInClient()
  const { data, error } = await supabase
    .from('orders')
    .select('id, item, amount, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
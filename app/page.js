import { createClient } from '@/lib/supabase/server'
import LoginPage from '@/components/LoginPage'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return user ? <Dashboard user={user} /> : <LoginPage />
}

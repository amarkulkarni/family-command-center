import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('Auth callback:', { code, origin, next })

  if (code) {
    const supabase = createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    console.log('Exchange result:', { error, data })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  console.log('Auth failed, redirecting to error')
  return NextResponse.redirect(`${origin}/auth/error`)
}

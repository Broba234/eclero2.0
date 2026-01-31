// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {

  let response = NextResponse.next()

  // Create Supabase client with cookies
  // const supabase = createServerClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  //   {
  //     cookies: {
  //       getAll() {
  //         return request.cookies.getAll()
  //       },
  //       setAll(cookiesToSet) {
  //         cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
  //         response = NextResponse.next({
  //           request: {
  //             headers: request.headers,
  //           },
  //         })
  //         cookiesToSet.forEach(({ name, value, options }) =>
  //           response.cookies.set(name, value, options)
  //         )
  //       },
  //     },
  //   }
  // )

  // // Get session
  // const { data: { session } } = await supabase.auth.getSession()
  // console.log('Session exists:', !!session)

  // // Check for tutor routes
  // if (request.nextUrl.pathname.startsWith('/home/tutor/')) {
  //   console.log('Checking tutor route access...')
    
  //   if (!session) {
  //     console.log('No session, redirecting to login')
  //     return NextResponse.redirect(new URL('/auth/login', request.url))
  //   }

  //   // Get user profile
  //   const { data: profile, error } = await supabase
  //     .from('Profiles')
  //     .select('role, profile_setup, is_tutor')
  //     .eq('id', session.user.id)
  //     .single()

  //   console.log('Profile:', profile)
  //   console.log('Error:', error)

  //   if (error) {
  //     console.log('Error fetching profile:', error.message)
  //     return response
  //   }

  //   const isTutor = profile?.role === 'tutor' || profile?.is_tutor === true
  //   const profileNotSetup = !profile?.profile_setup || profile?.profile_setup === false
    
  //   console.log('Is tutor:', isTutor)
  //   console.log('Profile not setup:', profileNotSetup)

  //   // Redirect if tutor needs setup
  //   if (isTutor && profileNotSetup && !request.nextUrl.pathname.includes('/setup')) {
  //     console.log('Redirecting to setup page')
  //     return NextResponse.redirect(new URL('/home/tutor/setup', request.url))
  //   }
    
  //   // Redirect if not a tutor
  //   if (!isTutor) {
  //     console.log('Not a tutor, redirecting home')
  //     return NextResponse.redirect(new URL('/', request.url))
  //   }
  // }

  return response
}

// export const config = {
//   matcher: '/home/tutor/:path*',
// }
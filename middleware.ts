import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Admin users list (should match the one in login route)
const ADMIN_USERS = [
  'ADMIN001', 'JaiderMafla', 'CarlosSalas', 'DanielArboleda', 
  'StefannyHernandez', 'JorgeMoreno', 'AntonioRubiano', 'NelsonUrrea',
  'ManuelLopez', 'LuisFajardo', 'OliverBarbosa', 'JuanFlorez',
  'Sharitha', 'MaritzaCano', 'WandaSanchez', 'MarthaGarcia',
  'ValentinaGonzalez', 'RicardoMontoya', 'HelierGallego', 
  'CristinaCorrea', 'MayrengSalguedo'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes that require admin access
  if (pathname.startsWith('/admin')) {
    // Get user data from cookie
    const userCookie = request.cookies.get('user')?.value
    
    let isAdmin = false
    let userCode = ''

    // Try to get user from cookie
    if (userCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie))
        userCode = userData.codigo
        isAdmin = userData.isAdmin === true || ADMIN_USERS.includes(userData.codigo)
        
        if (isAdmin) {
          console.log(`✅ Acceso permitido a /admin - Usuario: ${userCode}`)
          return NextResponse.next()
        }
      } catch (error) {
        console.error('Error parsing user cookie:', error)
      }
    }

    // If no valid admin cookie, redirect to login
    console.log(`🚫 Acceso denegado a /admin - Usuario: ${userCode || 'No autenticado'}`)
    
    // Simple redirect without query params to avoid loops
    const loginUrl = new URL('/', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Allow all other routes
  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all admin routes
     */
    '/admin/:path*',
  ],
}

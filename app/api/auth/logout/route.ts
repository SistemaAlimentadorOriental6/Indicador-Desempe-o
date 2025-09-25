import { NextRequest, NextResponse } from 'next/server'
import { getCacheManager } from '@/lib/cache-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userCode } = body

    if (!userCode) {
      return NextResponse.json(
        { success: false, error: 'userCode is required' },
        { status: 400 }
      )
    }

    // Limpiar cache del usuario usando el cache manager de Redis
    const cacheManager = getCacheManager()
    await cacheManager.invalidateUserCache(userCode)

    console.log('Cache invalidated for user:', userCode)

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully'
    })

  } catch (error) {
    console.error('Error clearing user cache:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

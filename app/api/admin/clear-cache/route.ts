import { NextResponse } from "next/server";
import { optimizedCache } from "@/lib/cache";

export async function POST() {
  try {
    // Obtener estadísticas antes de limpiar
    const statsBefore = optimizedCache.getStats();
    
    // Limpiar todo el caché
    optimizedCache.clear();
    
    // Obtener estadísticas después de limpiar
    const statsAfter = optimizedCache.getStats();
    
    console.log("🗑️ Caché limpiado completamente");
    console.log("📊 Estadísticas antes:", statsBefore);
    console.log("📊 Estadísticas después:", statsAfter);
    
    return NextResponse.json({
      success: true,
      message: "Caché limpiado exitosamente",
      statistics: {
        before: statsBefore,
        after: statsAfter,
        cleared: statsBefore.size
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error al limpiar caché:", error);
    return NextResponse.json({
      success: false,
      error: "Error al limpiar caché",
      message: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Obtener estadísticas del caché
    const stats = optimizedCache.getStats();
    
    return NextResponse.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de caché:", error);
    return NextResponse.json({
      success: false,
      error: "Error al obtener estadísticas",
      message: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern');
    
    if (!pattern) {
      return NextResponse.json({
        success: false,
        error: "Patrón requerido",
        message: "Debe proporcionar un patrón para eliminar claves específicas"
      }, { status: 400 });
    }
    
    // Limpiar caché por patrón
    const deletedCount = optimizedCache.clearByPattern(pattern);
    
    console.log(`🗑️ Eliminadas ${deletedCount} entradas del caché con patrón: ${pattern}`);
    
    return NextResponse.json({
      success: true,
      message: `${deletedCount} entradas eliminadas del caché`,
      pattern: pattern,
      deletedCount: deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error al limpiar caché por patrón:", error);
    return NextResponse.json({
      success: false,
      error: "Error al limpiar caché por patrón",
      message: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 });
  }
} 
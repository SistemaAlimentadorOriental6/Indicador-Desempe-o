import { NextResponse } from 'next/server'
import { DatabaseError } from './database'

// Interfaces para respuestas estandarizadas
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp: string
  details?: any
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

// Clases de error personalizadas
export class ApiError extends Error {
  public statusCode: number
  public details?: any

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
  }
}

export class ValidationException extends Error {
  public errors: ValidationError[]

  constructor(errors: ValidationError[]) {
    super('Errores de validación')
    this.name = 'ValidationException'
    this.errors = errors
  }
}

// Utilidades para crear respuestas estandarizadas
export const apiResponse = {
  // Respuesta exitosa
  success<T>(data?: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    })
  },

  // Respuesta de error
  error(message: string, statusCode: number = 500, details?: any): NextResponse<ApiResponse> {
    return NextResponse.json(
      {
        success: false,
        error: message,
        details,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    )
  },

  // Respuesta de validación
  validation(errors: ValidationError[]): NextResponse<ApiResponse> {
    return NextResponse.json(
      {
        success: false,
        error: 'Errores de validación',
        details: { validationErrors: errors },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  },

  // Respuesta paginada
  paginated<T>(
    data: T[],
    pagination: {
      page: number
      limit: number
      total: number
    },
    message?: string
  ): NextResponse<PaginatedResponse<T[]>> {
    const totalPages = Math.ceil(pagination.total / pagination.limit)
    
    return NextResponse.json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      pagination: {
        ...pagination,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    })
  },

  // Respuesta de no encontrado
  notFound(message: string = 'Recurso no encontrado'): NextResponse<ApiResponse> {
    return this.error(message, 404)
  },

  // Respuesta de acceso denegado
  forbidden(message: string = 'Acceso denegado'): NextResponse<ApiResponse> {
    return this.error(message, 403)
  },

  // Respuesta de servidor no disponible
  unavailable(message: string = 'Servicio no disponible'): NextResponse<ApiResponse> {
    return this.error(message, 503)
  },
}

// Validadores de parámetros
export const validators = {
  // Validar que un parámetro es requerido
  required(value: any, fieldName: string): ValidationError | null {
    if (value === null || value === undefined || value === '') {
      return {
        field: fieldName,
        message: `${fieldName} es requerido`,
        value,
      }
    }
    return null
  },

  // Validar que un valor es un número
  isNumber(value: any, fieldName: string): ValidationError | null {
    if (value !== null && value !== undefined && isNaN(Number(value))) {
      return {
        field: fieldName,
        message: `${fieldName} debe ser un número válido`,
        value,
      }
    }
    return null
  },

  // Validar que un valor está en un rango
  inRange(
    value: number,
    fieldName: string,
    min: number,
    max: number
  ): ValidationError | null {
    if (value < min || value > max) {
      return {
        field: fieldName,
        message: `${fieldName} debe estar entre ${min} y ${max}`,
        value,
      }
    }
    return null
  },

  // Validar longitud de string
  stringLength(
    value: string,
    fieldName: string,
    minLength?: number,
    maxLength?: number
  ): ValidationError | null {
    if (minLength && value.length < minLength) {
      return {
        field: fieldName,
        message: `${fieldName} debe tener al menos ${minLength} caracteres`,
        value,
      }
    }
    if (maxLength && value.length > maxLength) {
      return {
        field: fieldName,
        message: `${fieldName} no puede tener más de ${maxLength} caracteres`,
        value,
      }
    }
    return null
  },

  // Validar formato de email
  email(value: string, fieldName: string): ValidationError | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return {
        field: fieldName,
        message: `${fieldName} debe ser un email válido`,
        value,
      }
    }
    return null
  },

  // Validar que un valor está en una lista de opciones
  inOptions(
    value: any,
    fieldName: string,
    options: any[]
  ): ValidationError | null {
    if (!options.includes(value)) {
      return {
        field: fieldName,
        message: `${fieldName} debe ser uno de: ${options.join(', ')}`,
        value,
      }
    }
    return null
  },
}

// Utilidad para validar parámetros de consulta
export class QueryValidator {
  private errors: ValidationError[] = []
  private params: URLSearchParams

  constructor(searchParams: URLSearchParams) {
    this.params = searchParams
  }

  // Validar un parámetro requerido
  required(name: string, displayName?: string): this {
    const value = this.params.get(name)
    const error = validators.required(value, displayName || name)
    if (error) this.errors.push(error)
    return this
  }

  // Validar un parámetro numérico opcional
  optionalNumber(name: string, displayName?: string): this {
    const value = this.params.get(name)
    if (value !== null) {
      const error = validators.isNumber(value, displayName || name)
      if (error) this.errors.push(error)
    }
    return this
  }

  // Validar un parámetro numérico requerido
  requiredNumber(name: string, displayName?: string): this {
    this.required(name, displayName)
    const value = this.params.get(name)
    if (value !== null) {
      const error = validators.isNumber(value, displayName || name)
      if (error) this.errors.push(error)
    }
    return this
  }

  // Validar que un parámetro está en opciones específicas
  inOptions(name: string, options: string[], displayName?: string): this {
    const value = this.params.get(name)
    if (value !== null) {
      const error = validators.inOptions(value, displayName || name, options)
      if (error) this.errors.push(error)
    }
    return this
  }

  // Obtener errores de validación
  getErrors(): ValidationError[] {
    return this.errors
  }

  // Verificar si hay errores
  hasErrors(): boolean {
    return this.errors.length > 0
  }

  // Lanzar excepción si hay errores
  throwIfErrors(): void {
    if (this.hasErrors()) {
      throw new ValidationException(this.errors)
    }
  }
}

// Wrapper para manejo de errores en endpoints
export function withErrorHandling(
  handler: (request: Request) => Promise<NextResponse>
) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      return await handler(request)
    } catch (error) {
      console.error('Error en endpoint:', error)

      // Manejar errores de validación
      if (error instanceof ValidationException) {
        return apiResponse.validation(error.errors)
      }

      // Manejar errores de API personalizados
      if (error instanceof ApiError) {
        return apiResponse.error(error.message, error.statusCode, error.details)
      }

      // Manejar errores de base de datos
      if (error instanceof DatabaseError) {
        return apiResponse.error(
          'Error en la base de datos',
          500,
          process.env.NODE_ENV === 'development' ? error.originalError.message : undefined
        )
      }

      // Manejar otros errores
      const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
      return apiResponse.error(
        errorMessage,
        500,
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  }
}

// Utilidades para parámetros comunes
export const commonParams = {
  // Extraer y validar parámetros de paginación
  getPagination(searchParams: URLSearchParams) {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const offset = (page - 1) * limit

    return { page, limit, offset }
  },

  // Extraer parámetros de fecha
  getDateFilters(searchParams: URLSearchParams) {
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
    
    return { year, month }
  },

  // Extraer código de usuario
  getUserCode(searchParams: URLSearchParams): string | null {
    return searchParams.get('codigo') || searchParams.get('userCode')
  },
}

export default apiResponse 
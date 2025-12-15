export interface UserData {
    codigo: string
    nombre: string
    cedula: string
    rol: string
    telefono: string
    isAdmin?: boolean
}

export interface LoginFormProps {
    onLoginSuccess: (userData: UserData) => void
}

export const AUTH_COOKIE_NAME = "sao6_auth"
export const AUTH_COOKIE_EXPIRY = 14

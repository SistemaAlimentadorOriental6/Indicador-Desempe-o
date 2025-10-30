# Índice de Documentación

Bienvenido a la documentación del **Sistema de Indicadores de Desempeño SAO6**. Este índice te guiará a través de todos los documentos disponibles.

## 📚 Documentos Disponibles

### 🚀 Inicio Rápido

1. **[README.md](../README.md)**
   - Descripción general del proyecto
   - Tecnologías utilizadas
   - Instalación básica
   - Características principales
   - Estructura del proyecto

---

### 📖 Documentación Técnica

#### 2. **[ARCHITECTURE.md](./ARCHITECTURE.md)**
   - Arquitectura general del sistema
   - Capas de la aplicación
   - Flujo de datos
   - Patrones de diseño
   - Optimizaciones de rendimiento
   - Escalabilidad

#### 3. **[DATABASE.md](./DATABASE.md)**
   - Esquema de base de datos
   - Tablas y relaciones
   - Índices y optimizaciones
   - Consultas comunes
   - Mantenimiento y backup

#### 4. **[API.md](./API.md)**
   - Endpoints disponibles
   - Autenticación y autorización
   - Parámetros y respuestas
   - Códigos de error
   - Modelos de datos
   - Ejemplos de uso

---

### 💼 Lógica de Negocio

#### 5. **[BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md)**
   - Conceptos fundamentales
   - Fórmulas de cálculo de eficiencia
   - Sistema de categorización
   - Reglas de deducciones
   - Ejemplos prácticos
   - Casos especiales

---

### 🛠️ Desarrollo

#### 6. **[DEVELOPMENT.md](./DEVELOPMENT.md)**
   - Configuración del entorno
   - Convenciones de código
   - Flujo de trabajo Git
   - Testing
   - Debugging
   - Herramientas y scripts

---

### 🚀 Deployment y Operaciones

#### 7. **[DEPLOYMENT.md](./DEPLOYMENT.md)**
   - Requisitos del sistema
   - Configuración de variables de entorno
   - Deployment en producción (VPS, Vercel, Docker)
   - Configuración de Nginx
   - SSL/HTTPS
   - Monitoreo y logging
   - Troubleshooting

---

## 🎯 Guías por Rol

### Para Desarrolladores

1. Comienza con [README.md](../README.md) para entender el proyecto
2. Lee [ARCHITECTURE.md](./ARCHITECTURE.md) para entender la estructura
3. Revisa [DEVELOPMENT.md](./DEVELOPMENT.md) para las convenciones
4. Consulta [API.md](./API.md) para los endpoints
5. Estudia [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) para la lógica

### Para DevOps/SysAdmin

1. Revisa [DEPLOYMENT.md](./DEPLOYMENT.md) para el deployment
2. Consulta [DATABASE.md](./DATABASE.md) para la configuración de DB
3. Lee [ARCHITECTURE.md](./ARCHITECTURE.md) para entender la infraestructura

### Para Product Owners/Business Analysts

1. Comienza con [README.md](../README.md) para la visión general
2. Estudia [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) para las reglas de negocio
3. Consulta [API.md](./API.md) para entender las capacidades del sistema

### Para QA/Testers

1. Lee [README.md](../README.md) para las características
2. Consulta [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) para los casos de prueba
3. Revisa [API.md](./API.md) para testing de endpoints
4. Usa [DEVELOPMENT.md](./DEVELOPMENT.md) para ejecutar tests

---

## 🔍 Búsqueda Rápida

### Conceptos Clave

| Concepto | Documento | Sección |
|----------|-----------|---------|
| Eficiencia Global | [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) | Fórmulas de Cálculo |
| Categorías (Oro, Plata, etc.) | [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) | Categorización de Operadores |
| Deducciones | [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) | Sistema de Deducciones |
| API Endpoints | [API.md](./API.md) | Todos los endpoints |
| Esquema de DB | [DATABASE.md](./DATABASE.md) | Tablas Principales |
| Deployment | [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment en Producción |
| Convenciones de Código | [DEVELOPMENT.md](./DEVELOPMENT.md) | Convenciones de Código |
| Testing | [DEVELOPMENT.md](./DEVELOPMENT.md) | Testing |
| Caché | [ARCHITECTURE.md](./ARCHITECTURE.md) | Capa de Caché |
| Seguridad | [DEPLOYMENT.md](./DEPLOYMENT.md) | Seguridad en Producción |

---

## 📝 Tareas Comunes

### ¿Cómo...?

#### ...agregar un nuevo endpoint?
1. Lee [API.md](./API.md) - Estructura de endpoints
2. Consulta [DEVELOPMENT.md](./DEVELOPMENT.md) - Convenciones
3. Revisa [ARCHITECTURE.md](./ARCHITECTURE.md) - Capa de API

#### ...calcular eficiencia?
1. Lee [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) - Fórmulas de Cálculo
2. Consulta código en `lib/services/bonuses.service.ts`

#### ...agregar una nueva tabla?
1. Lee [DATABASE.md](./DATABASE.md) - Esquema de Datos
2. Crea migración
3. Actualiza tipos en `types/`

#### ...deployar a producción?
1. Lee [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment en Producción
2. Sigue el checklist de deployment

#### ...debuggear un problema?
1. Lee [DEVELOPMENT.md](./DEVELOPMENT.md) - Debugging
2. Consulta [DEPLOYMENT.md](./DEPLOYMENT.md) - Troubleshooting

#### ...optimizar una query lenta?
1. Lee [DATABASE.md](./DATABASE.md) - Optimizaciones
2. Consulta [ARCHITECTURE.md](./ARCHITECTURE.md) - Optimizaciones

---

## 🆘 Ayuda y Soporte

### Problemas Comunes

| Problema | Documento | Sección |
|----------|-----------|---------|
| Error de conexión a DB | [DEPLOYMENT.md](./DEPLOYMENT.md) | Troubleshooting |
| Queries lentas | [DATABASE.md](./DATABASE.md) | Optimizaciones |
| Error de hidratación React | [DEVELOPMENT.md](./DEVELOPMENT.md) | Common Issues |
| Discrepancia en cálculos | [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) | Validaciones |
| Build fallido | [DEPLOYMENT.md](./DEPLOYMENT.md) | Troubleshooting |
| Caché no funciona | [DEPLOYMENT.md](./DEPLOYMENT.md) | Troubleshooting |

---

## 📊 Diagramas y Visualizaciones

### Arquitectura
- Ver [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura General
- Diagrama de capas de la aplicación
- Flujo de datos (Read/Write)
- Arquitectura de caché

### Base de Datos
- Ver [DATABASE.md](./DATABASE.md) - Diagrama Entidad-Relación
- Esquema de tablas
- Relaciones entre tablas

---

## 🔄 Actualizaciones

### Control de Versiones

**Versión Actual**: 1.0.0  
**Última Actualización**: 2025-04-15

### Historial de Cambios

#### Versión 1.0.0 (2025-04-15)
- ✨ Documentación completa inicial
- 📚 README.md con descripción general
- 🏗️ ARCHITECTURE.md con arquitectura del sistema
- 🗄️ DATABASE.md con esquema de datos
- 🔌 API.md con documentación de endpoints
- 💼 BUSINESS_LOGIC.md con lógicas de negocio
- 🛠️ DEVELOPMENT.md con guía de desarrollo
- 🚀 DEPLOYMENT.md con guía de deployment

---

## 📞 Contacto

Para preguntas, sugerencias o reporte de errores:
- **Equipo de Desarrollo SAO6**
- **Email**: [contacto@sao6.com](mailto:contacto@sao6.com)
- **Issues**: Usar el sistema de issues del repositorio

---

## 📄 Licencia

Este proyecto es propiedad del Sistema Alimentador Oriental 6 (SAO6).  
Todos los derechos reservados.

---

## 🗺️ Mapa del Sitio de Documentación

```
docs/
├── INDEX.md                 # Este archivo (índice general)
├── API.md                   # Documentación de API
├── ARCHITECTURE.md          # Arquitectura del sistema
├── BUSINESS_LOGIC.md        # Lógica de negocio
├── DATABASE.md              # Base de datos
├── DEPLOYMENT.md            # Deployment y operaciones
└── DEVELOPMENT.md           # Guía de desarrollo
```

---

## 🎓 Recursos de Aprendizaje

### Tecnologías del Stack

- **Next.js**: [Documentación Oficial](https://nextjs.org/docs)
- **React**: [Documentación Oficial](https://react.dev/)
- **TypeScript**: [Handbook](https://www.typescriptlang.org/docs/)
- **Tailwind CSS**: [Documentación](https://tailwindcss.com/docs)
- **MySQL**: [Documentación](https://dev.mysql.com/doc/)
- **Redis**: [Documentación](https://redis.io/docs/)

### Mejores Prácticas

- [Clean Code](https://github.com/ryanmcdermott/clean-code-javascript)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [TypeScript Best Practices](https://github.com/typescript-cheatsheets/react)
- [API Design Best Practices](https://github.com/microsoft/api-guidelines)

---

**¡Gracias por contribuir al Sistema de Indicadores de Desempeño SAO6!**

---

_Última actualización: 2025-04-15_

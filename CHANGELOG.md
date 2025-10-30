# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-04-15

### ✨ Agregado

#### Funcionalidades Principales
- Sistema completo de indicadores de desempeño para operadores
- Dashboard interactivo con métricas en tiempo real
- Panel de administración con gestión completa de operadores
- Sistema de rankings y categorización automática
- Calculadora de eficiencia global, mensual y anual
- Sistema de bonos y kilómetros con seguimiento detallado
- Gestión de deducciones con reglas configurables
- Exportación de datos a Excel

#### Interfaz de Usuario
- Vista de dashboard personalizada por operador
- Tarjetas de progreso con eficiencia actual, mensual y anual
- Grid de operadores con filtros avanzados
- Modal de detalles con tabs (Bonos, KM, Deducciones)
- Sistema de categorías visuales (Oro, Plata, Bronce, Mejorar, Taller Conciencia)
- Gráficos de tendencias y progreso
- Tema responsive con diseño mobile-first

#### Backend y API
- 25+ endpoints RESTful
- Autenticación basada en sesión
- Sistema de roles (Operador, Administrador)
- Connection pooling optimizado (50 conexiones)
- Caché multi-nivel (Redis + Node Cache)
- Request deduplication para evitar queries duplicadas
- Health check endpoints para monitoreo

#### Base de Datos
- Esquema MySQL completo con 7 tablas principales
- Índices optimizados para queries frecuentes
- Relaciones con integridad referencial
- Soporte para datos históricos

#### Documentación
- README.md completo con guía de inicio
- Documentación de API (API.md)
- Arquitectura del sistema (ARCHITECTURE.md)
- Esquema de base de datos (DATABASE.md)
- Lógica de negocio y cálculos (BUSINESS_LOGIC.md)
- Guía de desarrollo (DEVELOPMENT.md)
- Guía de deployment (DEPLOYMENT.md)
- Índice de documentación (INDEX.md)

### 🔧 Corregido

#### Issue #1: Discrepancia en Cálculo de Deducciones
**Fecha**: 2025-04-10

**Problema**:
- Panel de admin mostraba: 71.9% eficiencia, $71,000 deducciones
- Vista de usuario mostraba: 67% eficiencia, $85,199 deducciones
- Diferencia de $14,199 = 3 días de "Día No Remunerado" (item '11')

**Causa Raíz**:
- `/api/user/global-efficiency` filtraba por `afectaDesempeno`
- `lib/services/bonuses.service.ts` calculaba TODAS las deducciones

**Solución**:
- Actualizado `bonuses.service.ts` para filtrar por `afectaDesempeno === true`
- Item '11' (Día No Remunerado) ahora correctamente excluido del cálculo
- Datos consistentes entre admin y vista de usuario

**Commits**: `fix: corregir cálculo de deducciones en bonuses.service`

---

#### Issue #2: Eficiencia Anual No Visible en Grid
**Fecha**: 2025-04-12

**Problema**:
- Grid de operadores solo mostraba eficiencia actual/mensual
- Usuario solicitó agregar eficiencia anual del año
- Color de tarjeta debía ser verde

**Solución Implementada**:
1. Identificado componente correcto: `operator-rankings.tsx`
2. Agregada lógica de carga por lotes (10 operadores por vez)
3. API utilizada: `/api/user/global-efficiency?userCode=${codigo}&year=${año}`
4. Cache inteligente para evitar recargas innecesarias
5. Layout actualizado: [Eficiencia Actual][Eficiencia Anual][Bonos][KM]
6. Color verde aplicado a tarjeta de eficiencia anual

**Estados Agregados**:
- `operatorsWithAnnualEfficiency`
- `isLoadingAnnualEfficiency`
- `lastOperatorsHash`

**Commits**: `feat: agregar eficiencia anual en grid de operadores`

---

#### Issue #3: Discrepancias con Cálculos de Excel
**Fecha**: 2025-04-08

**Problema Reportado**:
Diferencias entre eficiencia calculada en Excel vs Aplicación:
- Código 0046: Excel 92.1% vs App 90.6% (diferencia: 1.5%)
- Código 0199: Excel 98.0% vs App 97.7% (diferencia: 0.3%)
- Código 0739: Excel 94.6% vs App 93.4% (diferencia: 1.2%)
- Código 1118: Excel 93.0% vs App 88.7% (diferencia: 4.3%)
- Y otros casos similares...

**Análisis**:
- La aplicación calcula: `(bonusPercentage + kmPercentage) / 2`
- Los valores de Excel son consistentemente más altos
- Sugiere fórmula diferente o consideración de otros factores

**Estado**: 
- ✅ Fórmula documentada en BUSINESS_LOGIC.md
- ✅ Validación con datos reales pendiente
- ⚠️ Posible diferencia en ponderación o factores adicionales en Excel

**Nota**: Se requiere validación con el equipo de negocio para confirmar fórmula correcta.

### 🚀 Optimizaciones

#### Performance
- Implementado connection pooling con 50 conexiones simultáneas
- Caché Redis con TTL configurable por tipo de dato
- Request deduplication (5 segundos) para evitar queries duplicadas
- Índices compuestos en tablas principales
- Lazy loading de componentes pesados
- Code splitting automático por ruta

#### Base de Datos
- Índices en columnas frecuentemente consultadas
- Query optimization con EXPLAIN
- Connection timeout: 5 minutos
- Keep-alive habilitado
- Prepared statements para seguridad

#### Frontend
- Server-side rendering (SSR) con Next.js
- React Query para cache de cliente (5 minutos)
- Memoización de cálculos costosos
- Virtual scrolling para listas grandes
- Image optimization automática

### 📚 Documentación

#### Documentos Creados
- `README.md` - Descripción general y setup
- `docs/API.md` - Documentación completa de endpoints
- `docs/ARCHITECTURE.md` - Arquitectura técnica detallada
- `docs/DATABASE.md` - Esquema y optimizaciones de DB
- `docs/BUSINESS_LOGIC.md` - Fórmulas y reglas de negocio
- `docs/DEVELOPMENT.md` - Guía para desarrolladores
- `docs/DEPLOYMENT.md` - Instrucciones de deployment
- `docs/INDEX.md` - Índice y navegación de documentación
- `CHANGELOG.md` - Este archivo

#### Ejemplos Agregados
- Ejemplos de uso de API
- Casos de prueba de cálculos
- Configuraciones de deployment
- Scripts de mantenimiento

### 🔐 Seguridad

- Autenticación basada en sesión
- Validación de datos con Zod
- Prepared statements para prevenir SQL injection
- Variables de entorno para credenciales
- HTTPS configurado en producción
- Security headers en Nginx

### 🏗️ Infraestructura

#### Soportado
- Deployment en VPS/Servidor dedicado con PM2
- Deployment en Vercel (serverless)
- Deployment con Docker Compose
- Configuración de Nginx como reverse proxy
- SSL con Let's Encrypt
- Redis para caché distribuido

#### Monitoreo
- Health check endpoint: `/api/health`
- Logs estructurados con PM2
- Métricas de base de datos
- Cache hit rate tracking

---

## [0.9.0] - 2025-03-20

### ✨ Agregado
- Beta inicial del sistema
- Funcionalidades básicas de dashboard
- Cálculo simple de eficiencia
- Login y autenticación básica

### 🐛 Conocido
- Cálculos de eficiencia con discrepancias
- Falta eficiencia anual
- Performance no optimizado

---

## [0.5.0] - 2025-02-15

### ✨ Agregado
- Prototipo inicial
- Estructura básica de Next.js
- Conexión a base de datos
- UI básica con Tailwind CSS

---

## Roadmap Futuro

### [1.1.0] - Planeado

#### Features
- [ ] Notificaciones push para alertas
- [ ] Dashboard de administrador mejorado
- [ ] Reportes automáticos por email
- [ ] Integración con sistema de nómina
- [ ] App móvil (React Native)
- [ ] Sistema de comentarios y feedback
- [ ] Histórico de cambios de categoría
- [ ] Alertas tempranas de bajo desempeño

#### Mejoras
- [ ] Gráficos más interactivos (D3.js)
- [ ] Filtros avanzados con múltiples criterios
- [ ] Exportación a múltiples formatos (PDF, CSV)
- [ ] Modo oscuro completo
- [ ] Internacionalización (i18n)
- [ ] Offline support con PWA

#### Optimizaciones
- [ ] Caché de segundo nivel
- [ ] Query optimization avanzada
- [ ] Compresión de imágenes automática
- [ ] Lazy loading más agresivo
- [ ] Service Workers para cache

### [1.2.0] - Futuro

#### Features
- [ ] Machine Learning para predicción de desempeño
- [ ] Análisis predictivo de tendencias
- [ ] Recomendaciones personalizadas
- [ ] Gamificación del sistema
- [ ] Integración con APIs externas
- [ ] Dashboard personalizable

---

## Convenciones de Versionado

- **Major (X.0.0)**: Cambios incompatibles con versiones anteriores
- **Minor (0.X.0)**: Nuevas funcionalidades compatibles
- **Patch (0.0.X)**: Correcciones de bugs

### Tipos de Cambios

- **✨ Agregado**: Nuevas funcionalidades
- **🔧 Corregido**: Correcciones de bugs
- **🚀 Optimizaciones**: Mejoras de rendimiento
- **📚 Documentación**: Cambios en documentación
- **🔐 Seguridad**: Mejoras de seguridad
- **⚠️ Deprecado**: Funcionalidades que serán removidas
- **🗑️ Removido**: Funcionalidades eliminadas

---

## Contribuciones

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

**Importante**: Sigue las convenciones de commits y agrega entrada en CHANGELOG.md

---

## Mantenedores

- Equipo de Desarrollo SAO6

---

_Este changelog es actualizado con cada release del proyecto._

# Documentación de Base de Datos

Esta documentación describe el esquema y la estructura de la base de datos del Sistema de Indicadores de Desempeño.

## 📋 Tabla de Contenidos

- [Información General](#información-general)
- [Esquema de Datos](#esquema-de-datos)
- [Tablas Principales](#tablas-principales)
- [Relaciones](#relaciones)
- [Índices](#índices)
- [Consultas Comunes](#consultas-comunes)
- [Optimizaciones](#optimizaciones)

---

## 🗄️ Información General

### Tecnología
- **DBMS**: MySQL 8.0+
- **Charset**: utf8mb4
- **Collation**: utf8mb4_unicode_ci
- **Engine**: InnoDB

### Configuración de Conexión

```javascript
{
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  connectionLimit: 50,
  waitForConnections: true,
  queueLimit: 0,
  idleTimeout: 300000, // 5 minutos
  enableKeepAlive: true
}
```

---

## 📊 Esquema de Datos

### Diagrama Entidad-Relación

```
┌─────────────────┐
│    usuarios     │
│─────────────────│
│ id (PK)         │───┐
│ codigo (UK)     │   │
│ nombre          │   │
│ cedula          │   │
│ telefono        │   │
│ zona            │   │
│ padrino         │   │
│ tarea           │   │
│ fecha_ingreso   │   │
│ fecha_retiro    │   │
│ fecha_nacimiento│   │
│ rol             │   │
│ password        │   │
│ isAdmin         │   │
└─────────────────┘   │
                      │
        ┌─────────────┼─────────────┬──────────────┐
        ↓             ↓             ↓              ↓
┌─────────────┐ ┌───────────┐ ┌──────────┐ ┌────────────┐
│   bonos     │ │kilometros │ │novedades │ │ categorias │
│─────────────│ │───────────│ │──────────│ │────────────│
│ id (PK)     │ │ id (PK)   │ │ id (PK)  │ │ id (PK)    │
│ usuario_id  │ │usuario_id │ │usuario_id│ │ nombre     │
│ fecha       │ │ fecha     │ │ fecha    │ │ min_perc   │
│ monto       │ │ programado│ │ item     │ │ max_perc   │
│ tipo        │ │ ejecutado │ │ causa    │ │ color      │
│ estado      │ │ porcentaje│ │ monto    │ └────────────┘
│ porcentaje  │ │ ruta      │ │ obs      │
└─────────────┘ └───────────┘ └──────────┘
```

---

## 📋 Tablas Principales

### 1. usuarios

Almacena la información de todos los operadores del sistema.

```sql
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(10) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  cedula VARCHAR(20) UNIQUE,
  telefono VARCHAR(20),
  zona VARCHAR(100),
  padrino VARCHAR(255),
  tarea VARCHAR(100),
  fecha_ingreso DATE,
  fecha_retiro DATE NULL,
  fecha_nacimiento DATE,
  rol ENUM('Operador', 'Administrador', 'Supervisor') DEFAULT 'Operador',
  password VARCHAR(255),
  isAdmin BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_codigo (codigo),
  INDEX idx_zona (zona),
  INDEX idx_tarea (tarea),
  INDEX idx_activo (activo),
  INDEX idx_fecha_ingreso (fecha_ingreso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Campos:**
- `id`: Identificador único auto-incremental
- `codigo`: Código del operador (ej: "0046")
- `nombre`: Nombre completo del operador
- `cedula`: Número de identificación
- `telefono`: Número de contacto
- `zona`: Zona de operación (Norte, Sur, Este, Oeste)
- `padrino`: Nombre del padrino/supervisor
- `tarea`: Tipo de tarea (Conducción, Apoyo, etc.)
- `fecha_ingreso`: Fecha de ingreso al sistema
- `fecha_retiro`: Fecha de retiro (NULL si está activo)
- `fecha_nacimiento`: Fecha de nacimiento
- `rol`: Rol en el sistema
- `password`: Contraseña hasheada
- `isAdmin`: Bandera de administrador
- `activo`: Estado del operador

---

### 2. bonos

Registra los bonos otorgados a los operadores.

```sql
CREATE TABLE bonos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  fecha DATE NOT NULL,
  monto DECIMAL(12, 2) NOT NULL,
  tipo VARCHAR(100),
  estado ENUM('Pagado', 'Pendiente', 'Rechazado') DEFAULT 'Pendiente',
  porcentaje DECIMAL(5, 2),
  observacion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  
  INDEX idx_usuario_fecha (usuario_id, fecha),
  INDEX idx_fecha (fecha),
  INDEX idx_estado (estado),
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Campos:**
- `id`: Identificador único
- `usuario_id`: ID del operador (FK)
- `fecha`: Fecha del bono
- `monto`: Valor del bono en pesos
- `tipo`: Tipo de bono (Base, Cumplimiento, etc.)
- `estado`: Estado del pago
- `porcentaje`: Porcentaje de cumplimiento
- `observacion`: Notas adicionales

**Valores de Bono Base:**
- Bono Completo: $142,000
- 0.50 del Bono: $71,000
- 0.25 del Bono: $35,500

---

### 3. kilometros

Registra los kilómetros programados y ejecutados.

```sql
CREATE TABLE kilometros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  fecha DATE NOT NULL,
  programado DECIMAL(10, 2) NOT NULL,
  ejecutado DECIMAL(10, 2) NOT NULL,
  porcentaje DECIMAL(5, 2),
  ruta VARCHAR(255),
  vehiculo VARCHAR(50),
  observacion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  
  INDEX idx_usuario_fecha (usuario_id, fecha),
  INDEX idx_fecha (fecha),
  INDEX idx_ruta (ruta),
  INDEX idx_porcentaje (porcentaje)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Campos:**
- `id`: Identificador único
- `usuario_id`: ID del operador (FK)
- `fecha`: Fecha de la ruta
- `programado`: KM programados
- `ejecutado`: KM ejecutados
- `porcentaje`: Porcentaje de cumplimiento (ejecutado/programado * 100)
- `ruta`: Nombre/código de la ruta
- `vehiculo`: Identificador del vehículo
- `observacion`: Notas adicionales

---

### 4. novedades

Registra las deducciones y novedades que afectan el desempeño.

```sql
CREATE TABLE novedades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  fecha DATE NOT NULL,
  item VARCHAR(10) NOT NULL,
  causa VARCHAR(255) NOT NULL,
  monto DECIMAL(12, 2) NOT NULL,
  porcentaje_retirar VARCHAR(10),
  afecta_desempeno BOOLEAN DEFAULT TRUE,
  observacion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  
  INDEX idx_usuario_fecha (usuario_id, fecha),
  INDEX idx_fecha (fecha),
  INDEX idx_item (item),
  INDEX idx_afecta_desempeno (afecta_desempeno)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Campos:**
- `id`: Identificador único
- `usuario_id`: ID del operador (FK)
- `fecha`: Fecha de la novedad
- `item`: Código del item (1-13, DL, DG, etc.)
- `causa`: Descripción de la causa
- `monto`: Monto de la deducción
- `porcentaje_retirar`: Porcentaje o 'Día'
- `afecta_desempeno`: Si afecta el cálculo de desempeño
- `observacion`: Detalles adicionales

**Items de Deducciones:**

| Item | Causa | Porcentaje | Monto | Afecta Desempeño |
|------|-------|------------|-------|------------------|
| 0 | Sin Deducción | 0 | $0 | No |
| 1 | Incapacidad | 0.25 | $35,500 | Sí |
| 2 | Ausentismo | 1.00 | $142,000 | Sí |
| 3 | Incapacidad > 7 días | Día | $4,733 | Sí |
| 4 | Calamidad | Día | $4,733 | No |
| 5 | Retardo | 0.25 | $35,500 | Sí |
| 6 | Renuncia | Día | $4,733 | Sí |
| 7 | Vacaciones | Día | $4,733 | No |
| 8 | Suspensión | Día | $4,733 | Sí |
| 9 | No Ingreso | Día | $4,733 | No |
| 10 | Restricción | 1.00 | $142,000 | Sí |
| 11 | Día No Remunerado | Día | $4,733 | No |
| 12 | Retardo por Horas | 0.50 | $71,000 | Sí |
| 13 | DNR por Horas | 0 | $0 | No |
| DL | Daño Leve | 0.25 | $35,500 | Sí |
| DG | Daño Grave | 0.50 | $71,000 | Sí |
| DGV | Daño Gravísimo | 1.00 | $142,000 | Sí |

---

### 5. categorias

Define las categorías de desempeño.

```sql
CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  min_porcentaje DECIMAL(5, 2) NOT NULL,
  max_porcentaje DECIMAL(5, 2) NOT NULL,
  color_hex VARCHAR(7),
  descripcion TEXT,
  orden INT,
  
  INDEX idx_nombre (nombre),
  INDEX idx_rango (min_porcentaje, max_porcentaje)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Datos por defecto:**

```sql
INSERT INTO categorias (nombre, min_porcentaje, max_porcentaje, color_hex, orden) VALUES
('Oro', 95.00, 100.00, '#FFD700', 1),
('Plata', 90.00, 94.99, '#C0C0C0', 2),
('Bronce', 85.00, 89.99, '#CD7F32', 3),
('Mejorar', 80.00, 84.99, '#FCD34D', 4),
('Taller Conciencia', 0.00, 79.99, '#EF4444', 5);
```

---

### 6. zonas

Catálogo de zonas de operación.

```sql
CREATE TABLE zonas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 7. tareas

Catálogo de tipos de tareas.

```sql
CREATE TABLE tareas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔗 Relaciones

### Diagrama de Relaciones

```
usuarios (1) ──── (N) bonos
usuarios (1) ──── (N) kilometros
usuarios (1) ──── (N) novedades
```

### Integridad Referencial

- **ON DELETE CASCADE**: Al eliminar un usuario, se eliminan todos sus registros relacionados
- **Foreign Keys**: Garantizan consistencia de datos
- **Unique Constraints**: Evitan duplicados

---

## 🔍 Índices

### Índices por Tabla

#### usuarios
```sql
INDEX idx_codigo (codigo)              -- Búsqueda por código
INDEX idx_zona (zona)                  -- Filtro por zona
INDEX idx_tarea (tarea)                -- Filtro por tarea
INDEX idx_activo (activo)              -- Filtro por estado
INDEX idx_fecha_ingreso (fecha_ingreso) -- Ordenamiento por antigüedad
```

#### bonos
```sql
INDEX idx_usuario_fecha (usuario_id, fecha)  -- Query principal
INDEX idx_fecha (fecha)                       -- Filtro temporal
INDEX idx_estado (estado)                     -- Filtro por estado
INDEX idx_tipo (tipo)                         -- Filtro por tipo
```

#### kilometros
```sql
INDEX idx_usuario_fecha (usuario_id, fecha)  -- Query principal
INDEX idx_fecha (fecha)                       -- Filtro temporal
INDEX idx_ruta (ruta)                         -- Filtro por ruta
INDEX idx_porcentaje (porcentaje)             -- Ordenamiento
```

#### novedades
```sql
INDEX idx_usuario_fecha (usuario_id, fecha)     -- Query principal
INDEX idx_fecha (fecha)                          -- Filtro temporal
INDEX idx_item (item)                            -- Filtro por tipo
INDEX idx_afecta_desempeno (afecta_desempeno)  -- Filtro crítico
```

---

## 📝 Consultas Comunes

### 1. Eficiencia Global de Usuario

```sql
SELECT 
  u.codigo,
  u.nombre,
  -- Bonos
  COALESCE(SUM(b.monto), 0) as total_bonos,
  -- Deducciones que afectan desempeño
  COALESCE(SUM(CASE WHEN n.afecta_desempeno = TRUE THEN n.monto ELSE 0 END), 0) as total_deducciones,
  -- Eficiencia de bonos
  ((COALESCE(SUM(b.monto), 0) - COALESCE(SUM(CASE WHEN n.afecta_desempeno = TRUE THEN n.monto ELSE 0 END), 0)) 
   / NULLIF(COALESCE(SUM(b.monto), 0), 0) * 100) as eficiencia_bonos,
  -- KM
  COALESCE(SUM(k.ejecutado), 0) as km_ejecutado,
  COALESCE(SUM(k.programado), 0) as km_programado,
  -- Eficiencia de KM
  (COALESCE(SUM(k.ejecutado), 0) / NULLIF(COALESCE(SUM(k.programado), 0), 0) * 100) as eficiencia_km,
  -- Eficiencia Global
  (((COALESCE(SUM(b.monto), 0) - COALESCE(SUM(CASE WHEN n.afecta_desempeno = TRUE THEN n.monto ELSE 0 END), 0)) 
   / NULLIF(COALESCE(SUM(b.monto), 0), 0) * 100) +
   (COALESCE(SUM(k.ejecutado), 0) / NULLIF(COALESCE(SUM(k.programado), 0), 0) * 100)) / 2 as eficiencia_global
FROM usuarios u
LEFT JOIN bonos b ON u.id = b.usuario_id
LEFT JOIN kilometros k ON u.id = k.usuario_id
LEFT JOIN novedades n ON u.id = n.usuario_id
WHERE u.codigo = ?
  AND (b.fecha IS NULL OR YEAR(b.fecha) = ? AND MONTH(b.fecha) = ?)
  AND (k.fecha IS NULL OR YEAR(k.fecha) = ? AND MONTH(k.fecha) = ?)
  AND (n.fecha IS NULL OR YEAR(n.fecha) = ? AND MONTH(n.fecha) = ?)
GROUP BY u.id, u.codigo, u.nombre;
```

### 2. Ranking de Operadores

```sql
SELECT 
  u.codigo,
  u.nombre,
  u.zona,
  -- Eficiencia global calculada
  (((COALESCE(SUM(b.monto), 0) - COALESCE(SUM(CASE WHEN n.afecta_desempeno = TRUE THEN n.monto ELSE 0 END), 0)) 
   / NULLIF(COALESCE(SUM(b.monto), 0), 0) * 100) +
   (COALESCE(SUM(k.ejecutado), 0) / NULLIF(COALESCE(SUM(k.programado), 0), 0) * 100)) / 2 as eficiencia
FROM usuarios u
LEFT JOIN bonos b ON u.id = b.usuario_id 
  AND YEAR(b.fecha) = ? AND MONTH(b.fecha) = ?
LEFT JOIN kilometros k ON u.id = k.usuario_id
  AND YEAR(k.fecha) = ? AND MONTH(k.fecha) = ?
LEFT JOIN novedades n ON u.id = n.usuario_id
  AND YEAR(n.fecha) = ? AND MONTH(n.fecha) = ?
WHERE u.activo = TRUE
GROUP BY u.id
HAVING eficiencia IS NOT NULL
ORDER BY eficiencia DESC
LIMIT 100;
```

### 3. Deducciones de Usuario en Periodo

```sql
SELECT 
  n.fecha,
  n.item,
  n.causa,
  n.monto,
  n.porcentaje_retirar,
  n.afecta_desempeno,
  n.observacion
FROM novedades n
JOIN usuarios u ON n.usuario_id = u.id
WHERE u.codigo = ?
  AND YEAR(n.fecha) = ?
  AND MONTH(n.fecha) = ?
ORDER BY n.fecha DESC;
```

### 4. Bonos de Usuario en Periodo

```sql
SELECT 
  b.fecha,
  b.monto,
  b.tipo,
  b.estado,
  b.porcentaje,
  b.observacion
FROM bonos b
JOIN usuarios u ON b.usuario_id = u.id
WHERE u.codigo = ?
  AND YEAR(b.fecha) = ?
  AND MONTH(b.fecha) = ?
ORDER BY b.fecha DESC;
```

### 5. Kilómetros de Usuario en Periodo

```sql
SELECT 
  k.fecha,
  k.programado,
  k.ejecutado,
  k.porcentaje,
  k.ruta,
  k.vehiculo
FROM kilometros k
JOIN usuarios u ON k.usuario_id = u.id
WHERE u.codigo = ?
  AND YEAR(k.fecha) = ?
  AND MONTH(k.fecha) = ?
ORDER BY k.fecha DESC;
```

### 6. Estadísticas por Categoría

```sql
SELECT 
  CASE 
    WHEN eficiencia >= 95 THEN 'Oro'
    WHEN eficiencia >= 90 THEN 'Plata'
    WHEN eficiencia >= 85 THEN 'Bronce'
    WHEN eficiencia >= 80 THEN 'Mejorar'
    ELSE 'Taller Conciencia'
  END as categoria,
  COUNT(*) as cantidad,
  AVG(eficiencia) as promedio_eficiencia,
  MIN(eficiencia) as min_eficiencia,
  MAX(eficiencia) as max_eficiencia
FROM (
  SELECT 
    u.id,
    (((COALESCE(SUM(b.monto), 0) - COALESCE(SUM(CASE WHEN n.afecta_desempeno = TRUE THEN n.monto ELSE 0 END), 0)) 
     / NULLIF(COALESCE(SUM(b.monto), 0), 0) * 100) +
     (COALESCE(SUM(k.ejecutado), 0) / NULLIF(COALESCE(SUM(k.programado), 0), 0) * 100)) / 2 as eficiencia
  FROM usuarios u
  LEFT JOIN bonos b ON u.id = b.usuario_id
  LEFT JOIN kilometros k ON u.id = k.usuario_id
  LEFT JOIN novedades n ON u.id = n.usuario_id
  WHERE u.activo = TRUE
  GROUP BY u.id
) as operadores
GROUP BY categoria
ORDER BY 
  CASE categoria
    WHEN 'Oro' THEN 1
    WHEN 'Plata' THEN 2
    WHEN 'Bronce' THEN 3
    WHEN 'Mejorar' THEN 4
    ELSE 5
  END;
```

---

## ⚡ Optimizaciones

### 1. Índices Compuestos

Los índices compuestos `(usuario_id, fecha)` optimizan las consultas más frecuentes:

```sql
-- Beneficia consultas como:
SELECT * FROM bonos 
WHERE usuario_id = ? AND fecha BETWEEN ? AND ?
```

### 2. EXPLAIN para Análisis

Usar `EXPLAIN` para identificar consultas lentas:

```sql
EXPLAIN SELECT ...
```

### 3. Particionamiento (Para tablas grandes)

```sql
-- Particionar por año (opcional para tablas muy grandes)
ALTER TABLE bonos PARTITION BY RANGE (YEAR(fecha)) (
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### 4. Vistas Materializadas (Alternativa)

```sql
-- Vista para eficiencias globales (puede ser materializada)
CREATE VIEW v_eficiencias_globales AS
SELECT 
  u.id,
  u.codigo,
  u.nombre,
  -- ... cálculos de eficiencia ...
FROM usuarios u
LEFT JOIN bonos b ON ...
-- ... resto de la query
```

### 5. Archivado de Datos Antiguos

```sql
-- Tabla de archivo para datos históricos
CREATE TABLE bonos_archivo LIKE bonos;

-- Mover datos antiguos
INSERT INTO bonos_archivo 
SELECT * FROM bonos WHERE fecha < DATE_SUB(NOW(), INTERVAL 2 YEAR);

DELETE FROM bonos WHERE fecha < DATE_SUB(NOW(), INTERVAL 2 YEAR);
```

---

## 🔧 Mantenimiento

### Scripts de Mantenimiento

#### Limpieza de datos duplicados

```sql
-- Identificar duplicados
SELECT usuario_id, fecha, COUNT(*) as count
FROM bonos
GROUP BY usuario_id, fecha
HAVING count > 1;
```

#### Recalcular porcentajes

```sql
-- Actualizar porcentajes de kilometros
UPDATE kilometros
SET porcentaje = (ejecutado / NULLIF(programado, 0) * 100)
WHERE programado > 0;
```

#### Verificar integridad

```sql
-- Verificar usuarios sin datos
SELECT u.codigo, u.nombre
FROM usuarios u
LEFT JOIN bonos b ON u.id = b.usuario_id
LEFT JOIN kilometros k ON u.id = k.usuario_id
WHERE u.activo = TRUE
  AND b.id IS NULL
  AND k.id IS NULL;
```

---

## 📦 Backup y Restauración

### Backup Completo

```bash
mysqldump -u usuario -p nombre_base_datos > backup_$(date +%Y%m%d).sql
```

### Backup de Tablas Específicas

```bash
mysqldump -u usuario -p nombre_base_datos usuarios bonos kilometros novedades > backup_core.sql
```

### Restauración

```bash
mysql -u usuario -p nombre_base_datos < backup_20250415.sql
```

---

**Última actualización**: 2025-04-15

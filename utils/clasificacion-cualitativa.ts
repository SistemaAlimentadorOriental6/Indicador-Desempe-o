/**
 * Sistema de clasificación cualitativa para operadores
 * Basado en porcentajes de Bono y Km según las reglas establecidas
 */

export type CategoriaOperador = "Oro" | "Plata" | "Bronce" | "Mejorar" | "Taller Conciencia";

export interface RangoClasificacion {
  categoria: CategoriaOperador;
  bono: {
    minimo?: number;
    maximo?: number;
  };
  km: {
    minimo?: number;
    maximo?: number;
  };
}

// Definición de rangos para clasificación de Bono
export const RANGOS_BONO: RangoClasificacion[] = [
  {
    categoria: "Oro",
    bono: { minimo: 100, maximo: 100 }, // Exactamente 100%
    km: { minimo: 0, maximo: 100 } // No importa el km para Oro en bono
  },
  {
    categoria: "Plata",
    bono: { minimo: 95, maximo: 100 }, // 95% - 99.99%
    km: { minimo: 0, maximo: 100 }
  },
  {
    categoria: "Bronce",
    bono: { minimo: 90, maximo: 95 }, // 90% - 94.99%
    km: { minimo: 0, maximo: 100 }
  },
  {
    categoria: "Mejorar",
    bono: { minimo: 60, maximo: 90 }, // 60% - 89.99%
    km: { minimo: 0, maximo: 100 }
  },
  {
    categoria: "Taller Conciencia",
    bono: { minimo: 0, maximo: 60 }, // Menos de 60% (0% - 59.99%)
    km: { minimo: 0, maximo: 100 }
  }
];

// Definición de rangos para clasificación de Km
export const RANGOS_KM: RangoClasificacion[] = [
  {
    categoria: "Oro",
    bono: { minimo: 0, maximo: 100 },
    km: { minimo: 94 } // 94% o más
  },
  {
    categoria: "Plata",
    bono: { minimo: 0, maximo: 100 },
    km: { minimo: 90, maximo: 94 } // 90% - 93.99%
  },
  {
    categoria: "Bronce",
    bono: { minimo: 0, maximo: 100 },
    km: { minimo: 85, maximo: 90 } // 85% - 89.99%
  },
  {
    categoria: "Mejorar",
    bono: { minimo: 0, maximo: 100 },
    km: { minimo: 70, maximo: 85 } // 70% - 84.99%
  },
  {
    categoria: "Taller Conciencia",
    bono: { minimo: 0, maximo: 100 },
    km: { minimo: 0, maximo: 70 } // Menos de 70% (0% - 69.99%)
  }
];

// Matriz de combinaciones para determinar la categoría final
// Formato: MATRIZ_CLASIFICACION[categoriaBono][categoriaKm] = categoriaFinal
export const MATRIZ_CLASIFICACION: Record<CategoriaOperador, Record<CategoriaOperador, CategoriaOperador>> = {
  "Oro": {
    "Oro": "Oro",
    "Plata": "Plata", 
    "Bronce": "Plata",
    "Mejorar": "Bronce",
    "Taller Conciencia": "Bronce"
  },
  "Plata": {
    "Oro": "Plata",
    "Plata": "Plata",
    "Bronce": "Bronce",
    "Mejorar": "Bronce",
    "Taller Conciencia": "Bronce"
  },
  "Bronce": {
    "Oro": "Plata",
    "Plata": "Plata",
    "Bronce": "Bronce",
    "Mejorar": "Bronce",
    "Taller Conciencia": "Bronce"
  },
  "Mejorar": {
    "Oro": "Mejorar",
    "Plata": "Mejorar",
    "Bronce": "Mejorar",
    "Mejorar": "Mejorar",
    "Taller Conciencia": "Taller Conciencia"
  },
  "Taller Conciencia": {
    "Oro": "Taller Conciencia",
    "Plata": "Taller Conciencia", 
    "Bronce": "Taller Conciencia",
    "Mejorar": "Taller Conciencia",
    "Taller Conciencia": "Taller Conciencia"
  }
};

/**
 * Clasifica un porcentaje de bono según los rangos establecidos
 */
export function clasificarBono(porcentajeBono: number): CategoriaOperador {
  // Oro: 100% exacto
  if (porcentajeBono >= 100) {
    return "Oro";
  }
  
  // Plata: 95% - 99.99%
  if (porcentajeBono >= 95 && porcentajeBono < 100) {
    return "Plata";
  }
  
  // Bronce: 90% - 94.99%
  if (porcentajeBono >= 90 && porcentajeBono < 95) {
    return "Bronce";
  }
  
  // Mejorar: 60% - 89.99%
  if (porcentajeBono >= 60 && porcentajeBono < 90) {
    return "Mejorar";
  }
  
  // Taller Conciencia: menos de 60%
  if (porcentajeBono < 60) {
    return "Taller Conciencia";
  }
  
  // Fallback (no debería llegar aquí)
  return "Taller Conciencia";
}

/**
 * Clasifica un porcentaje de kilómetros según los rangos establecidos
 */
export function clasificarKm(porcentajeKm: number): CategoriaOperador {
  // Oro: 94% o más
  if (porcentajeKm >= 94) {
    return "Oro";
  }
  
  // Plata: 90% - 93.99%
  if (porcentajeKm >= 90 && porcentajeKm < 94) {
    return "Plata";
  }
  
  // Bronce: 85% - 89.99%
  if (porcentajeKm >= 85 && porcentajeKm < 90) {
    return "Bronce";
  }
  
  // Mejorar: 70% - 84.99%
  if (porcentajeKm >= 70 && porcentajeKm < 85) {
    return "Mejorar";
  }
  
  // Taller Conciencia: menos de 70%
  if (porcentajeKm < 70) {
    return "Taller Conciencia";
  }
  
  // Fallback (no debería llegar aquí)
  return "Taller Conciencia";
}

/**
 * Determina la categoría final basada en las clasificaciones de bono y km
 */
export function determinarCategoriaFinal(
  porcentajeBono: number,
  porcentajeKm: number
): CategoriaOperador {
  const categoriaBono = clasificarBono(porcentajeBono);
  const categoriaKm = clasificarKm(porcentajeKm);
  
  return MATRIZ_CLASIFICACION[categoriaBono][categoriaKm];
}

/**
 * Función principal para clasificar un operador
 */
export function clasificarOperador(
  porcentajeBono: number,
  porcentajeKm: number
): {
  categoriaFinal: CategoriaOperador;
  categoriaBono: CategoriaOperador;
  categoriaKm: CategoriaOperador;
  detalles: {
    bono: number;
    km: number;
    razonamiento: string;
  };
} {
  const categoriaBono = clasificarBono(porcentajeBono);
  const categoriaKm = clasificarKm(porcentajeKm);
  const categoriaFinal = MATRIZ_CLASIFICACION[categoriaBono][categoriaKm];
  
  const razonamiento = `Bono: ${porcentajeBono}% (${categoriaBono}) + Km: ${porcentajeKm}% (${categoriaKm}) = ${categoriaFinal}`;
  
  return {
    categoriaFinal,
    categoriaBono,
    categoriaKm,
    detalles: {
      bono: porcentajeBono,
      km: porcentajeKm,
      razonamiento
    }
  };
}

/**
 * Función de utilidad para validar si los porcentajes están en rangos válidos
 */
export function validarPorcentajes(bono: number, km: number): {
  esValido: boolean;
  errores: string[];
} {
  const errores: string[] = [];
  
  if (bono < 0 || bono > 100) {
    errores.push(`Porcentaje de bono inválido: ${bono}%. Debe estar entre 0% y 100%.`);
  }
  
  if (km < 0 || km > 100) {
    errores.push(`Porcentaje de km inválido: ${km}%. Debe estar entre 0% y 100%.`);
  }
  
  return {
    esValido: errores.length === 0,
    errores
  };
}

/**
 * Función para obtener información detallada sobre una categoría
 */
export function obtenerInfoCategoria(categoria: CategoriaOperador): {
  nombre: string;
  descripcion: string;
  rangosBono: string;
  rangosKm: string;
  color: string;
} {
  const info = {
    "Oro": {
      nombre: "Oro",
      descripcion: "Excelente desempeño en ambos indicadores",
      rangosBono: "100%",
      rangosKm: "≥94%",
      color: "amarillo"
    },
    "Plata": {
      nombre: "Plata",
      descripcion: "Muy buen desempeño general",
      rangosBono: "95-99%",
      rangosKm: "90-93%",
      color: "gris"
    },
    "Bronce": {
      nombre: "Bronce",
      descripcion: "Buen desempeño con oportunidades de mejora",
      rangosBono: "90-94%",
      rangosKm: "85-89%",
      color: "ámbar"
    },
    "Mejorar": {
      nombre: "Mejorar",
      descripcion: "Requiere atención y mejora en el desempeño",
      rangosBono: "60-89%",
      rangosKm: "70-84%",
      color: "naranja"
    },
    "Taller Conciencia": {
      nombre: "Taller de Conciencia",
      descripcion: "Necesita intervención inmediata y capacitación",
      rangosBono: "<60%",
      rangosKm: "<70%",
      color: "rojo"
    }
  };
  
  return info[categoria];
}

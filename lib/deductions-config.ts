export interface DeductionRule {
  item: string;
  causa: string;
  porcentajeRetirar?: number | 'Día';
  valorActual: number;
  observacion: 'Sí' | 'No Afecta Desempeño';
  afectaDesempeno: boolean;
}

export const DEDUCTION_RULES: DeductionRule[] = [
  // Novedades que afectan rendimiento
  { item: '0', causa: 'Sin Deducción', porcentajeRetirar: 0, valorActual: 0, observacion: 'No Afecta Desempeño', afectaDesempeno: false },
  { item: '1', causa: 'Incapacidad', porcentajeRetirar: 0.25, valorActual: 35500, observacion: 'Sí', afectaDesempeno: true },
  { item: '2', causa: 'Ausentismo', porcentajeRetirar: 1.00, valorActual: 142000, observacion: 'Sí', afectaDesempeno: true },
  { item: '5', causa: 'Retardo', porcentajeRetirar: 0.25, valorActual: 35500, observacion: 'Sí', afectaDesempeno: true },
  { item: '6', causa: 'Renuncia', porcentajeRetirar: 'Día', valorActual: 4733, observacion: 'Sí', afectaDesempeno: true },
  { item: '8', causa: 'Suspensión', porcentajeRetirar: 'Día', valorActual: 4733, observacion: 'Sí', afectaDesempeno: true },
  { item: '10', causa: 'Restricción', porcentajeRetirar: 1.00, valorActual: 142000, observacion: 'Sí', afectaDesempeno: true },
  { item: '12', causa: 'Retardo por Horas', porcentajeRetirar: 0.50, valorActual: 71000, observacion: 'Sí', afectaDesempeno: true },
  
  // Novedades que NO afectan rendimiento
  { item: '3', causa: 'Incapacidad > 7 días', porcentajeRetirar: 'Día', valorActual: 4733, observacion: 'Sí', afectaDesempeno: true },
  { item: '4', causa: 'Calamidad', porcentajeRetirar: 'Día', valorActual: 4733, observacion: 'No Afecta Desempeño', afectaDesempeno: false },
  { item: '7', causa: 'Vacaciones', porcentajeRetirar: 'Día', valorActual: 4733, observacion: 'No Afecta Desempeño', afectaDesempeno: false },
  { item: '9', causa: 'No Ingreso', porcentajeRetirar: 'Día', valorActual: 4733, observacion: 'No Afecta Desempeño', afectaDesempeno: false },
  { item: '11', causa: 'Día No Remunerado', porcentajeRetirar: 'Día', valorActual: 4733, observacion: 'No Afecta Desempeño', afectaDesempeno: false },
  { item: '13', causa: 'Día No Remunerado por Horas', porcentajeRetirar: 0, valorActual: 0, observacion: 'No Afecta Desempeño', afectaDesempeno: false },

  // Desincentivos y Novedades (afectan rendimiento)
  { item: 'DL', causa: 'Daño Leve', porcentajeRetirar: 0.25, valorActual: 35500, observacion: 'Sí', afectaDesempeno: true },
  { item: 'DG', causa: 'Daño Grave', porcentajeRetirar: 0.50, valorActual: 71000, observacion: 'Sí', afectaDesempeno: true },
  { item: 'DGV', causa: 'Daño Gravísimo', porcentajeRetirar: 1.00, valorActual: 142000, observacion: 'Sí', afectaDesempeno: true },
  { item: 'DEL', causa: 'Desincentivo Leve', porcentajeRetirar: 0.25, valorActual: 35500, observacion: 'Sí', afectaDesempeno: true },
  { item: 'DEG', causa: 'Desincentivo Grave', porcentajeRetirar: 0.50, valorActual: 71000, observacion: 'Sí', afectaDesempeno: true },
  { item: 'DEGV', causa: 'Desincentivo Gravísimo', porcentajeRetirar: 1.00, valorActual: 142000, observacion: 'Sí', afectaDesempeno: true },
  { item: 'INT', causa: 'Incumplimiento Interno', porcentajeRetirar: 0.25, valorActual: 35500, observacion: 'Sí', afectaDesempeno: true },
  { item: 'OM', causa: 'Falta Menor', porcentajeRetirar: 0.25, valorActual: 35500, observacion: 'Sí', afectaDesempeno: true },
  { item: 'OMD', causa: 'Falta MeDía', porcentajeRetirar: 0.50, valorActual: 71000, observacion: 'Sí', afectaDesempeno: true },
  { item: 'OG', causa: 'Falta Grave', porcentajeRetirar: 1.00, valorActual: 142000, observacion: 'Sí', afectaDesempeno: true },
  { item: 'NPF', causa: 'No presentarse a formación', porcentajeRetirar: 1.00, valorActual: 142000, observacion: 'Sí', afectaDesempeno: true },
  { item: 'HCC-L', causa: 'Hábitos, Conductas Y Comportamientos - Leve', porcentajeRetirar: 0.25, valorActual: 35500, observacion: 'Sí', afectaDesempeno: true },
  { item: 'HCC-G', causa: 'Hábitos, Conductas Y Comportamientos - Grave', porcentajeRetirar: 0.50, valorActual: 71000, observacion: 'Sí', afectaDesempeno: true },
  { item: 'HCC-GV', causa: 'Hábitos, Conductas Y Comportamientos - Gravísimo', porcentajeRetirar: 1.00, valorActual: 142000, observacion: 'Sí', afectaDesempeno: true },
];

export const getDeductionRule = (item: string): DeductionRule | undefined => {
  return DEDUCTION_RULES.find(rule => rule.item === item);
}; 
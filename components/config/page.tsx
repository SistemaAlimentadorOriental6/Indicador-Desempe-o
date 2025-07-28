"use client"

import React, { useState, useCallback, useMemo } from "react"
import * as XLSX from "xlsx"
import StatsCards from "@/components/config/StatsCard"
import { toast } from "@/components/ui/use-toast"
import {
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  Sparkles,
  Database,
  Upload,
  CheckCircle,
  Users,
  MapPin,
  Hash,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  TrendingUp,
  AlertTriangle,
  Car,
} from "lucide-react"
import FileUpload from "./FileUpload"

function getValue(obj: any, keys: string[]): any {
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key]
    const found = Object.keys(obj).find(
      (k) => k.toLowerCase() === key.toLowerCase()
    )
    if (found) return obj[found]
  }
  return undefined
}

function ConfigPage() {
  const [data, setData] = useState<any[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [tab, setTab] = useState<"zonas" | "padrinos" | "novedades" | "kilometros" | "novedades-operadores">("zonas")

  // Zonas
  const [zonasResumen, setZonasResumen] = useState<any>(null)
  const [searchZonas, setSearchZonas] = useState("")
  const [currentPageZonas, setCurrentPageZonas] = useState(1)
  const rowsPerPage = 10

  // Padrinos
  const [padrinosData, setPadrinosData] = useState<any[]>([])
  const [padrinosFileName, setPadrinosFileName] = useState<string>("")
  const [isPadrinosLoading, setIsPadrinosLoading] = useState(false)
  const [isPadrinosSaving, setIsPadrinosSaving] = useState(false)
  const [padrinosResumen, setPadrinosResumen] = useState<any>(null)
  const [searchPadrinos, setSearchPadrinos] = useState("")
  const [currentPagePadrinos, setCurrentPagePadrinos] = useState(1)
  const rowsPerPagePadrinos = 10

  // Novedades
  const [novedadesData, setNovedadesData] = useState<any[]>([])
  const [novedadesFileName, setNovedadesFileName] = useState<string>("")
  const [isNovedadesLoading, setIsNovedadesLoading] = useState(false)
  const [isNovedadesSaving, setIsNovedadesSaving] = useState(false)
  const [novedadesResumen, setNovedadesResumen] = useState<any>(null)
  const [searchNovedades, setSearchNovedades] = useState("")
  const [currentPageNovedades, setCurrentPageNovedades] = useState(1)
  const [duplicateNovedades, setDuplicateNovedades] = useState<any[]>([])
  const rowsPerPageNovedades = 10

  // Kilometros
  const [kilometrosData, setKilometrosData] = useState<any[]>([])
  const [kilometrosFileName, setKilometrosFileName] = useState<string>("")
  const [isKilometrosLoading, setIsKilometrosLoading] = useState(false)
  const [isKilometrosSaving, setIsKilometrosSaving] = useState(false)
  const [kilometrosResumen, setKilometrosResumen] = useState<any>(null)
  const [searchKilometros, setSearchKilometros] = useState("")
  const [currentPageKilometros, setCurrentPageKilometros] = useState(1)
  const [duplicateKilometros, setDuplicateKilometros] = useState<any[]>([])
  const rowsPerPageKilometros = 10

  // Novedades Operadores
  const [novedadesOperadoresData, setNovedadesOperadoresData] = useState<any[]>([])
  const [novedadesOperadoresFileName, setNovedadesOperadoresFileName] = useState<string>("")
  const [isNovedadesOperadoresLoading, setIsNovedadesOperadoresLoading] = useState(false)
  const [isNovedadesOperadoresSaving, setIsNovedadesOperadoresSaving] = useState(false)
  const [novedadesOperadoresResumen, setNovedadesOperadoresResumen] = useState<any>(null)
  const [searchNovedadesOperadores, setSearchNovedadesOperadores] = useState("")
  const [currentPageNovedadesOperadores, setCurrentPageNovedadesOperadores] = useState(1)
  const [duplicateNovedadesOperadores, setDuplicateNovedadesOperadores] = useState<any[]>([])
  const rowsPerPageNovedadesOperadores = 10

  const hasZonasData = data.length > 0
  const hasPadrinosData = padrinosData.length > 0
  const hasNovedadesData = novedadesData.length > 0
  const hasKilometrosData = kilometrosData.length > 0
  const hasNovedadesOperadoresData = novedadesOperadoresData.length > 0

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheetName = workbook.SheetNames.includes("BD") ? "BD" : null
      if (!sheetName)
        throw new Error("El archivo Excel debe tener una hoja llamada 'BD'")
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      if (!jsonData.length)
        throw new Error("La hoja 'BD' está vacía o no contiene datos válidos")
      setData(jsonData)
      setFileName(file.name)

      // Preview: solo comparar, no guardar
      const response = await fetch("/api/admin/zonas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operadores: jsonData, // Enviar datos crudos
          preview: true,
        }),
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { message: await response.text() }
        }
        throw new Error(
          errorData.message || "Error al comparar zonas en el backend"
        )
      }

      const resumen = await response.json()
      setZonasResumen(resumen)

      toast({
        title: "¡Archivo cargado exitosamente!",
        description: `Se procesaron ${jsonData.length} registros correctamente.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error al procesar el archivo:", error)
      toast({
        title: "Error al procesar archivo",
        description:
          error instanceof Error
            ? error.message
            : "Por favor, verifica que sea un archivo Excel válido.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSaveZonas = async () => {
    if (!data.length) return
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/zonas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operadores: data, // Enviar datos crudos (del estado)
          preview: false,
        }),
      })

      if (!response.ok) throw new Error("Error al guardar zonas en el backend")
      const resumen = await response.json()
      setZonasResumen(resumen)

      toast({
        title: "¡Zonas actualizadas!",
        description: "Los cambios se guardaron correctamente.",
        variant: "default",
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearData = () => {
    setData([])
    setFileName("")
    setZonasResumen(null)
  }

  // Estadísticas para padrinos
  const padrinosStats = React.useMemo(() => {
    if (!hasPadrinosData) return null

    const uniquePadrinos = new Set(padrinosData.map((item) => item.PADRINO || item["Padrino"] || item["PADRINO"])).size
    const uniqueZonas = new Set(padrinosData.map((item) => item.ZONA || item["Zona"] || item["ZONA"])).size
    const uniqueConductores = new Set(
      padrinosData.map((item) => item["CODIGO CONDUCTOR"] || item["Codigo Conductor"] || item["CÓDIGO CONDUCTOR"]),
    ).size
    const uniqueCelulares = new Set(padrinosData.map((item) => item.CELULAR || item["Celular"] || item["CELULAR"])).size

    return [
      {
        title: "Padrinos Únicos",
        value: uniquePadrinos,
        icon: Users,
        gradient: "from-cyan-500 to-blue-600",
        bgGradient: "from-cyan-50 to-blue-50",
        borderColor: "border-cyan-200",
      },
      {
        title: "Zonas",
        value: uniqueZonas,
        icon: MapPin,
        gradient: "from-emerald-500 to-teal-600",
        bgGradient: "from-emerald-50 to-teal-50",
        borderColor: "border-emerald-200",
      },
      {
        title: "Conductores",
        value: uniqueConductores,
        icon: Hash,
        gradient: "from-teal-500 to-cyan-600",
        bgGradient: "from-teal-50 to-cyan-50",
        borderColor: "border-teal-200",
      },
      {
        title: "Celulares Únicos",
        value: uniqueCelulares,
        icon: Activity,
        gradient: "from-blue-500 to-indigo-600",
        bgGradient: "from-blue-50 to-indigo-50",
        borderColor: "border-blue-200",
      },
    ]
  }, [padrinosData, hasPadrinosData])

  // Filtrado y paginación de la tabla de zonas
  const zonasFiltradas = useMemo(() => {
    if (!zonasResumen) return []

    const allRows = [
      ...zonasResumen.cambios.map((op: any) => ({ ...op, tipo: "cambio" })),
      ...zonasResumen.sinCambios.map((op: any) => ({ ...op, tipo: "sinCambio" })),
      ...zonasResumen.sinZona.map((op: any) => ({ ...op, tipo: "sinZona" })),
    ]

    if (!searchZonas.trim()) return allRows

    const s = searchZonas.trim().toLowerCase()
    return allRows.filter(
      (op: any) =>
        (op.codigo && op.codigo.toString().toLowerCase().includes(s)) ||
        (op.nombre && op.nombre.toLowerCase().includes(s)) ||
        (op.zona && op.zona.toLowerCase().includes(s))
    )
  }, [zonasResumen, searchZonas])

  const totalPagesZonas = Math.ceil(zonasFiltradas.length / rowsPerPage) || 1
  const paginatedRowsZonas = zonasFiltradas.slice(
    (currentPageZonas - 1) * rowsPerPage,
    currentPageZonas * rowsPerPage
  )

  const handleSearchZonasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchZonas(e.target.value)
    setCurrentPageZonas(1)
  }

  const handlePageChangeZonas = (page: number) => {
    if (page >= 1 && page <= totalPagesZonas) setCurrentPageZonas(page)
  }

  // Filtrado y paginación de la tabla de padrinos
  const padrinosFiltrados = useMemo(() => {
    if (!padrinosResumen) return []
    const allRows = [
      ...padrinosResumen.cambios.map((op: any) => ({ ...op, tipo: "cambio" })),
      ...padrinosResumen.sinCambios.map((op: any) => ({ ...op, tipo: "sinCambio" })),
      ...padrinosResumen.sinPadrino.map((op: any) => ({ ...op, tipo: "sinPadrino" })),
    ]
    if (!searchPadrinos.trim()) return allRows
    const s = searchPadrinos.trim().toLowerCase()
    return allRows.filter(
      (op: any) =>
        (op.codigo && op.codigo.toString().toLowerCase().includes(s)) ||
        (op.nombre && op.nombre.toLowerCase().includes(s)) ||
        (op.padrino && op.padrino.toLowerCase().includes(s))
    )
  }, [padrinosResumen, searchPadrinos])

  const totalPagesPadrinos = Math.ceil(padrinosFiltrados.length / rowsPerPagePadrinos) || 1
  const paginatedRowsPadrinos = padrinosFiltrados.slice(
    (currentPagePadrinos - 1) * rowsPerPagePadrinos,
    currentPagePadrinos * rowsPerPagePadrinos
  )

  const handleSearchPadrinosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPadrinos(e.target.value)
    setCurrentPagePadrinos(1)
  }

  const handlePageChangePadrinos = (page: number) => {
    if (page >= 1 && page <= totalPagesPadrinos) setCurrentPagePadrinos(page)
  }

  // NUEVO: Filtrado y paginación para novedades
  const novedadesFiltradas = useMemo(() => {
    if (!novedadesResumen) return []

    const allRows = [
      ...novedadesResumen.cambios.map((op: any) => ({ ...op, tipo: "cambio" })),
      ...novedadesResumen.sinCambios.map((op: any) => ({ ...op, tipo: "sinCambio" })),
      ...novedadesResumen.sinNovedad.map((op: any) => ({ ...op, tipo: "sinNovedad" })),
    ]

    if (!searchNovedades.trim()) return allRows

    const s = searchNovedades.trim().toLowerCase()
    return allRows.filter(
      (op: any) =>
        (op.codigoEmpleado && op.codigoEmpleado.toString().toLowerCase().includes(s)) ||
        (op.observaciones && op.observaciones.toLowerCase().includes(s))
    )
  }, [novedadesResumen, searchNovedades])

  const totalPagesNovedades = Math.ceil(novedadesFiltradas.length / rowsPerPageNovedades) || 1
  const paginatedRowsNovedades = novedadesFiltradas.slice(
    (currentPageNovedades - 1) * rowsPerPageNovedades,
    currentPageNovedades * rowsPerPageNovedades
  )

  const handleSearchNovedadesChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchNovedades(e.target.value)
    setCurrentPageNovedades(1)
  }

  const handlePageChangeNovedades = (page: number) => {
    if (page >= 1 && page <= totalPagesNovedades)
      setCurrentPageNovedades(page)
  }

  // Filtrado y paginación de la tabla de kilometros
  const kilometrosFiltrados = useMemo(() => {
    if (!kilometrosResumen) return []

    const allRows = [
      ...kilometrosResumen.cambios.map((op: any) => ({ ...op, tipo: "cambio" })),
      ...kilometrosResumen.sinCambios.map((op: any) => ({ ...op, tipo: "sinCambio" })),
      ...kilometrosResumen.sinKilometros.map((op: any) => ({
        ...op,
        tipo: "sinKilometro",
      })),
    ]

    if (!searchKilometros.trim()) return allRows

    const s = searchKilometros.trim().toLowerCase()
    return allRows.filter(
      (op: any) =>
        (op.codigo_empleado && op.codigo_empleado.toString().toLowerCase().includes(s)) ||
        (op.codigo_variable && op.codigo_variable.toLowerCase().includes(s))
    )
  }, [kilometrosResumen, searchKilometros])

  const totalPagesKilometros = Math.ceil(kilometrosFiltrados.length / rowsPerPageKilometros) || 1
  const paginatedRowsKilometros = kilometrosFiltrados.slice(
    (currentPageKilometros - 1) * rowsPerPageKilometros,
    currentPageKilometros * rowsPerPageKilometros
  )

  const handleSearchKilometrosChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchKilometros(e.target.value)
    setCurrentPageKilometros(1)
  }

  const handlePageChangeKilometros = (page: number) => {
    if (page >= 1 && page <= totalPagesKilometros)
      setCurrentPageKilometros(page)
  }

  // Filtrado y paginación de la tabla de novedades operadores
  const novedadesOperadoresFiltradas = useMemo(() => {
    if (!novedadesOperadoresResumen) return []

    const allRows = [
      ...novedadesOperadoresResumen.cambios.map((op: any) => ({ ...op, tipo: "cambio" })),
      ...novedadesOperadoresResumen.sinCambios.map((op: any) => ({ ...op, tipo: "sinCambio" })),
      ...novedadesOperadoresResumen.sinOperador.map((op: any) => ({ ...op, tipo: "sinOperador" })),
    ]

    if (!searchNovedadesOperadores.trim()) return allRows

    const s = searchNovedadesOperadores.trim().toLowerCase()
    return allRows.filter(
      (op: any) =>
        (op.cedula && op.cedula.toString().toLowerCase().includes(s)) ||
        (op.nombre && op.nombre.toLowerCase().includes(s)) ||
        (op.tarea && op.tarea.toLowerCase().includes(s))
    )
  }, [novedadesOperadoresResumen, searchNovedadesOperadores])

  const totalPagesNovedadesOperadores = Math.ceil(novedadesOperadoresFiltradas.length / rowsPerPageNovedadesOperadores) || 1
  const paginatedRowsNovedadesOperadores = novedadesOperadoresFiltradas.slice(
    (currentPageNovedadesOperadores - 1) * rowsPerPageNovedadesOperadores,
    currentPageNovedadesOperadores * rowsPerPageNovedadesOperadores
  )

  const handleSearchNovedadesOperadoresChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchNovedadesOperadores(e.target.value)
    setCurrentPageNovedadesOperadores(1)
  }

  const handlePageChangeNovedadesOperadores = (page: number) => {
    if (page >= 1 && page <= totalPagesNovedadesOperadores)
      setCurrentPageNovedadesOperadores(page)
  }

  // Padrinos
  const handlePadrinosUpload = useCallback(async (file: File) => {
    setIsPadrinosLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheetName = workbook.SheetNames.includes('BD') ? 'BD' : null;
      if (!sheetName) throw new Error("El archivo Excel debe tener una hoja llamada 'BD'");
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      if (!jsonData.length) throw new Error("La hoja 'BD' está vacía o no contiene datos válidos")
      setPadrinosData(jsonData)
      setPadrinosFileName(file.name)
      // Preview: solo comparar, no guardar
      const response = await fetch("/api/admin/padrinos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operadores: jsonData, preview: true }),
      });
      if (!response.ok) throw new Error("Error al comparar padrinos en el backend");
      const resumen = await response.json();
      setPadrinosResumen(resumen);
      toast({ title: "¡Archivo de padrinos cargado!", description: `Se procesaron ${jsonData.length} registros.`, variant: "default" });
    } catch (error) {
      toast({ title: "Error al procesar archivo", description: error instanceof Error ? error.message : "Por favor, verifica que sea un archivo Excel válido.", variant: "destructive" });
    } finally {
      setIsPadrinosLoading(false);
    }
  }, []);

  const handleSavePadrinos = async () => {
    if (!padrinosData.length) return;
    setIsPadrinosSaving(true);
    try {
      const response = await fetch("/api/admin/padrinos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operadores: padrinosData, preview: false }),
      });
      if (!response.ok) throw new Error("Error al guardar padrinos en el backend");
      const resumen = await response.json();
      setPadrinosResumen(resumen);
      toast({ title: "¡Padrinos actualizados!", description: "Los cambios se guardaron correctamente.", variant: "default" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron guardar los cambios de padrinos.", variant: "destructive" });
    } finally {
      setIsPadrinosSaving(false);
    }
  };

  const handleClearPadrinos = () => {
    setPadrinosData([]);
    setPadrinosFileName("");
    setPadrinosResumen(null);
  };

  const handleNovedadesUpload = useCallback(async (file: File) => {
    setIsNovedadesLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true })
      const sheetName = workbook.SheetNames.includes("BD") ? "BD" : null
      if (!sheetName)
        throw new Error("El archivo Excel debe tener una hoja llamada 'BD'")
      const worksheet = workbook.Sheets[sheetName]
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)
      if (!jsonData.length)
        throw new Error("La hoja 'BD' está vacía o no contiene datos válidos")

      // Validar duplicados
      const duplicates: any[] = []
      const uniques = new Set<string>()
      const uniqueData: any[] = []

      const getFormattedDate = (date: any) => {
        if (date instanceof Date) {
          return date.toISOString().slice(0, 10)
        }
        return date
      }

      for (const row of jsonData) {
        const key = [
          getValue(row, ["CÓDIGO EMPLEADO", "codigo_empleado"]),
          getFormattedDate(
            getValue(row, [
              "FECHA INICIO NOVEDAD (YYYY-MM-DD)",
              "fecha_inicio_novedad",
            ])
          ),
          getValue(row, [
            "CÓDIGO FACTOR DE CALIFICACIÓN CONFIABILIDAD HUMANA",
            "codigo_factor",
          ]),
        ].join("-")

        if (uniques.has(key)) {
          duplicates.push(row)
        } else {
          uniques.add(key)
          uniqueData.push(row)
        }
      }

      if (duplicates.length > 0) {
        setDuplicateNovedades(
          duplicates.map((d) => ({
            codigoEmpleado: getValue(d, ["CÓDIGO EMPLEADO", "codigo_empleado"]),
            fechaInicio: getFormattedDate(
              getValue(d, [
                "FECHA INICIO NOVEDAD (YYYY-MM-DD)",
                "fecha_inicio_novedad",
              ])
            ),
            observaciones: getValue(d, ["OBSERVACIONES", "observaciones"]),
          }))
        )
        toast({
          title: "Se encontraron duplicados",
          description: `Se encontraron ${duplicates.length} novedades duplicadas en el archivo. No se procesarán.`,
          variant: "destructive",
        })
      } else {
        setDuplicateNovedades([])
      }

      const transformedData = uniqueData.map((row) => {
        const fechaInicio = getValue(row, ["FECHA INICIO NOVEDAD (YYYY-MM-DD)", "fecha_inicio_novedad"]);
        const fechaFin = getValue(row, ["FECHA FIN NOVEDAD (YYYY-MM-DD)", "fecha_fin_novedad"]);

        return {
          ...row,
          "FECHA INICIO NOVEDAD (YYYY-MM-DD)": getFormattedDate(fechaInicio),
          "FECHA FIN NOVEDAD (YYYY-MM-DD)": getFormattedDate(fechaFin),
        }
      })

      setNovedadesData(transformedData)
      setNovedadesFileName(file.name)

      // Previsualizar datos
      if (transformedData.length > 0) {
        const previewResponse = await fetch("/api/admin/novedades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ novedades: transformedData, preview: true }),
        })
        if (!previewResponse.ok) {
          const errorData = await previewResponse.text()
          console.error("Error del servidor (preview):", errorData)
          throw new Error(
            `Error del servidor: ${previewResponse.statusText}. Detalles: ${errorData}`
          )
        }
        const previewData = await previewResponse.json()
        setNovedadesResumen(previewData)
      } else {
        setNovedadesResumen(null) // Limpiar resumen si no hay datos únicos
      }
    } catch (error) {
      console.error("Error al cargar novedades:", error)
      toast({
        title: "Error al cargar el archivo de novedades",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
      setNovedadesData([])
      setNovedadesFileName("")
      setNovedadesResumen(null)
    } finally {
      setIsNovedadesLoading(false)
    }
  }, [])

  const handleSaveNovedades = useCallback(async () => {
    if (!novedadesData.length) return
    setIsNovedadesSaving(true)
    try {
      const response = await fetch("/api/admin/novedades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          novedades: novedadesData,
          preview: false,
        }),
      })

      if (!response.ok) throw new Error("Error al guardar novedades en el backend")
      const resumen = await response.json()
      setNovedadesResumen(resumen)

      toast({
        title: "¡Novedades actualizadas!",
        description: "Los cambios se guardaron correctamente.",
        variant: "default",
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios de novedades.",
        variant: "destructive",
      })
    } finally {
      setIsNovedadesSaving(false)
    }
  }, [novedadesData])

  const handleClearNovedades = () => {
    setNovedadesData([])
    setNovedadesFileName("")
    setNovedadesResumen(null)
  }

  const handleKilometrosUpload = useCallback(async (file: File) => {
    setIsKilometrosLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true })
      const sheetName = workbook.SheetNames.includes("BD") ? "BD" : null
      if (!sheetName)
        throw new Error("El archivo Excel debe tener una hoja llamada 'BD'")
      const worksheet = workbook.Sheets[sheetName]
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
      })
      if (!jsonData.length)
        throw new Error("La hoja 'BD' está vacía o no contiene datos válidos")

      const getFormattedDate = (date: any) => {
        if (date instanceof Date) {
          return date.toISOString().slice(0, 10)
        }
        return date
      }

      const transformedData = jsonData.map((row: any) => {
        const fechaInicioProg = getValue(row, ["FECHA INICIO PROGRAMACIÓN (YYYY-MM-DD)", "fecha_inicio_programacion"]);
        const fechaFinProg = getValue(row, ["FECHA FIN PROGRAMACIÓN (YYYY-MM-DD)", "fecha_fin_programacion"]);
        const fechaInicioEjec = getValue(row, ["FECHA INICIO EJECUCIÓN (YYYY-MM-DD)", "fecha_inicio_ejecucion"]);
        const fechaFinEjec = getValue(row, ["FECHA FIN EJECUCIÓN (YYYY-MM-DD)", "fecha_fin_ejecucion"]);
        
        return {
          ...row,
          codigo_empleado: getValue(row, ["CÓDIGO EMPLEADO", "codigo_empleado"]),
          codigo_variable: getValue(row, [
            "CÓDIGO VARIABLE DE CONTROL",
            "codigo_variable",
          ]),
          valor_programacion: parseFloat(
            getValue(row, ["VALOR VAR. PROGRAMACIÓN", "valor_programacion"])
          ).toFixed(2),
          valor_ejecucion: parseFloat(
            getValue(row, ["VALOR VAR. EJECUCIÓN", "valor_ejecucion"])
          ).toFixed(2),
          fecha_inicio_programacion: getFormattedDate(fechaInicioProg),
          fecha_fin_programacion: getFormattedDate(fechaFinProg),
          fecha_inicio_ejecucion: getFormattedDate(fechaInicioEjec),
          fecha_fin_ejecucion: getFormattedDate(fechaFinEjec),
        }
      })

      // Validar duplicados
      const duplicates: any[] = []
      const uniques = new Set<string>()
      const uniqueData: any[] = []

      for (const row of transformedData) {
        const key = [
          row.codigo_empleado,
          row.codigo_variable,
          row.fecha_inicio_programacion,
          row.fecha_fin_programacion,
        ].join("-")

        if (uniques.has(key)) {
          duplicates.push(row)
        } else {
          uniques.add(key)
          uniqueData.push(row)
        }
      }

      if (duplicates.length > 0) {
        setDuplicateKilometros(duplicates)
        toast({
          title: "Se encontraron duplicados",
          description: `Se encontraron ${duplicates.length} registros duplicados en el archivo. No se procesarán.`,
          variant: "destructive",
        })
      } else {
        setDuplicateKilometros([])
      }

      setKilometrosData(uniqueData)
      setKilometrosFileName(file.name)

      // Previsualizar datos
      if (uniqueData.length > 0) {
        const previewResponse = await fetch("/api/admin/kilometros", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kilometros: uniqueData, preview: true }),
        })
        if (!previewResponse.ok) {
          const errorData = await previewResponse.text()
          console.error("Error del servidor (preview):", errorData)
          throw new Error(
            `Error del servidor: ${previewResponse.statusText}. Detalles: ${errorData}`
          )
        }
        const previewData = await previewResponse.json()
        setKilometrosResumen(previewData)
      } else {
        setKilometrosResumen(null)
      }
    } catch (error) {
      console.error("Error al cargar kilómetros:", error)
      toast({
        title: "Error al cargar el archivo de kilómetros",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
      setKilometrosData([])
      setKilometrosFileName("")
      setKilometrosResumen(null)
    } finally {
      setIsKilometrosLoading(false)
    }
  }, [])

  const handleSaveKilometros = useCallback(async () => {
    if (!kilometrosData.length) return
    setIsKilometrosSaving(true)
    try {
      const response = await fetch("/api/admin/kilometros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kilometros: kilometrosData,
          preview: false,
        }),
      })

      if (!response.ok) throw new Error("Error al guardar kilómetros en el backend")
      const resumen = await response.json()
      setKilometrosResumen(resumen)

      toast({
        title: "¡Kilómetros actualizados!",
        description: "Los cambios se guardaron correctamente.",
        variant: "default",
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios de kilómetros.",
        variant: "destructive",
      })
    } finally {
      setIsKilometrosSaving(false)
    }
  }, [kilometrosData])

  const handleClearKilometros = () => {
    setKilometrosData([])
    setKilometrosFileName("")
    setKilometrosResumen(null)
  }

  // Novedades Operadores
  const handleNovedadesOperadoresUpload = useCallback(async (file: File) => {
    setIsNovedadesOperadoresLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheetName = workbook.SheetNames.includes("BD") ? "BD" : null
      if (!sheetName)
        throw new Error("El archivo Excel debe tener una hoja llamada 'BD'")
      const worksheet = workbook.Sheets[sheetName]
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)
      if (!jsonData.length)
        throw new Error("La hoja 'BD' está vacía o no contiene datos válidos")

      // Validar duplicados
      const duplicates: any[] = []
      const uniques = new Set<string>()
      const uniqueData: any[] = []

      for (const row of jsonData) {
        const cedula = getValue(row, ["CEDULA", "cedula"])
        const key = cedula

        if (uniques.has(key)) {
          duplicates.push(row)
        } else {
          uniques.add(key)
          uniqueData.push(row)
        }
      }

      if (duplicates.length > 0) {
        setDuplicateNovedadesOperadores(duplicates)
        toast({
          title: "Se encontraron duplicados",
          description: `Se encontraron ${duplicates.length} registros duplicados en el archivo. No se procesarán.`,
          variant: "destructive",
        })
      } else {
        setDuplicateNovedadesOperadores([])
      }

      setNovedadesOperadoresData(uniqueData)
      setNovedadesOperadoresFileName(file.name)

      // Previsualizar datos
      if (uniqueData.length > 0) {
        const previewResponse = await fetch("/api/admin/novedades-operadores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ novedadesOperadores: uniqueData, preview: true }),
        })
        if (!previewResponse.ok) {
          const errorData = await previewResponse.text()
          console.error("Error del servidor (preview):", errorData)
          throw new Error(
            `Error del servidor: ${previewResponse.statusText}. Detalles: ${errorData}`
          )
        }
        const previewData = await previewResponse.json()
        setNovedadesOperadoresResumen(previewData)
      } else {
        setNovedadesOperadoresResumen(null)
      }

      toast({
        title: "¡Archivo de novedades operadores cargado!",
        description: `Se procesaron ${uniqueData.length} registros correctamente.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error al cargar novedades operadores:", error)
      toast({
        title: "Error al cargar el archivo de novedades operadores",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
      setNovedadesOperadoresData([])
      setNovedadesOperadoresFileName("")
      setNovedadesOperadoresResumen(null)
    } finally {
      setIsNovedadesOperadoresLoading(false)
    }
  }, [])

  const handleSaveNovedadesOperadores = useCallback(async () => {
    if (!novedadesOperadoresData.length) return
    setIsNovedadesOperadoresSaving(true)
    try {
      const response = await fetch("/api/admin/novedades-operadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          novedadesOperadores: novedadesOperadoresData,
          preview: false,
        }),
      })

      if (!response.ok) throw new Error("Error al guardar novedades operadores en el backend")
      const resumen = await response.json()
      setNovedadesOperadoresResumen(resumen)

      toast({
        title: "¡Novedades operadores actualizadas!",
        description: "Los cambios se guardaron correctamente.",
        variant: "default",
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios de novedades operadores.",
        variant: "destructive",
      })
    } finally {
      setIsNovedadesOperadoresSaving(false)
    }
  }, [novedadesOperadoresData])

  const handleClearNovedadesOperadores = () => {
    setNovedadesOperadoresData([])
    setNovedadesOperadoresFileName("")
    setNovedadesOperadoresResumen(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header compacto mejorado */}
      <div className="w-full bg-white/90 backdrop-blur-md border-b border-emerald-100/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-2xl blur-md opacity-25"></div>
                <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg">
                  <Database className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Configuración del Sistema
                </h1>
                <div className="flex items-center mt-1">
                  <Sparkles className="h-3 w-3 text-emerald-500 mr-2" />
                  <span className="text-emerald-600 font-medium text-sm">Gestión de Datos SAO6</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs mejorados */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-3xl bg-white/90 backdrop-blur-sm shadow-2xl border border-emerald-100 overflow-hidden p-2">
            <button
              className={`px-8 py-4 flex items-center gap-3 text-base font-bold transition-all duration-500 focus:outline-none rounded-2xl ${tab === "zonas"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl scale-105 transform"
                  : "text-emerald-700 hover:bg-emerald-50 hover:scale-105"
                }`}
              onClick={() => setTab("zonas")}
            >
              <FileSpreadsheet className="w-5 h-5" />
              Zonas
            </button>
            <button
              className={`px-8 py-4 flex items-center gap-3 text-base font-bold transition-all duration-500 focus:outline-none rounded-2xl ${tab === "padrinos"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-xl scale-105 transform"
                  : "text-cyan-700 hover:bg-cyan-50 hover:scale-105"
                }`}
              onClick={() => setTab("padrinos")}
            >
              <Users className="w-5 h-5" />
              Padrinos
            </button>
            <button
              className={`px-8 py-4 flex items-center gap-3 text-base font-bold transition-all duration-500 focus:outline-none rounded-2xl ${tab === "novedades"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl scale-105 transform"
                  : "text-orange-700 hover:bg-orange-50 hover:scale-105"
                }`}
              onClick={() => setTab("novedades")}
            >
              <AlertTriangle className="w-5 h-5" />
              Novedades
            </button>
            <button
              className={`px-8 py-4 flex items-center gap-3 text-base font-bold transition-all duration-500 focus:outline-none rounded-2xl ${tab === "kilometros"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-xl scale-105 transform"
                  : "text-purple-700 hover:bg-purple-50 hover:scale-105"
                }`}
              onClick={() => setTab("kilometros")}
            >
              <Car className="w-5 h-5" />
              Kilómetros
            </button>
            <button
              className={`px-8 py-4 flex items-center gap-3 text-base font-bold transition-all duration-500 focus:outline-none rounded-2xl ${tab === "novedades-operadores"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-xl scale-105 transform"
                  : "text-amber-700 hover:bg-amber-50 hover:scale-105"
                }`}
              onClick={() => setTab("novedades-operadores")}
            >
              <Users className="w-5 h-5" />
              Novedades Operadores
            </button>
          </div>
        </div>

        {/* Content */}
        {tab === "zonas" && (
          <div className="space-y-8">
            {/* Upload Section */}
            {!hasZonasData && (
              <div className="max-w-4xl mx-auto">
                <FileUpload onFileUpload={handleFileUpload} isUploading={isLoading} />
              </div>
            )}

            {/* Data Analysis Section */}
            {hasZonasData && zonasResumen && (
              <div className="space-y-8">
                {/* File Info Card mejorada */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-emerald-100">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-2xl blur opacity-30"></div>
                        <div className="relative bg-gradient-to-r from-emerald-100 to-teal-100 p-6 rounded-2xl border-2 border-emerald-200">
                          <FileCheck className="h-12 w-12 text-emerald-600" />
                        </div>
                      </div>
                      <div className="ml-6">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">{fileName}</h2>
                        <div className="flex items-center text-lg">
                          <div className="w-3 h-3 bg-emerald-400 rounded-full mr-3 animate-pulse"></div>
                          <span className="text-gray-600 font-medium">Archivo procesado exitosamente</span>
                        </div>
                        <div className="flex items-center mt-2 text-emerald-600">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          <span className="text-sm font-semibold">{data.length} registros cargados</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <button
                        onClick={() => window.location.reload()}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-2xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <RefreshCw className="mr-3 h-5 w-5" />
                        Nuevo Archivo
                      </button>
                      <button
                        onClick={handleClearData}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <Trash2 className="mr-3 h-5 w-5" />
                        Limpiar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="w-full">
                  <StatsCards data={data} />
                </div>

                {/* Controles mejorados */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-emerald-100">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchZonas}
                        onChange={handleSearchZonasChange}
                        placeholder="Buscar por código, nombre o zona..."
                        className="w-full pl-12 pr-4 py-4 border-2 border-emerald-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300 bg-white/80"
                      />
                    </div>
                    <button
                      onClick={handleSaveZonas}
                      disabled={isSaving || !data.length}
                      className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 hover:-translate-y-1"
                    >
                      {isSaving ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                          Guardando...
                        </div>
                      ) : (
                        "Guardar Cambios"
                      )}
                    </button>
                  </div>
                </div>

                {/* Tabla mejorada con mejor manejo de estados */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">
                  {zonasFiltradas.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gradient-to-r from-emerald-100 to-teal-100 sticky top-0 z-10">
                            <tr>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">
                                Código
                              </th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">
                                Nombre
                              </th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">
                                Zona Anterior
                              </th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">
                                Zona Nueva
                              </th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">
                                Estado
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedRowsZonas.map((op, idx) => (
                              <tr
                                key={`${op.tipo}-${op.codigo}-${idx}`}
                                className={`transition-all duration-200 hover:scale-[1.005] ${op.tipo === "cambio"
                                    ? "bg-green-50 hover:bg-green-100 border-l-4 border-green-400"
                                    : op.tipo === "sinZona"
                                      ? "bg-red-50 hover:bg-red-100 border-l-4 border-red-400"
                                      : "bg-white hover:bg-gray-50 border-l-4 border-gray-200"
                                  }`}
                              >
                                <td className="px-6 py-4 font-bold text-gray-900">{op.codigo || "N/A"}</td>
                                <td className="px-6 py-4 text-gray-700">{op.nombre || "Sin nombre"}</td>
                                <td className="px-6 py-4 text-gray-600">
                                  {op.zonaAnterior || op.zona || <span className="text-gray-400 italic">Sin zona</span>}
                                </td>
                                <td
                                  className={`px-6 py-4 ${op.tipo === "sinZona" || !op.zonaNueva ? "text-red-600 font-bold" : "text-gray-700"}`}
                                >
                                  {op.zonaNueva ? op.zonaNueva : <span className="text-red-500 font-bold">Sin zona asignada</span>}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${op.tipo === "cambio"
                                        ? "bg-green-100 text-green-800"
                                        : op.tipo === "sinZona"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                  >
                                    {op.tipo === "cambio"
                                      ? "✓ Actualizada"
                                      : op.tipo === "sinZona"
                                        ? "⚠ No asignada"
                                        : "— Sin cambios"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay resultados</h3>
                        <p className="text-gray-400 max-w-sm">
                          {searchZonas
                            ? `No se encontraron registros que coincidan con "${searchZonas}"`
                            : "No hay datos para mostrar"}
                        </p>
                        {searchZonas && (
                          <button
                            onClick={() => setSearchZonas("")}
                            className="mt-4 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors duration-200"
                          >
                            Limpiar búsqueda
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Paginación mejorada */}
                  {totalPagesZonas > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          Mostrando <span className="font-semibold">{(currentPageZonas - 1) * rowsPerPage + 1}</span> a{" "}
                          <span className="font-semibold">
                            {Math.min(currentPageZonas * rowsPerPage, zonasFiltradas.length)}
                          </span>{" "}
                          de <span className="font-semibold">{zonasFiltradas.length}</span> resultados
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChangeZonas(1)}
                            disabled={currentPageZonas === 1}
                            className="px-3 py-2 rounded-lg border border-emerald-200 bg-white text-emerald-700 font-medium hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                          >
                            Primera
                          </button>
                          <button
                            onClick={() => handlePageChangeZonas(currentPageZonas - 1)}
                            disabled={currentPageZonas === 1}
                            className="flex items-center px-3 py-2 rounded-lg border border-emerald-200 bg-white text-emerald-700 font-medium hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Anterior
                          </button>
                          <span className="px-4 py-2 text-gray-700 font-medium text-sm">
                            {currentPageZonas} / {totalPagesZonas}
                          </span>
                          <button
                            onClick={() => handlePageChangeZonas(currentPageZonas + 1)}
                            disabled={currentPageZonas === totalPagesZonas}
                            className="flex items-center px-3 py-2 rounded-lg border border-emerald-200 bg-white text-emerald-700 font-medium hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            Siguiente
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </button>
                          <button
                            onClick={() => handlePageChangeZonas(totalPagesZonas)}
                            disabled={currentPageZonas === totalPagesZonas}
                            className="px-3 py-2 rounded-lg border border-emerald-200 bg-white text-emerald-700 font-medium hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                          >
                            Última
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "padrinos" && (
          <div className="space-y-8">
            {/* Upload Section */}
            {!hasPadrinosData && (
              <div className="max-w-4xl mx-auto">
                <FileUpload onFileUpload={handlePadrinosUpload} isUploading={isPadrinosLoading} />
              </div>
            )}

            {/* Data Analysis Section */}
            {hasPadrinosData && padrinosResumen && (
              <div className="space-y-8">
                {/* File Info Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-cyan-100">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-2xl blur opacity-30"></div>
                        <div className="relative bg-gradient-to-r from-cyan-100 to-blue-100 p-6 rounded-2xl border-2 border-cyan-200">
                          <Users className="h-12 w-12 text-cyan-600" />
                        </div>
                      </div>
                      <div className="ml-6">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">{padrinosFileName}</h2>
                        <div className="flex items-center text-lg">
                          <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
                          <span className="text-gray-600 font-medium">Archivo procesado exitosamente</span>
                        </div>
                        <div className="flex items-center mt-2 text-cyan-600">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          <span className="text-sm font-semibold">{padrinosData.length} registros cargados</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <button
                        onClick={() => window.location.reload()}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-2xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <RefreshCw className="mr-3 h-5 w-5" />
                        Nuevo Archivo
                      </button>
                      <button
                        onClick={handleClearPadrinos}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <Trash2 className="mr-3 h-5 w-5" />
                        Limpiar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Controles de búsqueda y guardar */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-cyan-100">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchPadrinos}
                        onChange={handleSearchPadrinosChange}
                        placeholder="Buscar por código, nombre o padrino..."
                        className="w-full pl-12 pr-4 py-4 border-2 border-cyan-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 bg-white/80"
                      />
                    </div>
                    <button
                      onClick={handleSavePadrinos}
                      disabled={isPadrinosSaving || !padrinosData.length}
                      className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl shadow-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 hover:-translate-y-1"
                    >
                      {isPadrinosSaving ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                          Guardando...
                        </div>
                      ) : (
                        "Guardar Cambios"
                      )}
                    </button>
                  </div>
                </div>
                {/* Tabla de padrinos */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-cyan-100 overflow-hidden">
                  {padrinosFiltrados.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gradient-to-r from-cyan-100 to-blue-100 sticky top-0 z-10">
                            <tr>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Código</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Nombre</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Padrino Anterior</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Padrino Nuevo</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Nombre Padrino Anterior</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Nombre Padrino Nuevo</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedRowsPadrinos.map((op, idx) => (
                              <tr
                                key={`${op.tipo}-${op.codigo}-${idx}`}
                                className={`transition-all duration-200 hover:scale-[1.005] ${op.tipo === "cambio"
                                    ? "bg-cyan-50 hover:bg-cyan-100 border-l-4 border-cyan-400"
                                    : op.tipo === "sinPadrino"
                                      ? "bg-red-50 hover:bg-red-100 border-l-4 border-red-400"
                                      : "bg-white hover:bg-gray-50 border-l-4 border-gray-200"
                                  }`}
                              >
                                <td className="px-6 py-4 font-bold text-gray-900">{op.codigo || "N/A"}</td>
                                <td className="px-6 py-4 text-gray-700">{op.nombre || "Sin nombre"}</td>
                                <td className="px-6 py-4 text-gray-600">{op.padrinoAnterior || <span className="text-gray-400 italic">Sin padrino</span>}</td>
                                <td className={op.tipo === "sinPadrino" || !op.padrinoNuevo ? "px-6 py-4 text-red-600 font-bold" : "px-6 py-4 text-gray-700"}>
                                  {op.padrinoNuevo ? op.padrinoNuevo : <span className="text-red-500 font-bold">Sin padrino asignado</span>}
                                </td>
                                <td className="px-6 py-4 text-gray-600">{op.nombrePadrinoAnterior || <span className="text-gray-400 italic">-</span>}</td>
                                <td className="px-6 py-4 text-gray-600">{op.nombrePadrinoNuevo || <span className="text-gray-400 italic">-</span>}</td>
                                <td className={
                                  op.tipo === "cambio"
                                    ? "px-6 py-4 text-cyan-700 font-bold"
                                    : op.tipo === "sinPadrino"
                                      ? "px-6 py-4 text-red-700 font-bold"
                                      : "px-6 py-4 text-gray-500"
                                }>
                                  {op.tipo === "cambio"
                                    ? "✓ Actualizado"
                                    : op.tipo === "sinPadrino"
                                      ? "⚠ No asignado"
                                      : "— Sin cambios"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay resultados</h3>
                        <p className="text-gray-400 max-w-sm">
                          {searchPadrinos
                            ? `No se encontraron registros que coincidan con "${searchPadrinos}"`
                            : "No hay datos para mostrar"}
                        </p>
                        {searchPadrinos && (
                          <button
                            onClick={() => setSearchPadrinos("")}
                            className="mt-4 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition-colors duration-200"
                          >
                            Limpiar búsqueda
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Paginación */}
                  {totalPagesPadrinos > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          Mostrando <span className="font-semibold">{(currentPagePadrinos - 1) * rowsPerPagePadrinos + 1}</span> a {" "}
                          <span className="font-semibold">{Math.min(currentPagePadrinos * rowsPerPagePadrinos, padrinosFiltrados.length)}</span> {" "}
                          de <span className="font-semibold">{padrinosFiltrados.length}</span> resultados
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChangePadrinos(1)}
                            disabled={currentPagePadrinos === 1}
                            className="px-3 py-2 rounded-lg border border-cyan-200 bg-white text-cyan-700 font-medium hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                          >
                            Primera
                          </button>
                          <button
                            onClick={() => handlePageChangePadrinos(currentPagePadrinos - 1)}
                            disabled={currentPagePadrinos === 1}
                            className="flex items-center px-3 py-2 rounded-lg border border-cyan-200 bg-white text-cyan-700 font-medium hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Anterior
                          </button>
                          <span className="px-4 py-2 text-gray-700 font-medium text-sm">
                            {currentPagePadrinos} / {totalPagesPadrinos}
                          </span>
                          <button
                            onClick={() => handlePageChangePadrinos(currentPagePadrinos + 1)}
                            disabled={currentPagePadrinos === totalPagesPadrinos}
                            className="flex items-center px-3 py-2 rounded-lg border border-cyan-200 bg-white text-cyan-700 font-medium hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            Siguiente
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </button>
                          <button
                            onClick={() => handlePageChangePadrinos(totalPagesPadrinos)}
                            disabled={currentPagePadrinos === totalPagesPadrinos}
                            className="px-3 py-2 rounded-lg border border-cyan-200 bg-white text-cyan-700 font-medium hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                          >
                            Última
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "novedades" && (
          <div className="space-y-8">
            {/* Upload Section */}
            {!hasNovedadesData && (
              <div className="max-w-4xl mx-auto">
                <FileUpload onFileUpload={handleNovedadesUpload} isUploading={isNovedadesLoading} />
              </div>
            )}

            {/* Data Analysis Section */}
            {hasNovedadesData && novedadesResumen && (
              <div className="space-y-8">
                {/* File Info Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-orange-100">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-600 rounded-2xl blur opacity-30"></div>
                        <div className="relative bg-gradient-to-r from-orange-100 to-red-100 p-6 rounded-2xl border-2 border-orange-200">
                          <AlertTriangle className="h-12 w-12 text-orange-600" />
                        </div>
                      </div>
                      <div className="ml-6">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">{novedadesFileName}</h2>
                        <div className="flex items-center text-lg">
                          <div className="w-3 h-3 bg-orange-400 rounded-full mr-3 animate-pulse"></div>
                          <span className="text-gray-600 font-medium">Archivo procesado exitosamente</span>
                        </div>
                        <div className="flex items-center mt-2 text-orange-600">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          <span className="text-sm font-semibold">{novedadesData.length} registros cargados</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <button
                        onClick={() => window.location.reload()}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-2xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <RefreshCw className="mr-3 h-5 w-5" />
                        Nuevo Archivo
                      </button>
                      <button
                        onClick={handleClearNovedades}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <Trash2 className="mr-3 h-5 w-5" />
                        Limpiar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Controles de búsqueda y guardar */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-orange-100">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchNovedades}
                        onChange={handleSearchNovedadesChange}
                        placeholder="Buscar por código, fechas u observaciones..."
                        className="w-full pl-12 pr-4 py-4 border-2 border-orange-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-300 bg-white/80"
                      />
                    </div>
                    <button
                      onClick={handleSaveNovedades}
                      disabled={isNovedadesSaving || !novedadesData.length}
                      className="px-10 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-2xl shadow-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 hover:-translate-y-1"
                    >
                      {isNovedadesSaving ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                          Guardando...
                        </div>
                      ) : (
                        "Guardar Cambios"
                      )}
                    </button>
                  </div>
                </div>

                {/* Tabla de novedades */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-orange-100 overflow-hidden">
                  {novedadesFiltradas.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gradient-to-r from-orange-100 to-red-100 sticky top-0 z-10">
                            <tr>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Código Empleado</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Fecha Inicio</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Fecha Fin</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Factor Calificación</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Confiabilidad Humana</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Observaciones</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedRowsNovedades.map((op, idx) => (
                              <tr
                                key={`${op.tipo}-${op.codigoEmpleado}-${idx}`}
                                className={`transition-all duration-200 hover:scale-[1.005] ${op.tipo === "cambio"
                                    ? "bg-orange-50 hover:bg-orange-100 border-l-4 border-orange-400"
                                    : op.tipo === "sinNovedad"
                                      ? "bg-red-50 hover:bg-red-100 border-l-4 border-red-400"
                                      : "bg-white hover:bg-gray-50 border-l-4 border-gray-200"
                                  }`}
                              >
                                <td className="px-6 py-4 font-bold text-gray-900">{op.codigoEmpleado || "N/A"}</td>
                                <td className="px-6 py-4 text-gray-700">{op.fechaInicio || "Sin fecha"}</td>
                                <td className="px-6 py-4 text-gray-700">{op.fechaFin || "Sin fecha"}</td>
                                <td className="px-6 py-4 text-gray-600">{op.factorCalificacion || <span className="text-gray-400 italic">-</span>}</td>
                                <td className="px-6 py-4 text-gray-600">{op.confiabilidadHumana || <span className="text-gray-400 italic">-</span>}</td>
                                <td className="px-6 py-4 text-gray-600">{op.observaciones || <span className="text-gray-400 italic">-</span>}</td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${op.tipo === "cambio"
                                        ? "bg-orange-100 text-orange-800"
                                        : op.tipo === "sinNovedad"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                  >
                                    {op.tipo === "cambio"
                                      ? "✓ Actualizada"
                                      : op.tipo === "sinNovedad"
                                        ? "⚠ Sin novedad"
                                        : "— Sin cambios"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Paginación */}
                      {totalPagesNovedades > 1 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600">
                              Mostrando <span className="font-semibold">{(currentPageNovedades - 1) * rowsPerPageNovedades + 1}</span> a{" "}
                              <span className="font-semibold">
                                {Math.min(currentPageNovedades * rowsPerPageNovedades, novedadesFiltradas.length)}
                              </span>{" "}
                              de <span className="font-semibold">{novedadesFiltradas.length}</span> resultados
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePageChangeNovedades(1)}
                                disabled={currentPageNovedades === 1}
                                className="px-3 py-2 rounded-lg border border-orange-200 bg-white text-orange-700 font-medium hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                              >
                                Primera
                              </button>
                              <button
                                onClick={() => handlePageChangeNovedades(currentPageNovedades - 1)}
                                disabled={currentPageNovedades === 1}
                                className="flex items-center px-3 py-2 rounded-lg border border-orange-200 bg-white text-orange-700 font-medium hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Anterior
                              </button>
                              <span className="px-4 py-2 text-gray-700 font-medium text-sm">
                                {currentPageNovedades} / {totalPagesNovedades}
                              </span>
                              <button
                                onClick={() => handlePageChangeNovedades(currentPageNovedades + 1)}
                                disabled={currentPageNovedades === totalPagesNovedades}
                                className="flex items-center px-3 py-2 rounded-lg border border-orange-200 bg-white text-orange-700 font-medium hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                Siguiente
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </button>
                              <button
                                onClick={() => handlePageChangeNovedades(totalPagesNovedades)}
                                disabled={currentPageNovedades === totalPagesNovedades}
                                className="px-3 py-2 rounded-lg border border-orange-200 bg-white text-orange-700 font-medium hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                              >
                                Última
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay resultados</h3>
                        <p className="text-gray-400 max-w-sm">
                          {searchNovedades
                            ? `No se encontraron registros que coincidan con "${searchNovedades}"`
                            : "No hay datos para mostrar"}
                        </p>
                        {searchNovedades && (
                          <button
                            onClick={() => setSearchNovedades("")}
                            className="mt-4 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors duration-200"
                          >
                            Limpiar búsqueda
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "kilometros" && (
          <div className="space-y-8">
            {/* Upload Section */}
            {!hasKilometrosData && (
              <div className="max-w-4xl mx-auto">
                <FileUpload onFileUpload={handleKilometrosUpload} isUploading={isKilometrosLoading} />
              </div>
            )}

            {/* Data Analysis Section */}
            {hasKilometrosData && kilometrosResumen && (
              <div className="space-y-8">
                {/* File Info Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-purple-100">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-600 rounded-2xl blur opacity-30"></div>
                        <div className="relative bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-2xl border-2 border-purple-200">
                          <Car className="h-12 w-12 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-6">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">{kilometrosFileName}</h2>
                        <div className="flex items-center text-lg">
                          <div className="w-3 h-3 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                          <span className="text-gray-600 font-medium">Archivo procesado exitosamente</span>
                        </div>
                        <div className="flex items-center mt-2 text-purple-600">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          <span className="text-sm font-semibold">{kilometrosData.length} registros cargados</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <button
                        onClick={() => window.location.reload()}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-2xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <RefreshCw className="mr-3 h-5 w-5" />
                        Nuevo Archivo
                      </button>
                      <button
                        onClick={handleClearKilometros}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <Trash2 className="mr-3 h-5 w-5" />
                        Limpiar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Controles de búsqueda y guardar */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-purple-100">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchKilometros}
                        onChange={handleSearchKilometrosChange}
                        placeholder="Buscar por código, variable o valores..."
                        className="w-full pl-12 pr-4 py-4 border-2 border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300 bg-white/80"
                      />
                    </div>
                    <button
                      onClick={handleSaveKilometros}
                      disabled={isKilometrosSaving || !kilometrosData.length}
                      className="px-10 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 hover:-translate-y-1"
                    >
                      {isKilometrosSaving ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                          Guardando...
                        </div>
                      ) : (
                        "Guardar Cambios"
                      )}
                    </button>
                  </div>
                </div>

                {/* Tabla de kilómetros */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-purple-100 overflow-hidden">
                  {kilometrosFiltrados.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gradient-to-r from-purple-100 to-indigo-100 sticky top-0 z-10">
                            <tr>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Código Empleado</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Variable Control</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Valor Programación</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Valor Ejecución</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Fecha Inicio Prog.</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Fecha Fin Prog.</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Fecha Inicio Ejec.</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Fecha Fin Ejec.</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedRowsKilometros.map((op, idx) => (
                              <tr
                                key={`${op.tipo}-${op.codigo_empleado}-${idx}`}
                                className={`transition-all duration-200 hover:scale-[1.005] ${op.tipo === "cambio"
                                    ? "bg-purple-50 hover:bg-purple-100 border-l-4 border-purple-400"
                                    : op.tipo === "sinKilometros"
                                      ? "bg-red-50 hover:bg-red-100 border-l-4 border-red-400"
                                      : "bg-white hover:bg-gray-50 border-l-4 border-gray-200"
                                  }`}
                              >
                                <td className="px-6 py-4 font-bold text-gray-900">{op.codigo_empleado || "N/A"}</td>
                                <td className="px-6 py-4 text-gray-700">{op.codigo_variable || "Sin variable"}</td>
                                <td className="px-6 py-4 text-gray-600">{op.valor_programacion ?? <span className="text-gray-400 italic">-</span>}</td>
                                <td className="px-6 py-4 text-gray-600">{op.valor_ejecucion ?? <span className="text-gray-400 italic">-</span>}</td>
                                <td className="px-6 py-4 text-gray-600">{op.fecha_inicio_programacion ?? <span className="text-gray-400 italic">-</span>}</td>
                                <td className="px-6 py-4 text-gray-600">{op.fecha_fin_programacion ?? <span className="text-gray-400 italic">-</span>}</td>
                                <td className="px-6 py-4 text-gray-600">{op.fecha_inicio_ejecucion ?? <span className="text-gray-400 italic">-</span>}</td>
                                <td className="px-6 py-4 text-gray-600">{op.fecha_fin_ejecucion ?? <span className="text-gray-400 italic">-</span>}</td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${op.tipo === "cambio"
                                        ? "bg-purple-100 text-purple-800"
                                        : op.tipo === "sinKilometros"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                  >
                                    {op.tipo === "cambio"
                                      ? "✓ Actualizado"
                                      : op.tipo === "sinKilometros"
                                        ? "⚠ Sin kilómetros"
                                        : "— Sin cambios"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Paginación */}
                      {totalPagesKilometros > 1 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600">
                              Mostrando <span className="font-semibold">{(currentPageKilometros - 1) * rowsPerPageKilometros + 1}</span> a{" "}
                              <span className="font-semibold">
                                {Math.min(currentPageKilometros * rowsPerPageKilometros, kilometrosFiltrados.length)}
                              </span>{" "}
                              de <span className="font-semibold">{kilometrosFiltrados.length}</span> resultados
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePageChangeKilometros(1)}
                                disabled={currentPageKilometros === 1}
                                className="px-3 py-2 rounded-lg border border-purple-200 bg-white text-purple-700 font-medium hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                              >
                                Primera
                              </button>
                              <button
                                onClick={() => handlePageChangeKilometros(currentPageKilometros - 1)}
                                disabled={currentPageKilometros === 1}
                                className="flex items-center px-3 py-2 rounded-lg border border-purple-200 bg-white text-purple-700 font-medium hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Anterior
                              </button>
                              <span className="px-4 py-2 text-gray-700 font-medium text-sm">
                                {currentPageKilometros} / {totalPagesKilometros}
                              </span>
                              <button
                                onClick={() => handlePageChangeKilometros(currentPageKilometros + 1)}
                                disabled={currentPageKilometros === totalPagesKilometros}
                                className="flex items-center px-3 py-2 rounded-lg border border-purple-200 bg-white text-purple-700 font-medium hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                Siguiente
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </button>
                              <button
                                onClick={() => handlePageChangeKilometros(totalPagesKilometros)}
                                disabled={currentPageKilometros === totalPagesKilometros}
                                className="px-3 py-2 rounded-lg border border-purple-200 bg-white text-purple-700 font-medium hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                              >
                                Última
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay resultados</h3>
                        <p className="text-gray-400 max-w-sm">
                          {searchKilometros
                            ? `No se encontraron registros que coincidan con "${searchKilometros}"`
                            : "No hay datos para mostrar"}
                        </p>
                        {searchKilometros && (
                          <button
                            onClick={() => setSearchKilometros("")}
                            className="mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200"
                          >
                            Limpiar búsqueda
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {duplicateKilometros.length > 0 && (
                    <div className="space-y-4 mt-8">
                      <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                        <AlertTriangle />
                        Registros Duplicados ({duplicateKilometros.length})
                      </h3>
                      <p className="text-gray-600">
                        Estos registros ya existían en el archivo y no se procesarán.
                      </p>
                      <div className="bg-red-50 border border-red-200 rounded-3xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-red-200">
                            <thead className="bg-red-100">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase tracking-wider">
                                  Cód. Empleado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase tracking-wider">
                                  Variable
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase tracking-wider">
                                  Fecha Inicio
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase tracking-wider">
                                  Fecha Fin
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-red-200">
                              {duplicateKilometros.map((km, index) => (
                                <tr key={index} className="hover:bg-red-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {km.codigo_empleado}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {km.codigo_variable}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {km.fecha_inicio_programacion}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {km.fecha_fin_programacion}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "novedades-operadores" && (
          <div className="space-y-8">
            {/* Upload Section */}
            {!hasNovedadesOperadoresData && (
              <div className="max-w-4xl mx-auto">
                <FileUpload onFileUpload={handleNovedadesOperadoresUpload} isUploading={isNovedadesOperadoresLoading} />
              </div>
            )}

            {/* Data Analysis Section */}
            {hasNovedadesOperadoresData && novedadesOperadoresResumen && (
              <div className="space-y-8">
                {/* File Info Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-amber-100">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-2xl blur opacity-30"></div>
                        <div className="relative bg-gradient-to-r from-amber-100 to-yellow-100 p-6 rounded-2xl border-2 border-amber-200">
                          <Users className="h-12 w-12 text-amber-600" />
                        </div>
                      </div>
                      <div className="ml-6">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">{novedadesOperadoresFileName}</h2>
                        <div className="flex items-center text-lg">
                          <div className="w-3 h-3 bg-amber-400 rounded-full mr-3 animate-pulse"></div>
                          <span className="text-gray-600 font-medium">Archivo procesado exitosamente</span>
                        </div>
                        <div className="flex items-center mt-2 text-amber-600">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          <span className="text-sm font-semibold">{novedadesOperadoresData.length} registros cargados</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <button
                        onClick={() => window.location.reload()}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-2xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <RefreshCw className="mr-3 h-5 w-5" />
                        Nuevo Archivo
                      </button>
                      <button
                        onClick={handleClearNovedadesOperadores}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <Trash2 className="mr-3 h-5 w-5" />
                        Limpiar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Controles de búsqueda y guardar */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-amber-100">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchNovedadesOperadores}
                        onChange={handleSearchNovedadesOperadoresChange}
                        placeholder="Buscar por cédula, nombre o tarea..."
                        className="w-full pl-12 pr-4 py-4 border-2 border-amber-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-300 bg-white/80"
                      />
                    </div>
                    <button
                      onClick={handleSaveNovedadesOperadores}
                      disabled={isNovedadesOperadoresSaving || !novedadesOperadoresData.length}
                      className="px-10 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold rounded-2xl shadow-xl hover:from-amber-600 hover:to-yellow-700 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 hover:-translate-y-1"
                    >
                      {isNovedadesOperadoresSaving ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                          Guardando...
                        </div>
                      ) : (
                        "Guardar Cambios"
                      )}
                    </button>
                  </div>
                </div>

                {/* Tabla de novedades operadores */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-100 overflow-hidden">
                  {novedadesOperadoresFiltradas.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gradient-to-r from-amber-100 to-yellow-100 sticky top-0 z-10">
                            <tr>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Código</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Cédula</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Nombre</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Tarea Anterior</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Tarea Nueva</th>
                              <th className="px-6 py-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedRowsNovedadesOperadores.map((op, idx) => (
                              <tr
                                key={`${op.tipo}-${op.cedula}-${idx}`}
                                className={`transition-all duration-200 hover:scale-[1.005] ${op.tipo === "cambio"
                                    ? "bg-amber-50 hover:bg-amber-100 border-l-4 border-amber-400"
                                    : op.tipo === "sinOperador"
                                      ? "bg-red-50 hover:bg-red-100 border-l-4 border-red-400"
                                      : "bg-white hover:bg-gray-50 border-l-4 border-gray-200"
                                  }`}
                              >
                                <td className="px-6 py-4 font-bold text-gray-900">{op.codigo || "N/A"}</td>
                                <td className="px-6 py-4 text-gray-700">{op.cedula || "Sin cédula"}</td>
                                <td className="px-6 py-4 text-gray-700">{op.nombre || "Sin nombre"}</td>
                                <td className="px-6 py-4 text-gray-600">{op.tareaAnterior || <span className="text-gray-400 italic">Sin tarea</span>}</td>
                                <td className={op.tipo === "sinOperador" || !op.tareaNueva ? "px-6 py-4 text-red-600 font-bold" : "px-6 py-4 text-gray-700"}>
                                  {op.tareaNueva ? op.tareaNueva : <span className="text-red-500 font-bold">Sin tarea asignada</span>}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${op.tipo === "cambio"
                                        ? "bg-amber-100 text-amber-800"
                                        : op.tipo === "sinOperador"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                  >
                                    {op.tipo === "cambio"
                                      ? "✓ Actualizada"
                                      : op.tipo === "sinOperador"
                                        ? "⚠ No encontrado"
                                        : "— Sin cambios"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Paginación */}
                      {totalPagesNovedadesOperadores > 1 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600">
                              Mostrando <span className="font-semibold">{(currentPageNovedadesOperadores - 1) * rowsPerPageNovedadesOperadores + 1}</span> a{" "}
                              <span className="font-semibold">
                                {Math.min(currentPageNovedadesOperadores * rowsPerPageNovedadesOperadores, novedadesOperadoresFiltradas.length)}
                              </span>{" "}
                              de <span className="font-semibold">{novedadesOperadoresFiltradas.length}</span> resultados
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePageChangeNovedadesOperadores(1)}
                                disabled={currentPageNovedadesOperadores === 1}
                                className="px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-700 font-medium hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                              >
                                Primera
                              </button>
                              <button
                                onClick={() => handlePageChangeNovedadesOperadores(currentPageNovedadesOperadores - 1)}
                                disabled={currentPageNovedadesOperadores === 1}
                                className="flex items-center px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-700 font-medium hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Anterior
                              </button>
                              <span className="px-4 py-2 text-gray-700 font-medium text-sm">
                                {currentPageNovedadesOperadores} / {totalPagesNovedadesOperadores}
                              </span>
                              <button
                                onClick={() => handlePageChangeNovedadesOperadores(currentPageNovedadesOperadores + 1)}
                                disabled={currentPageNovedadesOperadores === totalPagesNovedadesOperadores}
                                className="flex items-center px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-700 font-medium hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                Siguiente
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </button>
                              <button
                                onClick={() => handlePageChangeNovedadesOperadores(totalPagesNovedadesOperadores)}
                                disabled={currentPageNovedadesOperadores === totalPagesNovedadesOperadores}
                                className="px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-700 font-medium hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                              >
                                Última
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay resultados</h3>
                        <p className="text-gray-400 max-w-sm">
                          {searchNovedadesOperadores
                            ? `No se encontraron registros que coincidan con "${searchNovedadesOperadores}"`
                            : "No hay datos para mostrar"}
                        </p>
                        {searchNovedadesOperadores && (
                          <button
                            onClick={() => setSearchNovedadesOperadores("")}
                            className="mt-4 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors duration-200"
                          >
                            Limpiar búsqueda
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {duplicateNovedadesOperadores.length > 0 && (
                    <div className="space-y-4 mt-8">
                      <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                        <AlertTriangle />
                        Registros Duplicados ({duplicateNovedadesOperadores.length})
                      </h3>
                      <p className="text-gray-600">
                        Estos registros ya existían en el archivo y no se procesarán.
                      </p>
                      <div className="bg-red-50 border border-red-200 rounded-3xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-red-200">
                            <thead className="bg-red-100">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase tracking-wider">
                                  Código
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase tracking-wider">
                                  Cédula
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase tracking-wider">
                                  Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase tracking-wider">
                                  Tarea
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-red-200">
                              {duplicateNovedadesOperadores.map((op, index) => (
                                <tr key={index} className="hover:bg-red-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {getValue(op, ["CODIGO", "codigo"])}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {getValue(op, ["CEDULA", "cedula"])}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {getValue(op, ["NOMBRE", "nombre"])}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {getValue(op, ["TAREA NO COMERCIAL", "tarea_no_comercial", "tarea"])}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ConfigPage

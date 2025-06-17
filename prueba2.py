import pandas as pd
import mysql.connector
from mysql.connector import Error
import datetime
import os

def conectar_mysql():
    """
    Establece la conexión con la base de datos MySQL
    """
    try:
        conexion = mysql.connector.connect(
            host='192.168.90.32',  # Cambia por tu host
            database='bdsaocomco_operadores',
            user='desarrollo',  # Cambia por tu usuario
            password='test_24*'  # Cambia por tu contraseña
        )
        
        if conexion.is_connected():
            print("Conexión exitosa a MySQL")
            return conexion
            
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return None

def leer_excel(ruta_archivo):
    """
    Lee los datos del archivo Excel desde la Hoja4
    """
    try:
        # Leer la hoja específica del Excel
        df = pd.read_excel(ruta_archivo, sheet_name='Hoja4')
        
        # Renombrar las columnas para que coincidan con la base de datos
        df.columns = [
            'fecha_inicio_novedad',
            'fecha_fin_novedad',
            'codigo_empleado',
            'codigo_factor',
            'observaciones'
        ]
        
        print(f"Se leyeron {len(df)} registros del Excel")
        return df
        
    except Exception as e:
        print(f"Error al leer el archivo Excel: {e}")
        return None

def convertir_fechas(df):
    """
    Convierte las fechas al formato correcto para MySQL
    """
    columnas_fecha = [
        'fecha_inicio_novedad',
        'fecha_fin_novedad'
    ]
    
    for columna in columnas_fecha:
        if columna in df.columns:
            # Convertir a datetime si no lo está ya
            df[columna] = pd.to_datetime(df[columna], errors='coerce')
            # Convertir a formato de fecha para MySQL (YYYY-MM-DD)
            df[columna] = df[columna].dt.date
    
    return df

def insertar_datos(conexion, df):
    """
    Inserta los datos del DataFrame en la tabla MySQL
    """
    cursor = conexion.cursor()
    
    # Query de inserción
    query = """
    INSERT INTO novedades 
    (fecha_inicio_novedad, fecha_fin_novedad, codigo_empleado, codigo_factor, observaciones)
    VALUES (%s, %s, %s, %s, %s)
    """
    
    registros_insertados = 0
    errores = 0
    
    try:
        for index, row in df.iterrows():
            try:
                # Preparar los datos para la inserción
                datos = (
                    row['fecha_inicio_novedad'] if pd.notna(row['fecha_inicio_novedad']) else None,
                    row['fecha_fin_novedad'] if pd.notna(row['fecha_fin_novedad']) else None,
                    str(row['codigo_empleado']).strip() if pd.notna(row['codigo_empleado']) else None,
                    str(row['codigo_factor']).strip() if pd.notna(row['codigo_factor']) else None,
                    str(row['observaciones']).strip() if pd.notna(row['observaciones']) else None
                )
                
                cursor.execute(query, datos)
                registros_insertados += 1
                
            except Exception as e:
                print(f"Error en la fila {index + 1}: {e}")
                print(f"Datos de la fila: {row.to_dict()}")
                errores += 1
                continue
        
        # Confirmar los cambios
        conexion.commit()
        print(f"Se insertaron {registros_insertados} registros exitosamente")
        if errores > 0:
            print(f"Se encontraron {errores} errores durante la inserción")
            
    except Error as e:
        print(f"Error durante la inserción: {e}")
        conexion.rollback()
    
    finally:
        cursor.close()

def validar_datos(df):
    """
    Valida los datos antes de insertar
    """
    print("\n=== VALIDACIÓN DE DATOS ===")
    
    # Verificar datos faltantes
    print("Registros con campos vacíos:")
    for columna in df.columns:
        nulos = df[columna].isna().sum()
        if nulos > 0:
            print(f"  {columna}: {nulos} registros vacíos")
    
    # Verificar formato de códigos
    print(f"\nCódigos de empleado únicos: {df['codigo_empleado'].nunique()}")
    print(f"Códigos de factor únicos: {df['codigo_factor'].nunique()}")
    
    # Mostrar rangos de fechas
    if not df['fecha_inicio_novedad'].isna().all():
        fecha_min = df['fecha_inicio_novedad'].min()
        fecha_max = df['fecha_inicio_novedad'].max()
        print(f"Rango de fechas de inicio: {fecha_min} a {fecha_max}")
    
    if not df['fecha_fin_novedad'].isna().all():
        fecha_min = df['fecha_fin_novedad'].min()
        fecha_max = df['fecha_fin_novedad'].max()
        print(f"Rango de fechas de fin: {fecha_min} a {fecha_max}")
    
    # Verificar longitud de observaciones
    if not df['observaciones'].isna().all():
        max_len = df['observaciones'].astype(str).str.len().max()
        print(f"Longitud máxima de observaciones: {max_len} caracteres")
        if max_len > 999:
            print("⚠️  ADVERTENCIA: Algunas observaciones exceden 999 caracteres y serán truncadas")

def main():
    """
    Función principal que ejecuta todo el proceso
    """
    # Configuración
    ruta_excel = input("Ingrese la ruta completa del archivo Excel: ")
    
    # Verificar que el archivo existe
    if not os.path.exists(ruta_excel):
        print("El archivo Excel no existe en la ruta especificada")
        return
    
    # Conectar a MySQL
    conexion = conectar_mysql()
    if not conexion:
        return
    
    try:
        # Leer datos del Excel
        df = leer_excel(ruta_excel)
        if df is None or df.empty:
            print("No se pudieron leer datos del Excel")
            return
        
        # Convertir fechas
        df = convertir_fechas(df)
        
        # Validar datos
        validar_datos(df)
        
        # Mostrar vista previa de los datos
        print("\n=== VISTA PREVIA DE LOS DATOS ===")
        print(df.head())
        print(f"\nTotal de registros a insertar: {len(df)}")
        
        # Mostrar algunos ejemplos de datos
        print("\n=== EJEMPLOS DE REGISTROS ===")
        for i in range(min(3, len(df))):
            print(f"Registro {i+1}:")
            registro = df.iloc[i]
            print(f"  Fecha inicio: {registro['fecha_inicio_novedad']}")
            print(f"  Fecha fin: {registro['fecha_fin_novedad']}")
            print(f"  Código empleado: {registro['codigo_empleado']}")
            print(f"  Código factor: {registro['codigo_factor']}")
            print(f"  Observaciones: {registro['observaciones']}")
            print()
        
        # Confirmar antes de proceder
        continuar = input("¿Desea continuar con la inserción? (s/n): ")
        if continuar.lower() != 's':
            print("Operación cancelada")
            return
        
        # Insertar datos
        insertar_datos(conexion, df)
        
        print("\nProceso completado exitosamente!")
        
    except Exception as e:
        print(f"Error general en el proceso: {e}")
    
    finally:
        if conexion.is_connected():
            conexion.close()
            print("Conexión a MySQL cerrada")

if __name__ == "__main__":
    print("=== Script de Importación Excel a MySQL ===")
    print("Novedades - Base de datos: bdsaocomco_operadores")
    print("=" * 50)
    
    # Verificar dependencias
    try:
        import pandas as pd
        import mysql.connector
        print("Dependencias verificadas correctamente")
    except ImportError as e:
        print(f"Error: Falta instalar dependencias - {e}")
        print("Ejecute: pip install pandas mysql-connector-python openpyxl")
        exit(1)
    
    main()
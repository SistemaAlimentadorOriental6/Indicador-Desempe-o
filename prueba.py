#importar librerias
import pyodbc
import pandas as pd
import warnings
import subprocess
from datetime import datetime
import numpy as np
import smtplib
import os
import locale

#El Duelo


warnings.filterwarnings('ignore')

server = '192.168.90.64'
bd = 'UNOEE'
user =  'power-bi'
password = 'Z1x2c3v4*'

try: 
    conexion = pyodbc.connect('DRIVER={SQL Server};SERVER='+server+';DATABASE='+bd+';UID='+user+';PWD='+password)
    print('Conexión exitosa')
except Exception as ex: 
    print(ex)

driver= '{SQL Server Native Client 11.0}'

cursor= conexion.cursor()

#Traer datos de la BD SAO6 y extraer los últimos 8 digitos del ID para hacer el cruce de tablas left(F200_ID,8) as [key]
# Definir la consulta SQL
codigo_SQL = "SELECT fecha_creacion, referencia_inteligente, descripcion_parte,codigo_documento_transaccion, numero_documento_transaccion, cantidad_salida, costo_promedio, descripcion_centro_costo FROM [ADMIN-SALIDAS_ALMACEN_1] WHERE codigo_documento_transaccion = 'SCI' AND codigo_bodega = 'BP001' AND fecha_creacion > '2023-01-01'"

# Ejecutar la consulta
df_SCI = pd.read_sql(codigo_SQL, conexion)

# Cerrar el cursor y la conexión
conexion.close()
# Convertir las columnas a cadenas de texto
df_SCI["numero_documento_transaccion"] = df_SCI["numero_documento_transaccion"].astype(str)
df_SCI["referencia_inteligente"] = df_SCI["referencia_inteligente"].astype(str)

# Concatenar las columnas
df_SCI["SCI+REF"] = df_SCI["numero_documento_transaccion"].str.cat(
    df_SCI["referencia_inteligente"], sep=""
)
# Función para formatear un número en estilo moneda

def formatear_moneda(valor):
    if pd.isnull(valor):
        return ""
    return f"${valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

# Aplicar el formato a la columna costo_promedio
df_SCI['Costo Unitario'] = df_SCI["costo_promedio"].apply(formatear_moneda)
#Convertir los números a enteros filtrando las filas que no contengan datos

df_SCI["cantidad_salida"] = df_SCI["cantidad_salida"].astype(int)
# Extraer minuta de repuestos de la Z
df_minuta = pd.read_excel(r'Z:\ALMACEN\PRIVADA\ALMACEN 2020\MINUTA REPUESTOS NO ENTREGADOS REVISADA_11122023.xlsx', sheet_name='MINUTA CONTROL', skiprows=3)
#Filtrar los N/A o vacios en la columna numero_documento
df_minuta["Numero_documento"] = df_minuta["Numero_documento"].replace(["N/A", " "], pd.NA)
df_minuta = df_minuta[df_minuta["Numero_documento"].notna()]

df_minuta = df_minuta[df_minuta['Numero_documento'] != 0]
df_minuta = df_minuta.reset_index(drop=True) #Ordenar las referencias
df_minuta= df_minuta.drop(columns=['Unnamed: 0']) #eliminar columna

# Renombrar una columna
df_minuta = df_minuta.rename(columns={'SCI&NombreItem': 'SCI+REF'})
df_minuta = df_minuta.rename(columns={'Nombre Item': 'Descripcion_parte'})
df_minuta = df_minuta.rename(columns={'Fecha SCI (Año-Mes-Día)': 'Fecha'})

# Asegurarse de que la columna "Costo Unitario" sea numérica
df_minuta["Costo Unitario"] = pd.to_numeric(df_minuta["Costo Unitario"], errors='coerce')

# Función para formatear un número en estilo moneda
def formatear_moneda(valor):
    if pd.isnull(valor):
        return ""
    return f"${valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

# Aplicar el formato a la columna costo_unitario
df_minuta["Costo_Unitario"] = df_minuta["Costo Unitario"].apply(formatear_moneda)

#import pandas as pd

# Limpiar la columna "BUS" para dejar solo los números (eliminando texto)
df_minuta["BUS"] = df_minuta["BUS"].fillna('0').astype(str).str.extract('(\d+)')  # Extrae solo los números
df_minuta["BUS"] = df_minuta["BUS"].fillna(0).astype(int)  # Convierte a entero, con 0 en caso de NaN

# Aplicar la misma operación a las otras columnas
df_minuta["Cantidad"] = df_minuta["Cantidad"].fillna(0).astype(int)
df_minuta["Numero_documento"] = df_minuta["Numero_documento"].fillna(0).astype(int)

#Quitar espacios en las columnas
df_minuta.columns = df_minuta.columns.str.strip()
df_SCI.columns = df_SCI.columns.str.strip()

# Establecer el idioma a español
locale.setlocale(locale.LC_TIME, 'es_ES.UTF-8')  # Para sistemas Unix
# locale.setlocale(locale.LC_TIME, 'Spanish_Spain.1252')  # Para Windows

# Asegurarse de que la columna sea de tipo datetime
df_minuta['Fecha'] = pd.to_datetime(df_minuta['Fecha'])

# Obtener el nombre del mes completo en español
df_minuta['mes'] = df_minuta['Fecha'].dt.strftime('%B')
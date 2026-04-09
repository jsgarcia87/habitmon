
import sqlite3
import os

db_path = 'instance/habitmon.db'

if not os.path.exists(db_path):
    print(f"Error: {db_path} no existe.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Añadiendo columnas a la tabla usuarios...")
    cursor.execute("ALTER TABLE usuarios ADD COLUMN pokemon_inicial_id VARCHAR(10) DEFAULT NULL;")
    cursor.execute("ALTER TABLE usuarios ADD COLUMN pokemon_inicial_nombre VARCHAR(50) DEFAULT NULL;")
    conn.commit()
    print("Migración completada con éxito.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("Las columnas ya existen.")
    else:
        print(f"Error de SQL: {e}")
finally:
    conn.close()

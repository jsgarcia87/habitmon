import sqlite3

def migrate():
    try:
        conn = sqlite3.connect('habitmon.db')
        cursor = conn.cursor()
        
        # Check if columns exist
        cursor.execute("PRAGMA table_info(usuarios)")
        columns = [c[1] for c in cursor.fetchall()]
        
        if 'pokemon_inicial_id' not in columns:
            cursor.execute('ALTER TABLE usuarios ADD COLUMN pokemon_inicial_id VARCHAR(10)')
            print("Added pokemon_inicial_id")
            
        if 'pokemon_inicial_nombre' not in columns:
            cursor.execute('ALTER TABLE usuarios ADD COLUMN pokemon_inicial_nombre VARCHAR(50)')
            print("Added pokemon_inicial_nombre")
            
        conn.commit()
        print("Migration completed successfully")
        conn.close()
    except Exception as e:
        print(f"Migration error: {e}")

if __name__ == "__main__":
    migrate()

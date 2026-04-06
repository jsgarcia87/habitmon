from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, date
import json
import os
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///habitmon.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'habitmon-super-secret' # Change this in production
db = SQLAlchemy(app)
jwt = JWTManager(app)

# --- Gym Templates ---
GIMNASIOS_TEMPLATE = [

  # ── MAÑANA (06:00–12:00) ─────────────────────────────────────────────────
  {
    "gym_id": "vestirse", "gym_nombre": "Gimnasio Vestirse",
    "orden": 1, "tiempo": "morning", "mapa_evento": "gym_vestirse",
    "battleback": "Graphics/battlebacks/indoor1.png",
    "pokemon": [
      { "nombre": "Meowth", "id": "052", "nivel": 5, "maxhp": 50,
        "habitos": [
          {"id": "quitarse_pijama", "nombre": "Quitarse el pijama", "icono": "\U0001f319", "da\u00f1o": 25, "obligatorio": True},
          {"id": "quitar_camiseta", "nombre": "Quitar camiseta", "icono": "\U0001f455", "da\u00f1o": 25, "obligatorio": False}
        ]
      },
      { "nombre": "Persian", "id": "053", "nivel": 8, "maxhp": 80,
        "habitos": [
          {"id": "ponerse_interior", "nombre": "Ponerse ropa interior", "icono": "\U0001fa32", "da\u00f1o": 20, "obligatorio": True},
          {"id": "ponerse_pantalones", "nombre": "Ponerse pantalones", "icono": "\U0001f456", "da\u00f1o": 20, "obligatorio": True},
          {"id": "ponerse_camiseta", "nombre": "Ponerse camiseta", "icono": "\U0001f455", "da\u00f1o": 20, "obligatorio": True},
          {"id": "ponerse_calcetines", "nombre": "Ponerse calcetines", "icono": "\U0001f9e6", "da\u00f1o": 20, "obligatorio": False}
        ]
      }
    ]
  },
  {
    "gym_id": "desayuno", "gym_nombre": "Gimnasio Desayuno",
    "orden": 2, "tiempo": "morning", "mapa_evento": "gym_desayuno",
    "battleback": "Graphics/battlebacks/indoor1.png",
    "pokemon": [
      { "nombre": "Snorlax", "id": "143", "nivel": 10, "maxhp": 100,
        "habitos": [
          {"id": "tomar_leche", "nombre": "Tomar leche", "icono": "\U0001f95b", "da\u00f1o": 35, "obligatorio": True},
          {"id": "comer_tostadas", "nombre": "Comer tostadas", "icono": "\U0001f35e", "da\u00f1o": 35, "obligatorio": True},
          {"id": "comer_fruta", "nombre": "Comer fruta", "icono": "\U0001f34a", "da\u00f1o": 30, "obligatorio": False}
        ]
      }
    ]
  },
  {
    "gym_id": "higiene_m", "gym_nombre": "Gimnasio Higiene",
    "orden": 3, "tiempo": "morning", "mapa_evento": "gym_higiene",
    "battleback": "Graphics/battlebacks/indoor1.png",
    "pokemon": [
      { "nombre": "Grimer", "id": "088", "nivel": 8, "maxhp": 70,
        "habitos": [
          {"id": "lavarse_dientes_m", "nombre": "Lavarse dientes", "icono": "\U0001fab5", "da\u00f1o": 35, "obligatorio": True},
          {"id": "lavarse_cara", "nombre": "Lavarse la cara", "icono": "\U0001f9fc", "da\u00f1o": 35, "obligatorio": True}
        ]
      },
      { "nombre": "Muk", "id": "089", "nivel": 12, "maxhp": 90,
        "habitos": [
          {"id": "lavarse_manos_m", "nombre": "Lavarse manos", "icono": "\U0001f932", "da\u00f1o": 30, "obligatorio": True},
          {"id": "peinarse", "nombre": "Peinarse", "icono": "\U0001f487", "da\u00f1o": 30, "obligatorio": False}
        ]
      }
    ]
  },

  # ── TARDE (12:00–20:00) ──────────────────────────────────────────────────
  {
    "gym_id": "deberes", "gym_nombre": "Gimnasio Deberes",
    "orden": 4, "tiempo": "day", "mapa_evento": "gym_deberes",
    "battleback": "Graphics/battlebacks/indoor1.png",
    "pokemon": [
      { "nombre": "Slowpoke", "id": "079", "nivel": 10, "maxhp": 80,
        "habitos": [
          {"id": "sacar_libros", "nombre": "Sacar los libros", "icono": "\U0001f4da", "da\u00f1o": 40, "obligatorio": True},
          {"id": "hacer_deberes", "nombre": "Hacer los deberes", "icono": "\u270f\ufe0f", "da\u00f1o": 40, "obligatorio": True}
        ]
      },
      { "nombre": "Slowbro", "id": "080", "nivel": 14, "maxhp": 100,
        "habitos": [
          {"id": "repasar_leccion", "nombre": "Repasar la lecci\u00f3n", "icono": "\U0001f4d6", "da\u00f1o": 35, "obligatorio": False},
          {"id": "guardar_mochila", "nombre": "Guardar la mochila", "icono": "\U0001f392", "da\u00f1o": 35, "obligatorio": True},
          {"id": "firmar_agenda", "nombre": "Firmar la agenda", "icono": "\u270d\ufe0f", "da\u00f1o": 30, "obligatorio": False}
        ]
      }
    ]
  },
  {
    "gym_id": "merienda", "gym_nombre": "Gimnasio Merienda",
    "orden": 5, "tiempo": "day", "mapa_evento": "gym_merienda",
    "battleback": "Graphics/battlebacks/outdoor.png",
    "pokemon": [
      { "nombre": "Oddish", "id": "043", "nivel": 8, "maxhp": 60,
        "habitos": [
          {"id": "merendar_fruta", "nombre": "Comer fruta", "icono": "\U0001f34e", "da\u00f1o": 30, "obligatorio": True},
          {"id": "merendar_bocata", "nombre": "Comer bocadillo", "icono": "\U0001f96a", "da\u00f1o": 30, "obligatorio": False}
        ]
      }
    ]
  },
  {
    "gym_id": "orden", "gym_nombre": "Gimnasio Orden",
    "orden": 6, "tiempo": "day", "mapa_evento": "gym_orden",
    "battleback": "Graphics/battlebacks/indoor1.png",
    "pokemon": [
      { "nombre": "Voltorb", "id": "100", "nivel": 10, "maxhp": 60,
        "habitos": [
          {"id": "hacer_cama", "nombre": "Hacer la cama", "icono": "\U0001f6cf\ufe0f", "da\u00f1o": 60, "obligatorio": True}
        ]
      },
      { "nombre": "Electrode", "id": "101", "nivel": 14, "maxhp": 100,
        "habitos": [
          {"id": "recoger_habitacion", "nombre": "Recoger habitaci\u00f3n", "icono": "\U0001f9f8", "da\u00f1o": 35, "obligatorio": True},
          {"id": "dejar_ropa_sucia", "nombre": "Ropa al cesto", "icono": "\U0001f9fa", "da\u00f1o": 35, "obligatorio": False},
          {"id": "limpiar_mesa", "nombre": "Limpiar la mesa", "icono": "\U0001f9f9", "da\u00f1o": 30, "obligatorio": False}
        ]
      }
    ]
  },

  # ── NOCHE (20:00–06:00) ──────────────────────────────────────────────────
  {
    "gym_id": "ducha", "gym_nombre": "Gimnasio Ducha",
    "orden": 7, "tiempo": "night", "mapa_evento": "gym_ducha",
    "battleback": "Graphics/battlebacks/indoor1.png",
    "pokemon": [
      { "nombre": "Psyduck", "id": "054", "nivel": 12, "maxhp": 80,
        "habitos": [
          {"id": "ducharse", "nombre": "Ducharse", "icono": "\U0001f6bf", "da\u00f1o": 40, "obligatorio": True},
          {"id": "lavarse_pelo", "nombre": "Lavarse el pelo", "icono": "\U0001f9f4", "da\u00f1o": 40, "obligatorio": False}
        ]
      },
      { "nombre": "Golduck", "id": "055", "nivel": 15, "maxhp": 100,
        "habitos": [
          {"id": "lavarse_dientes_n", "nombre": "Lavarse dientes", "icono": "\U0001f9b7", "da\u00f1o": 35, "obligatorio": True},
          {"id": "ponerse_pijama", "nombre": "Ponerse pijama", "icono": "\U0001f319", "da\u00f1o": 35, "obligatorio": True},
          {"id": "crema_manos", "nombre": "Ponerse crema", "icono": "\U0001f9f4", "da\u00f1o": 30, "obligatorio": False}
        ]
      }
    ]
  },
  {
    "gym_id": "cena", "gym_nombre": "Gimnasio Cena",
    "orden": 8, "tiempo": "night", "mapa_evento": "gym_cena",
    "battleback": "Graphics/battlebacks/indoor1.png",
    "pokemon": [
      { "nombre": "Growlithe", "id": "058", "nivel": 10, "maxhp": 70,
        "habitos": [
          {"id": "cenar_verduras", "nombre": "Cenar verduras", "icono": "\U0001f966", "da\u00f1o": 35, "obligatorio": True},
          {"id": "cenar_proteina", "nombre": "Cenar prote\u00edna", "icono": "\U0001f357", "da\u00f1o": 35, "obligatorio": True}
        ]
      }
    ]
  },
  {
    "gym_id": "dormir", "gym_nombre": "Gimnasio Dormir",
    "orden": 9, "tiempo": "night", "mapa_evento": "gym_dormir",
    "battleback": "Graphics/battlebacks/indoor1.png",
    "pokemon": [
      { "nombre": "Jigglypuff", "id": "039", "nivel": 10, "maxhp": 80,
        "habitos": [
          {"id": "apagar_tablet", "nombre": "Apagar tablet/tele", "icono": "\U0001f4f5", "da\u00f1o": 40, "obligatorio": True},
          {"id": "meterse_cama", "nombre": "Meterse en la cama", "icono": "\U0001f6cf\ufe0f", "da\u00f1o": 40, "obligatorio": True}
        ]
      },
      { "nombre": "Wigglytuff", "id": "040", "nivel": 14, "maxhp": 100,
        "habitos": [
          {"id": "leer_cuento", "nombre": "Leer un cuento", "icono": "\U0001f4d5", "da\u00f1o": 35, "obligatorio": False},
          {"id": "apagar_luz", "nombre": "Apagar la luz", "icono": "\U0001f4a1", "da\u00f1o": 35, "obligatorio": True},
          {"id": "buenas_noches", "nombre": "Dar las buenas noches", "icono": "\U0001f634", "da\u00f1o": 30, "obligatorio": False}
        ]
      }
    ]
  }
]

# --- Database Models ---

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PokemonColeccion(db.Model):
    __tablename__ = 'pokemon_coleccion'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    pokemon_id = db.Column(db.String(10), nullable=False)
    pokemon_nombre = db.Column(db.String(50))
    fecha_captura = db.Column(db.Date, default=date.today)
    gimnasio_origen = db.Column(db.String(50))

class Habito(db.Model):
    __tablename__ = 'habitos'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    gimnasio_id = db.Column(db.String(50), nullable=False)
    pokemon_index = db.Column(db.Integer, default=0) # Which pokemon in the gym sequence
    habito_id = db.Column(db.String(50), nullable=False)
    habito_nombre = db.Column(db.String(100))
    completado = db.Column(db.Boolean, default=False)
    fecha = db.Column(db.Date, default=date.today)

class ProgresoDiario(db.Model):
    __tablename__ = 'progreso_diario'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    fecha = db.Column(db.Date, default=date.today)
    gimnasios_completados = db.Column(db.JSON, default=list)
    pokemon_obtenidos = db.Column(db.JSON, default=list)

# --- Auth Routes ---

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    if Usuario.query.filter_by(email=data['email']).first():
        return jsonify({"success": False, "error": "Email already exists"}), 400
    
    new_user = Usuario(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'], method='pbkdf2:sha256'),
        avatar=data.get('avatar', 0)
    )
    db.session.add(new_user)
    db.session.commit()
    
    token = create_access_token(identity=str(new_user.id))
    return jsonify({"success": True, "token": token, "usuario": {"id": new_user.id, "username": new_user.username, "avatar": new_user.avatar}})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = Usuario.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password_hash, data['password']):
        token = create_access_token(identity=str(user.id))
        return jsonify({"success": True, "token": token, "usuario": {"id": user.id, "username": user.username, "avatar": user.avatar}})
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

# --- Gameplay Routes ---

@app.route('/api/coleccion/<int:usuario_id>', methods=['GET'])
@jwt_required()
def get_coleccion(usuario_id):
    pokemon = PokemonColeccion.query.filter_by(usuario_id=usuario_id).all()
    res = []
    for p in pokemon:
        res.append({
            "pokemon_id": p.pokemon_id,
            "pokemon_nombre": p.pokemon_nombre,
            "fecha_captura": p.fecha_captura.isoformat(),
            "gimnasio_origen": p.gimnasio_origen
        })
    return jsonify({"success": True, "pokemon": res})

@app.route('/api/habitos/template', methods=['GET'])
@jwt_required()
def get_template():
    return jsonify({"success": True, "template": GIMNASIOS_TEMPLATE})

@app.route('/api/progreso/setup', methods=['POST'])
@jwt_required()
def setup_day():
    user_id = int(get_jwt_identity())
    data = request.json # List of habits selected/adjusted
    today = date.today()
    
    # Clear existing for today
    Habito.query.filter_by(usuario_id=user_id, fecha=today).delete()
    
    for h in data['habitos']:
        new_h = Habito(
            usuario_id=user_id,
            gimnasio_id=h['gym_id'],
            pokemon_index=h.get('pokemon_index', 0),
            habito_id=h['habito_id'],
            habito_nombre=h['habito_nombre'],
            fecha=today
        )
        db.session.add(new_h)
    
    # Ensure progress object exists
    if not ProgresoDiario.query.filter_by(usuario_id=user_id, fecha=today).first():
        new_p = ProgresoDiario(usuario_id=user_id, fecha=today)
        db.session.add(new_p)
        
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/habito/completar', methods=['POST'])
@jwt_required()
def completar_habito():
    data = request.json
    user_id = int(get_jwt_identity())
    today = date.today()
    
    print(f"DEBUG: Completar habito: {data['gimnasio_id']} - {data['habito_id']} for user {user_id}")
    habito = Habito.query.filter_by(
        usuario_id=user_id, 
        gimnasio_id=data['gimnasio_id'], 
        habito_id=data['habito_id'],
        fecha=today
    ).first()
    
    if habito:
        habito.completado = True
        db.session.commit()
        print("DEBUG: Habito marcado como completado")
        return jsonify({"success": True})
    
    print(f"DEBUG: Habito NO encontrado en DB para fecha {today}")
    return jsonify({"success": False, "error": "Habit not found"}), 404

@app.route('/api/gimnasio/completar', methods=['POST'])
@jwt_required()
def completar_gimnasio():
    data = request.json
    user_id = int(get_jwt_identity())
    today = date.today()
    
    progreso = ProgresoDiario.query.filter_by(usuario_id=user_id, fecha=today).first()
    if progreso:
        gyms = list(progreso.gimnasios_completados or [])
        if data['gimnasio_id'] not in gyms:
            gyms.append(data['gimnasio_id'])
            progreso.gimnasios_completados = gyms
            
            # Add to collection
            new_p = PokemonColeccion(
                usuario_id=user_id,
                pokemon_id=data['pokemon_id'],
                pokemon_nombre=data['pokemon_nombre'],
                gimnasio_origen=data['gimnasio_id']
            )
            db.session.add(new_p)
            db.session.commit()
            return jsonify({"success": True, "pokemon_ganado": data['pokemon_nombre']})
    return jsonify({"success": False, "error": "Progress not found"}), 404

@app.route('/api/progreso/<int:usuario_id>/<string:fecha_str>', methods=['GET'])
@jwt_required()
def get_progreso(usuario_id, fecha_str):
    try:
        query_date = datetime.strptime(fecha_str, '%Y-%m-%d').date()
    except:
        query_date = date.today()
    
    habitos = Habito.query.filter_by(
        usuario_id=usuario_id, 
        fecha=query_date
    ).all()
    
    # Si no hay hábitos para hoy → necesita setup
    if not habitos:
        return jsonify({"success": True, "setup_required": True})
    
    progreso = ProgresoDiario.query.filter_by(
        usuario_id=usuario_id, 
        fecha=query_date
    ).first()
    
    habitos_list = []
    for h in habitos:
        # Find extra info from template
        extra = None
        gym = next((g for g in GIMNASIOS_TEMPLATE if g['gym_id'] == h.gimnasio_id), None)
        if gym:
            pk = gym['pokemon'][h.pokemon_index] if h.pokemon_index < len(gym['pokemon']) else None
            if pk:
                extra = next((th for th in pk['habitos'] if th['id'] == h.habito_id), None)
        
        habitos_list.append({
            "gym_id": h.gimnasio_id,
            "pokemon_index": h.pokemon_index,
            "id": h.habito_id,
            "nombre": h.habito_nombre,
            "completado": h.completado,
            "icono": extra['icono'] if extra else "❓",
            "daño": extra['daño'] if extra else 10
        })
    
    hour = datetime.now().hour
    if 6 <= hour < 12:
        tiempo_actual = 'morning'
    elif 12 <= hour < 20:
        tiempo_actual = 'day'
    else:
        tiempo_actual = 'night'

    return jsonify({
        "success": True,
        "setup_required": False,
        "tiempo_actual": tiempo_actual,
        "gimnasios_completados": progreso.gimnasios_completados if progreso else [],
        "habitos": habitos_list
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=8000, debug=True)

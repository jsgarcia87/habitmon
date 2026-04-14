from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import (JWTManager, 
  create_access_token, jwt_required, get_jwt_identity)
from werkzeug.security import (generate_password_hash, 
  check_password_hash)
from datetime import datetime, date
import json
import os

app = Flask(__name__, 
            static_folder='react-app/dist', 
            static_url_path='/')
CORS(app)

# Servir Frontend
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')
# Use an absolute path for the database to avoid issues with current working directory
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'habitmon.db')
app.config['JWT_SECRET_KEY'] = 'habitmon-secret-2024'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
jwt = JWTManager(app)

# IMPORTANTE: Añade este handler para debug
@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"JWT Invalid: {error}")
    return jsonify({"success":False,"msg":"Invalid"}), 401

@jwt.expired_token_loader  
def expired_token_callback(jwt_header, jwt_data):
    print(f"JWT Expired")
    return jsonify({"success":False,"msg":"Expired"}), 401

@jwt.unauthorized_loader
def unauthorized_callback(error):
    print(f"JWT Missing: {error}")
    return jsonify({"success":False,"msg":"Missing"}), 401


# ---------------------------------------------------------
# MODELS
# ---------------------------------------------------------

class Usuario(db.Model):
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(50), unique=True, nullable=False)
    email         = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar        = db.Column(db.Integer, default=0)
    # Pokémon inicial
    starter_id    = db.Column(db.String(10), nullable=True)
    starter_nombre= db.Column(db.String(50), nullable=True)
    starter_nivel  = db.Column(db.Integer, default=5)
    starter_exp    = db.Column(db.Integer, default=0)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "avatar": self.avatar,
            "starter_id": self.starter_id,
            "starter_nombre": self.starter_nombre,
            "starter_nivel": self.starter_nivel,
            "starter_exp": self.starter_exp
        }

class HabitoConfig(db.Model):
    """Config de hábitos por usuario (el padre edita esto)"""
    id          = db.Column(db.Integer, primary_key=True)
    usuario_id  = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    gym_id      = db.Column(db.String(50), nullable=False)
    habito_id   = db.Column(db.String(50), nullable=False)
    habito_nombre = db.Column(db.String(100), nullable=False)
    icono       = db.Column(db.String(10), default='⚔️')
    daño        = db.Column(db.Integer, default=25)
    activo      = db.Column(db.Boolean, default=True)
    orden       = db.Column(db.Integer, default=0)

class ProgresoDia(db.Model):
    """Progreso diario — se resetea cada día"""
    id          = db.Column(db.Integer, primary_key=True)
    usuario_id  = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    fecha       = db.Column(db.Date, default=date.today)
    gym_id      = db.Column(db.String(50), nullable=False)
    habito_id   = db.Column(db.String(50), nullable=False)
    completado  = db.Column(db.Boolean, default=False)
    __table_args__ = (
        db.UniqueConstraint('usuario_id','fecha',
                           'gym_id','habito_id'),
    )

class GimnasioCompletado(db.Model):
    id          = db.Column(db.Integer, primary_key=True)
    usuario_id  = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    gym_id      = db.Column(db.String(50), nullable=False)
    fecha       = db.Column(db.Date, default=date.today)

class Pokemon(db.Model):
    """Colección de Pokémon capturados"""
    id              = db.Column(db.Integer, primary_key=True)
    usuario_id      = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    pokemon_id      = db.Column(db.String(10), nullable=False)
    pokemon_nombre  = db.Column(db.String(50), nullable=False)
    origen          = db.Column(db.String(50))  # gym_id o 'wild'
    fecha_captura   = db.Column(db.Date, default=date.today)

# ---------------------------------------------------------
# DEFAULT HABITOS TEMPLATE
# ---------------------------------------------------------

DEFAULT_HABITOS = [
  # GYM: VESTIRSE
  {"gym_id":"vestirse","gym_nombre":"Gym Vestirse",
   "pokemon_fase1":{"id":"052","nombre":"Meowth","nivel":5,"maxhp":50},
   "pokemon_fase2":{"id":"053","nombre":"Persian","nivel":8,"maxhp":80},
   "fase1":[
     {"habito_id":"quitar_pijama","nombre":"Quitar pijama","icono":"🌙","daño":25},
     {"habito_id":"quitar_calcetines","nombre":"Quitar calcetines","icono":"🧦","daño":25}
   ],
   "fase2":[
     {"habito_id":"ponerse_ropa_interior","nombre":"Ponerse ropa interior","icono":"🩲","daño":20},
     {"habito_id":"ponerse_pantalones","nombre":"Ponerse pantalones","icono":"👖","daño":20},
     {"habito_id":"ponerse_camiseta","nombre":"Ponerse camiseta","icono":"👕","daño":20},
     {"habito_id":"ponerse_calcetines","nombre":"Ponerse calcetines","icono":"🧦","daño":20}
   ]
  },
  # GYM: DESAYUNO
  {"gym_id":"desayuno","gym_nombre":"Gym Desayuno",
   "pokemon_fase1":{"id":"143","nombre":"Snorlax","nivel":10,"maxhp":100},
   "pokemon_fase2":None,
   "fase1":[
     {"habito_id":"tomar_leche","nombre":"Tomar leche","icono":"🥛","daño":35},
     {"habito_id":"comer_tostadas","nombre":"Comer tostadas","icono":"🍞","daño":35},
     {"habito_id":"comer_fruta","nombre":"Comer fruta","icono":"🍊","daño":30}
   ],
   "fase2":None
  },
  # GYM: HIGIENE
  {"gym_id":"higiene","gym_nombre":"Gym Higiene",
   "pokemon_fase1":{"id":"088","nombre":"Grimer","nivel":8,"maxhp":70},
   "pokemon_fase2":{"id":"089","nombre":"Muk","nivel":12,"maxhp":90},
   "fase1":[
     {"habito_id":"lavarse_dientes","nombre":"Lavarse dientes","icono":"🪥","daño":35},
     {"habito_id":"lavarse_cara","nombre":"Lavarse cara","icono":"🧼","daño":35}
   ],
   "fase2":[
     {"habito_id":"lavarse_manos","nombre":"Lavarse manos","icono":"🤲","daño":30},
     {"habito_id":"peinarse","nombre":"Peinarse","icono":"💇","daño":30}
   ]
  },
  # GYM: ORDEN
  {"gym_id":"orden","gym_nombre":"Gym Orden",
   "pokemon_fase1":{"id":"100","nombre":"Voltorb","nivel":10,"maxhp":60},
   "pokemon_fase2":{"id":"101","nombre":"Electrode","nivel":14,"maxhp":100},
   "fase1":[
     {"habito_id":"hacer_cama","nombre":"Hacer la cama","icono":"🛏️","daño":60}
   ],
   "fase2":[
     {"habito_id":"recoger_habitacion","nombre":"Recoger habitación","icono":"🧸","daño":35},
     {"habito_id":"preparar_mochila","nombre":"Preparar mochila","icono":"🎒","daño":35}
   ]
  }
]

def init_default_habitos(usuario_id):
    # Revisa si ya tiene config
    count = HabitoConfig.query.filter_by(usuario_id=usuario_id).count()
    if count > 0: return

    for gym in DEFAULT_HABITOS:
        # Fase 1
        for h in gym['fase1']:
            db.session.add(HabitoConfig(
                usuario_id=usuario_id,
                gym_id=gym['gym_id'],
                habito_id=h['habito_id'],
                habito_nombre=h['nombre'],
                icono=h['icono'],
                daño=h['daño'],
                orden=0
            ))
        # Fase 2 if exists
        if gym['fase2']:
            for h in gym['fase2']:
                db.session.add(HabitoConfig(
                    usuario_id=usuario_id,
                    gym_id=gym['gym_id'],
                    habito_id=h['habito_id'],
                    habito_nombre=h['nombre'],
                    icono=h['icono'],
                    daño=h['daño'],
                    orden=1
                ))
    db.session.commit()

# ---------------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------------

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if Usuario.query.filter_by(email=data['email']).first():
        return jsonify({"success": False, "message": "Email ya registrado"}), 400
    
    new_user = Usuario(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'], method='pbkdf2:sha256'),
        avatar=data.get('avatar', 0)
    )
    db.session.add(new_user)
    db.session.commit()
    
    init_default_habitos(new_user.id)
    
    token = create_access_token(identity=str(new_user.id))
    return jsonify({"success": True, "token": token, "usuario": new_user.to_dict()})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = Usuario.query.filter_by(email=data['email']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        token = create_access_token(identity=str(user.id))
        return jsonify({"success": True, "token": token, "usuario": user.to_dict()})
    
    return jsonify({"success": False, "message": "Credenciales inválidas"}), 401

@app.route('/api/starter/elegir', methods=['POST'])
@jwt_required()
def elegir_starter():
    uid = get_jwt_identity()
    data = request.get_json()
    user = Usuario.query.get(uid)
    
    user.starter_id = data['pokemon_id']
    user.starter_nombre = data['pokemon_nombre']
    
    # Add to collection
    pk = Pokemon(
        usuario_id=uid,
        pokemon_id=data['pokemon_id'],
        pokemon_nombre=data['pokemon_nombre'],
        origen='starter'
    )
    db.session.add(pk)
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/starter/info', methods=['GET'])
@jwt_required()
def get_starter_info():
    uid = get_jwt_identity()
    user = Usuario.query.get(uid)
    return jsonify({
        "success": True,
        "starter_id": user.starter_id,
        "starter_nombre": user.starter_nombre,
        "starter_nivel": user.starter_nivel,
        "starter_exp": user.starter_exp
    })

@app.route('/api/habitos/config', methods=['GET', 'POST'])
@jwt_required()
def habitos_config():
    uid = int(get_jwt_identity())
    if request.method == 'GET':
        configs = HabitoConfig.query.filter_by(usuario_id=uid).all()
        # Group by gym_id
        gyms_map = {}
        for c in configs:
            gid = c.gym_id
            if gid not in gyms_map:
                gyms_map[gid] = {
                    "gym_id": gid,
                    "gym_nombre": f"Gym {gid.capitalize()}",
                    "activo": True,
                    "habitos": []
                }
            gyms_map[gid]["habitos"].append({
                "id": c.habito_id,
                "nombre": c.habito_nombre,
                "icono": c.icono,
                "daño": c.daño,
                "activo": c.activo
            })
        
        # Si no hay nada, el frontend usa defaults, pero devolver lista vacía
        return jsonify({"success": True, "config": list(gyms_map.values())})
    else:
        # POST: Replace config
        data = request.get_json() # expects list of gym objects
        if not isinstance(data, list):
            return jsonify({"success":False,"error":"Invalid data format"}), 400
            
        HabitoConfig.query.filter_by(usuario_id=uid).delete()
        for gym in data:
            gym_id = gym.get('gym_id')
            # Extraer los hábitos del gym
            habitos = gym.get('habitos') or gym.get('pokemon', [{}])[0].get('habitos', [])
            
            for h in habitos:
                db.session.add(HabitoConfig(
                    usuario_id=uid,
                    gym_id=gym_id,
                    habito_id=h.get('id') or h.get('habito_id'),
                    habito_nombre=h.get('nombre') or h.get('habito_nombre'),
                    icono=h.get('icono', '⚔️'),
                    daño=h.get('daño') or h.get('damage') or 25,
                    activo=h.get('activo', True)
                ))
        db.session.commit()
        return jsonify({"success": True})


@app.route('/api/habitos/hoy', methods=['GET'])
@jwt_required()
def get_habitos_hoy():
    uid = get_jwt_identity()
    today = date.today()
    
    # Check current config
    configs = HabitoConfig.query.filter_by(usuario_id=uid, activo=True).all()
    
    # Get or create today's progress
    habitos_res = []
    for c in configs:
        prog = ProgresoDia.query.filter_by(
            usuario_id=uid, fecha=today, 
            gym_id=c.gym_id, habito_id=c.habito_id
        ).first()
        
        if not prog:
            prog = ProgresoDia(
                usuario_id=uid, fecha=today, 
                gym_id=c.gym_id, habito_id=c.habito_id, 
                completado=False
            )
            db.session.add(prog)
            db.session.flush() # assign ID
            
        habitos_res.append({
            "gym_id": c.gym_id,
            "habito_id": c.habito_id,
            "nombre": c.habito_nombre,
            "icono": c.icono,
            "daño": c.daño,
            "completado": prog.completado
        })
    
    db.session.commit()
    return jsonify({"success": True, "habitos": habitos_res})

@app.route('/api/habitos/completar', methods=['POST'])
@jwt_required()
def completar_habito():
    uid = get_jwt_identity()
    today = date.today()
    data = request.get_json()
    
    prog = ProgresoDia.query.filter_by(
        usuario_id=uid, fecha=today, 
        gym_id=data['gym_id'], habito_id=data['habito_id']
    ).first()
    
    if not prog:
        return jsonify({"success": False, "message": "Hábito no encontrado para hoy"}), 404
    
    if prog.completado:
        return jsonify({"success": False, "message": "ya completado"}), 400
    
    prog.completado = True
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/gimnasios/hoy', methods=['GET'])
@jwt_required()
def get_gimnasios_hoy():
    uid = int(get_jwt_identity())
    today = date.today()
    
    # Obtener config de hábitos del usuario
    gym_ids = db.session.query(
        HabitoConfig.gym_id
    ).filter_by(
        usuario_id=uid, 
        activo=True  # solo gimnasios activos
    ).distinct().all()
    
    gym_ids = [g[0] for g in gym_ids]
    
    if not gym_ids:
        # Si no hay config, usar template default
        from default_config import DEFAULT_GYMS
        gym_ids = DEFAULT_GYMS
    
    res = []
    for gid in gym_ids:
        # IMPORTANTE: filtrar por fecha HOY
        comp = GimnasioCompletado.query.filter_by(
            usuario_id=uid,
            gym_id=gid,
            fecha=today  # solo hoy
        ).first()
        
        total = ProgresoDia.query.filter_by(
            usuario_id=uid,
            fecha=today,  # solo hoy
            gym_id=gid
        ).count()
        
        done = ProgresoDia.query.filter_by(
            usuario_id=uid,
            fecha=today,  # solo hoy
            gym_id=gid,
            completado=True
        ).count()
        
        res.append({
            "gym_id": gid,
            "completado": comp is not None,
            "habitos_completados": done,
            "total_habitos": total
        })
    
    return jsonify({"success": True, "gimnasios": res})


@app.route('/api/gimnasios/completar', methods=['POST'])
@jwt_required()
def completar_gimnasio():
    uid = get_jwt_identity()
    today = date.today()
    data = request.get_json()
    gid = data['gym_id']
    
    user = Usuario.query.get(uid)
    
    # Check if already completed today
    if GimnasioCompletado.query.filter_by(usuario_id=uid, fecha=today, gym_id=gid).first():
        return jsonify({"success": False, "message": "Gimnasio ya completado hoy"}), 400
    
    # Add to completed
    comp = GimnasioCompletado(usuario_id=uid, fecha=today, gym_id=gid)
    db.session.add(comp)
    
    # Add Pokémon to collection
    new_pk = Pokemon(
        usuario_id=uid,
        pokemon_id=data['pokemon_id'],
        pokemon_nombre=data['pokemon_nombre'],
        origen=gid
    )
    db.session.add(new_pk)
    
    # EXP Logic
    exp_gained = 50
    user.starter_exp += exp_gained
    subio_nivel = False
    
    target_exp = user.starter_nivel * 100
    if user.starter_exp >= target_exp:
        user.starter_nivel += 1
        user.starter_exp = 0 # reset or keep remainder? instructions say reset level*100
        subio_nivel = True
    
    db.session.commit()
    return jsonify({
        "success": True, 
        "exp_ganada": exp_gained, 
        "subio_nivel": subio_nivel,
        "nuevo_nivel": user.starter_nivel
    })

@app.route('/api/coleccion', methods=['GET'])
@jwt_required()
def get_coleccion():
    uid = get_jwt_identity()
    pks = Pokemon.query.filter_by(usuario_id=uid).all()
    res = [{
        "pokemon_id": p.pokemon_id,
        "pokemon_nombre": p.pokemon_nombre,
        "origen": p.origen,
        "fecha_captura": p.fecha_captura.isoformat()
    } for p in pks]
    return jsonify({"success": True, "pokemon": res})

@app.route('/api/admin/config', methods=['GET', 'POST'])
@jwt_required()
def admin_config():
    # En esta fase hace lo mismo que habitos_config
    return habitos_config()

# ---------------------------------------------------------
# START
# ---------------------------------------------------------

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    # Catch-all for SPA routing
    @app.errorhandler(404)
    def not_found(e):
        return send_from_directory(app.static_folder, 'index.html')

    app.run(port=8000, debug=True)

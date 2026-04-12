import os
from app import app, db, Usuario, Pokemon, init_default_habitos
from werkzeug.security import generate_password_hash

def setup_test_user():
    with app.app_context():
        # Clean existing test user if exists
        u = Usuario.query.filter_by(email="entrenador@habitmon.com").first()
        if u:
            print("Resetting existing test user...")
            db.session.delete(u)
            db.session.commit()
            
        # Create new test user
        new_user = Usuario(
            username="AshKetchum",
            email="entrenador@habitmon.com",
            password_hash=generate_password_hash("habitmon123", method="pbkdf2:sha256"),
            avatar=1,
            starter_id="155", # Cyndaquil
            starter_nombre="Cyndaquil",
            starter_nivel=5,
            starter_exp=0
        )
        db.session.add(new_user)
        db.session.commit()
        
        # Initialize default habits
        init_default_habitos(new_user.id)
        
        # Add starter to collection
        pk = Pokemon(
            usuario_id=new_user.id,
            pokemon_id="155",
            pokemon_nombre="Cyndaquil",
            origen="starter"
        )
        db.session.add(pk)
        db.session.commit()
        
        print("Test user created successfully!")
        print("Email: entrenador@habitmon.com")
        print("Password: habitmon123")

if __name__ == "__main__":
    setup_test_user()

import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

def test_flow():
    print("Testing Habitmon API...")
    
    # 1. Register
    reg_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
        "avatar": 1
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
    if r.status_code != 200 and "Email ya registrado" not in r.text:
        print(f"Register failed: {r.text}")
        return
    
    # 2. Login
    login_data = {"email": "test@example.com", "password": "password123"}
    r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if r.status_code != 200:
        print(f"Login failed: {r.text}")
        return
    
    token = r.json()['token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Choose starter
    starter_data = {"pokemon_id": "001", "pokemon_nombre": "Bulbasaur"}
    r = requests.post(f"{BASE_URL}/starter/elegir", json=starter_data, headers=headers)
    print(f"Choose starter: {r.json()}")
    
    # 4. Get habits
    r = requests.get(f"{BASE_URL}/habitos/hoy", headers=headers)
    habits = r.json()['habitos']
    print(f"Found {len(habits)} habits for today")
    
    if len(habits) > 0:
        h = habits[0]
        # 5. Complete habit
        r = requests.post(f"{BASE_URL}/habitos/completar", 
                         json={"gym_id": h['gym_id'], "habito_id": h['habito_id']}, 
                         headers=headers)
        print(f"Complete habit: {r.json()}")
        
    # 6. Complete gym
    r = requests.post(f"{BASE_URL}/gimnasios/completar", 
                     json={"gym_id": "vestirse", "pokemon_id": "052", "pokemon_nombre": "Meowth"}, 
                     headers=headers)
    print(f"Complete gym: {r.json()}")
    
    # 7. Battle victory (wild)
    r = requests.post(f"{BASE_URL}/battle/victory", json={}, headers=headers)
    print(f"Battle victory: {r.json()}")
    
    # 8. Capture pokemon (requires 50 coins)
    # Give some coins first if needed (should have earned some from gym and battle)
    r = requests.post(f"{BASE_URL}/coleccion/capturar", 
                     json={"pokemon_id": "016", "pokemon_nombre": "Pidgey"}, 
                     headers=headers)
    print(f"Capture pokemon: {r.json()}")

if __name__ == "__main__":
    test_flow()

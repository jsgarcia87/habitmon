import json

def build_gym_room(filename, floor_id, wall_id):
    with open(filename, 'r') as f:
        d = json.load(f)
    
    w = d.get('width', 15)
    h = d.get('height', 15)
    
    # Flat array for 3 layers
    data = [0] * (w * h * 3)
    
    # Layer 0
    for y in range(h):
        for x in range(w):
            idx = y * w + x
            # Borders are walls, inside is floor
            if x == 0 or x == w - 1 or y == 0 or y == h - 1:
                data[idx] = wall_id
            else:
                data[idx] = floor_id
    
    d['data'] = data
    if 'tileset_id' in d:
        # Don't change tileset_id here because CityMap manually overrides it in GYM_MAPS
        pass
        
    with open(filename, 'w') as f:
        json.dump(d, f)

build_gym_room('Data/Map004.json', 393, 401)
build_gym_room('Data/Map005.json', 393, 401)
build_gym_room('Data/Map006.json', 393, 401)
build_gym_room('Data/Map007.json', 393, 401)

print("Constructed Gym Maps!")

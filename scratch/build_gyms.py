import json

def construct_gym(filename, floor_id, wall_id):
    with open(filename, 'r') as f:
        d = json.load(f)
    
    w = d.get('width', 15)
    h = d.get('height', 15)
    
    layers = 3
    data = [0] * (w * h * layers)
    
    # Fill Layer 0 (Floor and Borders)
    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if x == 0 or x == w - 1 or y == 0 or y == h - 1:
                data[idx] = wall_id
            else:
                data[idx] = floor_id
                
    d['data'] = data
    with open(filename, 'w') as f:
        json.dump(d, f)

# Make Map004 Cave rules
construct_gym('Data/Map004.json', 393, 401)
# Make Map005 Gym rules
construct_gym('Data/Map005.json', 447, 385)
# Make Map006 Hall of fame rules
construct_gym('Data/Map006.json', 447, 428)
# Make Map007 Gym rules
construct_gym('Data/Map007.json', 447, 385)

print("Constructed all gyms successfully with their ideal structures!")

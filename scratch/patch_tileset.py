import json
def patch_map(filename, tileset_id):
    with open(filename, 'r') as f:
        d = json.load(f)
    d['tileset_id'] = tileset_id
    with open(filename, 'w') as f:
        json.dump(d, f)
patch_map('Data/Map003.json', 7)
patch_map('Data/Map004.json', 20)
patch_map('Data/Map005.json', 17)
patch_map('Data/Map006.json', 54)
patch_map('Data/Map007.json', 18)
print("Patched tileset ids in JSONs")

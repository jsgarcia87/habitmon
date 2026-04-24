import sys
from PIL import Image
import base64
from io import BytesIO

img = Image.open('public/Graphics/tilesets/gsc house 2.png')
cols = img.width // 32
rows = img.height // 32

for i in range(min(40, cols*rows)):  # first 40 ids
    x = (i % cols) * 32
    y = (i // cols) * 32
    patch = img.crop((x, y, x+32, y+32))
    buffered = BytesIO()
    patch.save(buffered, format="PNG")
    b64 = base64.b64encode(buffered.getvalue()).decode()
    print(f"<img src='data:image/png;base64,{b64}' title='ID {i}' /> {i}", end=" | ")
    if (i+1) % 8 == 0:
        print("<br/>")

import base64
import os

# 1x1 transparent PNG
base64_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
image_data = base64.b64decode(base64_data)

files = ["public/icon.png", "public/image.png", "public/splash.png"]

# Ensure directory exists
os.makedirs("public", exist_ok=True)

for file_path in files:
    with open(file_path, "wb") as f:
        f.write(image_data)
    print(f"Created {file_path}")

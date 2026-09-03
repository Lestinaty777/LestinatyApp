import json

with open('/home/arch-i7/Proyects/app/app.json', 'r') as f:
    data = json.load(f)

# Fallback to just the main icon
data['expo']['android']['adaptiveIcon'] = {
    "backgroundColor": "#E6F4FE",
    "foregroundImage": "./assets/icon.png"
}

with open('/home/arch-i7/Proyects/app/app.json', 'w') as f:
    json.dump(data, f, indent=2)


import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Remove patternNeutral and ArcoTransicion component
pattern_regex = re.compile(r'const patternNeutral = .*?function ArcoTransicion\(\) \{.*?\}\n', re.DOTALL)
content = re.sub(pattern_regex, '', content)

# Replace rendering
content = content.replace("<ArcoTransicion />", "<View style={{ height: 24 }} />")

# Remove styles
styles_regex = re.compile(r'  contenedorArco: \{.*?\},', re.DOTALL)
content = re.sub(styles_regex, '', content)

styles_regex2 = re.compile(r'  arcoPixeles: \{.*?\},', re.DOTALL)
content = re.sub(styles_regex2, '', content)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)


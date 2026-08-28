import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'r') as f:
    acode = f.read()

# Fix the import
acode = acode.replace("FadeInDown, ZoomIn", "FadeInDown, ZoomIn") # wait, the import became 'import Reanimated, { FadeIn, FadeInDown, ZoomIn }' wait, no, it became 'import Reanimated, { FadeIn, FadeInDown, ZoomIn }' if it was FadeInDown.
# Let's fix the JSX manually.
acode = acode.replace("entering={FadeInDown, ZoomIn.delay", "entering={FadeInDown.delay")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'w') as f:
    f.write(acode)


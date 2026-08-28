import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'r') as f:
    code = f.read()

# Fix duplicates
code = code.replace("  const [analisisCategoria, setAnalisisCategoria] = useState<string>('rutinas');\n  const [analisisCategoria, setAnalisisCategoria] = useState<string>('rutinas');", "  const [analisisCategoria, setAnalisisCategoria] = useState<string>('rutinas');")

# Fix pestanaActiva === 'activo'
code = code.replace("pestanaActiva === 'activo'", "pestanaActiva === 'analisis'")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'w') as f:
    f.write(code)


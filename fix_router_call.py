import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "router.push('/senderos/leccion');",
    "router.push({ pathname: '/senderos/leccion', params: { color } });"
)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

with open('/home/arch-i7/Proyects/app/app/senderos/leccion.tsx', 'r') as f:
    content2 = f.read()

content2 = content2.replace("import { useRouter } from 'expo-router';", "import { useRouter, useLocalSearchParams } from 'expo-router';")
content2 = content2.replace("  const enrutador = useRouter();", "  const enrutador = useRouter();\n  const { color } = useLocalSearchParams<{ color: string }>();\n  const colorTema = color || '#5B2E91';")
content2 = content2.replace("leccion={MOCK_LECCION}", "leccion={MOCK_LECCION} color={colorTema}")

with open('/home/arch-i7/Proyects/app/app/senderos/leccion.tsx', 'w') as f:
    f.write(content2)

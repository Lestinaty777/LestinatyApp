import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# 1. Asegurar importación de Activity
content = content.replace("import { Beaker, Users } from 'lucide-react-native';", "import { Beaker, Users, Activity } from 'lucide-react-native';")

# 2. Modificar ASIGNATURAS para que Icono (carrusel) sea Lucide, e IconoGrande/IconoFondo (principal) sea PixelartIcon
old_asignaturas = """  const ASIGNATURAS = [
    { id: '1', titulo: 'Anatomía I', color: biomas.inicio.MasterColor, categoriaId: 'salud' as any, desc: 'Sistema óseo, cráneo y articulaciones superiores.', Icono: () => <PixelartIcon name="book-open" size={24} color="#FFFFFF" />, IconoGrande: () => <PixelartIcon name="book-open" size={26} color="#FFFFFF" />, IconoFondo: () => <PixelartIcon name="book-open" size={42} color="#FFFFFF" style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
    { id: '2', titulo: 'Farmacología', color: '#B34A4A', categoriaId: 'habitos' as any, desc: 'Mecanismos de acción y farmacocinética básica.', Icono: () => <Beaker color="#FFFFFF" size={24} />, IconoGrande: () => <Beaker color="#FFFFFF" size={26} />, IconoFondo: () => <Beaker color="#FFFFFF" size={42} style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
    { id: '3', titulo: 'Ciencias Sociales', color: '#4A8BB3', categoriaId: 'rutinas' as any, desc: 'Sociología, psicología y comportamiento humano.', Icono: () => <Users color="#FFFFFF" size={24} />, IconoGrande: () => <Users color="#FFFFFF" size={26} />, IconoFondo: () => <Users color="#FFFFFF" size={42} style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
  ];"""

new_asignaturas = """  const ASIGNATURAS = [
    { id: '1', titulo: 'Anatomía I', color: biomas.inicio.MasterColor, categoriaId: 'salud' as any, desc: 'Sistema óseo, cráneo y articulaciones superiores.', Icono: () => <Activity color="#FFFFFF" size={24} />, IconoGrande: () => <PixelartIcon name="book-open" size={26} color="#FFFFFF" />, IconoFondo: () => <PixelartIcon name="book-open" size={42} color="#FFFFFF" style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
    { id: '2', titulo: 'Farmacología', color: '#B34A4A', categoriaId: 'habitos' as any, desc: 'Mecanismos de acción y farmacocinética básica.', Icono: () => <Beaker color="#FFFFFF" size={24} />, IconoGrande: () => <PixelartIcon name="book-open" size={26} color="#FFFFFF" />, IconoFondo: () => <PixelartIcon name="book-open" size={42} color="#FFFFFF" style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
    { id: '3', titulo: 'Ciencias Sociales', color: '#4A8BB3', categoriaId: 'rutinas' as any, desc: 'Sociología, psicología y comportamiento humano.', Icono: () => <Users color="#FFFFFF" size={24} />, IconoGrande: () => <PixelartIcon name="book-open" size={26} color="#FFFFFF" />, IconoFondo: () => <PixelartIcon name="book-open" size={42} color="#FFFFFF" style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
  ];"""
content = content.replace(old_asignaturas, new_asignaturas)

# 3. Arreglar el icono de fondo transparente dentro del carrusel para que coincida con el Lucide Icon
old_bg_icons = """                       {asig.id === '1' && <PixelartIcon name="book-open" size={42} color="#FFFFFF" />}
                       {asig.id === '2' && <Beaker size={42} color="#FFFFFF" />}
                       {asig.id === '3' && <Users size={42} color="#FFFFFF" />}"""

new_bg_icons = """                       {asig.id === '1' && <Activity size={42} color="#FFFFFF" />}
                       {asig.id === '2' && <Beaker size={42} color="#FFFFFF" />}
                       {asig.id === '3' && <Users size={42} color="#FFFFFF" />}"""
content = content.replace(old_bg_icons, new_bg_icons)

# 4. Traer el brillo un poco más hacia adentro
content = content.replace(
    """  tarjetaBrilloCarrusel: {
    position: 'absolute',
    top: -75,
    left: -60,""",
    """  tarjetaBrilloCarrusel: {
    position: 'absolute',
    top: -62,
    left: -50,"""
)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

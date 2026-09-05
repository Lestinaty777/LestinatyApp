import re

with open('/home/arch-i7/Proyects/app/src/modulos/metas/pantallas/MetasPantalla.tsx', 'r') as f:
    content = f.read()

# Fix Header Title
content = content.replace(
    "titulo: { fontSize: 48, fontFamily: 'Montserrat-Medium', color: '#111', letterSpacing: -2, marginBottom: 24 },",
    "titulo: { fontSize: 40, fontFamily: 'Montserrat-Medium', color: '#111', letterSpacing: -1, marginBottom: 24, lineHeight: 44 },"
)

# Fix Hero Canvas
content = content.replace(
    "lienzo: { \n    height: 280, \n    backgroundColor: '#F0EFEA', \n    justifyContent: 'center', \n    alignItems: 'center',\n    marginBottom: 24,\n    borderRadius: 2\n  },",
    "lienzo: { \n    height: 260, \n    backgroundColor: '#F0EFEA', \n    justifyContent: 'center', \n    alignItems: 'center',\n    marginBottom: 24,\n    borderRadius: 8,\n    overflow: 'hidden'\n  },"
)

content = content.replace(
    "heroArbol: { width: 220, height: 220, zIndex: 2 },",
    "heroArbol: { width: '80%', height: '80%', zIndex: 2 },"
)

# Fix List rows to stack properly on mobile
content = content.replace(
    "filaSubtitulo: { fontSize: 13, fontFamily: 'Montserrat-Medium', color: '#888' },",
    "filaSubtitulo: { fontSize: 13, fontFamily: 'Montserrat-Medium', color: '#888', flexWrap: 'wrap' },"
)

# Fix FAB placement for mobile
content = content.replace(
    "fab: { \n    position: 'absolute', \n    right: 24, \n    width: 64, \n    height: 64, \n    backgroundColor: '#111', ",
    "fab: { \n    position: 'absolute', \n    right: 20, \n    width: 60, \n    height: 60, \n    backgroundColor: '#111', "
)

with open('/home/arch-i7/Proyects/app/src/modulos/metas/pantallas/MetasPantalla.tsx', 'w') as f:
    f.write(content)

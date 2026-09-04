import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Add missing styles if they don't exist
missing_styles = """  tooltipCaja: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  tooltipFlechita: {
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    marginBottom: -8, 
    zIndex: 1,
  },
  tooltipPixelesMarco: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
  },"""

if "tooltipCaja:" not in content:
    content = content.replace("  etiqueta: {", missing_styles + "\n  etiqueta: {")

# Modify existing etiqueta styles
content = content.replace("left: -50,", "left: -70,")
content = content.replace("width: 172,", "width: 212,")
content = content.replace("color: '#E8E8E8',", "color: '#1A1A1A',")
content = content.replace("fontSize: 13,", "fontSize: 14,\n    textAlign: 'center',")
# Remove textShadow
content = re.sub(r'textShadow.*?,', '', content)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)


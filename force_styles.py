import re

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'r') as f:
    content = f.read()

# Replace everything from tooltipPosicionador to tooltipBotonTexto
old_styles_match = re.search(r'  tooltipPosicionador: \{.*  tooltipTitulo:', content, re.DOTALL)
if old_styles_match:
    old_styles_raw = old_styles_match.group(0)
    new_styles_raw = """  tooltipPosicionador: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: [{ translateX: '-50%' }],
    alignItems: 'center',
    marginBottom: 14,
    width: 240,
    zIndex: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  tooltipCaja: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    zIndex: 2,
  },
  tooltipFlechaWrapper: {
  },
  tooltipFlecha: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    marginTop: -10,
    zIndex: 1,
  },
  tooltipTitulo:"""
    content = content.replace(old_styles_raw, new_styles_raw)

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'w') as f:
    f.write(content)


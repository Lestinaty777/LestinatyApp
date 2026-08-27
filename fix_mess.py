with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'r') as f:
    content = f.read()

new_styles = """
  mapaHeaderWrapper: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    gap: 16,
    alignItems: 'center',
  },
  miniLibro: {
    width: 48,
    height: 64,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  miniLibroBisel: {
    width: '85%',
    height: '92%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapaHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  mapaHeaderTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 16,
    color: colores.texto,
    flex: 1,
    marginRight: 8,
  },
  mapaHeaderSub: {
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 11,
    color: colores.textoSecundario,
    marginBottom: 4,
  },
  mapaHeaderCerrar: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mapaHeaderCerrarTexto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 10,
    color: colores.texto,
  },
});"""

# Revert all occurrences back to });
content = content.replace(new_styles, "});")

# Now apply it PROPERLY only at the very end of the file.
# The file ends with:
#   },
# });
# We want to replace the LAST occurrence.
if content.endswith("});\n") or content.endswith("});"):
    content = content[:-3] + new_styles if content.endswith("});") else content[:-4] + new_styles + "\n"
else:
    # Use rsplit to replace only the last occurrence
    parts = content.rsplit("});", 1)
    if len(parts) == 2:
        content = parts[0] + new_styles + parts[1]

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'w') as f:
    f.write(content)


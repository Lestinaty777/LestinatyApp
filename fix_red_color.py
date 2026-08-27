with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'r') as f:
    content = f.read()

# Replace the previous reds with a warm, slightly yellow, highly saturated red (Vermilion/Scarlet)
content = content.replace('stopColor="#FF3B30"', 'stopColor="#FF4A00"')
content = content.replace('stopColor="#B3241F"', 'stopColor="#CC3600"')

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'w') as f:
    f.write(content)

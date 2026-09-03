import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/widgets/CapaCompletado.tsx', 'r') as f:
    rcode = f.read()

# Add 3000ms delay to the sequence
seq_old = """      Animated.sequence([
        Animated.timing(progreso, {"""
seq_new = """      Animated.sequence([
        Animated.delay(3000), // Pausa de 3 segundos para admirar el widget
        Animated.timing(progreso, {"""

rcode = rcode.replace(seq_old, seq_new)

# Add 3000ms to bubbles delay
rcode = re.sub(r'delay=\{(\d+)\}', lambda m: f"delay={{{int(m.group(1)) + 3000}}}", rcode)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/widgets/CapaCompletado.tsx', 'w') as f:
    f.write(rcode)


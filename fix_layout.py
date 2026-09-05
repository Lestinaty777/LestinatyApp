import re

with open('/home/arch-i7/Proyects/app/app/_layout.tsx', 'r') as f:
    content = f.read()

old_stack = """        <Stack.Screen name="senderos/analisis" />"""
new_stack = """        <Stack.Screen name="senderos/analisis" />
        <Stack.Screen name="senderos/leccion" options={{ presentation: 'fullScreenModal' }} />"""

content = content.replace(old_stack, new_stack)

with open('/home/arch-i7/Proyects/app/app/_layout.tsx', 'w') as f:
    f.write(content)

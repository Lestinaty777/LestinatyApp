import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    rcode = f.read()

props_type = """
export type RutinasAnalisisProps = {
  datos: any;
  acento: string;
  itemsCargados: number;
  senderoFiltro: any;
};

export function RutinasAnalisis({ acento }: RutinasAnalisisProps) {
"""

rcode = rcode.replace("export function RutinasAnalisis() {\n  const acento = '#00B4D8';", props_type)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(rcode)


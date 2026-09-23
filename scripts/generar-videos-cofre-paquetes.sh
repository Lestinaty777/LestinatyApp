#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COFRES_DIR="$REPO_DIR/assets/ilustraciones/senderos/biomas/cofres"
SOURCE="$COFRES_DIR/master.mov"
PAQUETES_SOLICITADOS=("$@")

if [[ ! -f "$SOURCE" ]]; then
  echo "No se encontró el maestro: $SOURCE" >&2
  exit 1
fi

# Mismo método que usa MasterChanger/tinteHsv.ts para íconos: rotar el matiz
# SOLO donde el material es verde (el candado/las bisagras doradas quedan
# intactas) y escalar la saturación hacia la del color de destino — no
# reemplazar el RGB directo. `hue=h=<delta>:s=<factor>` rota el frame entero
# preservando saturación/valor relativos (por eso se ve vívido, no lavado);
# `maskedmerge` aplica ese resultado solo donde la máscara (mismo test de
# dominancia de verde que ya usaba este script) dice "esto es verde".
generar_variante() {
  local paquete="$1"
  local delta="$2"
  local factor_sat="$3"
  local destino="$COFRES_DIR/abrir-cofre-$paquete.webm"
  local mascara="if(gt(g(X,Y),1.04*r(X,Y))*gt(g(X,Y),1.01*b(X,Y)),255,0)"

  if ((${#PAQUETES_SOLICITADOS[@]} > 0)); then
    local solicitado=false
    local candidato
    for candidato in "${PAQUETES_SOLICITADOS[@]}"; do
      if [[ "$candidato" == "$paquete" ]]; then
        solicitado=true
        break
      fi
    done
    [[ "$solicitado" == true ]] || return 0
  fi

  ffmpeg -y -v error -i "$SOURCE" -filter_complex "
    [0:v]format=gbrap,split=3[base_out][base_mask][base_hue];
    [base_hue]format=yuva444p,hue=h=$delta:s=$factor_sat,format=gbrap[hued];
    [base_mask]geq=r='$mascara':g='$mascara':b='$mascara':a='alpha(X,Y)',format=gray[mask];
    [base_out][hued][mask]maskedmerge,format=yuva420p
  " -an -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 -cpu-used 4 \
    -auto-alt-ref 0 -pix_fmt yuva420p "$destino"
}

# Colores oficiales de master_pack_color, expresados como delta de matiz desde
# el verde de referencia del material (~150°, medido sobre master.mov) y
# factor de saturación relativo a la saturación medida del mismo material
# (~0.73) — ver docs del comentario de arriba para el porqué.
generar_variante abyss         81.4  0.41
generar_variante amber        -130.9 1.37
generar_variante aurelia      -101.1 1.37
generar_variante celesthia      39.0 1.37
generar_variante crimsonmoon  -165.9 1.17
generar_variante diamante       60.0 0.59
generar_variante eclipse       116.6 0.83
generar_variante esmeralda       9.7 1.35
generar_variante golden       -108.1 1.36
generar_variante ignate       -151.9 1.36
generar_variante lightmoon      70.1 1.37
generar_variante mathist       121.9 0.85
generar_variante moon           73.7 1.09
generar_variante nevalhi        59.0 0.33
generar_variante sakura       -177.0 0.76
generar_variante valvery        35.5 1.36
generar_variante vida          -61.2 1.08

if ((${#PAQUETES_SOLICITADOS[@]} > 0)); then
  echo "Generadas ${#PAQUETES_SOLICITADOS[@]} variantes WebM en $COFRES_DIR"
else
  echo "Generadas 17 variantes WebM en $COFRES_DIR"
fi

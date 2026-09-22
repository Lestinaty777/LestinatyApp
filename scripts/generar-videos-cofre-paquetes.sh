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

generar_variante() {
  local paquete="$1"
  local rojo="$2"
  local verde="$3"
  local azul="$4"
  local destino="$COFRES_DIR/abrir-cofre-$paquete.webm"
  local maximo="max(max(r(X,Y),g(X,Y)),b(X,Y))"
  local mascara="gt(g(X,Y),1.04*r(X,Y))*gt(g(X,Y),1.01*b(X,Y))"

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

  ffmpeg -y -v error -i "$SOURCE" \
    -vf "format=gbrap,geq=r='if($mascara,min(255,$rojo*$maximo/140),r(X,Y))':g='if($mascara,min(255,$verde*$maximo/140),g(X,Y))':b='if($mascara,min(255,$azul*$maximo/140),b(X,Y))':a='alpha(X,Y)',format=yuva420p" \
    -an -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 -cpu-used 4 \
    -auto-alt-ref 0 -pix_fmt yuva420p "$destino"
}

# Colores oficiales de master_pack_color. El filtro recolorea únicamente
# el material verde y conserva los herrajes dorados, luces, sombras y alpha.
generar_variante abyss       33  35  47
generar_variante amber      240  77   1
generar_variante aurelia    255 208   0
generar_variante celesthia    1 176 207
generar_variante crimsonmoon 200  30  75
generar_variante diamante   128 176 224
generar_variante eclipse    106  63 160
generar_variante esmeralda    2 144  96
generar_variante golden     252 177   3
generar_variante ignate     193   2   8
generar_variante lightmoon    0  69 208
generar_variante mathist    178  95 251
generar_variante moon        47  95 224
generar_variante nevalhi    192 223 252
generar_variante sakura     252 112 175
generar_variante valvery      2 160 176
generar_variante vida       124 199  43

if ((${#PAQUETES_SOLICITADOS[@]} > 0)); then
  echo "Generadas ${#PAQUETES_SOLICITADOS[@]} variantes WebM en $COFRES_DIR"
else
  echo "Generadas 17 variantes WebM en $COFRES_DIR"
fi

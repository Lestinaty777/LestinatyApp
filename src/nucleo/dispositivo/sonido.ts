import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { crearBanderaDeseada } from './interruptorDiferido';

export type TipoSonido = 'clickSuave' | 'exito' | 'lluviaLoop';

const FUENTES: Record<TipoSonido, number> = {
  clickSuave: require('../../../assets/sonido/click-suave.wav'),
  exito: require('../../../assets/sonido_exito.wav'),
  lluviaLoop: require('../../../assets/sonido/lluvia-loop.mp3'),
};

let sesionConfigurada = false;

// Respeta el switch de silencio físico de iOS — es la única forma que
// tendrá un usuario de iOS de apagar estos sonidos, dado que no hay toggle
// de mute dentro de la app (decisión explícita).
async function asegurarSesionAudio() {
  if (sesionConfigurada) return;
  sesionConfigurada = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: false });
  } catch {
    // Si falla la configuración de sesión, igual se intenta reproducir —
    // nunca debe bloquear la UI por esto.
  }
}

const reproductoresCortos = new Map<TipoSonido, AudioPlayer>();

function obtenerReproductorCorto(tipo: TipoSonido): AudioPlayer {
  let reproductor = reproductoresCortos.get(tipo);
  if (!reproductor) {
    reproductor = createAudioPlayer(FUENTES[tipo]);
    reproductoresCortos.set(tipo, reproductor);
  }
  return reproductor;
}

// Sonido corto, no bloqueante — nunca debe romper la UI si expo-audio falla
// al cargar el asset (dispositivo sin salida de audio, permiso denegado, etc).
export async function reproducirSonido(tipo: Exclude<TipoSonido, 'lluviaLoop'>) {
  try {
    await asegurarSesionAudio();
    const reproductor = obtenerReproductorCorto(tipo);
    await reproductor.seekTo(0);
    reproductor.play();
  } catch {
    // Silencioso a propósito.
  }
}

let reproductorLluvia: AudioPlayer | null = null;
// `iniciarLluviaLoop` es async (espera `asegurarSesionAudio()`) — si el
// componente se desmonta rápido (navegar a Inicio apenas se entra a la
// pantalla), `detenerLluviaLoop()` podía correr ANTES de que
// `reproductorLluvia` existiera (el pause() no tenía nada que pausar), y el
// play() de más abajo terminaba sonando recién después, ya sin nadie
// escuchando el hábito. Ver interruptorDiferido.ts para la carrera exacta y
// sus tests — acá solo se conecta con la reproducción real.
const lluviaDeseada = crearBanderaDeseada();

// Ciclo de vida atado a AmbienteLluviaMapa: arranca en loop mientras el
// componente está montado y la condición del hábito sigue vigente, se
// detiene al desmontar o cambiar de hábito — nunca queda sonando en
// segundo plano.
export async function iniciarLluviaLoop() {
  lluviaDeseada.iniciar();
  try {
    await asegurarSesionAudio();
    if (!lluviaDeseada.sigueDeseado()) return;
    if (!reproductorLluvia) {
      reproductorLluvia = createAudioPlayer(FUENTES.lluviaLoop);
      reproductorLluvia.loop = true;
    }
    if (!lluviaDeseada.sigueDeseado()) return;
    reproductorLluvia.play();
  } catch {
    // Silencioso a propósito.
  }
}

export function detenerLluviaLoop() {
  lluviaDeseada.detener();
  try {
    reproductorLluvia?.pause();
  } catch {
    // Silencioso a propósito.
  }
}

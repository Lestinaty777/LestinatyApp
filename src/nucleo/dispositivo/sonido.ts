import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

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

// Ciclo de vida atado a AmbienteLluviaMapa: arranca en loop mientras el
// componente está montado y la condición del hábito sigue vigente, se
// detiene al desmontar o cambiar de hábito — nunca queda sonando en
// segundo plano.
export async function iniciarLluviaLoop() {
  try {
    await asegurarSesionAudio();
    if (!reproductorLluvia) {
      reproductorLluvia = createAudioPlayer(FUENTES.lluviaLoop);
      reproductorLluvia.loop = true;
    }
    reproductorLluvia.play();
  } catch {
    // Silencioso a propósito.
  }
}

export function detenerLluviaLoop() {
  try {
    reproductorLluvia?.pause();
  } catch {
    // Silencioso a propósito.
  }
}

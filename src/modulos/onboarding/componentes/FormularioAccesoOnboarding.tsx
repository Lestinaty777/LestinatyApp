import { router } from 'expo-router';
import { Gift, Mail } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CampoContrasena, CampoTexto, Checkbox, MasterButton, MasterIcon, Rebote, Texto } from '../../../diseno';
import { TOPE_ESCALA_TEXTO } from '../../../diseno/fundamentos/accesibilidad';
import { capacidades } from '../../../plataforma/capacidades';
import { usarEstadoAcceso } from '../../acceso/acceso.estado';
import { crearCuentaConEmail, iniciarSesionConEmail, iniciarSesionConGoogle, reenviarOtpRegistro, verificarCodigoReferido, verificarRegistroConOtp } from '../../acceso/acceso.servicio';
import { AccionAcceso } from '../../acceso/componentes/PantallaAcceso';
import { BotonGoogle } from '../../acceso/componentes/BotonGoogle';
import { CampoOtp } from '../../acceso/componentes/CampoOtp';
import { obtenerSegundosCooldownOtp, usarCooldownOtp } from '../../acceso/cooldownOtp';
import { crearEsquemaCredenciales, crearEsquemaOtpRegistro } from '../../acceso/esquemas';
import { CredencialesAcceso } from '../../acceso/tipos';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../../diseno/tema/masterColor';

const C = { tenue: ESCALA_ESMERALDA.musgo.l51, verde: ESCALA_ESMERALDA.jade.l50 };


const URL_TERMINOS = 'https://lestinaty.com/terminos';
const URL_PRIVACIDAD = 'https://lestinaty.com/privacidad';

type Modo = 'login' | 'crear';

// Adaptador para el slot iconoIzquierda de MasterButton (espera un componente
// lucide-style con color/size/strokeWidth) — acá se ignora ese `color` porque
// MasterIcon tiñe por paleta 1-7, no por hex, y sobre un botón verde saturado
// un ícono también verde se perdería (mismo problema de contraste que ya
// tuvo el checkbox de términos). Se deja con sus colores nativos.
function IconoFlorBoton({ size }: { color?: string; size?: number; strokeWidth?: number }) {
  return <MasterIcon name="flor" size={size ?? 18} />;
}

// Duplicado de CrearCuentaPantalla.tsx a propósito (mismo patrón de este
// proyecto que ElementoFlotanteSuave/oscurecer-aclarar) — reconoce cuándo
// Supabase devuelve "ya existe" en vez de un error genérico al crear cuenta.
function esErrorEmailSinConfirmar(error: unknown) {
  if (!(error instanceof Error)) return false;
  const mensaje = error.message.toLowerCase();
  return (
    mensaje.includes('email not confirmed') ||
    mensaje.includes('not confirmed') ||
    mensaje.includes('already registered') ||
    mensaje.includes('already exists') ||
    mensaje.includes('already been registered')
  );
}

// Antes esto era solo-login (crear cuenta mandaba a /crear-cuenta, una
// pantalla aparte). Ahora es un único formulario con toggle: en modo 'crear'
// aparecen código de referido + checkbox de términos, y ambos (submit de
// email Y botón de Google) quedan bloqueados hasta aceptar — antes el botón
// de Google creaba una cuenta nueva sin pasar por ninguno de los dos. Mismo
// formulario/lógica que IniciarSesionPantalla.tsx + CrearCuentaPantalla.tsx
// (src/modulos/acceso) reutilizada acá para no duplicar login/signup, usado
// en dos lugares: la pantalla standalone (reentrada en frío) y el slide 5 del
// carrusel de introducción.
export function FormularioAccesoOnboarding() {
  const { t } = useTranslation();
  const esc = useEscala();
  const s = useEstilosS();
  const definirUsuario = usarEstadoAcceso((estado) => estado.definirUsuario);
  const [modo, setModo] = useState<Modo>('login');
  const [cargandoGoogle, setCargandoGoogle] = useState(false);
  const [errorGoogle, setErrorGoogle] = useState<string | null>(null);

  // Solo relevante en modo 'crear':
  const [codigoReferido, setCodigoReferido] = useState('');
  const [estadoCodigo, setEstadoCodigo] = useState<'idle' | 'verificando' | 'valido' | 'invalido'>('idle');
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [emailPendiente, setEmailPendiente] = useState<string | null>(null);
  const [reenviando, setReenviando] = useState(false);
  const [paso, setPaso] = useState<'datos' | 'otp'>('datos');
  const cooldownReenvio = usarCooldownOtp('signup', emailPendiente);

  // Verificación en vivo del código, con debounce — el id evita que una
  // respuesta vieja (de un código ya reemplazado por otro más nuevo mientras
  // el usuario seguía tipeando) pise el resultado del código actual.
  const idVerificacion = useRef(0);
  useEffect(() => {
    const codigo = codigoReferido.trim();
    idVerificacion.current += 1;
    const idActual = idVerificacion.current;

    if (!codigo) {
      setEstadoCodigo('idle');
      return;
    }

    setEstadoCodigo('verificando');
    const temporizador = setTimeout(async () => {
      const valido = await verificarCodigoReferido(codigo);
      if (idVerificacion.current === idActual) {
        setEstadoCodigo(valido ? 'valido' : 'invalido');
      }
    }, 500);

    return () => clearTimeout(temporizador);
  }, [codigoReferido]);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    setError,
  } = useForm<CredencialesAcceso>({ defaultValues: { email: '', password: '' } });

  const {
    control: controlOtp,
    formState: { errors: errorsOtp, isSubmitting: verificandoOtp },
    clearErrors: clearErrorsOtp,
    handleSubmit: handleSubmitOtp,
    setValue: setValueOtp,
    setError: setErrorOtp,
  } = useForm<{ token: string }>({ defaultValues: { token: '' } });

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo);
    setErrorGoogle(null);
  }

  async function entrarConGoogle() {
    if (modo === 'crear' && !terminosAceptados) return;
    setErrorGoogle(null);
    setCargandoGoogle(true);
    try {
      const resultado = await iniciarSesionConGoogle(modo === 'crear' ? codigoReferido : undefined);
      if (resultado.estado === 'autenticado') {
        definirUsuario(resultado.usuario);
        router.replace('/(principal)/hoy');
      }
    } catch (error) {
      setErrorGoogle(error instanceof Error ? error.message : t('onboarding.formularioAcceso.errors.googleFailed'));
    } finally {
      setCargandoGoogle(false);
    }
  }

  const entrarConEmail = handleSubmit(async (valores) => {
    const esquemaCredenciales = crearEsquemaCredenciales({
      email: t('onboarding.formularioAcceso.validation.email'),
      passwordMin: t('onboarding.formularioAcceso.validation.passwordMin'),
    });
    const resultado = esquemaCredenciales.safeParse(valores);

    if (!resultado.success) {
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0];
        if (campo === 'email' || campo === 'password') setError(campo, { message: issue.message });
      }
      return;
    }

    try {
      const usuario = await iniciarSesionConEmail(resultado.data);
      definirUsuario(usuario);
      router.replace('/(principal)/hoy');
    } catch (error) {
      setError('root', { message: error instanceof Error ? error.message : t('onboarding.formularioAcceso.errors.verifyData') });
    }
  });

  const crearCuenta = handleSubmit(async (valores) => {
    if (!terminosAceptados) {
      setError('root', { message: t('onboarding.formularioAcceso.errors.acceptTerms') });
      return;
    }

    const esquemaCredenciales = crearEsquemaCredenciales({
      email: t('onboarding.formularioAcceso.validation.email'),
      passwordMin: t('onboarding.formularioAcceso.validation.passwordMin'),
    });
    const resultado = esquemaCredenciales.safeParse(valores);

    if (!resultado.success) {
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0];
        if (campo === 'email' || campo === 'password') setError(campo, { message: issue.message });
      }
      return;
    }

    try {
      setMensaje(null);
      clearErrorsOtp('root');
      const usuario = await crearCuentaConEmail(resultado.data, codigoReferido);

      if (!usuario) {
        setEmailPendiente(resultado.data.email);
        setMensaje(t('onboarding.formularioAcceso.messages.codeSent'));
        setPaso('otp');
        await cooldownReenvio.iniciar(resultado.data.email);
        return;
      }

      definirUsuario(usuario);
      router.replace('/(principal)/hoy');
    } catch (error) {
      if (esErrorEmailSinConfirmar(error)) {
        setEmailPendiente(resultado.data.email);
        setMensaje(t('onboarding.formularioAcceso.messages.codeSent'));
        setPaso('otp');

        try {
          const segundosRestantes = await obtenerSegundosCooldownOtp('signup', resultado.data.email);
          if (segundosRestantes <= 0) {
            await reenviarOtpRegistro(resultado.data.email);
            await cooldownReenvio.iniciar(resultado.data.email);
          }
        } catch {
          setMensaje(null);
          setErrorOtp('root', { message: t('onboarding.formularioAcceso.errors.resendFailed') });
        }

        return;
      }

      setError('root', { message: error instanceof Error ? error.message : t('onboarding.formularioAcceso.errors.createAccountFailed') });
    }
  });

  const verificarCodigo = handleSubmitOtp(async (valores) => {
    const esquemaOtpRegistro = crearEsquemaOtpRegistro(t('onboarding.formularioAcceso.errors.otpDigits'));
    const resultado = esquemaOtpRegistro.safeParse(valores);

    if (!resultado.success) {
      setErrorOtp('token', { message: resultado.error.issues[0]?.message ?? t('onboarding.formularioAcceso.errors.invalidCode') });
      return;
    }

    if (!emailPendiente) {
      setErrorOtp('root', { message: t('onboarding.formularioAcceso.errors.verifyData') });
      setPaso('datos');
      return;
    }

    try {
      const usuario = await verificarRegistroConOtp(emailPendiente, resultado.data.token);
      definirUsuario(usuario);
      router.replace('/(principal)/hoy');
    } catch (error) {
      setErrorOtp('root', { message: error instanceof Error ? error.message : t('onboarding.formularioAcceso.errors.invalidOrExpiredCode') });
    }
  });

  async function reenviarCodigo() {
    if (!emailPendiente) {
      setPaso('datos');
      return;
    }

    try {
      const segundosRestantes = await obtenerSegundosCooldownOtp('signup', emailPendiente);
      if (segundosRestantes > 0) {
        await cooldownReenvio.sincronizar();
        return;
      }

      setReenviando(true);
      await reenviarOtpRegistro(emailPendiente);
      clearErrorsOtp('root');
      setMensaje(t('onboarding.formularioAcceso.messages.codeSent'));
      await cooldownReenvio.iniciar(emailPendiente);
    } catch (error) {
      setMensaje(null);
      setErrorOtp('root', { message: error instanceof Error ? error.message : t('onboarding.formularioAcceso.errors.resendFailedSimple') });
    } finally {
      setReenviando(false);
    }
  }

  function volverADatos() {
    clearErrorsOtp();
    setValueOtp('token', '');
    setMensaje(null);
    setPaso('datos');
  }

  const esCrear = modo === 'crear';

  return (
    <View style={s.formulario}>
      {paso === 'datos' ? (
        <>
          {esCrear ? (
            <View style={s.filaEncabezadoModo}>
              <MasterIcon alTema name="maceta" size={20} />
              <Texto style={s.encabezadoModo}>{t('onboarding.formularioAcceso.createAccountHeader')}</Texto>
            </View>
          ) : null}

          <Controller
            control={control}
            name="email"
            render={({ field: { onBlur, onChange, value } }) => (
              <CampoTexto
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email?.message}
                iconoIzquierda={Mail}
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder={t('onboarding.formularioAcceso.emailPlaceholder')}
                variante="flotante"
                value={value}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onBlur, onChange, value } }) => (
              <CampoContrasena
                autoCapitalize="none"
                autoComplete={esCrear ? 'new-password' : 'password'}
                error={errors.password?.message}
                mostrarMedidor={esCrear}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder={t('onboarding.formularioAcceso.passwordPlaceholder')}
                variante="flotante"
                value={value}
              />
            )}
          />

          {esCrear ? (
            <>
              <CampoTexto
                autoCapitalize="characters"
                error={estadoCodigo === 'invalido' ? t('onboarding.formularioAcceso.referralInvalid') : undefined}
                iconoIzquierda={Gift}
                onChangeText={setCodigoReferido}
                placeholder={t('onboarding.formularioAcceso.referralCodePlaceholder')}
                variante="flotante"
                value={codigoReferido}
              />
              {estadoCodigo === 'verificando' ? (
                <Texto style={s.textoCrearCuenta}>{t('onboarding.formularioAcceso.referralChecking')}</Texto>
              ) : estadoCodigo === 'valido' ? (
                <Texto style={s.exito}>{t('onboarding.formularioAcceso.referralValid')}</Texto>
              ) : null}
            </>
          ) : null}

          {errors.root?.message ? <Texto style={s.error}>{errors.root.message}</Texto> : null}

          {!esCrear ? (
            <Rebote accessibilityLabel={t('onboarding.formularioAcceso.forgotPasswordAccessibility')} onPress={() => router.push('/(publico)/recuperar-acceso')} estilo={s.enlaceOlvido}>
              <Texto style={s.enlace}>{t('onboarding.formularioAcceso.forgotPassword')}</Texto>
            </Rebote>
          ) : (
            <Checkbox checked={terminosAceptados} colorActivo={C.verde} colorBorde={conAlfa(esc.jade.l50, 0.45)} onChange={setTerminosAceptados}>
              {t('onboarding.formularioAcceso.termsAcceptPrefix')}
              <Text maxFontSizeMultiplier={TOPE_ESCALA_TEXTO} onPress={() => Linking.openURL(URL_TERMINOS)} style={s.enlaceLegalInline}>{t('onboarding.formularioAcceso.termsOfUse')}</Text>
              {t('onboarding.formularioAcceso.termsAnd')}
              <Text maxFontSizeMultiplier={TOPE_ESCALA_TEXTO} onPress={() => Linking.openURL(URL_PRIVACIDAD)} style={s.enlaceLegalInline}>{t('onboarding.formularioAcceso.privacyNotice')}</Text>
              {t('onboarding.formularioAcceso.termsDot')}
            </Checkbox>
          )}

          <MasterButton
            color={C.verde}
            disabled={esCrear ? isSubmitting || !terminosAceptados : isSubmitting}
            iconoIzquierda={esCrear ? IconoFlorBoton : undefined}
            onPress={esCrear ? crearCuenta : entrarConEmail}
            style={s.boton}
          >
            {esCrear ? (isSubmitting ? t('onboarding.formularioAcceso.submittingCreate') : t('onboarding.formularioAcceso.submitCreate')) : (isSubmitting ? t('onboarding.formularioAcceso.submittingLogin') : t('onboarding.formularioAcceso.submitLogin'))}
          </MasterButton>

          {capacidades.googleSignIn ? (
            <>
              <View style={s.divisorFila}>
                <View style={s.divisorLinea} />
                <Texto style={s.divisorTexto}>{t('onboarding.formularioAcceso.orDivider')}</Texto>
                <View style={s.divisorLinea} />
              </View>

              {errorGoogle ? <Texto style={s.error}>{errorGoogle}</Texto> : null}
              <BotonGoogle cargando={cargandoGoogle} deshabilitado={esCrear && !terminosAceptados} onPress={entrarConGoogle} />
            </>
          ) : null}

          <View style={s.filaCrearCuenta}>
            <MasterIcon alTema name={esCrear ? 'candado' : 'idea'} size={16} />
            <Texto style={s.textoCrearCuenta}>{esCrear ? t('onboarding.formularioAcceso.alreadyHaveAccount') : t('onboarding.formularioAcceso.noAccount')}</Texto>
            <Rebote accessibilityLabel={esCrear ? t('onboarding.formularioAcceso.accessibilityLogin') : t('onboarding.formularioAcceso.accessibilityCreate')} onPress={() => cambiarModo(esCrear ? 'login' : 'crear')}>
              <Texto style={[s.enlace, s.enlaceDestacado]}>{esCrear ? t('onboarding.formularioAcceso.switchActionLogin') : t('onboarding.formularioAcceso.switchActionCreate')}</Texto>
            </Rebote>
          </View>
        </>
      ) : (
        <>
          {emailPendiente ? <Texto style={s.otpEmail}>{emailPendiente}</Texto> : null}

          <Controller
            control={controlOtp}
            name="token"
            render={({ field: { onBlur, onChange, value } }) => (
              <CampoOtp error={errorsOtp.token?.message} escala={1} onBlur={onBlur} onChange={onChange} value={value} />
            )}
          />

          {errorsOtp.root?.message ? (
            <Texto style={s.error}>{errorsOtp.root.message}</Texto>
          ) : mensaje ? (
            <Texto style={s.exito}>{mensaje}</Texto>
          ) : null}

          <MasterButton color={C.verde} disabled={verificandoOtp} onPress={verificarCodigo} style={s.boton}>
            {verificandoOtp ? t('onboarding.formularioAcceso.otpVerifying') : t('onboarding.formularioAcceso.otpVerifyButton')}
          </MasterButton>

          <View style={s.filaCrearCuenta}>
            <Texto style={s.textoCrearCuenta}>{t('onboarding.formularioAcceso.otpNotReceived')}</Texto>
            <AccionAcceso disabled={reenviando || cooldownReenvio.segundosRestantes > 0} onPress={reenviarCodigo} style={s.enlace}>
              {reenviando ? t('onboarding.formularioAcceso.otpResending') : cooldownReenvio.segundosRestantes > 0 ? t('onboarding.formularioAcceso.otpResendIn', { seconds: cooldownReenvio.segundosRestantes }) : t('onboarding.formularioAcceso.otpResendButton')}
            </AccionAcceso>
          </View>

          <Rebote accessibilityLabel={t('onboarding.formularioAcceso.changeEmail')} onPress={volverADatos} estilo={s.enlaceCentrado}>
            <Texto style={s.enlace}>{t('onboarding.formularioAcceso.changeEmail')}</Texto>
          </Rebote>
        </>
      )}
    </View>
  );
}

const crearEstilosS = (esc: EscalaMaster) => StyleSheet.create({
  formulario: { gap: 12, marginTop: 8, width: '100%' },
  filaEncabezadoModo: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: -2 },
  encabezadoModo: { color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 16 },
  error: { color: '#DC2626', fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18 },
  exito: { color: C.verde, fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 19 },
  enlaceOlvido: { alignSelf: 'flex-end' },
  enlaceCentrado: { alignSelf: 'center' },
  enlace: { color: C.verde, fontFamily: 'Montserrat-SemiBold', fontSize: 13 },
  enlaceDestacado: { fontFamily: 'Montserrat-Bold' },
  enlaceLegalInline: { color: C.verde, fontFamily: 'MontserratAlternates-SemiBold' },
  boton: { height: 54, marginTop: 4 },
  divisorFila: { alignItems: 'center', flexDirection: 'row', gap: 10, marginVertical: 2 },
  divisorLinea: { backgroundColor: conAlfa(esc.musgo.l51, 0.25), flex: 1, height: 1 },
  divisorTexto: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 12 },
  filaCrearCuenta: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 4 },
  textoCrearCuenta: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13 },
  otpEmail: { color: C.tenue, fontFamily: 'Montserrat-SemiBold', fontSize: 13, textAlign: 'center' },
});

const estilosPorEscalaS = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosS>>();

function useEstilosS() {
  const esc = useEscala();
  let valor = estilosPorEscalaS.get(esc);
  if (!valor) {
    valor = crearEstilosS(esc);
    estilosPorEscalaS.set(esc, valor);
  }
  return valor;
}

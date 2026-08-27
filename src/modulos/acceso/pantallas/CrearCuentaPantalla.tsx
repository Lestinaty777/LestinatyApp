import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { CampoContrasena, CampoTexto, Texto, colores } from '../../../diseno';
import { usarEstadoAcceso } from '../acceso.estado';
import { crearCuentaConEmail, reenviarOtpRegistro, verificarRegistroConOtp } from '../acceso.servicio';
import { CampoOtp } from '../componentes/CampoOtp';
import { obtenerSegundosCooldownOtp, usarCooldownOtp } from '../cooldownOtp';
import {
  AccionAcceso,
  BotonAcceso,
  EnlaceAcceso,
  calcularEscalaAcceso,
  estilosAcceso,
  PantallaAcceso,
} from '../componentes/PantallaAcceso';
import { crearEsquemaCredenciales, crearEsquemaOtpRegistro } from '../esquemas';
import { CredencialesAcceso } from '../tipos';

function esErrorEmailSinConfirmar(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const mensaje = error.message.toLowerCase();

  return (
    mensaje.includes('email not confirmed') ||
    mensaje.includes('not confirmed') ||
    mensaje.includes('already registered') ||
    mensaje.includes('already exists') ||
    mensaje.includes('already been registered')
  );
}

export function CrearCuentaPantalla() {
  const { t } = useTranslation();
  const definirUsuario = usarEstadoAcceso((estado) => estado.definirUsuario);
  const { height, width } = useWindowDimensions();
  const escala = calcularEscalaAcceso(height, width);
  const estiloCampo = {
    minHeight: 54 * escala,
    paddingHorizontal: 16 * escala,
  };
  const estiloInput = {
    fontSize: 15 * escala,
    minHeight: 48 * escala,
  };
  const altoBoton = 52 * escala;
  const paddingHorizontalBoton = 24 * escala;
  const estiloTextoBoton = [estilosAcceso.textoBoton, { fontSize: 18 * escala }];
  const estiloEnlaces = [
    estilosAcceso.enlaces,
    {
      fontSize: 13 * escala,
      marginTop: 8 * escala,
    },
  ];
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    clearErrors,
    setError,
  } = useForm<CredencialesAcceso>({
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [emailPendiente, setEmailPendiente] = useState<string | null>(null);
  const [reenviando, setReenviando] = useState(false);
  const [paso, setPaso] = useState<'datos' | 'otp'>('datos');
  const cooldownReenvio = usarCooldownOtp('signup', emailPendiente);
  const {
    control: controlOtp,
    formState: { errors: errorsOtp, isSubmitting: verificandoOtp },
    clearErrors: clearErrorsOtp,
    handleSubmit: handleSubmitOtp,
    setValue: setValueOtp,
    setError: setErrorOtp,
  } = useForm<{ token: string }>({
    defaultValues: {
      token: '',
    },
  });

  const crearCuenta = handleSubmit(async (valores) => {
    const esquemaCredenciales = crearEsquemaCredenciales({
      email: t('validation.email'),
      passwordMin: t('validation.passwordMin'),
    });
    const resultado = esquemaCredenciales.safeParse(valores);

    if (!resultado.success) {
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0];
        if (campo === 'email' || campo === 'password') {
          setError(campo, { message: issue.message });
        }
      }
      return;
    }

    try {
      setMensaje(null);
      clearErrorsOtp('root');
      const usuario = await crearCuentaConEmail(resultado.data);

      if (!usuario) {
        setEmailPendiente(resultado.data.email);
        setMensaje(t('auth.createAccount.codeSent'));
        setPaso('otp');
        await cooldownReenvio.iniciar(resultado.data.email);
        return;
      }

      definirUsuario(usuario);
      router.replace('/(principal)/inicio');
    } catch (error) {
      if (esErrorEmailSinConfirmar(error)) {
        setEmailPendiente(resultado.data.email);
        setMensaje(t('auth.createAccount.codeSent'));
        setPaso('otp');

        try {
          const segundosRestantes = await obtenerSegundosCooldownOtp('signup', resultado.data.email);

          if (segundosRestantes <= 0) {
            await reenviarOtpRegistro(resultado.data.email);
            await cooldownReenvio.iniciar(resultado.data.email);
          }
        } catch {
          setMensaje(null);
          setErrorOtp('root', { message: t('validation.resendCode') });
        }

        return;
      }

      setError('root', {
        message: error instanceof Error ? error.message : t('validation.signup'),
      });
    }
  });

  const verificarCodigo = handleSubmitOtp(async (valores) => {
    const esquemaOtpRegistro = crearEsquemaOtpRegistro(t('validation.invalidCode'));
    const resultado = esquemaOtpRegistro.safeParse(valores);

    if (!resultado.success) {
      setErrorOtp('token', { message: resultado.error.issues[0]?.message ?? t('validation.invalidCode') });
      return;
    }

    if (!emailPendiente) {
      setErrorOtp('root', { message: t('validation.signup') });
      setPaso('datos');
      return;
    }

    try {
      const usuario = await verificarRegistroConOtp(emailPendiente, resultado.data.token);
      definirUsuario(usuario);
      router.replace('/(principal)/inicio');
    } catch (error) {
      setErrorOtp('root', {
        message: error instanceof Error ? error.message : t('validation.invalidEmailCode'),
      });
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
      setMensaje(t('auth.createAccount.codeSent'));
      await cooldownReenvio.iniciar(emailPendiente);
    } catch (error) {
      setMensaje(null);
      setErrorOtp('root', {
        message: error instanceof Error ? error.message : t('validation.resendCode'),
      });
    } finally {
      setReenviando(false);
    }
  }

  function volverADatos() {
    clearErrors('root');
    clearErrorsOtp();
    setValueOtp('token', '');
    setMensaje(null);
    setPaso('datos');
  }

  return (
    <PantallaAcceso
      titulo={paso === 'otp' ? t('auth.verifyEmail.title') : t('auth.createAccount.title')}
      subtitulo={paso === 'otp' ? t('auth.verifyEmail.subtitle') : t('auth.createAccount.subtitle')}
    >
      {paso === 'datos' ? (
        <>
          <Controller
            control={control}
            name="email"
            render={({ field: { onBlur, onChange, value } }) => (
              <CampoTexto
                autoCapitalize="none"
                autoComplete="email"
                campoStyle={estiloCampo}
                error={errors.email?.message}
                iconoIzquierda={Mail}
                iconoSize={20 * escala}
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder={t('auth.email')}
                style={estiloInput}
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
                autoComplete="new-password"
                campoStyle={estiloCampo}
                error={errors.password?.message}
                iconoSize={20 * escala}
                mostrarMedidor
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder={t('auth.password')}
                style={estiloInput}
                variante="flotante"
                value={value}
              />
            )}
          />
          {errors.root?.message ? (
            <Texto style={[estilosAcceso.error, { fontSize: 13 * escala, lineHeight: 18 * escala }]}>
              {errors.root.message}
            </Texto>
          ) : null}

          <BotonAcceso
            disabled={isSubmitting}
            height={altoBoton}
            iconoSize={21 * escala}
            onPress={crearCuenta}
            paddingHorizontal={paddingHorizontalBoton}
            textStyle={estiloTextoBoton}
          >
            {isSubmitting ? `${t('auth.createAccount.button')}...` : t('auth.createAccount.button')}
          </BotonAcceso>
        </>
      ) : (
        <>
          {emailPendiente ? (
            <Texto style={[stylesOtp.email, { fontSize: 13 * escala, lineHeight: 18 * escala }]}>
              {emailPendiente}
            </Texto>
          ) : null}
          <Controller
            control={controlOtp}
            name="token"
            render={({ field: { onBlur, onChange, value } }) => (
              <CampoOtp error={errorsOtp.token?.message} escala={escala} onBlur={onBlur} onChange={onChange} value={value} />
            )}
          />
          {errorsOtp.root?.message ? (
            <Texto style={[estilosAcceso.error, { fontSize: 13 * escala, lineHeight: 18 * escala }]}>
              {errorsOtp.root.message}
            </Texto>
          ) : mensaje ? (
            <Texto style={[estilosAcceso.exito, { fontSize: 14 * escala, lineHeight: 19 * escala }]}>{mensaje}</Texto>
          ) : null}

          <BotonAcceso
            disabled={verificandoOtp}
            height={altoBoton}
            iconoSize={21 * escala}
            onPress={verificarCodigo}
            paddingHorizontal={paddingHorizontalBoton}
            textStyle={estiloTextoBoton}
          >
            {verificandoOtp ? t('auth.createAccount.verifying') : t('auth.verifyCode')}
          </BotonAcceso>

          <Texto style={estiloEnlaces}>
            {t('auth.resendPrompt')}{' '}
            <AccionAcceso
              disabled={reenviando || cooldownReenvio.segundosRestantes > 0}
              onPress={reenviarCodigo}
              style={{ fontSize: 13 * escala }}
            >
              {reenviando
                ? t('auth.createAccount.resending')
                : cooldownReenvio.segundosRestantes > 0
                  ? t('auth.resendIn', { seconds: cooldownReenvio.segundosRestantes })
                  : t('auth.createAccount.resendCode')}
            </AccionAcceso>
          </Texto>
          <AccionAcceso onPress={volverADatos} style={{ fontSize: 13 * escala, textAlign: 'center' }}>
            {t('auth.changeEmail')}
          </AccionAcceso>
        </>
      )}

      {paso === 'datos' ? (
        <Texto style={estiloEnlaces}>
          {t('auth.createAccount.alreadyHaveAccount')}{' '}
          <EnlaceAcceso href="/(publico)/iniciar-sesion" style={{ fontSize: 13 * escala }}>
            {t('auth.signIn')}
          </EnlaceAcceso>
        </Texto>
      ) : null}
    </PantallaAcceso>
  );
}

const stylesOtp = StyleSheet.create({
  raiz: {
    gap: 8,
  },
  fila: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  casilla: {
    backgroundColor: colores.superficie,
    borderRadius: 10,
    borderWidth: 2,
    fontFamily: 'MontserratAlternates-Bold',
    padding: 0,
    textAlign: 'center',
    shadowColor: '#26352C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 0,
  },
  error: {
    color: colores.error,
    fontFamily: 'MontserratAlternates-Medium',
    textAlign: 'center',
  },
  email: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    textAlign: 'center',
  },
});

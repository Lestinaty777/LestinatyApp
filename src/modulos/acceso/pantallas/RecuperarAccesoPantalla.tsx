import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { CampoContrasena, CampoTexto, Texto, colores } from '../../../diseno';
import { actualizarContrasenaRecuperada, recuperarAcceso, verificarRecuperacionConOtp } from '../acceso.servicio';
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
import { crearEsquemaEmail, crearEsquemaNuevaContrasena, crearEsquemaOtpRegistro } from '../esquemas';

type PasoRecuperacion = 'email' | 'otp' | 'password' | 'exito';

export function RecuperarAccesoPantalla() {
  const { t } = useTranslation();
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
    clearErrors,
    handleSubmit,
    setError,
  } = useForm<{ email: string }>({
    defaultValues: {
      email: '',
    },
  });
  const {
    control: controlOtp,
    formState: { errors: errorsOtp, isSubmitting: verificandoOtp },
    clearErrors: clearErrorsOtp,
    handleSubmit: handleSubmitOtp,
    setError: setErrorOtp,
    setValue: setValueOtp,
  } = useForm<{ token: string }>({
    defaultValues: {
      token: '',
    },
  });
  const {
    control: controlPassword,
    formState: { errors: errorsPassword, isSubmitting: guardandoPassword },
    handleSubmit: handleSubmitPassword,
    setError: setErrorPassword,
  } = useForm<{ confirmarPassword: string; password: string }>({
    defaultValues: {
      confirmarPassword: '',
      password: '',
    },
  });
  const [emailPendiente, setEmailPendiente] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [paso, setPaso] = useState<PasoRecuperacion>('email');
  const [reenviando, setReenviando] = useState(false);
  const cooldownReenvio = usarCooldownOtp('recovery', emailPendiente);

  const enviarCorreo = handleSubmit(async (valores) => {
    const esquemaEmail = crearEsquemaEmail(t('validation.email'));
    const resultado = esquemaEmail.safeParse(valores);

    if (!resultado.success) {
      setError('email', { message: resultado.error.issues[0]?.message ?? t('validation.email') });
      return;
    }

    try {
      const segundosRestantes = await obtenerSegundosCooldownOtp('recovery', resultado.data.email);

      if (segundosRestantes > 0) {
        clearErrorsOtp('root');
        setEmailPendiente(resultado.data.email);
        setMensaje(t('auth.forgotPassword.sent'));
        setPaso('otp');
        return;
      }

      await recuperarAcceso(resultado.data.email);
      clearErrorsOtp('root');
      setEmailPendiente(resultado.data.email);
      setMensaje(t('auth.forgotPassword.sent'));
      setPaso('otp');
      await cooldownReenvio.iniciar(resultado.data.email);
    } catch (error) {
      setMensaje(null);
      setError('root', {
        message: error instanceof Error ? error.message : t('validation.resetEmail'),
      });
    }
  });

  const verificarCodigo = handleSubmitOtp(async (valores) => {
    const esquemaOtp = crearEsquemaOtpRegistro(t('validation.invalidCode'));
    const resultado = esquemaOtp.safeParse(valores);

    if (!resultado.success) {
      setErrorOtp('token', { message: resultado.error.issues[0]?.message ?? t('validation.invalidCode') });
      return;
    }

    if (!emailPendiente) {
      setErrorOtp('root', { message: t('validation.resetEmail') });
      setPaso('email');
      return;
    }

    try {
      await verificarRecuperacionConOtp(emailPendiente, resultado.data.token);
      clearErrorsOtp();
      setMensaje(null);
      setPaso('password');
    } catch (error) {
      setMensaje(null);
      setErrorOtp('root', {
        message: error instanceof Error ? error.message : t('validation.invalidEmailCode'),
      });
    }
  });

  const guardarNuevaContrasena = handleSubmitPassword(async (valores) => {
    const esquemaPassword = crearEsquemaNuevaContrasena({
      confirmar: t('validation.passwordMatch'),
      passwordMin: t('validation.passwordMin'),
    });
    const resultado = esquemaPassword.safeParse(valores);

    if (!resultado.success) {
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0];
        if (campo === 'password' || campo === 'confirmarPassword') {
          setErrorPassword(campo, { message: issue.message });
        }
      }
      return;
    }

    try {
      await actualizarContrasenaRecuperada(resultado.data.password);
      setPaso('exito');
      setMensaje(t('auth.forgotPassword.updated'));
    } catch (error) {
      setErrorPassword('root', {
        message: error instanceof Error ? error.message : t('validation.updatePassword'),
      });
    }
  });

  async function reenviarCodigo() {
    if (!emailPendiente) {
      setPaso('email');
      return;
    }

    try {
      const segundosRestantes = await obtenerSegundosCooldownOtp('recovery', emailPendiente);

      if (segundosRestantes > 0) {
        await cooldownReenvio.sincronizar();
        return;
      }

      setReenviando(true);
      await recuperarAcceso(emailPendiente);
      clearErrorsOtp('root');
      setMensaje(t('auth.forgotPassword.sent'));
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

  function volverAEmail() {
    clearErrors('root');
    clearErrorsOtp();
    setValueOtp('token', '');
    setMensaje(null);
    setPaso('email');
  }

  function titulo() {
    if (paso === 'otp') {
      return t('auth.forgotPassword.verifyTitle');
    }

    if (paso === 'password') {
      return t('auth.forgotPassword.newPasswordTitle');
    }

    return t('auth.forgotPassword.title');
  }

  function subtitulo() {
    if (paso === 'otp') {
      return t('auth.forgotPassword.verifySubtitle');
    }

    if (paso === 'password') {
      return t('auth.forgotPassword.newPasswordSubtitle');
    }

    return t('auth.forgotPassword.subtitle');
  }

  return (
    <PantallaAcceso titulo={titulo()} subtitulo={subtitulo()}>
      {paso === 'email' ? (
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

          {errors.root?.message ? (
            <Texto style={[estilosAcceso.error, { fontSize: 13 * escala, lineHeight: 18 * escala }]}>
              {errors.root.message}
            </Texto>
          ) : null}

          <BotonAcceso
            disabled={isSubmitting}
            height={altoBoton}
            iconoSize={21 * escala}
            onPress={enviarCorreo}
            paddingHorizontal={paddingHorizontalBoton}
            textStyle={estiloTextoBoton}
          >
            {isSubmitting ? `${t('auth.forgotPassword.button')}...` : t('auth.forgotPassword.button')}
          </BotonAcceso>
        </>
      ) : null}

      {paso === 'otp' ? (
        <>
          {emailPendiente ? (
            <Texto style={[styles.email, { fontSize: 13 * escala, lineHeight: 18 * escala }]}>{emailPendiente}</Texto>
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
          <AccionAcceso onPress={volverAEmail} style={{ fontSize: 13 * escala, textAlign: 'center' }}>
            {t('auth.changeEmail')}
          </AccionAcceso>
        </>
      ) : null}

      {paso === 'password' ? (
        <>
          <Controller
            control={controlPassword}
            name="password"
            render={({ field: { onBlur, onChange, value } }) => (
              <CampoContrasena
                autoCapitalize="none"
                autoComplete="new-password"
                campoStyle={estiloCampo}
                error={errorsPassword.password?.message}
                iconoSize={20 * escala}
                mostrarMedidor
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder={t('auth.forgotPassword.newPassword')}
                style={estiloInput}
                variante="flotante"
                value={value}
              />
            )}
          />

          <Controller
            control={controlPassword}
            name="confirmarPassword"
            render={({ field: { onBlur, onChange, value } }) => (
              <CampoContrasena
                autoCapitalize="none"
                autoComplete="new-password"
                campoStyle={estiloCampo}
                error={errorsPassword.confirmarPassword?.message}
                iconoSize={20 * escala}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder={t('auth.forgotPassword.confirmPassword')}
                style={estiloInput}
                variante="flotante"
                value={value}
              />
            )}
          />

          {errorsPassword.root?.message ? (
            <Texto style={[estilosAcceso.error, { fontSize: 13 * escala, lineHeight: 18 * escala }]}>
              {errorsPassword.root.message}
            </Texto>
          ) : null}

          <BotonAcceso
            disabled={guardandoPassword}
            height={altoBoton}
            iconoSize={21 * escala}
            onPress={guardarNuevaContrasena}
            paddingHorizontal={paddingHorizontalBoton}
            textStyle={estiloTextoBoton}
          >
            {guardandoPassword ? t('auth.forgotPassword.saving') : t('auth.forgotPassword.savePassword')}
          </BotonAcceso>
        </>
      ) : null}

      {paso === 'exito' ? (
        <>
          {mensaje ? (
            <Texto style={[estilosAcceso.exito, { fontSize: 14 * escala, lineHeight: 19 * escala }]}>{mensaje}</Texto>
          ) : null}

          <BotonAcceso
            height={altoBoton}
            iconoSize={21 * escala}
            onPress={() => router.replace('/(publico)/iniciar-sesion')}
            paddingHorizontal={paddingHorizontalBoton}
            textStyle={estiloTextoBoton}
          >
            {t('auth.signIn')}
          </BotonAcceso>
        </>
      ) : null}

      {paso !== 'exito' ? (
        <Texto style={estiloEnlaces}>
          <EnlaceAcceso href="/(publico)/iniciar-sesion" style={{ fontSize: 13 * escala }}>
            {t('auth.signIn')}
          </EnlaceAcceso>
        </Texto>
      ) : null}
    </PantallaAcceso>
  );
}

const styles = StyleSheet.create({
  email: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    textAlign: 'center',
  },
});

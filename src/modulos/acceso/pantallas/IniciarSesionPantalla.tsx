import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions } from 'react-native';

import { CampoContrasena, CampoTexto, Texto } from '../../../diseno';
import { usarEstadoAcceso } from '../acceso.estado';
import { iniciarSesionConEmail } from '../acceso.servicio';
import { BotonAcceso, EnlaceAcceso, calcularEscalaAcceso, estilosAcceso, PantallaAcceso } from '../componentes/PantallaAcceso';
import { crearEsquemaCredenciales } from '../esquemas';
import { CredencialesAcceso } from '../tipos';

export function IniciarSesionPantalla() {
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
    setError,
  } = useForm<CredencialesAcceso>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const entrarConEmail = handleSubmit(async (valores) => {
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
      const usuario = await iniciarSesionConEmail(resultado.data);
      definirUsuario(usuario);
      router.replace('/(principal)/hoy');
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : t('validation.invalidCredentials'),
      });
    }
  });

  return (
    <PantallaAcceso titulo={t('auth.login.title')} subtitulo={t('auth.login.subtitle')}>
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
            autoComplete="password"
            campoStyle={estiloCampo}
            error={errors.password?.message}
            iconoSize={20 * escala}
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

      <EnlaceAcceso href="/(publico)/recuperar-acceso" style={{ fontSize: 13 * escala }}>
        {t('auth.login.forgotPassword')}
      </EnlaceAcceso>

      <BotonAcceso
        disabled={isSubmitting}
        height={altoBoton}
        iconoSize={21 * escala}
        onPress={entrarConEmail}
        paddingHorizontal={paddingHorizontalBoton}
        textStyle={estiloTextoBoton}
      >
        {isSubmitting ? `${t('auth.signIn')}...` : t('auth.login.button')}
      </BotonAcceso>

      <Texto style={estiloEnlaces}>
        {t('auth.login.noAccount')}{' '}
        <EnlaceAcceso href="/(publico)/crear-cuenta" style={{ fontSize: 13 * escala }}>
          {t('auth.login.creatingAccount')}
        </EnlaceAcceso>
      </Texto>
    </PantallaAcceso>
  );
}

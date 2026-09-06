# Aceptar propuesta de Aby

Esta Edge Function recibe un `propuestaId` autenticado y transforma una propuesta `lista` no expirada en un Sendero activo. El cliente no recibe ni usa `service_role`.

La función reclama la propuesta con un cambio condicional a `generando`, crea una meta, un sendero, una sección, cinco lecciones, una evaluación, cinco conexiones y un cofre de 10 gemas. Después activa la sección y el Sendero, y marca la propuesta como `aceptada`.

Si falla cualquier inserción, elimina la meta creada para aplicar las cascadas y marca la propuesta como `fallida`. Un segundo intento sobre la misma propuesta devuelve conflicto y no crea un segundo sendero.

## Despliegue

```bash
supabase functions deploy aceptar-propuesta-aby
```

Requiere que esté aplicada `20260905_06_senderos_nucleo_estudio.sql` y que `SUPABASE_SERVICE_ROLE_KEY` exista como secreto de la función.

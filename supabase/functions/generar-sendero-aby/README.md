# Generar propuesta de sendero con Aby

La funcion recibe una configuracion autenticada de `materia` o `examen`, llama a Gemini exclusivamente desde Supabase Edge Functions y devuelve una propuesta revisable. La clave nunca se agrega a Expo, `app.json` ni a variables `EXPO_PUBLIC_*`.

La respuesta siempre tiene esta forma:

```json
{
  "propuestaId": "uuid",
  "path": {
    "titulo": "...",
    "descripcion": "...",
    "intencion": "aprender | examen",
    "nodos": ["cinco lecciones y una evaluacion final"],
    "conexiones": ["cinco conexiones lineales"]
  }
}
```

Antes de invocar Gemini se crea `public.aby_propuestas` con estado `generando`. Solo un `PathEstudio` valido pasa a estado `lista`; los fallos se registran como `fallida` sin devolver detalles internos al cliente.

## Secretos requeridos

```bash
supabase secrets set GEMINI_API_KEY=valor-secreto
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=valor-service-role
supabase functions deploy generar-sendero-aby
```

Aplica antes `20260905_06_senderos_nucleo_estudio.sql`. La app movil debe usar `generarPropuestaEstudioRemota()` con una sesion autenticada. La confirmacion de la propuesta es responsabilidad de `aceptar-propuesta-aby`.

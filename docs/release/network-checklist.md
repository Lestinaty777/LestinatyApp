# Checklist de red IPv6-only / DNS64-NAT64

Apple exige que la app funcione en una red exclusivamente IPv6 (DNS64/NAT64).
Esto solo se puede probar en un iPhone físico — no hay forma de simularlo
fielmente desde este entorno de desarrollo.

## Verificación estática ya hecha (repo)

```bash
rg -n "https?://([0-9]{1,3}\.){3}[0-9]{1,3}|localhost|127\.0\.0\.1" src app
```

Resultado: sin endpoints de aplicación con IP numérica ni `localhost`. Todo
el tráfico de red usa hostnames HTTPS (`*.supabase.co`, RevenueCat, OneSignal).

## Pendiente — gate físico (requiere hardware, no automatizable aquí)

1. Crear una red IPv6-only según la guía de Apple (https://developer.apple.com/support/ipv6/),
   por ejemplo compartiendo internet desde un Mac con NAT64 habilitado.
2. Instalar el build candidato (TestFlight o `ios-simulator`/`preview`) en un
   iPhone físico conectado a esa red, con datos celulares apagados.
3. Probar, sin reiniciar la app entre pasos: cold start, login, refresh de
   sesión, crear/completar un hábito, Senderos, Aby, catálogo y compra
   sandbox, restauración, notificación push, y los enlaces de Privacidad/Términos.
4. Repetir con red lenta y con pérdida de red momentánea, confirmando que
   cada fallo muestra un reintento accionable (no spinner infinito ni crash).

Marcar este archivo con fecha, build ID y resultado `PASS`/`FAIL` por fila
una vez ejecutado — sin capturas de claves ni valores de entorno.

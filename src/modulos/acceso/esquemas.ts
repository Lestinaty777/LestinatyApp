import { z } from 'zod';

export function crearEsquemaCredenciales(mensajes: { email: string; passwordMin: string }) {
  return z.object({
    email: z.string().email(mensajes.email),
    password: z.string().min(8, mensajes.passwordMin),
  });
}

export function crearEsquemaEmail(mensaje: string) {
  return z.object({
    email: z.string().email(mensaje),
  });
}

export function crearEsquemaOtpRegistro(mensaje: string) {
  return z.object({
    token: z.string().regex(/^\d{6}$/, mensaje),
  });
}

export function crearEsquemaNuevaContrasena(mensajes: { confirmar: string; passwordMin: string }) {
  return z
    .object({
      confirmarPassword: z.string().min(8, mensajes.passwordMin),
      password: z.string().min(8, mensajes.passwordMin),
    })
    .refine((valores) => valores.password === valores.confirmarPassword, {
      message: mensajes.confirmar,
      path: ['confirmarPassword'],
    });
}

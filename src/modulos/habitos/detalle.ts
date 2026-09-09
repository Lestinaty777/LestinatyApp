export function resolverIdHabito(valor: string | string[] | undefined) {
  const id = Array.isArray(valor) ? valor[0] : valor;
  return id && id.trim() ? id : null;
}

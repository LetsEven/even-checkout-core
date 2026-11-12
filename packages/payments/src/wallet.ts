/**
 * true si el backend rechazó la orden de wallet de forma definitiva: un 4xx con
 * código semántico (400 baseAmount <= 0, 422 payment_rejected, ...), donde
 * reintentar con los mismos datos fallaría igual. El errorHandler del backend
 * pone `code` también en los 5xx, así que el código solo no basta: un 500/502
 * pasajero (o un 408/429) no debe ocultar Apple/Google Pay.
 */
export function isDefinitiveWalletRejection(result: {
  status?: number;
  code?: string;
  error?: { code?: string };
}): boolean {
  const { status } = result;
  if (status === undefined || status < 400 || status >= 500) return false;
  if (status === 408 || status === 429) return false;
  return !!(result.code ?? result.error?.code);
}

/**
 * El evento `error` del SDK de Google Pay también dispara durante la
 * inicialización, antes de que el botón esté listo. Solo un error con el botón
 * ya listo corresponde a un intento real de pago y debe mostrarse al usuario;
 * el de inicialización solo oculta el botón.
 */
export function classifyGooglePayError(buttonReady: boolean): "init" | "payment" {
  return buttonReady ? "payment" : "init";
}

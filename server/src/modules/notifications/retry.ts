/**
 * Utilidad para reintentar una operación asíncrona con backoff.
 *
 * @param fn Función a ejecutar (debe devolver Promise)
 * @param attempts Número total de intentos (default: 2)
 * @param delayMs Delay entre intentos en ms (default: 2000)
 * @returns Resultado de la función si tiene éxito, o lanza el último error
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  attempts = 2,
  delayMs = 2000,
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < attempts) {
        // Esperar antes del siguiente intento
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  throw lastError!;
};
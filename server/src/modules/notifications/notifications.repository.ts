import { db } from '../../db/client.js';
import { notificationLogs } from '../../db/schema.js';

/**
 * Registra un intento de envío de notificación.
 *
 * Se llama desde el orquestador (T-063/T-065) después de cada intento.
 * No lanza: un fallo al registrar el log no debe romper el flujo principal.
 *
 * @param orderId ID del pedido
 * @param channel Canal ('email' | 'telegram')
 * @param attempt Número de intento (1-based)
 * @param totalAttempts Total de intentos planeados
 * @param status Estado de este intento ('sent' | 'failed')
 * @param errorMessage Mensaje de error si falló
 */
const insertNotificationLog = (
  orderId: number,
  channel: 'email' | 'telegram',
  attempt: number,
  totalAttempts: number,
  status: 'sent' | 'failed',
  errorMessage: string | null = null,
): void => {
  try {
    db.insert(notificationLogs)
      .values({
        orderId,
        channel,
        status,
        errorMessage,
        sentAt: Math.floor(Date.now() / 1000),
      })
      .run();
  } catch (err) {
    // No rompemos el flujo principal si falla el logging de notificaciones
    // El logger ya capturó el error del envío; esto es solo trazabilidad
    console.error('Failed to insert notification log:', err);
  }
};

/**
 * Ejecuta una función de notificación con reintentos y registra cada intento.
 *
 * @param orderId ID del pedido
 * @param channel Canal ('email' | 'telegram')
 * @param sendFn Función que envía la notificación
 * @param attempts Número total de intentos (default: 2)
 * @param delayMs Delay entre intentos en ms (default: 2000)
 * @returns true si tuvo éxito en algún intento, false si todos fallaron
 */
const sendWithRetry = async (
  orderId: number,
  channel: 'email' | 'telegram',
  sendFn: () => Promise<void>,
  attempts = 2,
  delayMs = 2000,
): Promise<boolean> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await sendFn();
      // Éxito: registrar y retornar
      insertNotificationLog(orderId, channel, attempt, attempts, 'sent', null);
      return true;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const errorMessage = lastError.message;

      // Registrar este intento fallido
      insertNotificationLog(
        orderId,
        channel,
        attempt,
        attempts,
        attempt === attempts ? 'failed' : 'failed', // si es el último, final failed; si no, attempt failed
        errorMessage,
      );

      // Si no es el último intento, esperar antes de reintentar
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // Todos los intentos fallaron, lastError se usa para el log final si fuera necesario
  void lastError;
  return false;
};

export { insertNotificationLog, sendWithRetry };
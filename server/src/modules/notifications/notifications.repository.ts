import { db } from '../../db/client.js';
import { notificationLogs } from '../../db/schema.js';

/**
 * Registra el resultado de un envío de notificación.
 *
 * Se llama desde el orquestador (T-063) después de cada intento de envío.
 * No lanza: un fallo al registrar el log no debe romper el flujo principal.
 */
const insertNotificationLog = (
  orderId: number,
  channel: 'email' | 'telegram',
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

export { insertNotificationLog };
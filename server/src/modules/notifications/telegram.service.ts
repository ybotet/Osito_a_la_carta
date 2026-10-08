import { env } from '../../config/index.js';
import { logger } from '../../logger.js';
import type { OrderRow } from '../../modules/orders/orders.repository.js';

type LocalizedOrderItem = {
  dishId: number;
  name: string;
  quantity: number;
  unitPrice: number;
};

const formatMoney = (value: number): string =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);

const buildTelegramMessage = (
  order: OrderRow,
  items: LocalizedOrderItem[],
): string => {
  const note =
    order.customerNote === null || order.customerNote.length === 0
      ? 'sin nota'
      : order.customerNote;

  const lines = items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.name} — ${formatMoney(item.unitPrice * item.quantity)}`,
    )
    .join('\n');

  const date = new Date(order.createdAt * 1000).toLocaleString('es-ES');

  return `🍽️ *Nuevo pedido #${order.id}*
👤 Cliente: (email no disponible en order)
📝 Nota: ${note}
---- Items ----
${lines}
---- Total ----
💰 ${formatMoney(order.total)}
🕐 ${date}`;
};

/**
 * Servicio de notificaciones Telegram.
 *
 * **Lanza un error si el envio falla.** El orquestador (T-063) es quien
 * captura ese error: un fallo de Telegram no debe bloquear la respuesta del
 * `POST /api/orders`, pero tampoco debe pasar desapercibido. Asi el servicio
 * es "puro": o envia y devuelve undefined, o lanza, y quien llama decide que
 * hacer con el fallo.
 *
 * **No registra en `NotificationLog`**: eso es T-064, que envolvera a este
 * servicio. Aqui solo se manda el mensaje.
 *
 * Recibe items ya localizados (con campo `name` en el idioma correspondiente).
 */
const sendOrderTelegram = async (
  order: OrderRow,
  items: LocalizedOrderItem[],
): Promise<void> => {
  const { Bot } = await import('node-telegram-bot-api');

  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  const message = buildTelegramMessage(order, items);

  await bot.api.sendMessage({
    chat_id: env.TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'Markdown',
  });

  logger.info(
    { orderId: order.id, chatId: env.TELEGRAM_CHAT_ID },
    'Mensaje Telegram enviado al chef',
  );
};

export { sendOrderTelegram };

export type SendOrderTelegramParams = {
  order: OrderRow;
  items: LocalizedOrderItem[];
};
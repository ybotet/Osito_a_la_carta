import { env } from '../config/index.js';
import { logger } from '../logger.js';
import { sendOrderTelegram } from '../modules/notifications/telegram.service.js';

/**
 * Script de prueba de T-061: envia un mensaje de Telegram de prueba al chef
 * con datos ficticios.
 *
 * Uso: `npx tsx src/scripts/test-telegram.ts`
 *
 * **Los datos son ficticios.** No toca la base de datos: el pedido y sus
 * lineas se construyen a mano con valores de ejemplo, asi que el script es
 * util para probar la configuracion de Telegram sin necesidad de tener pedidos
 * reales. El destinatario es `env.TELEGRAM_CHAT_ID`.
 */
const main = async () => {
  const fakeOrder = {
    id: 9999,
    userId: 0,
    status: 'pending',
    total: 35.7,
    customerNote: 'Esta es una nota de prueba del cliente.',
    createdAt: Math.floor(Date.now() / 1000),
  } as Parameters<typeof sendOrderTelegram>[0];

  const fakeItems = [
    {
      dishId: 1,
      name: 'Sopa de verduras',
      quantity: 2,
      unitPrice: 11.9,
    },
    {
      dishId: 3,
      name: 'Olivier',
      quantity: 1,
      unitPrice: 11.9,
    },
  ] as Parameters<typeof sendOrderTelegram>[1];

  logger.info({ chatId: env.TELEGRAM_CHAT_ID }, 'Enviando mensaje de prueba por Telegram');
  await sendOrderTelegram(fakeOrder, fakeItems);
  logger.info('Mensaje de prueba enviado correctamente por Telegram');
};

main().catch((error) => {
  logger.error({ err: error }, 'Falló el envío del mensaje de prueba por Telegram');
  process.exit(1);
});
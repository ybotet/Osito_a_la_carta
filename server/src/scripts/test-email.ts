import { env } from '../config/index.js';
import { logger } from '../logger.js';
import { sendOrderEmail } from '../modules/notifications/email.service.js';

/**
 * Script de prueba de T-060: envia un correo electronico de prueba al chef
 * con datos ficticios.
 *
 * Uso: `npx tsx src/scripts/test-email.ts`
 *
 * **Los datos son ficticios.** No toca la base de datos: el pedido y sus
 * lineas se construyen a mano con valores de ejemplo, asi que el script es
 * util para probar la configuracion de Mailgun sin necesidad de tener pedidos
 * reales. El destinatario es `env.CHEF_EMAIL`, que en desarrollo es el de
 * `.env` (el dueño puso yaiselbotet@gmail.com).
 */
const main = async () => {
  const fakeOrder = {
    id: 9999,
    userId: 0,
    status: 'pending',
    total: 35.7,
    customerNote: 'Esta es una nota de prueba del cliente.',
    createdAt: Math.floor(Date.now() / 1000),
  } as Parameters<typeof sendOrderEmail>[0];

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
  ] as Parameters<typeof sendOrderEmail>[1];

  logger.info({ to: env.CHEF_EMAIL, from: env.MAILGUN_FROM.raw }, 'Enviando correo de prueba');
  await sendOrderEmail(fakeOrder, fakeItems);
  logger.info('Correo de prueba enviado correctamente');
};

main().catch((error) => {
  logger.error({ err: error }, 'Falló el envío del correo de prueba');
  process.exit(1);
});
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

const formatItems = (items: LocalizedOrderItem[]): string =>
  items
    .map(
      (item) =>
        `${item.quantity} x ${item.name} (${formatMoney(
          item.unitPrice,
        )}) = ${formatMoney(item.unitPrice * item.quantity)}`,
    )
    .join('\n');

const buildHtml = (order: OrderRow, items: LocalizedOrderItem[]): string => {
  const note =
    order.customerNote === null || order.customerNote.length === 0
      ? ''
      : `<p><strong>Nota del cliente:</strong> ${order.customerNote}</p>`;
  const lines = items
    .map(
      (item) =>
        `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${formatMoney(
          item.unitPrice,
        )}</td><td>${formatMoney(item.unitPrice * item.quantity)}</td></tr>`,
    )
    .join('');
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Nuevo pedido #${order.id}</title>
</head>
<body>
  <h1>Nuevo pedido #${order.id}</h1>
  <p><strong>Estado:</strong> ${order.status}</p>
  <p><strong>Fecha:</strong> ${new Date(
    order.createdAt * 1000,
  ).toLocaleString('es-ES')}</p>
  <p><strong>Total:</strong> ${formatMoney(order.total)}</p>
  ${note}
  <h2>Platos</h2>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead>
      <tr><th>Plato</th><th>Cantidad</th><th>Precio unit.</th><th>Subtotal</th></tr>
    </thead>
    <tbody>
      ${lines}
    </tbody>
  </table>
</body>
</html>`;
};

const buildText = (order: OrderRow, items: LocalizedOrderItem[]): string => {
  const note =
    order.customerNote === null || order.customerNote.length === 0
      ? ''
      : `\nNota del cliente: ${order.customerNote}`;
  const lines = formatItems(items).split('\n').join('\n  ');
  return `Nuevo pedido #${order.id}

Estado: ${order.status}
Fecha: ${new Date(order.createdAt * 1000).toLocaleString('es-ES')}
Total: ${formatMoney(order.total)}${note}

Platos:
  ${lines}`;
};

/**
 * Servicio de correo electronico con Mailgun.
 *
 * **Lanza un error si el envio falla.** El orquestador (T-063) es quien
 * captura ese error: un fallo de correo no debe bloquear la respuesta del
 * `POST /api/orders`, pero tampoco debe pasar desapercibido. Asi el servicio
 * es "puro": o envia y devuelve undefined, o lanza, y quien llama decide que
 * hacer con el fallo.
 *
 * **No registra en `NotificationLog`**: eso es T-064, que envolvera a este
 * servicio. Aqui solo se manda el correo.
 *
 * Recibe items ya localizados (con campo `name` en el idioma correspondiente).
 */
const sendOrderEmail = async (
  order: OrderRow,
  items: LocalizedOrderItem[],
): Promise<void> => {
  const { default: Mailgun } = await import('mailgun.js');
  const { default: FormData } = await import('form-data');

  const mailgun = new Mailgun(FormData);
  const client = mailgun.client({
    username: 'api',
    key: env.MAILGUN_API_KEY,
  });

  const result = await client.messages.create(env.MAILGUN_DOMAIN, {
    from: env.MAILGUN_FROM.raw,
    to: env.CHEF_EMAIL,
    subject: `Nuevo pedido #${order.id} - Osito a la carta`,
    text: buildText(order, items),
    html: buildHtml(order, items),
  });

  logger.info(
    { orderId: order.id, to: env.CHEF_EMAIL, result },
    'Correo electronico enviado al chef',
  );
};

export { sendOrderEmail };

export type SendOrderEmailParams = {
  order: OrderRow;
  items: LocalizedOrderItem[];
};
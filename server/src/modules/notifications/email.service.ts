import { env } from '../../config/index.js';
import { logger } from '../../logger.js';
import type { OrderRow } from '../../modules/orders/orders.repository.js';
import { buildOrderEmailHtml, buildOrderEmailText, type LocalizedOrderItem } from './templates/order-email.js';
import { buildVerificationEmailHtml, buildVerificationEmailText } from './templates/verification-email.js';

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
  customerEmail: string,
): Promise<void> => {
  const { default: Mailgun } = await import('mailgun.js');
  const { default: FormData } = await import('form-data');

  const mailgun = new Mailgun(FormData);
  const client = mailgun.client({
    username: 'api',
    key: env.MAILGUN_API_KEY,
  });

  // Determinar datos del cliente para el email
  const isGuest = order.userId === null;
  const clientName = isGuest ? order.guestName : customerEmail;
  const clientPhone = isGuest ? order.guestPhone : null;
  const deliveryAddress = isGuest ? order.deliveryAddress : null;
  const trackingToken = isGuest ? order.trackingToken : null;

  const result = await client.messages.create(env.MAILGUN_DOMAIN, {
    from: env.MAILGUN_FROM.raw,
    to: env.CHEF_EMAIL,
    subject: `Nuevo pedido #${order.id} - Osito a la carta`,
    text: buildOrderEmailText(order, items, customerEmail, { isGuest, clientName, clientPhone, deliveryAddress, trackingToken }),
    html: buildOrderEmailHtml(order, items, customerEmail, { isGuest, clientName, clientPhone, deliveryAddress, trackingToken }),
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
  customerEmail: string;
};

/**
 * Envía un email de verificación de cuenta al usuario registrado.
 * Lanza un error si el envío falla; el caller decide cómo manejarlo.
 */
const sendVerificationEmail = async (
  email: string,
  token: string,
  language: 'es' | 'ru' | 'en' = 'es',
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
    to: email,
    subject: 'Verifica tu email - Osito a la carta',
    text: buildVerificationEmailText(email, token, language),
    html: buildVerificationEmailHtml(email, token, language),
  });

  logger.info(
    { email, result },
    'Correo de verificacion enviado',
  );
};

export { sendVerificationEmail };
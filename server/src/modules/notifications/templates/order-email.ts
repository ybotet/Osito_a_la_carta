import type { OrderRow } from '../../orders/orders.repository.js';
import { env } from '../../../config/index.js';

export type LocalizedOrderItem = {
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

const formatDate = (timestamp: number): string =>
  new Date(timestamp * 1000).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const buildItemRows = (items: LocalizedOrderItem[]): string =>
  items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 16px; font-size: 14px; color: #1f2937;">${item.name}</td>
      <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; text-align: right;">${formatMoney(item.unitPrice)}</td>
      <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; text-align: right; font-weight: 600;">${formatMoney(item.unitPrice * item.quantity)}</td>
    </tr>`,
    )
    .join('');

// URL absoluta del logo (servido por Nginx en producción, por Express en dev)
const logoUrl = `${env.PUBLIC_ORIGIN}/images/osito.jpg`;

export const buildOrderEmailHtml = (
  order: OrderRow,
  items: LocalizedOrderItem[],
  customerEmail: string,
): string => {
  const noteHtml =
    order.customerNote === null || order.customerNote.length === 0
      ? ''
      : `
  <div style="margin-top: 24px; padding: 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
    <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Nota del cliente:</strong> ${order.customerNote}</p>
  </div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nuevo pedido #${order.id} - Osito a la carta</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; line-height: 1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 24px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle; width: 56px;">
                    <img src="${logoUrl}" alt="Osito a la carta" style="width: 48px; height: 48px; border-radius: 8px; display: block;" />
                  </td>
                  <td style="vertical-align: middle;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">Osito a la carta</h1>
                    <p style="margin: 8px 0 0; font-size: 14px; color: #d1d5db;">Nuevo pedido recibido</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Info -->
          <tr>
            <td style="padding: 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Número de pedido</p>
                    <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600; color: #1f2937;">#${order.id}</p>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Fecha</p>
                    <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #1f2937;">${formatDate(order.createdAt)}</p>
                  </td>
                </tr>
              </table>

              <!-- Customer Info -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Cliente</p>
                    <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #1f2937;">${customerEmail}</p>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Estado</p>
                    <span style="display: inline-block; padding: 4px 12px; background-color: #dbeafe; color: #1e40af; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: capitalize;">${order.status}</span>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">Plato</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">Cant.</th>
                    <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">Precio unit.</th>
                    <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${buildItemRows(items)}
                </tbody>
              </table>

              <!-- Total -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 0; text-align: right;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Total del pedido</p>
                    <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #1f2937;">${formatMoney(order.total)}</p>
                  </td>
                </tr>
              </table>

              ${noteHtml}

              <!-- Footer -->
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Este es un mensaje automático del sistema de pedidos de <strong>Osito a la carta</strong>.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
          © ${new Date().getFullYear()} Osito a la carta. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const buildOrderEmailText = (
  order: OrderRow,
  items: LocalizedOrderItem[],
  customerEmail: string,
): string => {
  const noteText =
    order.customerNote === null || order.customerNote.length === 0
      ? ''
      : `\n\nNota del cliente: ${order.customerNote}`;

  const lines = items
    .map(
      (item) =>
        `  • ${item.quantity}x ${item.name} — ${formatMoney(item.unitPrice)} c/u = ${formatMoney(item.unitPrice * item.quantity)}`,
    )
    .join('\n');

  return `========================================
  Osito a la carta - Nuevo pedido #${order.id}
========================================

Fecha: ${formatDate(order.createdAt)}
Cliente: ${customerEmail}
Estado: ${order.status}

--- Platos ---
${lines}

--- Total ---
${formatMoney(order.total)}
${noteText}

---
Este es un mensaje automático del sistema de pedidos de Osito a la carta.
© ${new Date().getFullYear()} Osito a la carta. Todos los derechos reservados.`;
};

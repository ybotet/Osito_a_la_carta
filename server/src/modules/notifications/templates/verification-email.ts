import { env } from '../../../config/index.js';

const logoUrl = `${env.PUBLIC_ORIGIN}/images/osito.jpg`;
const verifyUrl = (token: string) => `${env.PUBLIC_ORIGIN}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

export const buildVerificationEmailHtml = (
  email: string,
  token: string,
  language: 'es' | 'ru' | 'en' = 'es',
): string => {
  const messages = {
    es: {
      title: 'Verifica tu email',
      subtitle: 'Confirma que este email es tuyo para activar tu cuenta.',
      button: 'Verificar email',
      footer: 'Este es un mensaje automático de Osito a la carta.',
    },
    ru: {
      title: 'Подтвердите email',
      subtitle: 'Подтвердите, что этот email принадлежит вам, чтобы активировать аккаунт.',
      button: 'Подтвердить email',
      footer: 'Это автоматическое сообщение Osito a la carta.',
    },
    en: {
      title: 'Verify your email',
      subtitle: 'Confirm that this email is yours to activate your account.',
      button: 'Verify email',
      footer: 'This is an automatic message from Osito a la carta.',
    },
  };

  const msg = messages[language] ?? messages.es;

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${msg.title} - Osito a la carta</title>
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
                    <p style="margin: 8px 0 0; font-size: 14px; color: #d1d5db;">${msg.title}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1f2937;">${msg.title}</h2>
              <p style="margin: 0 0 24px; font-size: 16px; color: #374151;">${msg.subtitle}</p>
              <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">${email}</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <a href="${verifyUrl(token)}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: -0.01em;">
                      ${msg.button}
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                ${msg.footer}<br />
                © ${new Date().getFullYear()} Osito a la carta. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const buildVerificationEmailText = (
  email: string,
  token: string,
  _language: 'es' | 'ru' | 'en' = 'es',
): string => {
  const url = verifyUrl(token);
  return `========================================
  Osito a la carta - Verificación de email
  ========================================

  Hola,

  Gracias por registrarte en Osito a la carta. Por favor, verifica tu email haciendo clic en el siguiente enlace:

  ${url}

  Tu email es: ${email}

  ---
  Este es un mensaje automático de Osito a la carta.
  © ${new Date().getFullYear()} Osito a la carta. Todos los derechos reservados.`;
};

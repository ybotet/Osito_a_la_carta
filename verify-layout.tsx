import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { i18n } from './client/src/lib/i18n';
import es from './client/src/locales/es.json';
import ru from './client/src/locales/ru.json';
import en from './client/src/locales/en.json';
import Layout from './client/src/components/Layout';
import { useAuthStore } from './client/src/store/auth';

i18n.use(initReactI18next).init({
  resources: { es, ru, en },
  lng: 'es',
  fallbackLng: 'es',
  supportedLngs: ['es', 'ru', 'en'],
  nonExplicitSupportedLngs: true,
  interpolation: { escapeValue: false },
});

function render(layout: React.ReactElement): string {
  return renderToString(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{layout}</MemoryRouter>
    </I18nextProvider>,
  );
}

const out: string[] = [];

out.push('--- sin sesion ---');
out.push(render(<Layout />));

useAuthStore.getState().setSession(
  { id: 1, email: 'admin@osito.local', role: 'admin', preferredLang: 'es' },
  'access-token-abc',
  'refresh-token-xyz',
);
out.push('--- con sesion ---');
out.push(render(<Layout />));

useAuthStore.getState().clearSession();
out.push('--- tras logout ---');
out.push(render(<Layout />));

process.stdout.write(out.join('\n'));
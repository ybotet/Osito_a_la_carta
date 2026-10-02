import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App.tsx';
import Menu from './pages/Menu.tsx';
import './lib/i18n.ts';
import './index.css';

/**
 * `staleTime` de 30 s: el menú cambia poco y el usuario navega entre páginas. Con el valor
 * por defecto (0) cada montaje de `Menu` vuelve a pedir la lista aunque se tenga recién, y
 * con 30 s la navegación es inmediata sin dejar el menú rancio.
 *
 * `retry` se deja en su valor por defecto (3) a propósito: un fallo de red en desarrollo es
 * normal y reintentar lo resuelve solo. La página muestra el estado de error después de los
 * reintentos, no en el primer fallo.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
});

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('No se encontro el elemento #root en index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/menu" element={<Menu />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App.tsx';
import Menu from './pages/Menu.tsx';
import DishDetail from './pages/DishDetail.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Cart from './pages/Cart.tsx';
import Orders from './pages/Orders.tsx';
import OrderDetail from './pages/OrderDetail.tsx';
import Stats from './pages/Stats.tsx';
import AdminOrders from './pages/admin/Orders.tsx';
import Layout from './components/Layout.tsx';
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
        {/*
          `Layout` es la ruta padre de todas: lleva el navbar con el selector de idioma y
          pinta dentro la ruta activa. Así cada página nueva hereda el navbar sin que su
          propio fichero tenga que acordarse de montarlo.
        */}
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<App />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/menu/:id" element={<DishDetail />} />
            {/*
              `/login` y `/register` entran como rutas del layout, no como páginas sueltas
              fuera de él: el navbar con el selector de idioma tiene que estar también en los
              formularios, o un usuario que no sabe español se encuentra con un formulario en
              ruso y un navbar que le pone "Русский" en un sitio donde no lo puede cambiar.
            */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/orders/:id" element={<AdminOrders />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useAuthHydrated } from '../store/auth';
import { Button } from './ui/button';

/**
 * Nombre del usuario en el navbar y botón de cerrar sesión.
 *
 * **Muestra el email y no un nombre propio porque `users` no tiene campo de nombre.** SPEC §6 y
 * `db/schema.ts` definen la tabla con `email`, `passwordHash`, `role`, `preferredLang` y
 * `createdAt`, y nada más. El enunciado pide "el nombre del usuario", y el email es lo único
 * que hay: enseñarlo cumple la función (que el usuario reconozca con qué cuenta está dentro)
 * sin inventar un campo en la base de datos ni una migración para él. Si algún día se quiere un
 * nombre de verdad, es una columna nueva y este componente no cambia.
 *
 * **Solo se pinta si hay sesión**, y la sesión se decide con `useIsAuthenticated` (T-045), que
 * además del email exige `accessToken`: con uno solo de los dos no hay sesión usable.
 *
 * **Cerrar sesión es solo del cliente, y por diseño.** No hay endpoint de logout en el servidor
 * porque los refresh tokens son sin estado: no hay tabla donde revocarlos (decisión anotada en
 * MEMORY, T-041). Lo que hace este botón es `clearSession`, que con `persist` **también borra el
 * `localStorage`**, así que la sesión no reaparece al recargar. El refresh token sigue siendo
 * válido en el servidor hasta que caduca a los 7 días; revocar de verdad exigiría una tabla de
 * tokens o una columna `token_version`, que es una migración nueva y no cabe aquí.
 *
 * **Redirige a la portada con `replace: true`.** Sin `replace`, el cierre de sesión quedaría en
 * el historial y "atrás" devolvería al usuario a una página que ya no puede ver, que se queda
 * cargando hasta fallar. Con `replace` el historial salta a la portada, que es lo que espera
 * alguien que acaba de cerrar sesión.
 *
 * El componente **no recibe props**: lee el store con selectores, como el resto del cliente.
 */
const UserMenu = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isHydrated = useAuthHydrated();

  const isAuthenticated = useAuthStore(
    (state) => state.user !== null && state.accessToken !== null,
  );
  const email = useAuthStore((state) => state.user?.email);
  const clearSession = useAuthStore((state) => state.clearSession);

  if (!isHydrated) {
    return null;
  }

  if (!isAuthenticated || email === undefined) {
    return null;
  }

  const onLogout = () => {
    clearSession();
    void navigate('/', { replace: true });
  };

  return (
    <div className="flex items-center gap-2">
      {/*
        `max-w` + `truncate`: un email puede ser largo y, sin recortar, el navbar en móvil
        empuja el selector de idioma y los enlaces fuera de pantalla. El `title` deja el email
        completo en el tooltip del ratón, que es donde cabe de verdad.

        `title` en vez de `sr-only`: aquí el texto **sí** es información, no un adorno, así que
        se enseña. Por eso es un `<span>` y no una etiqueta oculta para lectores de pantalla.
      */}
      <span
        className="max-w-40 truncate text-sm text-muted-foreground sm:max-w-56"
        title={email}
      >
        {email}
      </span>

      {/*
        `type="button"` lo pone el propio `Button` de shadcn (un retoque de T-035 sobre el
        original), así que este botón dentro de un futuro `<form>` no lo enviaría por accidente.
        Es un `<button>` de verdad y no `asChild` con un `Link`, porque cerrar sesión **hace algo**
        en lugar de navegar a una ruta.
      */}
      <Button variant="ghost" size="sm" onClick={onLogout}>
        {t('nav.logout')}
      </Button>
    </div>
  );
};

export default UserMenu;
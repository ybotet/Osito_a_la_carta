/**
 * Gestión de pedidos de invitados en `localStorage`.
 *
 * Un invitado que no se registra queda con un `trackingToken` (UUID v4) que le
 * permite consultar su pedido en `/orders/track/:token`. Como no hay cuenta, el
 * token se guarda localmente para que al volver al sitio pueda encontrar su
 * pedido sin recordarlo.
 *
 * **Límite de 10 tokens**: evita que un script malicioso o un uso incorrecto
 * rellene `localStorage`. Si se supera, se elimina el más antiguo.
 */
const GUEST_TOKENS_KEY = 'osito-guest-tokens';
const MAX_TOKENS = 10;

type GuestTokenEntry = {
  token: string;
  orderId: number;
  createdAt: number;
};

const readTokens = (): GuestTokenEntry[] => {
  try {
    const raw = localStorage.getItem(GUEST_TOKENS_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is GuestTokenEntry =>
          entry !== null &&
          typeof entry === 'object' &&
          typeof (entry as Record<string, unknown>).token === 'string' &&
          typeof (entry as Record<string, unknown>).orderId === 'number' &&
          typeof (entry as Record<string, unknown>).createdAt === 'number',
      )
      .sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
};

const writeTokens = (tokens: GuestTokenEntry[]): void => {
  localStorage.setItem(GUEST_TOKENS_KEY, JSON.stringify(tokens));
};

/**
 * Guarda un token de pedido de invitado. Si hay más de `MAX_TOKENS`,
 * elimina el más antiguo antes de añadir el nuevo.
 */
const saveToken = (entry: GuestTokenEntry): void => {
  const tokens = readTokens();
  // Evitar duplicados por token
  const filtered = tokens.filter((t) => t.token !== entry.token);
  if (filtered.length >= MAX_TOKENS) {
    filtered.shift(); // elimina el más antiguo
  }
  filtered.push(entry);
  writeTokens(filtered);
};

/**
 * Devuelve todos los tokens guardados, ordenados del más reciente al más antiguo.
 */
const getTokens = (): GuestTokenEntry[] =>
  readTokens().reverse();

/**
 * Devuelve el último token guardado, o `null` si no hay ninguno.
 */
const getLastToken = (): GuestTokenEntry | null => {
  const tokens = readTokens();
  if (tokens.length === 0) return null;
  return tokens[tokens.length - 1] ?? null;
};

/**
 * Busca un token por su valor. Devuelve la entrada o `null`.
 */
const getTokenByValue = (token: string): GuestTokenEntry | null =>
  readTokens().find((t) => t.token === token) ?? null;

/**
 * Elimina un token concreto (por ejemplo, cuando el usuario se registra
 * y su pedido pasa a estar ligado a su cuenta).
 */
const removeToken = (token: string): void => {
  const tokens = readTokens().filter((t) => t.token !== token);
  writeTokens(tokens);
};

/**
 * Limpia todos los tokens. Se llama cuando el usuario inicia sesión y
 * sus pedidos quedan accesibles por `/orders`.
 */
const clearTokens = (): void => {
  localStorage.removeItem(GUEST_TOKENS_KEY);
};

export {
  saveToken,
  getTokens,
  getLastToken,
  getTokenByValue,
  removeToken,
  clearTokens,
};
export type { GuestTokenEntry };
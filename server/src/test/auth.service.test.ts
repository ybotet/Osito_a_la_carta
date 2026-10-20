import { describe, it, expect } from 'vitest';
import { registerUser, loginUser, refreshAccessToken } from '../modules/auth/auth.service.js';
import { emailExists, findUserById } from '../modules/auth/auth.repository.js';
import { ConflictError, UnauthorizedError } from '../shared/errors.js';
import { sendVerificationEmail } from '../modules/notifications/email.service.js';

describe('auth.service', () => {
  const TEST_EMAIL = 'test@example.com';
  const TEST_PASSWORD = 'password123';
  const TEST_PREFERRED_LANG = 'es' as const;

  describe('registerUser', () => {
    it('registra un usuario correctamente y no incluye passwordHash en la respuesta', () => {
      const result = registerUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        preferredLang: TEST_PREFERRED_LANG,
      });

      expect(result).toBeDefined();
      expect(result.email).toBe(TEST_EMAIL);
      expect(result.role).toBe('customer');
      expect(result.preferredLang).toBe(TEST_PREFERRED_LANG);
      expect(result.id).toBeGreaterThan(0);
      expect(result).not.toHaveProperty('passwordHash');
      expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it('lanza ConflictError (EMAIL_TAKEN) cuando el email ya existe', () => {
      registerUser({
        email: 'duplicate@example.com',
        password: TEST_PASSWORD,
        preferredLang: TEST_PREFERRED_LANG,
      });

      expect(() =>
        registerUser({
          email: 'duplicate@example.com',
          password: 'otra-password',
          preferredLang: 'ru',
        }),
      ).toThrow(ConflictError);
    });

    it('envía email de verificación tras registrar', () => {
      registerUser({
        email: 'verify@example.com',
        password: TEST_PASSWORD,
        preferredLang: TEST_PREFERRED_LANG,
      });

      expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        'verify@example.com',
        expect.any(String),
        'es',
      );
    });
  });

  describe('loginUser', () => {
    it('autentica correctamente y devuelve tokens + usuario', () => {
      registerUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        preferredLang: TEST_PREFERRED_LANG,
      });

      const result = loginUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.accessToken.length).toBeGreaterThan(0);
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken.length).toBeGreaterThan(0);
      expect(result.user.email).toBe(TEST_EMAIL);
      expect(result.user.role).toBe('customer');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('lanza UnauthorizedError (INVALID_CREDENTIALS) con contraseña incorrecta', () => {
      registerUser({
        email: 'wrongpass@example.com',
        password: TEST_PASSWORD,
        preferredLang: TEST_PREFERRED_LANG,
      });

      expect(() =>
        loginUser({
          email: 'wrongpass@example.com',
          password: 'wrong-password',
        }),
      ).toThrow(UnauthorizedError);
    });

    it('lanza UnauthorizedError (INVALID_CREDENTIALS) con email inexistente', () => {
      expect(() =>
        loginUser({
          email: 'nonexistent@example.com',
          password: TEST_PASSWORD,
        }),
      ).toThrow(UnauthorizedError);
    });
  });

  describe('refreshAccessToken', () => {
    it('renueva un access token válido', () => {
      registerUser({
        email: 'refresh@example.com',
        password: TEST_PASSWORD,
        preferredLang: TEST_PREFERRED_LANG,
      });

      const loginResult = loginUser({
        email: 'refresh@example.com',
        password: TEST_PASSWORD,
      });

      const result = refreshAccessToken({ refreshToken: loginResult.refreshToken });

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.accessToken.length).toBeGreaterThan(0);
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('lanza UnauthorizedError (INVALID_REFRESH_TOKEN) con un token inválido', () => {
      expect(() =>
        refreshAccessToken({ refreshToken: 'invalid-token' }),
      ).toThrow(UnauthorizedError);
    });

    it('lanza UnauthorizedError (INVALID_REFRESH_TOKEN) con un access token en lugar de refresh', () => {
      registerUser({
        email: 'token-swap@example.com',
        password: TEST_PASSWORD,
        preferredLang: TEST_PREFERRED_LANG,
      });

      const loginResult = loginUser({
        email: 'token-swap@example.com',
        password: TEST_PASSWORD,
      });

      expect(() =>
        refreshAccessToken({ refreshToken: loginResult.accessToken }),
      ).toThrow(UnauthorizedError);
    });
  });

  describe('integridad de la base de datos', () => {
    it('emailExists devuelve true solo para emails registrados', () => {
      expect(emailExists('notregistered@example.com')).toBe(false);

      registerUser({
        email: 'exists@example.com',
        password: TEST_PASSWORD,
        preferredLang: TEST_PREFERRED_LANG,
      });

      expect(emailExists('exists@example.com')).toBe(true);
    });

    it('findUserById devuelve undefined para usuarios inexistentes', () => {
      expect(findUserById(99999)).toBeUndefined();
    });

    it('findUserById devuelve el usuario incluyendo passwordHash', () => {
      const registered = registerUser({
        email: 'findme@example.com',
        password: TEST_PASSWORD,
        preferredLang: TEST_PREFERRED_LANG,
      });

      const found = findUserById(registered.id);

      expect(found).toBeDefined();
      expect(found?.email).toBe('findme@example.com');
      expect(found?.passwordHash).toBeDefined();
    });
  });
});

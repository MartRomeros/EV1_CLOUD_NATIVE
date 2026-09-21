import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { ENV } from '../config/env.js';

/**
 * Middleware de validación de tokens JWT emitidos por Microsoft Entra ID.
 * Valida la firma del token contra las claves públicas (JWKS), el issuer y el audience.
 * Si ENV.AUTH_REQUIRED es false (desarrollo local), permite continuar sin bloquear.
 */

let checkJwtMiddleware = null;

try {
  checkJwtMiddleware = expressjwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://login.microsoftonline.com/${ENV.AZURE_TENANT_ID}/discovery/v2.0/keys`,
    }),
    audience: [
      ENV.AZURE_CLIENT_ID,
      `api://${ENV.AZURE_CLIENT_ID}`,
    ],
    issuer: [
      `https://login.microsoftonline.com/${ENV.AZURE_TENANT_ID}/v2.0`,
      `https://sts.windows.net/${ENV.AZURE_TENANT_ID}/`,
    ],
    algorithms: ['RS256'],
  });
} catch (err) {
  console.warn('[AUTH] No se pudo inicializar expressjwt:', err.message);
}

export function validateJwt(req, res, next) {
  // En desarrollo local o si AUTH_REQUIRED es false, permitir el paso sin validación estricta
  if (!ENV.AUTH_REQUIRED) {
    return next();
  }

  if (!checkJwtMiddleware) {
    return res.status(500).json({ error: 'Configuración de autenticación no disponible' });
  }

  return checkJwtMiddleware(req, res, next);
}

/**
 * Middleware para autorización basada en roles (RBAC).
 * Verifica que el usuario autenticado cuente con al menos uno de los roles permitidos.
 * Los roles se extraen del claim `roles` del token JWT (req.auth.roles) emitido por Entra ID.
 * Si ENV.AUTH_REQUIRED es false (desarrollo local), permite continuar sin bloquear.
 *
 * @param {...string} allowedRoles - Lista de roles autorizados para el endpoint.
 */
export function requireRole(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map((r) => String(r).toLowerCase());

  return (req, res, next) => {
    if (!ENV.AUTH_REQUIRED) {
      return next();
    }

    const tokenRoles = req.auth?.roles;
    const userRoles = Array.isArray(tokenRoles)
      ? tokenRoles.map((r) => String(r).toLowerCase())
      : typeof tokenRoles === 'string'
      ? [tokenRoles.toLowerCase()]
      : [];

    const hasPermission = normalizedAllowed.some((role) => userRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Acceso denegado: permisos insuficientes para este recurso',
      });
    }

    return next();
  };
}

export default validateJwt;


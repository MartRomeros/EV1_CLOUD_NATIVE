/**
 * Middleware centralizado para captura y formateo de errores no controlados.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Token de autenticación no proporcionado o inválido',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export default errorHandler;

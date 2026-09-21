import app from './app.js';
import { ENV } from './config/env.js';
import { initDb } from './config/initDb.js';

// Inicializar esquemas y tablas condicionalmente
initDb().catch(err => {
  console.error('[DB] Error crítico al inicializar base de datos:', err);
});

// Iniciar el servidor HTTP
app.listen(ENV.PORT, () => {
  console.log(`[Server] Backend corriendo en el puerto ${ENV.PORT}`);
});

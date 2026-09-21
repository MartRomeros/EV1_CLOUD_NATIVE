import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler.js';
import { validateJwt } from './middlewares/auth.js';
import router from './routes/index.js';

const app = express();

// Configuración de middlewares globales
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check: fuera del middleware de auth para que el health check del NLB
// no dependa de un JWT válido.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware de autenticación JWT (con bypass en modo local si AUTH_REQUIRED=false)
app.use(validateJwt);

// Montaje de rutas
app.use('/', router);

// Manejador centralizado de errores
app.use(errorHandler);

export default app;

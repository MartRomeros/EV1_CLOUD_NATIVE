import cors from 'cors';
import express from 'express';
import { errorHandler } from './middlewares/errorHandler.js';
import router from './routes/index.js';

const app = express();

// Configuración de middlewares globales
app.use(cors());
app.use(express.json());

// Montaje de rutas
app.use('/', router);

// Manejador centralizado de errores
app.use(errorHandler);

export default app;

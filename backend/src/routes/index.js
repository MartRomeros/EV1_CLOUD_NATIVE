import { Router } from 'express';
import { getResumen } from '../controllers/ot.controller.js';
import otRouter from './ot.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas del recurso OT
router.use('/ot', otRouter);

// Ruta resumen (compatibilidad retroactiva)
router.get('/resumen', getResumen);

export default router;

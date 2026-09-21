import { Router } from 'express';
import { getResumen } from '../controllers/ot.controller.js';
import otRouter from './ot.routes.js';
import clienteRouter from './cliente.routes.js';
import catalogoRouter from './catalogo.routes.js';
import usuarioRouter from './usuario.routes.js';

const router = Router();

// Rutas de los recursos
router.use('/ot', otRouter);
router.use('/clientes', clienteRouter);
router.use('/catalogo', catalogoRouter);
router.use('/usuarios', usuarioRouter);

// Ruta resumen (compatibilidad retroactiva)
router.get('/resumen', getResumen);

export default router;

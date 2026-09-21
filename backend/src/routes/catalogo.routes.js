import { Router } from 'express';
import * as catalogoController from '../controllers/catalogo.controller.js';
import { requireRole } from '../middlewares/auth.js';

const router = Router();

// Todas las operaciones de catálogo son exclusivas para el rol admin
router.use(requireRole('admin'));

router.get('/', catalogoController.getAll);
router.post('/', catalogoController.create);
router.get('/:concepto', catalogoController.getByConcepto);
router.put('/:concepto', catalogoController.update);
router.delete('/:concepto', catalogoController.remove);

export default router;

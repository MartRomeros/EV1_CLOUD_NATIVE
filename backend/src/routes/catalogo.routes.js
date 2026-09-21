import { Router } from 'express';
import * as catalogoController from '../controllers/catalogo.controller.js';

const router = Router();

router.get('/', catalogoController.getAll);
router.post('/', catalogoController.create);
router.get('/:concepto', catalogoController.getByConcepto);
router.put('/:concepto', catalogoController.update);
router.delete('/:concepto', catalogoController.remove);

export default router;

import { Router } from 'express';
import * as otController from '../controllers/ot.controller.js';
import { validateCreateItem, validateCreateOt } from '../middlewares/validate.js';

const router = Router();

// CRUD de Órdenes de Trabajo (OT)
router.get('/', otController.getAll);
router.post('/', validateCreateOt, otController.create);
router.get('/:id', otController.getById);
router.put('/:id', otController.update);
router.delete('/:id', otController.remove);

// Subrecursos: Ítems de la orden
router.post('/:id/items', validateCreateItem, otController.createItem);
router.get('/:id/items', otController.getItems);

export default router;

import { Router } from 'express';
import * as otController from '../controllers/ot.controller.js';
import { requireRole } from '../middlewares/auth.js';
import { validateCreateItem, validateCreateOt } from '../middlewares/validate.js';

const router = Router();

// CRUD de Órdenes de Trabajo (OT)
router.get('/', requireRole('admin', 'recepcion', 'mecanico'), otController.getAll);
router.post('/', requireRole('admin', 'recepcion'), validateCreateOt, otController.create);
router.get('/:id', requireRole('admin', 'recepcion', 'mecanico'), otController.getById);
router.put('/:id', requireRole('admin'), otController.update);
router.delete('/:id', requireRole('admin'), otController.remove);

// Subrecursos: Ítems de la orden
router.post('/:id/items', requireRole('admin', 'recepcion'), validateCreateItem, otController.createItem);
router.get('/:id/items', requireRole('admin', 'recepcion', 'mecanico'), otController.getItems);

export default router;

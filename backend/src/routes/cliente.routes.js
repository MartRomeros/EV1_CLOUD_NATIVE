import { Router } from 'express';
import * as clienteController from '../controllers/cliente.controller.js';
import { requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireRole('admin', 'recepcion'), clienteController.getAll);
router.post('/', requireRole('admin', 'recepcion'), clienteController.create);
router.get('/:id', requireRole('admin', 'recepcion'), clienteController.getById);
router.put('/:id', requireRole('admin', 'recepcion'), clienteController.update);
router.delete('/:id', requireRole('admin'), clienteController.remove);

export default router;

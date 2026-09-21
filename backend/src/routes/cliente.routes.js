import { Router } from 'express';
import * as clienteController from '../controllers/cliente.controller.js';

const router = Router();

router.get('/', clienteController.getAll);
router.post('/', clienteController.create);
router.get('/:id', clienteController.getById);
router.put('/:id', clienteController.update);
router.delete('/:id', clienteController.remove);

export default router;

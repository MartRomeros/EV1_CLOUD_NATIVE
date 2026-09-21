import { Router } from 'express';
import * as usuarioController from '../controllers/usuario.controller.js';

const router = Router();

router.get('/', usuarioController.getAll);
router.post('/', usuarioController.create);
router.get('/:email', usuarioController.getByEmail);
router.put('/:email', usuarioController.update);
router.delete('/:email', usuarioController.remove);

export default router;

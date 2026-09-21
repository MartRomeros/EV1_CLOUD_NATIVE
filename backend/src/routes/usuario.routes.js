import { Router } from 'express';
import * as usuarioController from '../controllers/usuario.controller.js';
import { requireRole } from '../middlewares/auth.js';

const router = Router();

// Todas las operaciones de usuarios son exclusivas para el rol admin
router.use(requireRole('admin'));

router.get('/', usuarioController.getAll);
router.post('/', usuarioController.create);
router.get('/:email', usuarioController.getByEmail);
router.put('/:email', usuarioController.update);
router.delete('/:email', usuarioController.remove);

export default router;

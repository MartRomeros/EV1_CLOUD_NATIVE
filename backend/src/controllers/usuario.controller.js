import * as usuarioService from '../services/usuario.service.js';

export async function getAll(req, res, next) {
  try {
    const usuarios = await usuarioService.getUsuariosList();
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
}

export async function getByEmail(req, res, next) {
  try {
    const usuario = await usuarioService.getUsuarioByEmail(req.params.email);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const { email, nombre, rol } = req.body;
    if (!email || !nombre) {
      return res.status(400).json({ error: 'El email y el nombre son obligatorios' });
    }

    const existe = await usuarioService.getUsuarioByEmail(email);
    if (existe) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    }

    const nuevo = await usuarioService.createUsuario(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const actualizado = await usuarioService.updateUsuario(req.params.email, req.body);
    if (!actualizado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(actualizado);
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const deleted = await usuarioService.deleteUsuario(req.params.email);
    if (!deleted) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
}

import * as clienteService from '../services/cliente.service.js';

export async function getAll(req, res, next) {
  try {
    const clientes = await clienteService.getClientesList();
    res.json(clientes);
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const cliente = await clienteService.getClienteById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    if (!req.body.nombre) {
      return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
    }
    const nuevo = await clienteService.createCliente(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    if (!req.body.nombre) {
      return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
    }
    const actualizado = await clienteService.updateCliente(req.params.id, req.body);
    if (!actualizado) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(actualizado);
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const deleted = await clienteService.deleteCliente(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
}

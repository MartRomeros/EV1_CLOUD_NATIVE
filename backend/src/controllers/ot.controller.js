import * as otService from '../services/ot.service.js';

/**
 * Controlador HTTP para Órdenes de Trabajo (OT) e Ítems.
 */

// GET /ot
export async function getAll(req, res, next) {
  try {
    const ordenes = await otService.getOrdenesList();
    res.json(ordenes);
  } catch (error) {
    next(error);
  }
}

// GET /ot/:id
export async function getById(req, res, next) {
  try {
    const orden = await otService.getOrdenById(req.params.id);
    if (!orden) {
      return res.status(404).json({ error: 'OT no encontrada' });
    }
    res.json(orden);
  } catch (error) {
    next(error);
  }
}

// POST /ot
export async function create(req, res, next) {
  try {
    const nuevaOrden = await otService.createOrden(req.body);
    res.status(201).json(nuevaOrden);
  } catch (error) {
    next(error);
  }
}

// PUT /ot/:id
export async function update(req, res, next) {
  try {
    const ordenActualizada = await otService.updateOrden(req.params.id, req.body);
    if (!ordenActualizada) {
      return res.status(404).json({ error: 'OT no encontrada' });
    }
    res.json(ordenActualizada);
  } catch (error) {
    next(error);
  }
}

// DELETE /ot/:id
export async function remove(req, res, next) {
  try {
    const deleted = await otService.deleteOrden(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'OT no encontrada' });
    }
    res.json({ message: 'OT eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
}

// POST /ot/:id/items
export async function createItem(req, res, next) {
  try {
    const item = await otService.addOtItem(req.params.id, req.body);
    if (!item) {
      return res.status(404).json({ error: 'OT no encontrada' });
    }
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

// GET /ot/:id/items
export async function getItems(req, res, next) {
  try {
    const items = await otService.getOtItems(req.params.id);
    if (!items) {
      return res.status(404).json({ error: 'OT no encontrada' });
    }
    res.json(items);
  } catch (error) {
    next(error);
  }
}

// GET /resumen (compatibilidad con vista agregada)
export async function getResumen(req, res, next) {
  try {
    const resumen = await otService.getOrdenesList();
    res.json(resumen);
  } catch (error) {
    next(error);
  }
}

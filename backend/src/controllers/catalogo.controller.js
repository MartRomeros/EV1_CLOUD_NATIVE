import * as catalogoService from '../services/catalogo.service.js';

export async function getAll(req, res, next) {
  try {
    const catalogo = await catalogoService.getCatalogoList();
    res.json(catalogo);
  } catch (error) {
    next(error);
  }
}

export async function getByConcepto(req, res, next) {
  try {
    const servicio = await catalogoService.getServicioByConcepto(req.params.concepto);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.json(servicio);
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const { concepto, descripcion } = req.body;
    if (!concepto || !descripcion) {
      return res.status(400).json({ error: 'El concepto y la descripción son obligatorios' });
    }

    const existe = await catalogoService.getServicioByConcepto(concepto);
    if (existe) {
      return res.status(409).json({ error: 'Ya existe un servicio con ese concepto' });
    }

    const nuevo = await catalogoService.createServicio(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const { descripcion } = req.body;
    if (!descripcion) {
      return res.status(400).json({ error: 'La descripción es obligatoria' });
    }

    const actualizado = await catalogoService.updateServicio(req.params.concepto, req.body);
    if (!actualizado) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.json(actualizado);
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const deleted = await catalogoService.deleteServicio(req.params.concepto);
    if (!deleted) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.json({ message: 'Servicio eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
}

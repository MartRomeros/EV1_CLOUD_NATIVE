/**
 * Middlewares ligeros de validación manual para peticiones entrantes.
 */

export function validateCreateOt(req, res, next) {
  const { clienteId, cliente_id, patente, items } = req.body;
  const resolvedClienteId = clienteId || cliente_id;

  if (!resolvedClienteId || typeof resolvedClienteId !== 'string' || !resolvedClienteId.trim()) {
    return res.status(400).json({ error: 'El campo clienteId (o cliente_id) es obligatorio y debe ser un texto válido.' });
  }

  if (!patente || typeof patente !== 'string' || !patente.trim()) {
    return res.status(400).json({ error: 'El campo patente es obligatorio y debe ser un texto válido.' });
  }

  if (items !== undefined) {
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'El campo items debe ser un arreglo de elementos.' });
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const precioUnit = it.precioUnit ?? it.precio_unit;
      if (!it.concepto || typeof it.concepto !== 'string' || !it.concepto.trim()) {
        return res.status(400).json({ error: `El ítem en la posición ${i} debe tener un concepto válido.` });
      }
      if (typeof it.cantidad !== 'number' || it.cantidad <= 0) {
        return res.status(400).json({ error: `El ítem en la posición ${i} debe tener una cantidad numérica mayor a 0.` });
      }
      if (typeof precioUnit !== 'number' || precioUnit < 0) {
        return res.status(400).json({ error: `El ítem en la posición ${i} debe tener un precioUnit numérico mayor o igual a 0.` });
      }
    }
  }

  next();
}

export function validateCreateItem(req, res, next) {
  const { concepto, cantidad } = req.body;
  const precioUnit = req.body.precioUnit ?? req.body.precio_unit;

  if (!concepto || typeof concepto !== 'string' || !concepto.trim()) {
    return res.status(400).json({ error: 'El campo concepto es obligatorio.' });
  }

  if (typeof cantidad !== 'number' || cantidad <= 0) {
    return res.status(400).json({ error: 'El campo cantidad debe ser un número mayor a 0.' });
  }

  if (typeof precioUnit !== 'number' || precioUnit < 0) {
    return res.status(400).json({ error: 'El campo precioUnit (o precio_unit) debe ser un número mayor o igual a 0.' });
  }

  next();
}

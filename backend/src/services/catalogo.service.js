import * as catalogoModel from '../models/catalogo.model.js';
import { toCamelCase } from '../utils/caseConverter.js';

export async function getCatalogoList() {
  const rows = await catalogoModel.findAll();
  return rows.map(row => {
    const item = toCamelCase(row);
    return {
      ...item,
      precioUnit: Number(item.precioUnit) || 0,
    };
  });
}

export async function getServicioByConcepto(concepto) {
  const row = await catalogoModel.findByConcepto(concepto);
  if (!row) {
    return null;
  }
  const item = toCamelCase(row);
  return {
    ...item,
    precioUnit: Number(item.precioUnit) || 0,
  };
}

export async function createServicio(data) {
  const concepto = data.concepto;
  const descripcion = data.descripcion;
  const precioUnit = Number(data.precioUnit ?? data.precio_unit ?? 0);
  const categoria = data.categoria || 'repuesto';

  const row = await catalogoModel.insert({ concepto, descripcion, precioUnit, categoria });
  const item = toCamelCase(row);
  return {
    ...item,
    precioUnit: Number(item.precioUnit) || 0,
  };
}

export async function updateServicio(concepto, data) {
  const descripcion = data.descripcion;
  const precioUnit = Number(data.precioUnit ?? data.precio_unit ?? 0);
  const categoria = data.categoria;

  const row = await catalogoModel.update(concepto, { descripcion, precioUnit, categoria });
  if (!row) {
    return null;
  }
  const item = toCamelCase(row);
  return {
    ...item,
    precioUnit: Number(item.precioUnit) || 0,
  };
}

export async function deleteServicio(concepto) {
  const row = await catalogoModel.deleteByConcepto(concepto);
  return row !== null;
}
